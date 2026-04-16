import { useState, useEffect, useRef } from "react";
const API = import.meta.env.VITE_SCCU_API || "http://127.0.0.1:3001";
const fmt = (n) => new Intl.NumberFormat("en-BZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
const s = {
  page: { fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#1a1a1a", background: "#f7f7f5", minHeight: "100vh" },
  card: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1.25rem" },
  input: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #e8e8e8", borderRadius: 8, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  btnP: { padding: "11px 20px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, cursor: "pointer", background: "#0F6E56", color: "#fff" },
  btnS: { padding: "11px 20px", fontSize: 13, fontWeight: 500, border: "1px solid #e8e8e8", borderRadius: 8, cursor: "pointer", background: "#fff", color: "#1a1a1a" },
  lbl: { fontSize: 12, color: "#888", marginBottom: 5, display: "block", fontWeight: 500 },
};
function TellerLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const login = async () => {
    if (!username || !password) { setError("Enter username and password"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/teller/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const d = await r.json();
      if (r.ok) onLogin(d.token, d);
      else setError(d.detail || "Login failed");
    } catch { setError("Cannot reach SCCU API"); }
    setLoading(false);
  };
  return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22, color: "#fff", fontWeight: 700 }}>T</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Teller Portal</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>Sensu Community Credit Union — Belize City</p>
        </div>
        <div style={s.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={s.lbl}>Teller username</label><input style={s.input} placeholder="teller1" value={username} onChange={e => setUsername(e.target.value)} /></div>
            <div><label style={s.lbl}>Password</label><input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
            {error && <div style={{ padding: "10px 12px", background: "#FCEBEB", borderRadius: 8, fontSize: 13, color: "#A32D2D" }}>{error}</div>}
            <button onClick={login} disabled={loading} style={{ ...s.btnP, width: "100%", padding: 13 }}>{loading ? "Signing in…" : "Sign in"}</button>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 20 }}>teller1 / Sccu2026#Teller1 · teller2 / Sccu2026#Teller2</p>
        </div>
      </div>
    </div>
  );
}
function OpenSession({ token, teller, onOpened }) {
  const [float, setFloat] = useState("500");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const open = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/teller/session/open`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ opening_float: parseFloat(float) || 0 }) });
      const d = await r.json();
      if (r.ok) onOpened(d); else setError(d.detail || "Failed to open session");
    } catch { setError("API error"); }
    setLoading(false);
  };
  return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={s.card}>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>Open till</h2>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "#888" }}>Welcome, {teller.full_name} — {teller.branch}</p>
          <label style={s.lbl}>Opening cash float (BZD)</label>
          <input style={{ ...s.input, marginBottom: 16 }} type="number" value={float} onChange={e => setFloat(e.target.value)} placeholder="500.00" />
          {error && <div style={{ padding: "10px 12px", background: "#FCEBEB", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 12 }}>{error}</div>}
          <button onClick={open} disabled={loading} style={{ ...s.btnP, width: "100%" }}>{loading ? "Opening…" : "Open till — start session"}</button>
        </div>
      </div>
    </div>
  );
}
function MemberSearch({ token, onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const search = async (val) => {
    if (val.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/teller/member-lookup?q=${encodeURIComponent(val)}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json(); setResults(d.results || []);
    } catch { setResults([]); }
    setLoading(false);
  };
  const handleChange = (val) => { setQ(val); clearTimeout(timer.current); timer.current = setTimeout(() => search(val), 300); };
  return (
    <div>
      <label style={s.lbl}>Search member — name, email, or account ID</label>
      <input style={s.input} placeholder="e.g. Maria Santos" value={q} onChange={e => handleChange(e.target.value)} />
      {loading && <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>Searching…</p>}
      {results.length > 0 && (
        <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
          {results.map((r, i) => (
            <div key={r.account_id} onClick={() => { onSelect(r); setResults([]); setQ(""); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", cursor: "pointer", background: "#fff", borderBottom: i < results.length - 1 ? "1px solid #f0f0f0" : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f7f7f5"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              <div><p style={{ margin: "0 0 2px", fontWeight: 500, fontSize: 13 }}>{r.owner_name}</p><p style={{ margin: 0, fontSize: 11, color: "#888" }}>{r.account_id}</p></div>
              <div style={{ textAlign: "right" }}><p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 13 }}>BZD {fmt(r.balance)}</p><p style={{ margin: 0, fontSize: 11, color: "#888" }}>{r.currency}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Receipt({ data, type, onClose }) {
  const printReceipt = () => {
    const w = window.open("", "_blank", "width=320,height=500");
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:10px}.center{text-align:center}.line{border-top:1px dashed #000;margin:8px 0}.row{display:flex;justify-content:space-between}h3{margin:0 0 4px}p{margin:2px 0}</style></head><body><div class="center"><h3>SENSU COMMUNITY CU</h3><p>Belize City, Belize · bz.sccu</p></div><div class="line"></div><div class="row"><span>${type.toUpperCase()}</span><span>${new Date(data.timestamp).toLocaleString("en-BZ")}</span></div><div class="line"></div><p>Receipt: ${data.receipt_no}</p><p>Account: ${data.account_label}</p><p>ID: ${data.account_id}</p><div class="line"></div><div class="row"><span>Amount:</span><strong>BZD ${fmt(data.amount)}</strong></div><div class="row"><span>New balance:</span><strong>BZD ${fmt(data.new_balance)}</strong></div><div class="line"></div><p>${data.description}</p><div class="line"></div><p>Teller: ${data.teller}</p><p>Branch: ${data.branch}</p><div class="center"><p style="margin-top:12px">Thank you for banking with SCCU</p></div></body></html>`);
    w.print(); w.close();
  };
  const accent = type === "deposit" ? "#0F6E56" : "#A32D2D";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ ...s.card, width: "100%", maxWidth: 380, margin: "1rem" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 22, color: accent }}>✓</div>
          <h3 style={{ margin: 0, fontSize: 18, color: accent }}>{type === "deposit" ? "Deposit successful" : "Withdrawal successful"}</h3>
        </div>
        <div style={{ background: "#f7f7f5", borderRadius: 10, padding: "1rem", marginBottom: 16 }}>
          {[["Receipt no.", data.receipt_no], ["Account", data.account_label], ["Amount", `BZD ${fmt(data.amount)}`], ["New balance", `BZD ${fmt(data.new_balance)}`], ["Description", data.description], ["Teller", data.teller], ["Time", new Date(data.timestamp).toLocaleString("en-BZ")]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e8e8e8", fontSize: 13 }}>
              <span style={{ color: "#888" }}>{k}</span>
              <span style={{ fontWeight: k === "Amount" || k === "New balance" ? 600 : 400 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={printReceipt} style={{ ...s.btnS, flex: 1 }}>Print receipt</button>
          <button onClick={onClose} style={{ ...s.btnP, flex: 1 }}>New transaction</button>
        </div>
      </div>
    </div>
  );
}
function TellerWorkspace({ token, teller, session, onCloseSession, onLogout }) {
  const [mode, setMode] = useState("deposit");
  const [member, setMember] = useState(null);
  const [amount, setAmount] = useState("");
  const [description, setDesc] = useState("");
  const [source, setSource] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [summary, setSummary] = useState(null);
  const [view, setView] = useState("transaction");
  const loadSummary = async () => {
    try {
      const r = await fetch(`${API}/teller/session/summary`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json(); setSummary(d);
    } catch {}
  };
  useEffect(() => { if (view === "summary") loadSummary(); }, [view]);
  useEffect(() => { loadSummary(); }, []);
  const post = async () => {
    if (!member) { setError("Select a member account first"); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount"); return; }
    setLoading(true); setError("");
    const endpoint = mode === "deposit" ? "/teller/deposit" : "/teller/withdrawal";
    try {
      const r = await fetch(`${API}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ account_id: member.account_id, amount: parseFloat(amount), description: description || undefined, source: mode === "deposit" ? source : undefined }) });
      const d = await r.json();
      if (r.ok) { setReceipt(d); setMember(null); setAmount(""); setDesc(""); setSource("Cash"); loadSummary(); }
      else setError(d.detail || "Transaction failed");
    } catch { setError("API error — check server"); }
    setLoading(false);
  };
  const closeSession = async () => {
    const cf = prompt("Enter closing cash count (BZD):", session.opening_float);
    if (cf === null) return;
    try {
      const r = await fetch(`${API}/teller/session/close`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ closing_float: parseFloat(cf) || 0 }) });
      if (r.ok) onCloseSession();
    } catch {}
  };
  const now = new Date().toLocaleString("en-BZ", { hour: "2-digit", minute: "2-digit", hour12: true });
  return (
    <div style={s.page}>
      {receipt && <Receipt data={receipt} type={mode} onClose={() => setReceipt(null)} />}
      <div style={{ background: "#534AB7", padding: "0 20px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{teller.full_name.split(" ").map(w => w[0]).join("").slice(0,2)}</div>
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 14 }}>{teller.full_name}</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{teller.branch} · Session #{session.session_id} · {now}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView(v => v === "summary" ? "transaction" : "summary")} style={{ padding: "7px 14px", fontSize: 12, borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff" }}>{view === "summary" ? "Back to till" : "Today's summary"}</button>
            <button onClick={closeSession} style={{ padding: "7px 14px", fontSize: 12, borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "rgba(255,255,255,0.8)" }}>Close till</button>
            <button onClick={onLogout} style={{ padding: "7px 14px", fontSize: 12, borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)" }}>Sign out</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[["Opening float", `BZD ${fmt(session.opening_float)}`], ["Deposits today", summary ? `BZD ${fmt(summary.total_deposits)}` : "—"], ["Withdrawals today", summary ? `BZD ${fmt(summary.total_withdrawals)}` : "—"], ["Transactions", summary ? String(summary.transaction_count) : "—"]].map(([label, value], i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "1rem" }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: "#888", textTransform: "uppercase" }}>{label}</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>
        {view === "transaction" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
            <div style={s.card}>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {["deposit", "withdrawal"].map(m => (
                  <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px", fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "none", background: mode === m ? (m === "deposit" ? "#0F6E56" : "#A32D2D") : "#f7f7f5", color: mode === m ? "#fff" : "#888" }}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}><MemberSearch token={token} onSelect={setMember} /></div>
              {member && (
                <div style={{ background: "#EAF3DE", borderRadius: 10, padding: "12px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 14, color: "#27500A" }}>{member.owner_name}</p><p style={{ margin: 0, fontSize: 11, color: "#3B6D11" }}>{member.account_id}</p></div>
                  <div style={{ textAlign: "right" }}><p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, color: "#27500A" }}>BZD {fmt(member.balance)}</p><button onClick={() => setMember(null)} style={{ fontSize: 11, color: "#888", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Clear</button></div>
                </div>
              )}
              <div style={{ marginBottom: 14 }}><label style={s.lbl}>Amount (BZD)</label><input style={{ ...s.input, fontSize: 20, fontWeight: 600 }} type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></div>
              {mode === "deposit" && (<div style={{ marginBottom: 14 }}><label style={s.lbl}>Source</label><select value={source} onChange={e => setSource(e.target.value)} style={s.input}><option>Cash</option><option>Bank transfer</option><option>Cheque</option><option>Remittance</option><option>Payroll</option><option>Other</option></select></div>)}
              <div style={{ marginBottom: 18 }}><label style={s.lbl}>Description (optional)</label><input style={s.input} placeholder={mode === "deposit" ? "e.g. Salary — Ministry of Health" : "e.g. Member withdrawal"} value={description} onChange={e => setDesc(e.target.value)} /></div>
              {error && <div style={{ padding: "10px 12px", background: "#FCEBEB", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 14 }}>{error}</div>}
              <button onClick={post} disabled={loading || !member} style={{ ...s.btnP, width: "100%", padding: 13, fontSize: 15, background: mode === "deposit" ? "#0F6E56" : "#A32D2D", opacity: !member ? 0.5 : 1 }}>
                {loading ? "Processing…" : `Post ${mode} — BZD ${amount ? fmt(amount) : "0.00"}`}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={s.card}>
                <p style={{ fontWeight: 600, margin: "0 0 12px", fontSize: 14 }}>Quick deposit</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[50,100,200,500,1000,2000].map(n => (<button key={n} onClick={() => { setMode("deposit"); setAmount(String(n)); }} style={{ ...s.btnS, padding: "9px", fontSize: 13, fontWeight: 600 }}>BZD {n.toLocaleString()}</button>))}
                </div>
              </div>
              <div style={s.card}>
                <p style={{ fontWeight: 600, margin: "0 0 12px", fontSize: 14 }}>Quick withdrawal</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[50,100,200,500,1000,2000].map(n => (<button key={n} onClick={() => { setMode("withdrawal"); setAmount(String(n)); }} style={{ ...s.btnS, padding: "9px", fontSize: 13, fontWeight: 600, color: "#A32D2D" }}>BZD {n.toLocaleString()}</button>))}
                </div>
              </div>
              <div style={s.card}>
                <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 13 }}>Teller rules</p>
                {["Cash above BZD 5,000 — manager approval", "Always verify member ID", "Count cash before posting", "BZD 10,000+ — CTR required"].map(r => (
                  <p key={r} style={{ margin: "0 0 8px", fontSize: 12, color: "#666", display: "flex", gap: 8 }}><span style={{ color: "#534AB7", flexShrink: 0 }}>▸</span>{r}</p>
                ))}
              </div>
            </div>
          </div>
        )}
        {view === "summary" && summary && (
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Today's transactions — {teller.full_name}</h3>
              <button onClick={loadSummary} style={s.btnS}>Refresh</button>
            </div>
            {summary.transactions.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: "2rem" }}>No transactions posted yet.</p>
            ) : (
              <div style={{ border: "1px solid #e8e8e8", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#f7f7f5" }}>{["Receipt","Type","Account","Description","Amount","Time"].map(h => (<th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, fontSize: 11, color: "#888", textTransform: "uppercase", borderBottom: "1px solid #e8e8e8" }}>{h}</th>))}</tr></thead>
                  <tbody>
                    {summary.transactions.map((t, i) => (
                      <tr key={i} style={{ borderBottom: i < summary.transactions.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: "#888" }}>{t.receipt_no}</td>
                        <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: t.txn_type === "DEPOSIT" ? "#EAF3DE" : "#FCEBEB", color: t.txn_type === "DEPOSIT" ? "#0F6E56" : "#A32D2D" }}>{t.txn_type}</span></td>
                        <td style={{ padding: "12px 14px", fontWeight: 500 }}>{t.account_label}</td>
                        <td style={{ padding: "12px 14px", color: "#888" }}>{t.description}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: t.txn_type === "DEPOSIT" ? "#0F6E56" : "#A32D2D" }}>{t.txn_type === "DEPOSIT" ? "+" : "−"}BZD {fmt(t.amount)}</td>
                        <td style={{ padding: "12px 14px", color: "#888", fontSize: 11 }}>{new Date(t.created_at).toLocaleTimeString("en-BZ", { hour: "2-digit", minute: "2-digit" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: "flex", gap: 24, marginTop: 16, padding: "14px 16px", background: "#f7f7f5", borderRadius: 10, fontSize: 13 }}>
              <span style={{ color: "#888" }}>Deposits:</span><span style={{ fontWeight: 700, color: "#0F6E56" }}>BZD {fmt(summary.total_deposits)}</span>
              <span style={{ color: "#888", marginLeft: 12 }}>Withdrawals:</span><span style={{ fontWeight: 700, color: "#A32D2D" }}>BZD {fmt(summary.total_withdrawals)}</span>
              <span style={{ color: "#888", marginLeft: 12 }}>Count:</span><span style={{ fontWeight: 700 }}>{summary.transaction_count}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default function TellerPortal() {
  const [token, setToken] = useState("");
  const [teller, setTeller] = useState(null);
  const [session, setSession] = useState(null);
  const handleLogin = (tok, info) => { setToken(tok); setTeller(info); };
  const handleLogout = async () => {
    try { await fetch(`${API}/teller/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); } catch {}
    setToken(""); setTeller(null); setSession(null);
  };
  if (!token) return <TellerLogin onLogin={handleLogin} />;
  if (!session) return <OpenSession token={token} teller={teller} onOpened={setSession} />;
  return <TellerWorkspace token={token} teller={teller} session={session} onCloseSession={() => { setSession(null); setTeller(null); setToken(""); }} onLogout={handleLogout} />;
}
