export const AD_PACKAGES = [
  {
    id: "ad-monthly",
    name: "Monthly",
    nameKey: "store.adMonthly",
    price: 1.0,
    period: "month",
    periodKey: "store.perMonth",
    popular: false,
  },
  {
    id: "ad-lifetime",
    name: "Lifetime",
    nameKey: "store.adLifetime",
    price: 10.0,
    period: "once",
    periodKey: "store.oneTime",
    popular: false,
  },
];

export const AI_PACKAGES = [
  {
    id: "ai-250",
    name: "Starter Pack",
    nameKey: "store.aiStarter",
    requests: 250,
    price: 1.0,
    popular: false,
  },
  {
    id: "ai-3000",
    name: "Pro Pack",
    nameKey: "store.aiPro",
    requests: 3000,
    price: 10.0,
    popular: true,
    save: "17%",
  },
];
