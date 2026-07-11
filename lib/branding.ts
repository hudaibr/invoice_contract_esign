// Central branding config — edit these to match your agency.
// Swap logoUrl to your uploaded logo path once you have one (e.g. "/logo.png" in /public).

export const branding = {
  agencyName: "Jiggers in Joggers",
  tagline: "Your Vision, Our Art",
  logoUrl: "/logo.png",
  email: "hello@jiggersinjoggers.com", // update if this differs from your actual contact inbox
  website: "jiggersinjoggers.com",
  address: "203 S Boston St, Rice, TX 75155",
  phone: "+1 832-233-8747",

  // Brand colors — sampled directly from your logo's green gradient
  colors: {
    primary: "#3FBB43", // deeper green from logo shadow — main accent, buttons, totals
    primaryLight: "#54F358", // bright highlight green from logo — for gradients/hover glow
    primaryDark: "#2E8A32", // darker shade for hover states
    text: "#1F2937",
    muted: "#6B7280",
    border: "#E5E7EB",
    background: "#FFFFFF",
  },

  currency: {
    code: "USD",
    symbol: "$",
  },

  invoice: {
    defaultTaxRate: 0, // percentage, e.g. 5 for 5%
    defaultDueDays: 14,
    footerNote: "Thank you for your business! Payment is due within the terms above.",
  },

  contract: {
    defaultPaymentTerms: "50% upfront, 50% on final delivery",
    defaultRevisionRounds: 2,
    jurisdiction: "Texas, United States",
  },
};

export type Branding = typeof branding;
