// ============================================================
// BelizePay — Institution Configuration
// Sensu Community Credit Union and Financial Services
// ONE file per institution. Change this, nothing else.
//
// Deploy: copy this file to ~/sccu/src/ as institution.config.js
// ============================================================

const INSTITUTION = {

  // ── Identity ──────────────────────────────────────────────
  SHORT:      "sccu",
  FULL_NAME:  "Sensu Community Credit Union and Financial Services",
  TAGLINE:    "Community-owned banking for every Belizean.",
  TYPE:       "credit_union",
  FOUNDED:    "2026",
  LOCATION:   "Belize City, Belize",
  ROUTING:    "bz.sccu",

  // ── Network ───────────────────────────────────────────────
  // All API calls go through BelizePay gateway — never direct to OBP
  GATEWAY_URL:  "http://127.0.0.1:3002",
  PUBLIC_URL:   "https://sccu.aonedatasolution.com",
  OBP_PORT:     8080,
  PG_PORT:      5432,
  VITE_PORT:    5173,

  // ── OBP credentials (bootstrap only, not exposed to browser) ──
  CONSUMER_KEY:    "sccu-key-2026",
  CONSUMER_SECRET: "sccu-secret-2026",
  ADMIN_USER:      "nyanavila_20",

  // ── Currency ──────────────────────────────────────────────
  CURRENCY:          "BZD",
  CURRENCY_USD_RATE: 2.0,

  // ── Branding ──────────────────────────────────────────────
  // Sensu palette: deep teal-blue primary, green accent — community feel
  COLORS: {
    primary:      "#0B4D6B",
    primaryMid:   "#0E6189",
    primaryLight: "#1A7DAD",
    accent:       "#1A6B4A",
    accentLight:  "#22905E",
    sand:         "#E8D07E",
    sandLight:    "#F5EEC4",
    cream:        "#F8FAF7",
    white:        "#FFFFFF",
    ink:          "#1A1E2E",
    muted:        "#516B7A",
    border:       "#CDD8E0",
    danger:       "#C0392B",
    success:      "#1A6B4A",
  },
  FONTS: {
    display: "'Playfair Display', serif",
    body:    "'Source Sans 3', sans-serif",
    google:  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Source+Sans+3:wght@300;400;600&display=swap",
  },

  // ── Contact ───────────────────────────────────────────────
  CONTACT: {
    email:   "support@sccu.bz",
    phone:   "+501 XXX-XXXX",
    address: "Belize City, Belize District, Belize",
    hours:   "Monday – Friday, 8:00 AM – 4:00 PM",
    fraud:   "fraud@sccu.bz",
  },

  // ── Products ──────────────────────────────────────────────
  SAVINGS: {
    min_balance:   100.00,
    dividend_rate: 6.0,
    dividend_freq: "Quarterly",
  },

  LOANS: [
    { name: "Personal loan",     rate: "12–15%", max: "BZD 10,000",  term: "36 months",   highlight: false },
    { name: "Agricultural loan", rate: "10–12%", max: "BZD 50,000",  term: "60 months",   highlight: true  },
    { name: "Business loan",     rate: "14–18%", max: "BZD 100,000", term: "84 months",   highlight: false },
    { name: "Education loan",    rate: "8%",     max: "BZD 30,000",  term: "Study + 2yr", highlight: false },
  ],

  SERVICES: [
    { title: "Share savings account",  desc: "Earn 6% annual dividend. Your savings are your ownership stake in SCCU.",          color: "#0B4D6B" },
    { title: "Free member transfers",  desc: "Send money instantly to any SCCU member at no cost — 24 hours, 7 days a week.",   color: "#1A6B4A" },
    { title: "Affordable loans",       desc: "Personal, agricultural, business, and education loans at below-bank rates.",       color: "#8B6914" },
    { title: "Diaspora remittance",    desc: "Receive USD at the guaranteed Central Bank rate — BZD 2:1. No hidden fees.",      color: "#1A7DAD" },
    { title: "Digital banking",        desc: "Manage your account from any phone or computer, anywhere in the world.",          color: "#1A6B4A" },
    { title: "BelizePay network",      desc: "Transfer to other credit unions and banks on the BelizePay open banking rail.",  color: "#0B4D6B" },
  ],

  MEMBER_TYPES: ["Community", "Business", "Agricultural", "Diaspora", "Trade", "Staff"],

  // ── Teller ────────────────────────────────────────────────
  TELLER: {
    large_cash_threshold: 5000,
    ctr_threshold:        10000,
    min_balance:          100.00,
    quick_amounts:        [50, 100, 200, 500, 1000, 2000],
  },

  // ── Admin ─────────────────────────────────────────────────
  ADMIN: {
    admin_username: "nyanavila_20",
    branch:         "Belize City",
  },
};

export default INSTITUTION;
