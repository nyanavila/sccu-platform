import { useState, useEffect } from "react";
import Transfer from "./Transfer.jsx";

import API from "./config.js";
const SCCU_API = API;
const fmt = (n) => new Intl.NumberFormat("en-BZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const MEMBER_TRANSACTIONS = {
  "maria.santos@sccu.bz": [
    { date: "Apr 8", desc: "Salary credit — Ministry of Education", amount: 700, type: "credit" },
    { date: "Apr 5", desc: "Electricity bill — BEL", amount: 160, type: "debit" },
    { date: "Apr 1", desc: "Founding share purchase", amount: 500, type: "credit" },
  ],
  "carlos.palacio@sccu.bz": [
    { date: "Apr 4", desc: "Supplier payment — Western Hardware", amount: 11250, type: "debit" },
    { date: "Apr 3", desc: "Small business loan disbursement", amount: 25000, type: "credit" },
    { date: "Apr 1", desc: "Founding share purchase", amount: 5000, type: "credit" },
  ],
  "rose.aranda@sccu.bz": [
    { date: "Apr 2", desc: "Agricultural loan disbursement — Cayo citrus", amount: 12000, type: "credit" },
    { date: "Apr 1", desc: "Founding share purchase", amount: 1000, type: "credit" },
  ],
  "james.westby@sccu.bz": [
    { date: "Apr 9", desc: "Remittance — Western Union USA", amount: 12800, type: "credit" },
    { date: "Apr 5", desc: "Remittance — Western Union USA", amount: 20000, type: "credit" },
    { date: "Apr 1", desc: "Founding share purchase", amount: 2000, type: "credit" },
  ],
  "pedro.coc@sccu.bz": [
    { date: "Apr 8", desc: "Contract payment — GoB Works Ministry", amount: 3800, type: "credit" },
    { date: "Apr 1", desc: "Founding share purchase", amount: 1500, type: "credit" },
  ],
  "diana.cal@sccu.bz": [
    { date: "Apr 9", desc: "Market sales deposit — Central Market stall 14", amount: 500, type: "credit" },
    { date: "Apr 1", desc: "Founding share purchase", amount: 500, type: "credit" },
  ],
  "miguel.tzul@sccu.bz": [
    { date: "Apr 6", desc: "Cacao cooperative payout — Toledo District", amount: 2300, type: "credit" },
    { date: "Apr 1", desc: "Founding share purchase", amount: 800, type: "credit" },
  ],
  "keisha.young@sccu.bz": [
    { date: "Apr 12", desc: "Opening deposit", amount: 750, type: "credit" },
  ],
  "samuel.flowers@sccu.bz": [
    { date: "Apr 12", desc: "Opening deposit", amount: 1000, type: "credit" },
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
  "keisha.young@sccu.bz":   "Keisha Young",
  "samuel.flowers@sccu.bz": "Samuel Flowers",
};

const MEMBER_PASSWORDS = {
  "maria.santos@sccu.bz":   "Sccu2026#Maria",
  "carlos.palacio@sccu.bz": "Sccu2026#Carlos",
  "rose.aranda@sccu.bz":    "Sccu2026#Rose",
  "james.westby@sccu.bz":   "Sccu2026#James",
  "pedro.coc@sccu.bz":      "Sccu2026#Pedro",
  "diana.cal@sccu.bz":      "Sccu2026#Diana",
  "miguel.tzul@sccu.bz":    "Sccu2026#Miguel",
  "keisha.young@sccu.bz":   "Sccu2026#6O24B1NK",
  "samuel.flowers@sccu.bz": "Sccu2026#flowers",
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
  const [showTransfer, setShowTransfer] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState([]);

  useEffect(() => {
    fetch(`${SCCU_API}/health`)
      .then(r => r.json())
      .then(() => setApiStatus("live"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const fetchTransactions = async (accountId) => {
    try {
      const r = await fetch(`${SCCU_API}/transactions/${accountId}`);
      const d = await r.json();
      setLiveTransactions(d.transactions || []);
    } catch {}
  };

  const login = async () => {
    setLoading(true);
    setError("");
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
    try {
      const r = await fetch(`${SCCU_API}/accounts`);
      const d = await r.json();
      const memberAccount = d.accounts.find(a => a.owner_email === email);
      if (memberAccount) {
        setAccount(memberAccount);
        setLoggedIn(true);
        fetchTransactions(memberAccount.id);
      } else {
        setError("Account not found. Please contact SCCU support.");
      }
    } catch {
      setError("Cannot reach SCCU API. Please try again.");
    }
    setLoading(false);
  };

  const name = MEMBER_NAMES[email] || "Member";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const transactions = MEMBER_TRANSACTIONS[email] || [];

  const s = {
    page: { fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#1a1a1a", minHeight: "100vh", background: "#f7f7f5" },
    card: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: "1.5rem" },
    input: { width: "100%", padding: "12px 14px", fontSize: 14, border: "1px solid #e8e8e8", borderRadius: 10, boxSizing: "border-box", outline: "none" },
    btn: (primary) => ({
      width: "100%", padding: "13px", fontSize: 14, fontWeight: 600,
      border: primary ? "none" : "1px solid #e8e8e8", borderRadius: 10,
      cursor: "pointer", background: primary ? "#0F6E56" : "#fff",
      color: primary ? "#fff" : "#1a1a1a",
    }),
    tab: (active) => ({
      padding: "10px 20px", fontSize: 13, border: "none", background: "none",
      cursor: "pointer", color: active ? "#1a1a1a" : "#888",
      fontWeight: active ? 600 : 400,
      borderBottom: active ? "2px solid #0F6E56" : "2px solid transparent",
      marginBottom: -1,
    }),
  };

  if (!loggedIn) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "10px 14px", borderRadius: 8, background: "#f7f7f5" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiStatus === "live" ? "#1D9E75" : "#EF9F27" }}/>
              <span style={{ fontSize: 12, color: "#888" }}>
                {apiStatus === "live" ? "Secure connection — SCCU Belize" : "Connecting to SCCU..."}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "block", fontWeight: 500 }}>Email address</label>
                <input style={s.input} type="email" placeholder="yourname@sccu.bz" value={email} onChange={e => setEmail(e.target.value)}/>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "block", fontWeight: 500 }}>Password</label>
                <input style={s.input} type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}/>
              </div>
              {error && <div style={{ padding: "12px 14px", background: "#FCEBEB", borderRadius: 8, fontSize: 13, color: "#A32D2D" }}>{error}</div>}
              <button onClick={login} disabled={loading} style={s.btn(true)}>
                {loading ? "Signing in..." : "Sign in to my account"}
              </button>
            </div>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Need help? Call SCCU: <span style={{ color: "#0F6E56" }}>+501 XXX-XXXX</span></p>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginBottom: 10 }}>Demo — click to sign in as a member</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(MEMBER_NAMES).slice(0, 6).map(([em, nm]) => (
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
    <>
      {showReceive && account && (
        <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"1rem" }}>
          <div style={{ background:"#fff",borderRadius:20,padding:"2rem",width:"100%",maxWidth:460 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
              <div>
                <h2 style={{ margin:"0 0 4px",fontSize:20,fontWeight:700 }}>Receive money</h2>
                <p style={{ margin:0,fontSize:13,color:"#888" }}>Share your account details</p>
              </div>
              <button onClick={() => setShowReceive(false)} style={{ width:32,height:32,borderRadius:"50%",border:"1px solid #e8e8e8",background:"#fff",cursor:"pointer",fontSize:18 }}>×</button>
            </div>
            <div style={{ background:"#f7f7f5",borderRadius:12,padding:"1.25rem",marginBottom:20 }}>
              {[
                ["Full name", MEMBER_NAMES[email]],
                ["Account ID", account.id],
                ["Account number", account.number || "SCCU-2026"],
                ["Institution", "Sensu Community Credit Union"],
                ["Routing", "bz.sccu"],
                ["Currency", "BZD — Belize Dollar"],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e8e8e8",fontSize:13 }}>
                  <span style={{ color:"#888" }}>{k}</span>
                  <span style={{ fontWeight:500,fontFamily:k.includes("Account")||k==="Routing"?"monospace":"inherit",fontSize:k.includes("Account")||k==="Routing"?11:13 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:"12px 14px",background:"#E6F1FB",borderRadius:8,marginBottom:20,fontSize:13,color:"#185FA5" }}>
              Share these details with anyone who wants to send you money via SCCU.
            </div>
            <button onClick={() => setShowReceive(false)} style={{ width:"100%",padding:"13px",fontSize:14,fontWeight:600,border:"none",borderRadius:10,cursor:"pointer",background:"#0F6E56",color:"#fff" }}>Done</button>
          </div>
        </div>
      )}

      {showSupport && (
        <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"1rem" }}>
          <div style={{ background:"#fff",borderRadius:20,padding:"2rem",width:"100%",maxWidth:460 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
              <div>
                <h2 style={{ margin:"0 0 4px",fontSize:20,fontWeight:700 }}>Support</h2>
                <p style={{ margin:0,fontSize:13,color:"#888" }}>Sensu Community Credit Union</p>
              </div>
              <button onClick={() => setShowSupport(false)} style={{ width:32,height:32,borderRadius:"50%",border:"1px solid #e8e8e8",background:"#fff",cursor:"pointer",fontSize:18 }}>×</button>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:20 }}>
              {[
                ["Phone", "+501 XXX-XXXX", "Call us during business hours"],
                ["Email", "support@sccu.bz", "We reply within 24 hours"],
                ["WhatsApp", "+501 XXX-XXXX", "Message us anytime"],
                ["Branch", "Belize City — Main Branch", "Mon-Fri 8am-4pm"],
              ].map(([type,val,desc]) => (
                <div key={type} style={{ padding:"14px",background:"#f7f7f5",borderRadius:10 }}>
                  <p style={{ margin:"0 0 2px",fontWeight:600,fontSize:13 }}>{type}</p>
                  <p style={{ margin:"0 0 2px",fontSize:14,color:"#0F6E56" }}>{val}</p>
                  <p style={{ margin:0,fontSize:12,color:"#888" }}>{desc}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSupport(false)} style={{ width:"100%",padding:"13px",fontSize:14,fontWeight:600,border:"1px solid #e8e8e8",borderRadius:10,cursor:"pointer",background:"#fff" }}>Close</button>
          </div>
        </div>
      )}

      {showTransfer && account && (
        <Transfer
          account={account}
          onClose={() => setShowTransfer(false)}
          onSuccess={(result) => {
            setAccount(prev => ({ ...prev, balance: result.sender_new_balance }));
            fetchTransactions(account.id);
            setShowTransfer(false);
          }}
        />
      )}

      <div style={s.page}>
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
              <button onClick={() => { setLoggedIn(false); setAccount(null); setEmail(""); setPassword(""); setLiveTransactions([]); }}
                style={{ padding: "6px 14px", fontSize: 12, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, background: "transparent", color: "#fff", cursor: "pointer" }}>
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px" }}>
          <div style={{ background: "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)", borderRadius: 20, padding: "2rem", marginBottom: 20, color: "#fff" }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, opacity: 0.8, textTransform: "uppercase", letterSpacing: ".08em" }}>Share Savings Account</p>
            <p style={{ margin: "0 0 4px", fontSize: 42, fontWeight: 700, letterSpacing: "-1px" }}>BZD {fmt(account?.balance || 0)}</p>
            <p style={{ margin: "0 0 20px", fontSize: 13, opacity: 0.7 }}>Available balance</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                ["Account number", account?.number || "SCCU-2026"],
                ["Account type", "BZD Share Savings"],
                ["Currency", "BZD (USD 2:1)"],
              ].map(([k, v]) => (
                <div key={k} style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.8 }}>{k}</p>
                  <p style={{ margin: 0, fontSize: 12, fontFamily: k === "Account number" ? "monospace" : "inherit" }}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { icon: "↑", label: "Send money", color: "#0F6E56", action: () => setShowTransfer(true) },
              { icon: "↓", label: "Receive", color: "#185FA5", action: null },
              { icon: "⟳", label: "Transfer", color: "#854F0B", action: () => setShowTransfer(true) },
              { icon: "?", label: "Support", color: "#534AB7", action: null },
            ].map((a, i) => (
              <div key={i} onClick={() => a.action && a.action()}
                style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem", textAlign: "center", cursor: a.action ? "pointer" : "default" }}
                onMouseEnter={e => e.currentTarget.style.background = a.action ? "#f7f7f5" : "#fff"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${a.color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 18, color: a.color }}>
                  {a.icon}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{a.label}</p>
              </div>
            ))}
          </div>

          <div style={{ borderBottom: "1px solid #e8e8e8", marginBottom: 20, display: "flex", gap: 4 }}>
            {["overview", "transactions", "details"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={s.tab(activeTab === t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={s.card}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#888", textTransform: "uppercase" }}>Last transaction</p>
                  <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600 }}>{transactions[0]?.date || "—"}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{transactions[0]?.desc?.slice(0, 30) || "No transactions yet"}</p>
                </div>
                <div style={s.card}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#888", textTransform: "uppercase" }}>Member since</p>
                  <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600 }}>April 2026</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Founding member — SCCU</p>
                </div>
              </div>

              <div style={s.card}>
                <p style={{ fontWeight: 600, marginBottom: 16 }}>Recent activity</p>
                {(liveTransactions.length > 0 ? liveTransactions.slice(0, 3).map((t, i) => ({
                  key: t.txn_id,
                  desc: t.description,
                  date: new Date(t.created_at).toLocaleDateString(),
                  type: t.direction,
                  amount: Math.abs(t.net_amount),
                })) : transactions.slice(0, 3).map((t, i) => ({
                  key: i,
                  desc: t.desc,
                  date: t.date,
                  type: t.type,
                  amount: t.amount,
                }))).map((t, i, arr) => (
                  <div key={t.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, marginBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.type === "credit" ? "#EAF3DE" : "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: t.type === "credit" ? "#3B6D11" : "#A32D2D" }}>
                        {t.type === "credit" ? "↓" : "↑"}
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500 }}>{t.desc}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{t.date}</p>
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

          {activeTab === "transactions" && (
            <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Transaction history</p>
                <button onClick={() => fetchTransactions(account.id)} style={{ fontSize: 12, padding: "6px 12px", border: "1px solid #e8e8e8", borderRadius: 6, background: "#fff", cursor: "pointer" }}>Refresh</button>
              </div>
              {(liveTransactions.length > 0 ? liveTransactions : transactions.map((t, i) => ({
                txn_id: i,
                description: t.desc,
                created_at: t.date,
                direction: t.type,
                net_amount: t.type === "credit" ? t.amount : -t.amount,
              }))).map((t, i, arr) => (
                <div key={t.txn_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.direction === "credit" ? "#EAF3DE" : "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: t.direction === "credit" ? "#3B6D11" : "#A32D2D", flexShrink: 0 }}>
                      {t.direction === "credit" ? "↓" : "↑"}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 500 }}>{t.description}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                        {typeof t.created_at === "string" && t.created_at.includes("T")
                          ? new Date(t.created_at).toLocaleDateString()
                          : t.created_at}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, color: t.direction === "credit" ? "#0F6E56" : "#A32D2D" }}>
                      {t.direction === "credit" ? "+" : "−"}BZD {fmt(Math.abs(t.net_amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "details" && (
            <div style={s.card}>
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
                  ["Routing", "bz.sccu"],
                  ["Status", "Active — founding member"],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 0", color: "#888", width: 180 }}>{k}</td>
                    <td style={{ padding: "12px 0" }}>{v}</td>
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
    </>
  );
}
