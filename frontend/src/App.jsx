import { useState, useEffect } from "react";
import NewMember from "./NewMember.jsx";

const SCCU_API = "http://127.0.0.1:3001";

const TYPE_MAP = {
  "maria.santos@sccu.bz":   { type: "Community",    initials: "MS" },
  "carlos.palacio@sccu.bz": { type: "Business",     initials: "CP" },
  "rose.aranda@sccu.bz":    { type: "Agricultural", initials: "RA" },
  "james.westby@sccu.bz":   { type: "Diaspora",     initials: "JW" },
  "pedro.coc@sccu.bz":      { type: "Trade",        initials: "PC" },
  "diana.cal@sccu.bz":      { type: "Community",    initials: "DC" },
  "miguel.tzul@sccu.bz":    { type: "Agricultural", initials: "MT" },
  "keisha.young@sccu.bz":   { type: "Community",    initials: "KY" },
  "samuel.flowers@sccu.bz": { type: "Community",    initials: "SF" },
};

const TYPE_COLORS = {
  Community:    { bg: "#E6F1FB", text: "#185FA5" },
  Business:     { bg: "#EAF3DE", text: "#3B6D11" },
  Agricultural: { bg: "#FAEEDA", text: "#854F0B" },
  Diaspora:     { bg: "#EEEDFE", text: "#534AB7" },
  Trade:        { bg: "#E1F5EE", text: "#0F6E56" },
};

const RECENT_TXN = [
  { date: "Apr 9",  member: "James Westby",   desc: "Diaspora remittance — Western Union USA",       amount: 32800, type: "credit" },
  { date: "Apr 9",  member: "Diana Cal",       desc: "Market vendor sales — Central Market stall 14", amount: 500,   type: "credit" },
  { date: "Apr 8",  member: "Pedro Coc",       desc: "Contract payment — GoB Works Ministry",         amount: 3800,  type: "credit" },
  { date: "Apr 6",  member: "Miguel Tzul",     desc: "Cacao cooperative payout — Toledo District",    amount: 2300,  type: "credit" },
  { date: "Apr 5",  member: "Maria Santos",    desc: "Electricity bill payment — BEL",                amount: 160,   type: "debit"  },
  { date: "Apr 4",  member: "Carlos Palacio",  desc: "Supplier payment — Western Hardware",           amount: 11250, type: "debit"  },
  { date: "Apr 2",  member: "Rose Aranda",     desc: "Agricultural loan disbursement — Cayo citrus",  amount: 12000, type: "credit" },
];

const fmt = (n) => new Intl.NumberFormat("en-BZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const TABS = ["Dashboard", "Members", "Accounts", "Compliance", "Settings"];

const s = {
  page: { fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#1a1a1a", maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #e8e8e8", marginBottom: 20 },
  logo: { width: 40, height: 40, borderRadius: "50%", background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center" },
  tabs: { display: "flex", gap: 2, borderBottom: "1px solid #e8e8e8", marginBottom: 24 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  metric: { background: "#f7f7f5", borderRadius: 10, padding: "1rem" },
  card: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem 1.25rem" },
  badge: (type) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: TYPE_COLORS[type]?.bg || "#f0f0f0", color: TYPE_COLORS[type]?.text || "#888" }),
  avatar: (initials) => ({ width: 40, height: 40, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#185FA5", flexShrink: 0 }),
  btn: { padding: "8px 16px", fontSize: 13, border: "1px solid #e8e8e8", borderRadius: 8, background: "#fff", cursor: "pointer" },
  input: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #e8e8e8", borderRadius: 8, boxSizing: "border-box", outline: "none" },
};

export default function SCCUDashboard() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("nyanavila_20");
  const [password, setPassword] = useState("Sccu2026#Admin");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Dashboard");
  const [apiStatus, setApiStatus] = useState("checking");
  const [selectedMember, setSelectedMember] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [showNewMember, setShowNewMember] = useState(false);

  useEffect(() => {
    fetch(`${SCCU_API}/health`)
      .then(r => r.json())
      .then(() => setApiStatus("live"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const fetchData = async () => {
    try {
      const [accRes, statRes] = await Promise.all([
        fetch(`${SCCU_API}/accounts`).then(r => r.json()),
        fetch(`${SCCU_API}/stats`).then(r => r.json()),
      ]);
      setAccounts(accRes.accounts || []);
      setStats(statRes);
    } catch {}
  };

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${SCCU_API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (r.ok) {
        setToken(d.token);
        setLoggedIn(true);
        fetchData();
      } else {
        setError(d.detail || "Login failed");
      }
    } catch {
      setError("Cannot reach SCCU API at " + SCCU_API);
    }
    setLoading(false);
  };

  const totalAssets = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  if (!loggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f5", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 16, padding: "2rem", border: "1px solid #e8e8e8" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ ...s.logo, width: 60, height: 60, margin: "0 auto 12px" }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Sensu CU</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>Admin Portal — Belize</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "8px 12px", borderRadius: 8, background: "#f7f7f5" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiStatus === "live" ? "#1D9E75" : apiStatus === "offline" ? "#E24B4A" : "#EF9F27" }}/>
            <span style={{ fontSize: 12, color: "#888" }}>
              {apiStatus === "live" ? "SCCU API live — FastAPI + PostgreSQL" : apiStatus === "offline" ? "API offline — run: uvicorn api:app --port 3001" : "Checking API..."}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "#888", marginBottom: 4, display: "block" }}>Username</label>
              <input style={s.input} value={username} onChange={e => setUsername(e.target.value)}/>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", marginBottom: 4, display: "block" }}>Password</label>
              <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}/>
            </div>
            {error && <p style={{ margin: 0, fontSize: 12, color: "#A32D2D", padding: "8px 12px", background: "#FCEBEB", borderRadius: 8 }}>{error}</p>}
            <button onClick={login} disabled={loading} style={{ ...s.btn, background: "#0F6E56", color: "#fff", border: "none", padding: "12px", fontSize: 14, fontWeight: 500, marginTop: 4 }}>
              {loading ? "Signing in..." : "Sign in to SCCU"}
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 24 }}>Sensu Community Credit Union · Belize</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={s.logo}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Sensu Community Credit Union</p>
            <p style={{ margin: 0, fontSize: 11, color: "#888" }}>bz.sccu · Belize City, BZ</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75" }}/>
            <span style={{ fontSize: 11, color: "#888" }}>Live · FastAPI + PostgreSQL</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#185FA5" }}>NY</div>
            <span style={{ fontSize: 13 }}>nyanavila_20</span>
          </div>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setSelectedMember(null); }} style={{
            padding: "10px 16px", fontSize: 13, border: "none", background: "none", cursor: "pointer",
            color: tab === t ? "#1a1a1a" : "#888", fontWeight: tab === t ? 600 : 400,
            borderBottom: tab === t ? "2px solid #1a1a1a" : "2px solid transparent", marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      {tab === "Dashboard" && (
        <div>
          <div style={s.grid4}>
            {[
              { label: "Total assets",   value: `BZD ${fmt(totalAssets)}`,           sub: `${accounts.length} share savings accounts` },
              { label: "Members",        value: String(accounts.length),              sub: "All active — founding group" },
              { label: "Avg balance",    value: `BZD ${fmt(totalAssets / (accounts.length || 1))}`, sub: "Per member account" },
              { label: "Data source",    value: "Live",                               sub: "FastAPI · PostgreSQL 15" },
            ].map((c, i) => (
              <div key={i} style={s.metric}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: ".05em" }}>{c.label}</p>
                <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>{c.value}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{c.sub}</p>
              </div>
            ))}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <p style={{ fontWeight: 600, marginBottom: 16 }}>Member balances — live from DB</p>
              {accounts.map(a => {
                const pct = totalAssets > 0 ? Math.round((a.balance / totalAssets) * 100) : 0;
                const info = TYPE_MAP[a.owner_email] || {};
                return (
                  <div key={a.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13 }}>{a.label.replace(" Share Savings","").replace(" Account","").replace(" Business","").replace(" Agricultural","").replace(" Diaspora","").replace(" Trade Member","").replace(" Community","").replace(" Rural","")}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>BZD {fmt(a.balance)}</span>
                    </div>
                    <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "#1D9E75", borderRadius: 3 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={s.card}>
              <p style={{ fontWeight: 600, marginBottom: 16 }}>Recent transactions</p>
              {RECENT_TXN.slice(0, 5).map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, marginBottom: i < 4 ? 12 : 0, borderBottom: i < 4 ? "1px solid #f0f0f0" : "none" }}>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 500 }}>{t.member}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{t.desc.slice(0, 38)}…</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                    <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: t.type === "credit" ? "#0F6E56" : "#A32D2D" }}>
                      {t.type === "credit" ? "+" : "−"}BZD {fmt(t.amount)}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Members" && showNewMember && (
        <NewMember
          onSuccess={(member) => { setShowNewMember(false); fetchData(); }}
          onCancel={() => setShowNewMember(false)}
        />
      )}

      {tab === "Members" && !showNewMember && (
        <div>
          {selectedMember ? (
            <div>
              <button onClick={() => setSelectedMember(null)} style={{ ...s.btn, marginBottom: 20 }}>← Back</button>
              <div style={s.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "#185FA5" }}>
                    {TYPE_MAP[selectedMember.owner_email]?.initials || "??"}
                  </div>
                  <div>
                    <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 600 }}>{selectedMember.label}</h2>
                    <span style={s.badge(TYPE_MAP[selectedMember.owner_email]?.type)}>
                      {TYPE_MAP[selectedMember.owner_email]?.type || "Member"}
                    </span>
                  </div>
                </div>
                <div style={{ ...s.grid2, marginBottom: 24 }}>
                  <div style={s.metric}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#888", textTransform: "uppercase" }}>Balance</p>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>BZD {fmt(selectedMember.balance)}</p>
                  </div>
                  <div style={s.metric}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#888", textTransform: "uppercase" }}>Account ID</p>
                    <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>{selectedMember.id}</p>
                  </div>
                </div>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  {[
                    ["Owner", selectedMember.owner_name],
                    ["Email", selectedMember.owner_email],
                    ["Currency", `${selectedMember.currency} (USD 2:1 peg)`],
                    ["Type", selectedMember.type],
                    ["Status", "Active — validated"],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 0", color: "#888", width: 140 }}>{k}</td>
                      <td style={{ padding: "12px 0" }}>{v}</td>
                    </tr>
                  ))}
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, color: "#888", fontSize: 13 }}>{accounts.length} members · Live from PostgreSQL · Click to view details</p>
            <button onClick={() => setShowNewMember(true)} style={{ padding: "9px 18px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, background: "#0F6E56", color: "#fff", cursor: "pointer" }}>
              + New member
            </button>
          </div>
              <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
                {accounts.map((a, i) => {
                  const info = TYPE_MAP[a.owner_email] || {};
                  const autoInitials = (a.owner_name || '').split(' ').map(w=>w[0]?.toUpperCase()||'').join('').slice(0,2);
                  return (
                    <div key={a.id} onClick={() => setSelectedMember(a)}
                      style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", cursor: "pointer", background: "#fff", borderBottom: i < accounts.length - 1 ? "1px solid #f0f0f0" : "none", transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f7f7f5"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#185FA5", flexShrink: 0 }}>
                        {info.initials || autoInitials || "??"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 3px", fontWeight: 500, fontSize: 14 }}>{a.owner_name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{a.owner_email}</p>
                      </div>
                      <span style={s.badge(info.type)}>{info.type || "Member"}</span>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, minWidth: 110, textAlign: "right" }}>BZD {fmt(a.balance)}</p>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Accounts" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, color: "#888", fontSize: 13 }}>{accounts.length} accounts — live from PostgreSQL 15</p>
            <button onClick={fetchData} style={s.btn}>Refresh</button>
          </div>
          <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f7f7f5" }}>
                  {["Member", "Email", "Account ID", "Type", "Balance (BZD)", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 500, fontSize: 11, color: "#888", borderBottom: "1px solid #e8e8e8", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, i) => {
                  const info = TYPE_MAP[a.owner_email] || {};
                  const autoInitials = (a.owner_name || '').split(' ').map(w=>w[0]?.toUpperCase()||'').join('').slice(0,2);
                  return (
                    <tr key={a.id} style={{ borderBottom: i < accounts.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                      <td style={{ padding: "14px", fontWeight: 500 }}>{a.owner_name}</td>
                      <td style={{ padding: "14px", fontSize: 12, color: "#888" }}>{a.owner_email}</td>
                      <td style={{ padding: "14px", fontFamily: "monospace", fontSize: 11, color: "#888" }}>{a.id}</td>
                      <td style={{ padding: "14px" }}><span style={s.badge(info.type)}>{info.type || "Member"}</span></td>
                      <td style={{ padding: "14px", fontWeight: 600 }}>{fmt(a.balance)}</td>
                      <td style={{ padding: "14px" }}><span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#EAF3DE", color: "#3B6D11" }}>Active</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 16px", background: "#f7f7f5", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#888" }}>Total assets under management</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>BZD {fmt(totalAssets)}</span>
          </div>
        </div>
      )}

      {tab === "Compliance" && (
        <div style={s.grid2}>
          {[
            { title: "AML/CFT status", items: [["MLTPA Cap 104 — framework pending", false], ["FIU Belize — registration required", false], ["CDD programme — in development", false], ["STR filing system — planned", false]] },
            { title: "CBB registration", items: [["Credit Unions Act Cap 314", false], ["Fit & proper — officers to document", false], ["IT risk assessment — architecture ready", true], ["CBB submission — Phase 0", false]] },
            { title: "NPS payments licence", items: [["NPS Act Cap 266:01", false], ["APSSS 2.0 integration — planned", false], ["BZD:USD 2:1 hardcoded in system", true], ["Payment processor — TBD", false]] },
            { title: "Data & privacy", items: [["Member data on RHEL 9 + OptiPlex", true], ["PostgreSQL — persistent storage", true], ["No data leaves Belize", true], ["FastAPI audit endpoints — live", true]] },
          ].map((c, i) => (
            <div key={i} style={{ ...s.card, marginBottom: 0 }}>
              <p style={{ fontWeight: 600, marginBottom: 14 }}>{c.title}</p>
              {c.items.map(([text, done]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#888", marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "#1D9E75" : "#e0e0e0", flexShrink: 0 }}/>
                  {text}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "Settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={s.card}>
            <p style={{ fontWeight: 600, marginBottom: 16 }}>System configuration</p>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              {[
                ["SCCU API", "http://127.0.0.1:3001 (FastAPI)"],
                ["OBP API", "http://127.0.0.1:8080 (OBP v5.1.0)"],
                ["Bank ID", "93dba562-eb4f-4a69-949f-0fe9bb6a5644"],
                ["Bank routing", "bz.sccu"],
                ["Admin user", "nyanavila_20"],
                ["Database", "PostgreSQL 15 — localhost:5432/sccu"],
                ["Cache", "Redis 7 — localhost:6379"],
                ["Runtime", "Podman rootless — RHEL 9 — OptiPlex 7050"],
                ["Currency", "BZD — USD 2:1 peg"],
                ["GitHub", "github.com/nyanavila/sccu-platform"],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 0", color: "#888", width: 200 }}>{k}</td>
                  <td style={{ padding: "10px 0", fontFamily: "monospace", fontSize: 11 }}>{v}</td>
                </tr>
              ))}
            </table>
          </div>
          <div style={s.card}>
            <p style={{ fontWeight: 600, marginBottom: 16 }}>Quick commands</p>
            {[
              ["Start SCCU API", "cd ~/sccu && uvicorn api:app --host 0.0.0.0 --port 3001 --reload &"],
              ["Start OBP core banking", "podman run --network host --env-file ~/sccu/obp.env docker.io/openbankproject/obp-api"],
              ["Get fresh OBP token", "source ~/sccu/auth.sh"],
              ["Check all containers", "podman ps --format '{{.Names}} {{.Status}}'"],
              ["Save to GitHub", "cd ~/sccu && git add -A && git commit -m 'update' && git push"],
            ].map(([label, cmd]) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</p>
                <code style={{ display: "block", fontSize: 11, padding: "10px 12px", background: "#f7f7f5", borderRadius: 8, fontFamily: "monospace", lineHeight: 1.7, wordBreak: "break-all" }}>{cmd}</code>
              </div>
            ))}
          </div>
          <button onClick={() => { setLoggedIn(false); setToken(""); setAccounts([]); setStats(null); }} style={s.btn}>Sign out</button>
        </div>
      )}
    </div>
  );
}
// This file has been updated - please refresh
