use std::env;
use std::io::{self, Read, Write};
use std::path::PathBuf;
use std::process;

use raskladka_engine::engine::{execute, Command, EngineResponse};
use raskladka_engine::Workspace;

fn main() {
    if let Err(err) = run() {
        let payload = EngineResponse::Error {
            message: err,
            kind: "cli".into(),
        };
        let text = serde_json::to_string(&payload).unwrap_or_else(|_| {
            r#"{"type":"error","message":"fatal"}"#.to_string()
        });
        let _ = writeln!(io::stderr(), "{text}");
        process::exit(1);
    }
}

fn run() -> Result<(), String> {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.iter().any(|a| a == "--help" || a == "-h") {
        print_help();
        return Ok(());
    }
    if args.iter().any(|a| a == "--version" || a == "-V") {
        println!("{}", env!("CARGO_PKG_VERSION"));
        return Ok(());
    }

    let mut workspace_path: Option<PathBuf> = None;
    let mut command_path: Option<PathBuf> = None;
    let mut bundle_path: Option<PathBuf> = None;
    let mut use_stdin = false;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--workspace" | "-w" => {
                i += 1;
                workspace_path = Some(PathBuf::from(args.get(i).ok_or("нужен путь после --workspace")?));
            }
            "--command" | "-c" => {
                i += 1;
                command_path = Some(PathBuf::from(args.get(i).ok_or("нужен путь после --command")?));
            }
            "--bundle" | "-b" => {
                i += 1;
                bundle_path = Some(PathBuf::from(args.get(i).ok_or("нужен путь после --bundle")?));
            }
            "--stdin" => use_stdin = true,
            other => return Err(format!("неизвестный аргумент: {other}")),
        }
        i += 1;
    }

    if use_stdin || (workspace_path.is_none() && command_path.is_none() && bundle_path.is_none()) {
        let mut raw = String::new();
        io::stdin()
            .read_to_string(&mut raw)
            .map_err(|e| e.to_string())?;
        let out = raskladka_engine::execute_bundle(raw.trim());
        println!("{out}");
        return Ok(());
    }

    if let Some(path) = bundle_path {
        let raw = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        println!("{}", raskladka_engine::execute_bundle(&raw));
        return Ok(());
    }

    let workspace = if let Some(path) = workspace_path {
        let raw = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str::<Workspace>(&raw).map_err(|e| e.to_string())?
    } else {
        Workspace::empty()
    };

    let command = if let Some(path) = command_path {
        let raw = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str::<Command>(&raw).map_err(|e| e.to_string())?
    } else {
        Command::Ping
    };

    match execute(&workspace, command) {
        Ok(response) => {
            println!("{}", serde_json::to_string(&response).map_err(|e| e.to_string())?);
            Ok(())
        }
        Err(err) => Err(err.to_string()),
    }
}

fn print_help() {
    println!(
        "raskladka-engine {} — расчёт веса блюд и меню

Использование:
  raskladka-engine --stdin < bundle.json
  raskladka-engine --workspace kitchen.json --command cmd.json
  raskladka-engine --bundle bundle.json

Формат bundle.json:
  {{ \"workspace\": {{ ... }}, \"command\": {{ \"cmd\": \"calc_dish\", \"dish_id\": \"...\", \"portions\": 20 }} }}

Команды: ping, convert, calc_dish, calc_dish_inline, scale_dish,
scale_from_anchor, portions_from_stock, fit_portion, calc_menu,
shopping, tech_card, cost_card, menu_report, compare_dishes,
production, search, validate
",
        env!("CARGO_PKG_VERSION")
    );
}
