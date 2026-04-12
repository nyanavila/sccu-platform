import { useState, useEffect } from "react";

const API = "http://127.0.0.1:8080";
const BANK_ID = "93dba562-eb4f-4a69-949f-0fe9bb6a5644";
const CONSUMER_KEY = "sccu-key-2026";

const MEMBERS = [
  { id: "sccu-savings-maria-001",   name: "Maria Santos",    type: "Community",    balance: 2400,  initials: "MS", email: "maria.santos@sccu.bz" },
  { id: "sccu-savings-carlos-001",  name: "Carlos Palacio",  type: "Business",     balance: 18750, initials: "CP", email: "carlos.palacio@sccu.bz" },
  { id: "sccu-savings-rose-001",    name: "Rose Aranda",     type: "Agricultural", balance: 5200,  initials: "RA", email: "rose.aranda@sccu.bz" },
  { id: "sccu-savings-james-001",   name: "James Westby",    type: "Diaspora",     balance: 34800, initials: "JW", email: "james.westby@sccu.bz" },
  { id: "sccu-savings-pedro-001",   name: "Pedro Coc",       type: "Trade",        balance: 7600,  initials: "PC", email: "pedro.coc@sccu.bz" },
  { id: "sccu-savings-diana-001",   name: "Diana Cal",       type: "Community",    balance: 1850,  initials: "DC", email: "diana.cal@sccu.bz" },
  { id: "sccu-savings-miguel-001",  name: "Miguel Tzul",     type: "Agricultural", balance: 3100,  initials: "MT", email: "miguel.tzul@sccu.bz" },
];

const TYPE_COLORS = {
  Community:    { bg: "#E6F1FB", text: "#185FA5" },
  Business:     { bg: "#EAF3DE", text: "#3B6D11" },
  Agricultural: { bg: "#FAEEDA", text: "#854F0B" },
  Diaspora:     { bg: "#EEEDFE", text: "#534AB7" },
  Trade:        { bg: "#E1F5EE", text: "#0F6E56" },
};

const fmt = (n) => new Intl.NumberFormat("en-BZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const totalAssets = MEMBERS.reduce((s, m) => s + m.balance, 0);
const TABS = ["Dashboard", "Members", "Accounts", "Compliance", "Settings"];

const RECENT_TXN = [
  { date: "Apr 9",  member: "James Westby",   desc: "Diaspora remittance — Western Union USA",       amount: 32800, type: "credit" },
  { date: "Apr 9",  member: "Diana Cal",       desc: "Market vendor sales — Central Market stall 14", amount: 500,   type: "credit" },
  { date: "Apr 8",  member: "Pedro Coc",       desc: "Contract payment — GoB Works Ministry",         amount: 3800,  type: "credit" },
  { date: "Apr 6",  member: "Miguel Tzul",     desc: "Cacao cooperative payout — Toledo District",    amount: 2300,  type: "credit" },
  { date: "Apr 5",  member: "Maria Santos",    desc: "Electricity bill payment — BEL",                amount: 160,   type: "debit"  },
  { date: "Apr 4",  member: "Carlos Palacio",  desc: "Supplier payment — Western Hardware",           amount: 11250, type: "debit"  },
  { date: "Apr 2",  member: "Rose Aranda",     desc: "Agricultural loan disbursement — Cayo citrus",  amount: 12000, type: "credit" },
];

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
  const [liveAccounts, setLiveAccounts] = useState([]);
  const [obpVersion, setObpVersion] = useState("");

  useEffect(() => {
    fetch(`${API}/obp/v5.1.0/root`)
      .then(r => r.json())
      .then(d => { setApiStatus("live"); setObpVersion(d.version || "v5.1.0"); })
      .catch(() => setApiStatus("offline"));
  }, []);

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/my/logins/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `DirectLogin username="${username}",password="${password}",consumer_key="${CONSUMER_KEY}"`,
        },
      });
      const d = await r.json();
      if (d.token) {
        setToken(d.token);
        setLoggedIn(true);
        fetchAccounts(d.token);
      } else {
        setError(d.message || "Login failed");
      }
    } catch {
      setError("Cannot reach SCCU API at " + API);
    }
    setLoading(false);
  };

  const fetchAccounts = async (tk) => {
    try {
      const r = await fetch(`${API}/obp/v5.1.0/banks/${BANK_ID}/accounts/private`, {
        headers: { "Authorization": `DirectLogin token="${tk}"` },
      });
      const d = await r.json();
      setLiveAccounts(d.accounts || []);
    } catch {}
  };

  const s = {
    page: { fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#1a1a1a", padding: "0 0 40px" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #e8e8e8", marginBottom: 20 },
    logo: { width: 40, height: 40, borderRadius: "50%", background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center" },
    tabs: { display: "flex", gap: 2, borderBottom: "1px solid #e8e8e8", marginBottom: 24 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    metric: { background: "#f7f7f5", borderRadius: 10, padding: "1rem" },
    card: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem 1.25rem" },
    badge: (type) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: TYPE_COLORS[type]?.bg, color: TYPE_COLORS[type]?.text }),
    avatar: { width: 40, height: 40, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#185FA5", flexShrink: 0 },
    btn: { padding: "8px 16px", fontSize: 13, border: "1px solid #e8e8e8", borderRadius: 8, background: "#fff", cursor: "pointer" },
    input: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #e8e8e8", borderRadius: 8, boxSizing: "border-box", outline: "none" },
  };

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
              {apiStatus === "live" ? `OBP ${obpVersion} — live` : apiStatus === "offline" ? "API offline — start containers first" : "Checking API..."}
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
    <div style={{ ...s.page, maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" }}>
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
            <span style={{ fontSize: 11, color: "#888" }}>Live · {obpVersion}</span>
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
              { label: "Total assets", value: `BZD ${fmt(totalAssets)}`, sub: "7 share savings accounts" },
              { label: "Members", value: "7", sub: "All active — founding group" },
              { label: "Live accounts", value: liveAccounts.length || "7", sub: "Via OBP API" },
              { label: "API status", value: "Live", sub: `${obpVersion} · mapped` },
            ].map((c, i) => (
              <div key={i} style={s.metric}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: ".05em" }}>{c.label}</p>
                <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600 }}>{c.value}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{c.sub}</p>
              </div>
            ))}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <p style={{ fontWeight: 600, marginBottom: 16 }}>Member balances</p>
              {MEMBERS.map(m => (
                <div key={m.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13 }}>{m.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>BZD {fmt(m.balance)}</span>
                  </div>
                  <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round(m.balance / totalAssets * 100)}%`, background: "#1D9E75", borderRadius: 3 }}/>
                  </div>
                </div>
              ))}
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

      {tab === "Members" && (
        <div>
          {selectedMember ? (
            <div>
              <button onClick={() => setSelectedMember(null)} style={{ ...s.btn, marginBottom: 20 }}>← Back</button>
              <div style={s.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  <div style={{ ...s.avatar, width: 56, height: 56, fontSize: 18 }}>{selectedMember.initials}</div>
                  <div>
                    <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 600 }}>{selectedMember.name}</h2>
                    <span style={s.badge(selectedMember.type)}>{selectedMember.type} member</span>
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
                    ["Email", selectedMember.email],
                    ["Account type", "Share Savings — BZD"],
                    ["Currency", "BZD (USD 2:1 peg)"],
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
              <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>7 founding members · Click to view details</p>
              <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
                {MEMBERS.map((m, i) => (
                  <div key={m.id} onClick={() => setSelectedMember(m)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", cursor: "pointer", background: "#fff", borderBottom: i < MEMBERS.length - 1 ? "1px solid #f0f0f0" : "none", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f7f7f5"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <div style={s.avatar}>{m.initials}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 3px", fontWeight: 500, fontSize: 14 }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{m.email}</p>
                    </div>
                    <span style={s.badge(m.type)}>{m.type}</span>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, minWidth: 110, textAlign: "right" }}>BZD {fmt(m.balance)}</p>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Accounts" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, color: "#888", fontSize: 13 }}>{liveAccounts.length > 0 ? `${liveAccounts.length} accounts from OBP API` : "7 accounts — local data"}</p>
            <button onClick={() => fetchAccounts(token)} style={s.btn}>Refresh from API</button>
          </div>
          <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f7f7f5" }}>
                  {["Member", "Account ID", "Type", "Balance (BZD)", "Currency", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 500, fontSize: 11, color: "#888", borderBottom: "1px solid #e8e8e8", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: i < MEMBERS.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <td style={{ padding: "14px", fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: "14px", fontFamily: "monospace", fontSize: 11, color: "#888" }}>{m.id}</td>
                    <td style={{ padding: "14px" }}><span style={s.badge(m.type)}>{m.type}</span></td>
                    <td style={{ padding: "14px", fontWeight: 600 }}>{fmt(m.balance)}</td>
                    <td style={{ padding: "14px", color: "#888" }}>BZD</td>
                    <td style={{ padding: "14px" }}><span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#EAF3DE", color: "#3B6D11" }}>Active</span></td>
                  </tr>
                ))}
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
            { title: "Data & privacy", items: [["Member data on RHEL 9 server", true], ["PostgreSQL — persistent storage", true], ["No data leaves Belize", true], ["OBP audit metrics — live", true]] },
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
                ["OBP API host", "http://127.0.0.1:8080"],
                ["Bank ID", "93dba562-eb4f-4a69-949f-0fe9bb6a5644"],
                ["Bank routing", "bz.sccu"],
                ["Consumer key", "sccu-key-2026"],
                ["Admin user", "nyanavila_20"],
                ["Database", "PostgreSQL 15 — localhost:5432/sccu"],
                ["Cache", "Redis 7 — localhost:6379"],
                ["Runtime", "Podman rootless — RHEL 9"],
                ["Network mode", "--network host"],
                ["Currency", "BZD — USD 2:1 peg"],
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
              ["Start SCCU containers", "podman run --network host --env-file ~/sccu/obp.env docker.io/openbankproject/obp-api"],
              ["Get fresh token", "source ~/sccu/auth.sh"],
              ["Check container status", "podman ps --format '{{.Names}} {{.Status}}'"],
              ["Watch OBP logs", "podman logs -f sccu-core 2>&1 | grep -v keepalive"],
            ].map(([label, cmd]) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</p>
                <code style={{ display: "block", fontSize: 11, padding: "10px 12px", background: "#f7f7f5", borderRadius: 8, fontFamily: "monospace", lineHeight: 1.7, wordBreak: "break-all" }}>{cmd}</code>
              </div>
            ))}
          </div>
          <button onClick={() => { setLoggedIn(false); setToken(""); setLiveAccounts([]); }} style={s.btn}>Sign out</button>
        </div>
      )}
    </div>
  );
}
