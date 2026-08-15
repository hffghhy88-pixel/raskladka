import type { ReactNode } from "react";
import { formatMassGrams, formatMoney } from "../domain/units";
import type { WeightTriple } from "../types/models";

export function PageHead({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="stage-head">
      <div>
        <h1>{title}</h1>
        {hint ? <p>{hint}</p> : null}
      </div>
      <div className="row no-print">{children}</div>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function WeightStrip({ weights, finished }: { weights: WeightTriple; finished?: number }) {
  return (
    <div className="weights">
      <div>
        <span className="muted">Брутто</span>
        <b>{formatMassGrams(weights.grossG)}</b>
      </div>
      <div>
        <span className="muted">Нетто</span>
        <b>{formatMassGrams(weights.netG)}</b>
      </div>
      <div>
        <span className="muted">{finished != null ? "Выход блюда" : "Выход"}</span>
        <b>{formatMassGrams(finished ?? weights.yieldG)}</b>
      </div>
    </div>
  );
}

export function Money({ value }: { value: number }) {
  return <span className="mono">{formatMoney(value)}</span>;
}

export function Empty({ text }: { text: string }) {
  return <p className="muted">{text}</p>;
}
