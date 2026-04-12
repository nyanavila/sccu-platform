import { useState, useEffect } from "react";

const SCCU_API = "http://127.0.0.1:3001";

const fmt = (n) => new Intl.NumberFormat("en-BZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const MEMBER_TRANSACTIONS = {
  "maria.santos@sccu.bz": [
    { date: "Apr 8", desc: "Salary credit — Ministry of Education", amount: 700, type: "credit", balance: 2400 },
    { date: "Apr 5", desc: "Electricity bill — BEL", amount: 160, type: "debit", balance: 1700 },
    { date: "Apr 1", desc: "Founding share purchase", amount: 500, type: "credit", balance: 500 },
  ],
  "carlos.palacio@sccu.bz": [
    { date: "Apr 4", desc: "Supplier payment — Western Hardware", amount: 11250, type: "debit", balance: 18750 },
    { date: "Apr 3", desc: "Small business loan disbursement", amount: 25000, type: "credit", balance: 30000 },
    { date: "Apr 1", desc: "Founding share purchase", amount: 5000, type: "credit", balance: 5000 },
  ],
  "rose.aranda@sccu.bz": [
    { date: "Apr 2", desc: "Agricultural loan disbursement — Cayo citrus", amount: 12000, type: "credit", balance: 5200 },
    { date: "Apr 1", desc: "Founding share purchase", amount: 1000, type: "credit", balance: 1000 },
  ],
  "james.westby@sccu.bz": [
    { date: "Apr 9", desc: "Remittance — Western Union USA", amount: 12800, type: "credit", balance: 34800 },
    { date: "Apr 5", desc: "Remittance — Western Union USA", amount: 20000, type: "credit", balance: 22000 },
    { date: "Apr 1", desc: "Founding share purchase", amount: 2000, type: "credit", balance: 2000 },
  ],
  "pedro.coc@sccu.bz": [
    { date: "Apr 8", desc: "Contract payment — GoB Works Ministry", amount: 3800, type: "credit", balance: 7600 },
    { date: "Apr 1", desc: "Founding share purchase", amount: 1500, type: "credit", balance: 1500 },
  ],
  "diana.cal@sccu.bz": [
    { date: "Apr 9", desc: "Market sales deposit — Central Market stall 14", amount: 500, type: "credit", balance: 1850 },
    { date: "Apr 1", desc: "Founding share purchase", amount: 500, type: "credit", balance: 500 },
  ],
  "miguel.tzul@sccu.bz": [
    { date: "Apr 6", desc: "Cacao cooperative payout — Toledo District", amount: 2300, type: "credit", balance: 3100 },
    { date: "Apr 1", desc: "Founding share purchase", amount: 800, type: "credit", balance: 800 },
  ],
};

const MEMBER_NAMES = {
  "maria.santos@sccu.bz":   "Maria Santos",
  "carlos.palacio@sccu.bz": "Carlos Palacio",
  "rose.aranda@sccu.bz":    "Rose Aranda",
  "james.westby@sccu.bz":   "James Westby",
  "pedro.coc@sccu.bz":      "Pedro Coc",
  "diana.cal@sccu.bz":      "Diana Cal",
  "miguel.tzul@sccu.bz":    "Miguel Tzul",
};

const MEMBER_PASSWORDS = {
  "maria.santos@sccu.bz":   "Sccu2026#Maria",
  "carlos.palacio@sccu.bz": "Sccu2026#Carlos",
  "rose.aranda@sccu.bz":    "Sccu2026#Rose",
  "james.westby@sccu.bz":   "Sccu2026#James",
  "pedro.coc@sccu.bz":      "Sccu2026#Pedro",
  "diana.cal@sccu.bz":      "Sccu2026#Diana",
  "miguel.tzul@sccu.bz":    "Sccu2026#Miguel",
};

export default function MemberPortal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [account, setAccount] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch(`${SCCU_API}/health`)
      .then(r => r.json())
      .then(() => setApiStatus("live"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const login = async () => {
    setLoading(true);
    setError("");

    // Validate member credentials locally
    if (!MEMBER_PASSWORDS[email]) {
      setError("Email not found. Please check your email address.");
      setLoading(false);
      return;
    }
    if (MEMBER_PASSWORDS[email] !== password) {
      setError("Incorrect password. Please try again.");
      setLoading(false);
      return;
    }

    // Fetch their account from FastAPI
    try {
      const r = await fetch(`${SCCU_API}/accounts`);
      const d = await r.json();
      const memberAccount = d.accounts.find(a => a.owner_email === email);
      if (memberAccount) {
        setAccount(memberAccount);
        setLoggedIn(true);
      } else {
        setError("Account not found. Please contact SCCU support.");
      }
    } catch {
      setError("Cannot reach SCCU API. Please try again.");
    }
    setLoading(false);
  };

  const initials = email ? email.split(".").slice(0,2).map(p => p[0]?.toUpperCase()).join("") : "??";
  const name = MEMBER_NAMES[email] || "Member";
  const transactions = MEMBER_TRANSACTIONS[email] || [];

  const s = {
    page: { fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#1a1a1a", minHeight: "100vh", background: "#f7f7f5" },
    card: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: "1.5rem" },
    input: { width: "100%", padding: "12px 14px", fontSize: 14, border: "1px solid #e8e8e8", borderRadius: 10, boxSizing: "border-box", outline: "none" },
    btn: (primary) => ({
      width: "100%", padding: "13px", fontSize: 14, fontWeight: 600,
      border: primary ? "none" : "1px solid #e8e8e8",
      borderRadius: 10, cursor: "pointer",
      background: primary ? "#0F6E56" : "#fff",
      color: primary ? "#fff" : "#1a1a1a",
    }),
    tab: (active) => ({
      padding: "10px 20px", fontSize: 13, border: "none", background: "none", cursor: "pointer",
      color: active ? "#1a1a1a" : "#888", fontWeight: active ? 600 : 400,
      borderBottom: active ? "2px solid #0F6E56" : "2px solid transparent",
      marginBottom: -1,
    }),
  };

  if (!loggedIn) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0F6E56" }}>Sensu CU</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#888" }}>Member Online Banking</p>
          </div>

          <div style={s.card}>
            {/* API status */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "10px 14px", borderRadius: 8, background: "#f7f7f5" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiStatus === "live" ? "#1D9E75" : "#EF9F27" }}/>
              <span style={{ fontSize: 12, color: "#888" }}>
                {apiStatus === "live" ? "Secure connection — SCCU Belize" : "Connecting to SCCU..."}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "block", fontWeight: 500 }}>Email address</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="yourname@sccu.bz"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "block", fontWeight: 500 }}>Password</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                />
              </div>
              {error && (
                <div style={{ padding: "12px 14px", background: "#FCEBEB", borderRadius: 8, fontSize: 13, color: "#A32D2D" }}>
                  {error}
                </div>
              )}
              <button onClick={login} disabled={loading} style={s.btn(true)}>
                {loading ? "Signing in..." : "Sign in to my account"}
              </button>
            </div>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                Need help? Call SCCU: <span style={{ color: "#0F6E56" }}>+501 XXX-XXXX</span>
              </p>
            </div>
          </div>

          {/* Quick login buttons for demo */}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginBottom: 10 }}>Demo — click to sign in as a member</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(MEMBER_NAMES).slice(0,6).map(([em, nm]) => (
                <button key={em} onClick={() => { setEmail(em); setPassword(MEMBER_PASSWORDS[em]); }}
                  style={{ padding: "8px 12px", fontSize: 12, border: "1px solid #e8e8e8", borderRadius: 8, background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  {nm}
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 20 }}>
            Sensu Community Credit Union and Financial Services · Belize City, BZ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Top nav */}
      <div style={{ background: "#0F6E56", padding: "0 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Sensu CU</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {initials}
            </div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13 }}>{name}</span>
            <button onClick={() => { setLoggedIn(false); setAccount(null); setEmail(""); setPassword(""); }}
              style={{ padding: "6px 14px", fontSize: 12, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, background: "transparent", color: "#fff", cursor: "pointer" }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px" }}>

        {/* Balance hero card */}
        <div style={{ background: "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)", borderRadius: 20, padding: "2rem", marginBottom: 20, color: "#fff" }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, opacity: 0.8, textTransform: "uppercase", letterSpacing: ".08em" }}>Share Savings Account</p>
          <p style={{ margin: "0 0 4px", fontSize: 42, fontWeight: 700, letterSpacing: "-1px" }}>
            BZD {fmt(account?.balance || 0)}
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 13, opacity: 0.7 }}>Available balance</p>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.8 }}>Account number</p>
              <p style={{ margin: 0, fontSize: 12, fontFamily: "monospace" }}>{account?.number || "SCCU-2026-000X"}</p>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.8 }}>Account type</p>
              <p style={{ margin: 0, fontSize: 12 }}>BZD Share Savings</p>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.8 }}>Currency</p>
              <p style={{ margin: 0, fontSize: 12 }}>BZD (USD 2:1)</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { icon: "↑", label: "Send money", color: "#0F6E56" },
            { icon: "↓", label: "Receive", color: "#185FA5" },
            { icon: "⟳", label: "Transfer", color: "#854F0B" },
            { icon: "?", label: "Support", color: "#534AB7" },
          ].map((a, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem", textAlign: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f7f7f5"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${a.color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 18, color: a.color }}>
                {a.icon}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{a.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid #e8e8e8", marginBottom: 20, display: "flex", gap: 4 }}>
          {["overview", "transactions", "details"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={s.tab(activeTab === t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem 1.25rem" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#888", textTransform: "uppercase" }}>Last transaction</p>
                <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600 }}>{transactions[0]?.date || "—"}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{transactions[0]?.desc?.slice(0,30) || "No transactions yet"}…</p>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem 1.25rem" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#888", textTransform: "uppercase" }}>Member since</p>
                <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600 }}>April 2026</p>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Founding member — SCCU</p>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem 1.25rem" }}>
              <p style={{ fontWeight: 600, marginBottom: 16 }}>Recent activity</p>
              {transactions.slice(0, 3).map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, marginBottom: i < 2 ? 14 : 0, borderBottom: i < 2 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.type === "credit" ? "#EAF3DE" : "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: t.type === "credit" ? "#3B6D11" : "#A32D2D" }}>
                      {t.type === "credit" ? "↓" : "↑"}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500 }}>{t.desc}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{t.date} · {t.type === "credit" ? "Credit" : "Debit"}</p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: t.type === "credit" ? "#0F6E56" : "#A32D2D" }}>
                    {t.type === "credit" ? "+" : "−"}BZD {fmt(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions tab */}
        {activeTab === "transactions" && (
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f0f0f0" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Transaction history</p>
            </div>
            {transactions.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: i < transactions.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.type === "credit" ? "#EAF3DE" : "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: t.type === "credit" ? "#3B6D11" : "#A32D2D", flexShrink: 0 }}>
                    {t.type === "credit" ? "↓" : "↑"}
                  </div>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 500 }}>{t.desc}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{t.date} · Balance after: BZD {fmt(t.balance)}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, color: t.type === "credit" ? "#0F6E56" : "#A32D2D" }}>
                    {t.type === "credit" ? "+" : "−"}BZD {fmt(t.amount)}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{t.type === "credit" ? "Credit" : "Debit"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details tab */}
        {activeTab === "details" && (
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1.5rem" }}>
            <p style={{ fontWeight: 600, marginBottom: 20 }}>Account details</p>
            <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
              {[
                ["Full name", name],
                ["Email", email],
                ["Account ID", account?.id || "—"],
                ["Account label", account?.label || "—"],
                ["Currency", "BZD — Belize Dollar"],
                ["Exchange rate", "BZD 2.00 = USD 1.00 (fixed peg)"],
                ["Account type", "Share Savings"],
                ["Institution", "Sensu Community Credit Union"],
                ["Branch", "Belize City — Main Branch"],
                ["Routing", "bz.sccu"],
                ["Status", "Active — founding member"],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "12px 0", color: "#888", width: 180 }}>{k}</td>
                  <td style={{ padding: "12px 0", fontWeight: k === "Full name" ? 500 : 400 }}>{v}</td>
                </tr>
              ))}
            </table>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 32 }}>
          Sensu Community Credit Union and Financial Services · Belize City, BZ · bz.sccu
        </p>
      </div>
    </div>
  );
}
