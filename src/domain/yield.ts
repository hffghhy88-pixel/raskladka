import type {
  ColdLossTable,
  ColdProcess,
  HotProcess,
  HotYieldTable,
  YieldKind,
  YieldProfile,
} from "../types/models";

export function emptyCold(): ColdLossTable {
  return {
    peel: 0,
    trim: 0,
    bone: 0,
    scale: 0,
    gut: 0,
    defrost: 2,
    soak: 0,
    custom: 0,
  };
}

export function emptyHot(): HotYieldTable {
  return {
    boil: 100,
    steam: 100,
    stew: 100,
    fry: 100,
    deepFry: 100,
    bake: 100,
    grill: 100,
    blanch: 100,
    saute: 100,
    custom: 100,
  };
}

export function emptyYield(): YieldProfile {
  return { coldLoss: emptyCold(), hotYield: emptyHot() };
}

export const YIELD_PRESETS: Record<YieldKind, YieldProfile> = {
  none: emptyYield(),
  root: {
    coldLoss: { ...emptyCold(), peel: 25, trim: 8, custom: 25 },
    hotYield: {
      boil: 97,
      steam: 98,
      stew: 82,
      fry: 69,
      deepFry: 60,
      bake: 78,
      grill: 75,
      blanch: 96,
      saute: 80,
      custom: 85,
    },
  },
  onion: {
    coldLoss: { ...emptyCold(), peel: 16, trim: 10, custom: 16 },
    hotYield: {
      boil: 92,
      steam: 95,
      stew: 50,
      fry: 48,
      deepFry: 45,
      bake: 70,
      grill: 65,
      blanch: 94,
      saute: 50,
      custom: 60,
    },
  },
  cabbage: {
    coldLoss: { ...emptyCold(), peel: 20, trim: 15, custom: 20 },
    hotYield: {
      boil: 88,
      steam: 90,
      stew: 78,
      fry: 72,
      deepFry: 65,
      bake: 80,
      grill: 75,
      blanch: 90,
      saute: 74,
      custom: 82,
    },
  },
  greens: {
    coldLoss: { ...emptyCold(), peel: 24, trim: 20, custom: 24 },
    hotYield: {
      boil: 70,
      steam: 72,
      stew: 55,
      fry: 50,
      deepFry: 45,
      bake: 58,
      grill: 50,
      blanch: 75,
      saute: 52,
      custom: 60,
    },
  },
  meat: {
    coldLoss: { ...emptyCold(), trim: 7, bone: 28, defrost: 3, custom: 7 },
    hotYield: {
      boil: 63,
      steam: 68,
      stew: 62,
      fry: 63,
      deepFry: 60,
      bake: 65,
      grill: 62,
      blanch: 85,
      saute: 70,
      custom: 63,
    },
  },
  poultry: {
    coldLoss: { ...emptyCold(), trim: 6, bone: 32, gut: 18, defrost: 4, custom: 6 },
    hotYield: {
      boil: 67,
      steam: 70,
      stew: 65,
      fry: 68,
      deepFry: 64,
      bake: 70,
      grill: 66,
      blanch: 88,
      saute: 72,
      custom: 68,
    },
  },
  fish: {
    coldLoss: { ...emptyCold(), scale: 6, gut: 22, bone: 40, trim: 12, defrost: 5, custom: 22 },
    hotYield: {
      boil: 80,
      steam: 82,
      stew: 78,
      fry: 80,
      deepFry: 75,
      bake: 80,
      grill: 78,
      blanch: 90,
      saute: 82,
      custom: 80,
    },
  },
  groats: {
    coldLoss: emptyCold(),
    hotYield: {
      boil: 250,
      steam: 220,
      stew: 240,
      fry: 140,
      deepFry: 130,
      bake: 180,
      grill: 120,
      blanch: 160,
      saute: 150,
      custom: 250,
    },
  },
  pasta: {
    coldLoss: emptyCold(),
    hotYield: {
      boil: 230,
      steam: 200,
      stew: 210,
      fry: 130,
      deepFry: 120,
      bake: 180,
      grill: 110,
      blanch: 170,
      saute: 140,
      custom: 230,
    },
  },
  dairy: {
    coldLoss: emptyCold(),
    hotYield: {
      boil: 95,
      steam: 96,
      stew: 88,
      fry: 80,
      deepFry: 75,
      bake: 85,
      grill: 78,
      blanch: 97,
      saute: 82,
      custom: 95,
    },
  },
};

export function coldLossPercent(profile: YieldProfile, process: ColdProcess): number {
  if (process === "none") return 0;
  return profile.coldLoss[process === "custom" ? "custom" : process];
}

export function hotYieldPercent(profile: YieldProfile, process: HotProcess): number {
  if (process === "none") return 100;
  if (process === "deep_fry") return profile.hotYield.deepFry;
  return profile.hotYield[process === "custom" ? "custom" : process];
}

export function cloneYield(profile: YieldProfile): YieldProfile {
  return {
    coldLoss: { ...profile.coldLoss },
    hotYield: { ...profile.hotYield },
  };
}
