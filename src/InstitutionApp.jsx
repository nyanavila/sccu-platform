// ============================================================
// BelizePay — Institution App Template  v1.0
// All 5 portals. Zero hardcoding. Config-driven.
// Usage: drop InstitutionApp.jsx + institution.config.js into src/
// ============================================================
import { useState, useEffect, useRef } from "react";
import CFG from "./institution.config.js";

const C   = CFG.COLORS;
const GW  = CFG.GATEWAY_URL;
const SH  = CFG.SHORT;
const fmt = (n, d = 2) =>
  new Intl.NumberFormat("en-BZ", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);

function getRoute() {
  const p = window.location.pathname.toLowerCase();
  if (p.includes("/teller")) return "teller";
  if (p.includes("/admin"))  return "admin";
  if (p.includes("/member")) return "member";
  return "public";
}

// ── Shared styles ────────────────────────────────────────────
const mkBtn = (bg, color = "#fff", extra = {}) => ({
  padding: "11px 24px", fontSize: 14, fontWeight: 600,
  border: "none", borderRadius: 8, cursor: "pointer",
  background: bg, color, fontFamily: CFG.FONTS.body,
  transition: "opacity .15s", ...extra,
});
const inp = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  border: `1.5px solid ${C.border}`, borderRadius: 8,
  fontFamily: CFG.FONTS.body, outline: "none",
  boxSizing: "border-box", background: C.white, color: C.ink,
};
const crd = {
  background: C.white, border: `1px solid ${C.border}`,
  borderRadius: 14, padding: "24px 28px",
};
const lbl = {
  fontSize: 12, color: C.muted, display: "block",
  marginBottom: 5, fontWeight: 600, letterSpacing: ".04em",
};

function Fld({ label: L, children }) {
  return <div style={{ marginBottom: 14 }}><label style={lbl}>{L}</label>{children}</div>;
}
function Err({ msg }) {
  if (!msg) return null;
  return <div style={{ background:"#FDEDED", border:`1px solid ${C.danger}`, borderRadius:8, padding:"10px 14px", fontSize:13, color:C.danger, marginBottom:12 }}>{msg}</div>;
}
function Ok({ msg }) {
  if (!msg) return null;
  return <div style={{ background:"#E8F5E9", border:`1px solid ${C.success}`, borderRadius:8, padding:"10px 14px", fontSize:13, color:C.success, marginBottom:12 }}>{msg}</div>;
}
function Modal({ open, onClose, title, children, w = 480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(11,61,107,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ ...crd, width:"100%", maxWidth:w, boxShadow:"0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:CFG.FONTS.display, fontSize:20, fontWeight:700, color:C.primary }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:C.muted }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
const Wave = ({ top = C.primary, bottom = C.cream }) => (
  <div style={{ background:top, lineHeight:0, marginBottom:-2 }}>
    <svg viewBox="0 0 1440 56" style={{ display:"block", width:"100%" }}>
      <path fill={bottom} d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z" />
    </svg>
  </div>
);

// ── Gateway helpers ──────────────────────────────────────────
async function gwGet(path) {
  const r = await fetch(`${GW}${path}`); return r.json();
}
async function gwPost(path, body) {
  const r = await fetch(`${GW}${path}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  return { ok:r.ok, data:await r.json() };
}

// ══════════════════════════════════════════════════════════════
//  PUBLIC SITE
// ══════════════════════════════════════════════════════════════
function PublicSite({ onNav }) {
  // ChatWidget rendered from parent
  const [apiOk, setApiOk]         = useState(null);
  const [loanOpen, setLoanOpen]   = useState(false);
  const [ctOpen,   setCtOpen]     = useState(false);
  const [joinOpen, setJoinOpen]   = useState(false);
  const [lF, setLF] = useState({ name:"", email:"", phone:"", type:CFG.LOANS[0]?.name||"", amount:"", msg:"" });
  const [cF, setCF] = useState({ name:"", email:"", msg:"" });
  const [jF, setJF] = useState({ name:"", email:"", phone:"", type:CFG.MEMBER_TYPES[0]||"", id:"National ID" });
  const [done, setDone] = useState("");

  useEffect(() => { gwGet(`/institutions/${SH}`).then(()=>setApiOk(true)).catch(()=>setApiOk(false)); }, []);
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });
  const submit = (which) => { setDone(which); setTimeout(() => { setLoanOpen(false); setCtOpen(false); setJoinOpen(false); setDone(""); }, 2000); };

  const navBtn = { background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.8)", fontSize:14, fontFamily:CFG.FONTS.body, padding:"4px 0" };

  return (
    <div style={{ fontFamily:CFG.FONTS.body, color:C.ink, background:C.white }}>
      <link href={CFG.FONTS.google} rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(11,61,107,.97)", backdropFilter:"blur(8px)", padding:"0 48px", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:9, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C8 2 4 5.5 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.5-4-8-8-8z" fill="white"/><circle cx="12" cy="10" r="3" fill={C.accent}/></svg>
          </div>
          <div>
            <div style={{ fontFamily:CFG.FONTS.display, fontSize:18, fontWeight:700, color:C.white }}>{SH.toUpperCase()}</div>
            <div style={{ fontSize:9, color:C.sand, letterSpacing:".1em" }}>{CFG.FULL_NAME.toUpperCase()}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:28 }}>
          {[["About",()=>scrollTo("about")],["Services",()=>scrollTo("services")],["Loans",()=>setLoanOpen(true)],["Contact",()=>setCtOpen(true)]].map(([l,fn])=>(
            <button key={l} style={navBtn} onClick={fn} onMouseEnter={e=>e.target.style.color=C.sand} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.8)"}>{l}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {apiOk===true && <div style={{ width:7, height:7, borderRadius:"50%", background:"#4ADE80" }}/>}
          <button onClick={()=>onNav("member")} style={mkBtn(C.sand,C.primary,{padding:"7px 18px",fontSize:13})}>Member login</button>
          <button onClick={()=>onNav("teller")} style={mkBtn("rgba(255,255,255,.12)",C.white,{border:"1px solid rgba(255,255,255,.3)",padding:"7px 18px",fontSize:13})}>Teller</button>
          <button onClick={()=>onNav("admin")}  style={mkBtn("rgba(255,255,255,.08)",C.white,{border:"1px solid rgba(255,255,255,.2)",padding:"7px 18px",fontSize:13})}>Admin</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background:`linear-gradient(160deg,${C.primary} 0%,${C.primaryMid} 55%,${C.accent} 100%)`, minHeight:"90vh", display:"flex", alignItems:"center", padding:"80px 48px 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:"8%", top:"10%", width:320, height:320, borderRadius:"50%", border:"1px solid rgba(232,201,126,.15)" }}/>
        <div style={{ position:"absolute", right:"5%", bottom:"20%", width:160, height:160, borderRadius:"50%", background:"rgba(26,122,74,.15)" }}/>
        <div style={{ maxWidth:1100, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center", paddingBottom:80 }}>
          <div>
            <div style={{ display:"inline-block", fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, background:C.sandLight, color:C.accent, marginBottom:20 }}>Serving {CFG.LOCATION} since {CFG.FOUNDED}</div>
            <h1 style={{ fontFamily:CFG.FONTS.display, fontSize:"clamp(40px,5.5vw,68px)", fontWeight:900, color:C.white, lineHeight:1.1, marginBottom:24 }}>
              Banking rooted<br/>in <span style={{ color:C.sand }}>your land.</span>
            </h1>
            <p style={{ fontSize:17, color:"rgba(255,255,255,.75)", lineHeight:1.7, maxWidth:500, marginBottom:36 }}>
              {CFG.FULL_NAME} is a community-owned financial institution built for people in {CFG.LOCATION}. Your savings. Your loans. Your cooperative.
            </p>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              <button onClick={()=>setJoinOpen(true)} style={mkBtn(C.sand,C.primary)}>Open your account</button>
              <button onClick={()=>scrollTo("services")} style={mkBtn("transparent",C.white,{border:"2px solid rgba(255,255,255,.4)"})}>Learn more ↓</button>
            </div>
            <div style={{ marginTop:40, display:"flex", gap:40 }}>
              {[["BZD 2:1","USD fixed rate"],[`${CFG.SAVINGS.dividend_rate}%`,"Target dividend"],["Free","Member transfers"]].map(([n,l])=>(
                <div key={l}>
                  <div style={{ fontFamily:CFG.FONTS.display, fontSize:28, fontWeight:700, color:C.sand }}>{n}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Hero card */}
          <div style={{ background:"rgba(255,255,255,.07)", backdropFilter:"blur(12px)", borderRadius:20, padding:36, border:"1px solid rgba(255,255,255,.12)" }}>
            <div style={{ fontSize:11, color:C.sand, letterSpacing:".08em", marginBottom:8 }}>POWERED BY BELIZEPAY NETWORK</div>
            <div style={{ fontFamily:CFG.FONTS.display, fontSize:20, color:C.white, marginBottom:24, lineHeight:1.4 }}>Your money works harder when your community owns the bank.</div>
            {CFG.LOANS.map(l=>(
              <div key={l.name} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,.1)", fontSize:14 }}>
                <span style={{ color:"rgba(255,255,255,.8)" }}>{l.name}</span>
                <span style={{ color:C.sand, fontWeight:600, fontSize:13 }}>from {l.rate}</span>
              </div>
            ))}
            <button onClick={()=>onNav("member")} style={{ ...mkBtn(C.sand,C.primary), width:"100%", textAlign:"center", marginTop:24, padding:13 }}>Sign in to your account →</button>
          </div>
        </div>
      </div>

      <Wave top={C.primary} bottom={C.cream}/>

      {/* SERVICES */}
      <div id="services" style={{ background:C.cream, padding:"80px 0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 48px" }}>
          <div style={{ display:"inline-block", fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, background:C.sandLight, color:C.accent, marginBottom:20 }}>What we offer</div>
          <h2 style={{ fontFamily:CFG.FONTS.display, fontSize:38, fontWeight:700, color:C.primary, marginBottom:16 }}>Everything you need<br/>to grow your finances</h2>
          <p style={{ fontSize:16, color:C.muted, maxWidth:540, lineHeight:1.7, marginBottom:48 }}>Financial services at rates that keep money in your community.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {CFG.SERVICES.map(({title,desc,color})=>(
              <div key={title} style={{ ...crd, borderTop:`4px solid ${color}` }}>
                <div style={{ fontSize:15, fontWeight:700, color, marginBottom:10, fontFamily:CFG.FONTS.display }}>{title}</div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Wave top={C.cream} bottom={C.primary}/>

      {/* LOANS */}
      <div id="loans" style={{ background:C.primary, padding:"80px 0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 48px" }}>
          <div style={{ display:"inline-block", fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, background:"rgba(232,201,126,.15)", color:C.sand, marginBottom:20 }}>Loan products</div>
          <h2 style={{ fontFamily:CFG.FONTS.display, fontSize:38, fontWeight:700, color:C.white, marginBottom:40 }}>Rates commercial banks<br/>cannot match</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:40 }}>
            {CFG.LOANS.map(l=>(
              <div key={l.name} style={{ background:l.highlight?"rgba(255,255,255,.12)":"rgba(255,255,255,.06)", border:l.highlight?`1px solid ${C.sand}`:"1px solid rgba(255,255,255,.1)", borderRadius:14, padding:"28px 22px" }}>
                {l.highlight&&<div style={{ fontSize:10, fontWeight:700, color:C.sand, letterSpacing:".1em", marginBottom:12 }}>MOST POPULAR</div>}
                <div style={{ fontSize:12, color:C.sand, fontWeight:700, marginBottom:14 }}>{l.name.toUpperCase()}</div>
                <div style={{ fontFamily:CFG.FONTS.display, fontSize:30, fontWeight:700, color:C.white, marginBottom:4 }}>{l.rate}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", marginBottom:18 }}>per annum</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.7)", marginBottom:6 }}>Max: <span style={{ color:C.sand, fontWeight:600 }}>{l.max}</span></div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.7)" }}>Term: <span style={{ color:C.white }}>{l.term}</span></div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center" }}>
            <button onClick={()=>setLoanOpen(true)} style={mkBtn(C.sand,C.primary)}>Apply for a loan →</button>
          </div>
        </div>
      </div>

      <Wave top={C.primary} bottom={C.white}/>

      {/* HOW TO JOIN */}
      <div id="about" style={{ background:C.white, padding:"80px 0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 48px" }}>
          <div style={{ display:"inline-block", fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, background:C.sandLight, color:C.accent, marginBottom:20 }}>Getting started</div>
          <h2 style={{ fontFamily:CFG.FONTS.display, fontSize:38, fontWeight:700, color:C.primary, marginBottom:48 }}>Open your account<br/>in three steps</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:40 }}>
            {[
              {n:"01",title:"Visit the branch",desc:`Come to ${SH.toUpperCase()} in ${CFG.LOCATION} with your national ID or passport and proof of address.`},
              {n:"02",title:"Complete KYC",    desc:`Fill in the membership form. Deposit your opening balance of BZD ${fmt(CFG.SAVINGS.min_balance)} minimum.`},
              {n:"03",title:"Start banking",   desc:"Receive your login credentials and access your account online within minutes of joining."},
            ].map(({n,title,desc})=>(
              <div key={n}>
                <div style={{ fontFamily:CFG.FONTS.display, fontSize:56, fontWeight:900, color:C.sandLight, lineHeight:1, marginBottom:16 }}>{n}</div>
                <div style={{ fontSize:18, fontWeight:700, color:C.primary, marginBottom:10, fontFamily:CFG.FONTS.display }}>{title}</div>
                <div style={{ fontSize:15, color:C.muted, lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background:C.accent, padding:"64px 48px", textAlign:"center" }}>
        <h2 style={{ fontFamily:CFG.FONTS.display, fontSize:38, fontWeight:700, color:C.white, marginBottom:16 }}>Ready to join {SH.toUpperCase()}?</h2>
        <p style={{ fontSize:17, color:"rgba(255,255,255,.75)", maxWidth:460, margin:"0 auto 36px" }}>
          Open to any Belizean citizen or resident. Minimum opening deposit: BZD {fmt(CFG.SAVINGS.min_balance)}.
        </p>
        <button onClick={()=>setJoinOpen(true)} style={mkBtn(C.sand,C.primary)}>Open your account today</button>
      </div>

      {/* FOOTER */}
      <footer style={{ background:C.primary, padding:"48px", color:"rgba(255,255,255,.6)", fontSize:13 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:40 }}>
          <div>
            <div style={{ fontFamily:CFG.FONTS.display, fontSize:20, color:C.white, fontWeight:700, marginBottom:12 }}>{SH.toUpperCase()}</div>
            <div style={{ lineHeight:1.8, marginBottom:16 }}>{CFG.FULL_NAME}<br/>{CFG.LOCATION}<br/>{CFG.ROUTING} · Powered by BelizePay</div>
            <div style={{ fontSize:12, color:C.sand }}>{apiOk===true?"● Platform online":"○ Platform offline"}</div>
          </div>
          {[
            {heading:"Services",  links:CFG.SERVICES.slice(0,4).map(s=>s.title)},
            {heading:"Institution",links:["About "+SH.toUpperCase(),"Board of directors","Annual report","Complaints"]},
            {heading:"Contact",   links:[CFG.CONTACT.address,CFG.CONTACT.email,CFG.CONTACT.phone,CFG.CONTACT.hours]},
          ].map(({heading,links})=>(
            <div key={heading}>
              <div style={{ color:C.sand, fontWeight:700, fontSize:12, letterSpacing:".08em", marginBottom:14 }}>{heading.toUpperCase()}</div>
              {links.map(l=>(
                <div key={l} style={{ marginBottom:8, cursor:"pointer" }} onMouseEnter={e=>e.target.style.color=C.white} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.6)"}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth:1100, margin:"40px auto 0", paddingTop:24, borderTop:"1px solid rgba(255,255,255,.1)", display:"flex", justifyContent:"space-between", fontSize:12 }}>
          <span>© {new Date().getFullYear()} {CFG.FULL_NAME}. All rights reserved.</span>
          <span>Regulated by the Central Bank of Belize · Member of BelizePay Financial Technologies</span>
        </div>
      </footer>

      {/* MODALS */}
      <Modal open={loanOpen} onClose={()=>setLoanOpen(false)} title="Apply for a loan">
        {done==="loan"?<Ok msg="Application received! A loan officer will contact you within 3 business days."/>:<>
          <Fld label="Full name"><input style={inp} value={lF.name} onChange={e=>setLF(f=>({...f,name:e.target.value}))} placeholder="Legal name as on ID"/></Fld>
          <Fld label="Email"><input style={inp} type="email" value={lF.email} onChange={e=>setLF(f=>({...f,email:e.target.value}))}/></Fld>
          <Fld label="Phone"><input style={inp} value={lF.phone} onChange={e=>setLF(f=>({...f,phone:e.target.value}))} placeholder="+501 XXX-XXXX"/></Fld>
          <Fld label="Loan type"><select style={inp} value={lF.type} onChange={e=>setLF(f=>({...f,type:e.target.value}))}>{CFG.LOANS.map(l=><option key={l.name}>{l.name}</option>)}</select></Fld>
          <Fld label="Amount (BZD)"><input style={inp} type="number" value={lF.amount} onChange={e=>setLF(f=>({...f,amount:e.target.value}))} placeholder="0.00"/></Fld>
          <Fld label="Purpose"><textarea style={{...inp,height:80,resize:"vertical"}} value={lF.msg} onChange={e=>setLF(f=>({...f,msg:e.target.value}))}/></Fld>
          <button onClick={()=>submit("loan")} style={{...mkBtn(C.primary),width:"100%"}}>Submit application</button>
        </>}
      </Modal>

      <Modal open={ctOpen} onClose={()=>setCtOpen(false)} title="Contact us">
        {done==="contact"?<Ok msg="Message received! We will respond within 1 business day."/>:<>
          <div style={{ background:C.cream, borderRadius:10, padding:"14px 16px", marginBottom:20, fontSize:13, color:C.muted, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["Email",CFG.CONTACT.email],["Phone",CFG.CONTACT.phone],["Address",CFG.CONTACT.address],["Hours",CFG.CONTACT.hours]].map(([k,v])=>(
              <div key={k}><div style={{ fontWeight:600, color:C.ink, fontSize:12 }}>{k}</div><div>{v}</div></div>
            ))}
          </div>
          <Fld label="Your name"><input style={inp} value={cF.name} onChange={e=>setCF(f=>({...f,name:e.target.value}))}/></Fld>
          <Fld label="Email"><input style={inp} type="email" value={cF.email} onChange={e=>setCF(f=>({...f,email:e.target.value}))}/></Fld>
          <Fld label="Message"><textarea style={{...inp,height:100,resize:"vertical"}} value={cF.msg} onChange={e=>setCF(f=>({...f,msg:e.target.value}))}/></Fld>
          <button onClick={()=>submit("contact")} style={{...mkBtn(C.primary),width:"100%"}}>Send message</button>
        </>}
      </Modal>

      <Modal open={joinOpen} onClose={()=>setJoinOpen(false)} title="Open your account">
        {done==="join"?<Ok msg="Application submitted! Visit the branch with your ID to complete registration."/>:<>
          <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Fill in your details and visit the branch with your ID. Minimum deposit: BZD {fmt(CFG.SAVINGS.min_balance)}.</p>
          <Fld label="Full name (as on ID)"><input style={inp} value={jF.name} onChange={e=>setJF(f=>({...f,name:e.target.value}))}/></Fld>
          <Fld label="Email"><input style={inp} type="email" value={jF.email} onChange={e=>setJF(f=>({...f,email:e.target.value}))}/></Fld>
          <Fld label="Phone"><input style={inp} value={jF.phone} onChange={e=>setJF(f=>({...f,phone:e.target.value}))}/></Fld>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Fld label="Membership type"><select style={inp} value={jF.type} onChange={e=>setJF(f=>({...f,type:e.target.value}))}>{CFG.MEMBER_TYPES.map(t=><option key={t}>{t}</option>)}</select></Fld>
            <Fld label="ID type"><select style={inp} value={jF.id} onChange={e=>setJF(f=>({...f,id:e.target.value}))}>{["National ID","Passport","Driver's licence"].map(t=><option key={t}>{t}</option>)}</select></Fld>
          </div>
          <button onClick={()=>submit("join")} style={{...mkBtn(C.accent),width:"100%"}}>Submit application</button>
        </>}
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MEMBER PORTAL
// ══════════════════════════════════════════════════════════════
function MemberPortal({ onBack }) {
  const [step,setStep]       = useState("login");
  const [email,setEmail]     = useState("");
  const [pass,setPass]       = useState("");
  const [err,setErr]         = useState("");
  const [loading,setLoading] = useState(false);
  const [member,setMember]   = useState(null);
  const [accounts,setAccounts]= useState([]);
  const [txns,setTxns]       = useState([]);
  const [tab,setTab]         = useState("overview");
  const [members,setMembers] = useState([]);
  const [sendOpen,setSendOpen]= useState(false);
  const [loanOpen,setLoanOpen]= useState(false);
  const [sendTo,setSendTo]   = useState("");
  const [sendAmt,setSendAmt] = useState("");
  const [sendDesc,setSendDesc]= useState("");
  const [sending,setSending] = useState(false);
  const [sendErr,setSendErr] = useState("");

  const login = async () => {
    if (!email||!pass){setErr("Enter your email and password");return;}
    setLoading(true);setErr("");
    try {
      const {ok,data} = await gwPost("/auth/login",{username:email,password:pass,institution:SH});
      if(!ok) throw new Error(data.detail||"Login failed");
      const [acRes,txRes,mbRes] = await Promise.all([
        gwGet(`/institutions/${SH}/accounts`),
        gwGet(`/institutions/${SH}/transactions?limit=20`),
        gwGet(`/institutions/${SH}/members`),
      ]);
      const myAcc = (acRes.accounts||[]).filter(a=>a.owner_email===email);
      if(!myAcc.length) throw new Error("No account found for this email");
      setAccounts(myAcc);setTxns(txRes.transactions||[]);
      setMembers((mbRes.members||[]).filter(m=>m.email!==email));
      setMember({email,name:myAcc[0]?.owner_name||email});setStep("portal");
    } catch(e){setErr(e.message);}
    setLoading(false);
  };

  const doSend = async () => {
    if(!sendTo||!sendAmt)return;
    setSending(true);setSendErr("");
    try {
      const rec=members.find(m=>m.email===sendTo);
      if(!rec) throw new Error("Recipient not found");
      const {ok,data}=await gwPost("/transactions",{from_account:accounts[0]?.id,to_account:rec.id,amount:parseFloat(sendAmt),currency:"BZD",description:sendDesc||"Member transfer",institution:SH});
      if(!ok) throw new Error(data.detail||"Transfer failed");
      setSendOpen(false);setSendAmt("");setSendDesc("");setSendTo("");
      const acRes=await gwGet(`/institutions/${SH}/accounts`);
      setAccounts((acRes.accounts||[]).filter(a=>a.owner_email===email));
    } catch(e){setSendErr(e.message);}
    setSending(false);
  };

  const bal = accounts[0]?.balance||0;
  const bar = (title,signOut) => (
    <div style={{background:C.primary,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,borderRadius:8,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C8 2 4 5 4 10c0 6 8 12 8 12s8-6 8-12c0-5-4-8-8-8z" fill="white"/></svg>
        </div>
        <div style={{fontFamily:CFG.FONTS.display,fontSize:15,fontWeight:700,color:C.white}}>{SH.toUpperCase()} {title}</div>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        {member&&<span style={{fontSize:13,color:C.sand}}>{member.name}</span>}
        <button onClick={signOut||onBack} style={mkBtn("rgba(255,255,255,.15)",C.white,{padding:"6px 14px",fontSize:12,border:"1px solid rgba(255,255,255,.25)"})}>{member?"Sign out":"← Back"}</button>
      </div>
    </div>
  );

  if(step==="login") return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:CFG.FONTS.body}}>
      <link href={CFG.FONTS.google} rel="stylesheet"/>
      {bar("Member Portal",onBack)}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 65px)",padding:40}}>
        <div style={{...crd,width:"100%",maxWidth:400,boxShadow:"0 8px 40px rgba(11,61,107,.12)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontFamily:CFG.FONTS.display,fontSize:24,fontWeight:700,color:C.primary}}>Member sign in</div>
            <div style={{fontSize:13,color:C.muted,marginTop:4}}>{CFG.FULL_NAME}</div>
          </div>
          <Fld label="Email address"><input style={inp} value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder={`you@${SH}.bz`}/></Fld>
          <Fld label="Password"><input style={inp} value={pass} onChange={e=>setPass(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&login()}/></Fld>
          <Err msg={err}/>
          <button onClick={login} disabled={loading} style={{...mkBtn(C.primary),width:"100%",opacity:loading?.7:1}}>{loading?"Signing in…":"Sign in"}</button>
          <div style={{textAlign:"center",marginTop:20,fontSize:13,color:C.muted}}>Forgot your password? <span style={{color:C.primary,cursor:"pointer"}} onClick={()=>window.open(`mailto:${CFG.CONTACT.email}`)}>Contact the branch</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:CFG.FONTS.body}}>
      <link href={CFG.FONTS.google} rel="stylesheet"/>
      {bar("Member Portal",()=>setStep("login"))}
      <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
        {/* Balance card */}
        <div style={{background:`linear-gradient(135deg,${C.primary} 0%,${C.primaryMid} 100%)`,borderRadius:18,padding:"36px 40px",marginBottom:24,color:C.white,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
          <div style={{fontSize:12,color:C.sand,letterSpacing:".06em",marginBottom:8}}>SHARE SAVINGS BALANCE</div>
          <div style={{fontFamily:CFG.FONTS.display,fontSize:46,fontWeight:700,marginBottom:4}}>BZD {fmt(bal)}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>USD {fmt(bal/CFG.CURRENCY_USD_RATE)} · {accounts[0]?.id}</div>
          <div style={{display:"flex",gap:12,marginTop:28}}>
            <button onClick={()=>setSendOpen(true)} style={mkBtn(C.accent)}>Send money</button>
            <button onClick={()=>setLoanOpen(true)} style={mkBtn("rgba(255,255,255,.12)",C.white,{border:"1px solid rgba(255,255,255,.25)"})}>Apply for loan</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{borderBottom:`1px solid ${C.border}`,marginBottom:24,display:"flex"}}>
          {["overview","transactions","account"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 20px",fontSize:14,border:"none",background:"none",cursor:"pointer",fontFamily:CFG.FONTS.body,color:tab===t?C.primary:C.muted,fontWeight:tab===t?600:400,borderBottom:tab===t?`2px solid ${C.primary}`:"2px solid transparent"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
        {tab==="overview"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div style={crd}>
              <div style={{fontSize:13,fontWeight:600,color:C.primary,marginBottom:16}}>Your membership</div>
              {[["Member since","April 2026"],["Account type",accounts[0]?.type||"Share Savings"],[`Dividend rate`,`Target ${CFG.SAVINGS.dividend_rate}% p.a.`],["Next dividend","June 2026"],["Status","Active"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontSize:14}}>
                  <span style={{color:C.muted}}>{k}</span><span style={{fontWeight:600,color:C.ink}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={crd}>
              <div style={{fontSize:13,fontWeight:600,color:C.primary,marginBottom:16}}>Quick actions</div>
              {[["Send money to a member",()=>setSendOpen(true),C.primary],["Apply for a loan",()=>setLoanOpen(true),C.primary],["Download statement",()=>alert("Coming soon"),C.muted],["Contact "+SH.toUpperCase(),()=>window.open(`mailto:${CFG.CONTACT.email}`),C.muted]].map(([l,fn,col])=>(
                <div key={l} onClick={fn} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                  <span style={{fontSize:14,color:col,fontWeight:col===C.primary?600:400}}>{l}</span>
                  <span style={{color:C.border,fontSize:18}}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="transactions"&&(
          <div style={crd}>
            <div style={{fontSize:13,fontWeight:600,color:C.primary,marginBottom:16}}>Recent transactions</div>
            {txns.length===0
              ?<div style={{textAlign:"center",color:C.muted,padding:"40px 0",fontSize:14}}>No transactions yet.</div>
              :txns.filter(t=>accounts.some(a=>a.id===t.account_id||a.id===t.from_account||a.id===t.to_account)).map((t,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`,fontSize:14}}>
                  <div>
                    <div style={{fontWeight:500,color:C.ink}}>{t.description||t.txn_type}</div>
                    <div style={{fontSize:12,color:C.muted}}>{t.receipt_no}·{t.created_at?new Date(t.created_at).toLocaleDateString():""}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:15,color:t.txn_type?.toUpperCase().includes("DEPOSIT")?C.success:C.danger}}>
                    {t.txn_type?.toUpperCase().includes("DEPOSIT")?"+":"−"}BZD {fmt(t.amount)}
                  </div>
                </div>
              ))
            }
          </div>
        )}
        {tab==="account"&&(
          <div style={crd}>
            <div style={{fontSize:13,fontWeight:600,color:C.primary,marginBottom:16}}>Account details</div>
            {[["Full name",member?.name||"—"],["Email",member?.email||"—"],["Account ID",accounts[0]?.id||"—"],["Currency",`BZD — Belize Dollar (USD ${CFG.CURRENCY_USD_RATE}:1 peg)`],["Institution",CFG.FULL_NAME],["Routing",CFG.ROUTING],["BelizePay network","Connected"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`,fontSize:14}}>
                <span style={{color:C.muted}}>{k}</span><span style={{fontWeight:500,color:C.ink,textAlign:"right",maxWidth:"60%"}}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={sendOpen} onClose={()=>setSendOpen(false)} title="Send money">
        <Fld label="Send to"><select style={inp} value={sendTo} onChange={e=>setSendTo(e.target.value)}><option value="">Select member…</option>{members.map(m=><option key={m.email} value={m.email}>{m.username||m.email}</option>)}</select></Fld>
        <Fld label="Amount (BZD)"><input style={inp} type="number" value={sendAmt} onChange={e=>setSendAmt(e.target.value)} placeholder="0.00"/></Fld>
        <Fld label="Description"><input style={inp} value={sendDesc} onChange={e=>setSendDesc(e.target.value)} placeholder="e.g. Rent payment April"/></Fld>
        <Err msg={sendErr}/>
        <div style={{display:"flex",gap:12}}>
          <button onClick={()=>setSendOpen(false)} style={{...mkBtn(C.cream,C.muted,{border:`1px solid ${C.border}`}),flex:1}}>Cancel</button>
          <button onClick={doSend} disabled={sending||!sendTo||!sendAmt} style={{...mkBtn(C.accent),flex:2,opacity:!sendTo||!sendAmt?.5:1}}>{sending?"Sending…":`Send BZD ${sendAmt||"0.00"}`}</button>
        </div>
      </Modal>
      <Modal open={loanOpen} onClose={()=>setLoanOpen(false)} title="Apply for a loan">
        <Fld label="Loan type"><select style={inp}>{CFG.LOANS.map(l=><option key={l.name}>{l.name} — from {l.rate}</option>)}</select></Fld>
        <Fld label="Amount (BZD)"><input style={inp} type="number" placeholder="0.00"/></Fld>
        <Fld label="Purpose"><textarea style={{...inp,height:80,resize:"vertical"}}/></Fld>
        <button onClick={()=>{setLoanOpen(false);alert("Application received!");}} style={{...mkBtn(C.primary),width:"100%"}}>Submit application</button>
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TELLER PORTAL
// ══════════════════════════════════════════════════════════════
function TellerPortal({ onBack }) {
  const TAPI = CFG.GATEWAY_URL; // teller endpoints on gateway
  const [step,setStep]         = useState("login");
  const [user,setUser]         = useState("");
  const [pass,setPass]         = useState("");
  const [err,setErr]           = useState("");
  const [loading,setLoading]   = useState(false);
  const [token,setToken]       = useState("");
  const [teller,setTeller]     = useState(null);
  const [session,setSession]   = useState(null);
  const [float_,setFloat]      = useState("500");
  const [mode,setMode]         = useState("deposit");
  const [member,setMember]     = useState(null);
  const [amount,setAmount]     = useState("");
  const [desc,setDesc]         = useState("");
  const [source,setSource]     = useState("Cash");
  const [posting,setPosting]   = useState(false);
  const [receipt,setReceipt]   = useState(null);
  const [summary,setSummary]   = useState(null);
  const [view,setView]         = useState("transaction");
  const [q,setQ]               = useState("");
  const [results,setResults]   = useState([]);
  const [searching,setSearching]= useState(false);
  const timer = useRef(null);

  const ta = async (path,opts={}) => {
    const r = await fetch(`${TAPI}${path}`,{ headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...opts.headers}, ...opts });
    return { ok:r.ok, data:await r.json() };
  };

  const doLogin = async () => {
    if(!user||!pass){setErr("Enter username and password");return;}
    setLoading(true);setErr("");
    try {
      const r=await fetch(`${TAPI}/teller/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pass,institution:SH})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.detail||"Login failed");
      setToken(d.token);setTeller(d);setStep("open");
    } catch(e){setErr(e.message);}
    setLoading(false);
  };

  const openTill = async () => {
    setLoading(true);setErr("");
    try {
      const r=await fetch(`${TAPI}/teller/session/open`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({opening_float:parseFloat(float_)||0})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.detail||"Failed to open session");
      setSession(d);setStep("work");loadSum(token);
    } catch(e){setErr(e.message);}
    setLoading(false);
  };

  const loadSum = async (tok=token) => {
    try {
      const r=await fetch(`${TAPI}/teller/session/summary`,{headers:{Authorization:`Bearer ${tok}`}});
      const d=await r.json();setSummary(d);
    } catch{}
  };

  const search = async (val) => {
    if(val.length<2){setResults([]);return;}
    setSearching(true);
    try {
      const r=await fetch(`${TAPI}/teller/member-lookup?q=${encodeURIComponent(val)}`,{headers:{Authorization:`Bearer ${token}`}});
      const d=await r.json();setResults(d.results||[]);
    } catch{setResults([]);}
    setSearching(false);
  };
  const handleQ = (val) => { setQ(val); clearTimeout(timer.current); timer.current=setTimeout(()=>search(val),300); };

  const post = async () => {
    if(!member||!amount||parseFloat(amount)<=0)return;
    setPosting(true);setErr("");
    try {
      const ep=mode==="deposit"?"/teller/deposit":"/teller/withdrawal";
      const r=await fetch(`${TAPI}${ep}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({account_id:member.account_id,amount:parseFloat(amount),description:desc||undefined,source:mode==="deposit"?source:undefined})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.detail||"Transaction failed");
      setReceipt({...d,type:mode});setMember(null);setAmount("");setDesc("");setSource("Cash");setQ("");setResults([]);
      loadSum();
    } catch(e){setErr(e.message);}
    setPosting(false);
  };

  const closeTill = async () => {
    const cf=window.prompt("Enter closing cash count (BZD):",session?.opening_float||"0");
    if(cf===null)return;
    try {
      await fetch(`${TAPI}/teller/session/close`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({closing_float:parseFloat(cf)||0})});
      setStep("login");setToken("");setTeller(null);setSession(null);setSummary(null);
    } catch{}
  };

  const printRec = (d) => {
    const w=window.open("","_blank","width=340,height=520");
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;width:290px;margin:0 auto;padding:12px}.c{text-align:center}.l{border-top:1px dashed #000;margin:8px 0}.r{display:flex;justify-content:space-between}h3,p{margin:2px 0}</style></head><body><div class="c"><h3>${SH.toUpperCase()}</h3><p>${CFG.FULL_NAME}</p><p>${CFG.ROUTING}</p></div><div class="l"/><div class="r"><span>${d.type?.toUpperCase()}</span><span>${new Date(d.timestamp).toLocaleString("en-BZ")}</span></div><div class="l"/><p>Receipt: ${d.receipt_no}</p><p>Account: ${d.account_label}</p><p>ID: ${d.account_id}</p><div class="l"/><div class="r"><span>Amount:</span><strong>BZD ${fmt(d.amount)}</strong></div><div class="r"><span>New balance:</span><strong>BZD ${fmt(d.new_balance)}</strong></div><div class="l"/><p>${d.description}</p><div class="l"/><p>Teller: ${d.teller}</p><p>Branch: ${d.branch}</p><div class="c"><p style="margin-top:12px">Thank you for banking with ${SH.toUpperCase()}</p></div></body></html>`);
    w.print();w.close();
  };

  const hdr = () => (
    <div style={{background:"#534AB7",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{teller?teller.full_name?.split(" ").map(w=>w[0]).join("").slice(0,2):"T"}</div>
        <div>
          <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{teller?teller.full_name:`${SH.toUpperCase()} Teller Portal`}</div>
          {session&&<div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>Session #{session.session_id} · {teller?.branch}</div>}
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        {step==="work"&&<>
          <button onClick={()=>{setView(v=>v==="summary"?"transaction":"summary");if(view!=="summary")loadSum();}} style={mkBtn("rgba(255,255,255,.12)","#fff",{padding:"6px 14px",fontSize:12,border:"1px solid rgba(255,255,255,.25)"})}>
            {view==="summary"?"← Back to till":"Today's summary"}
          </button>
          <button onClick={closeTill} style={mkBtn("rgba(255,255,255,.06)","rgba(255,255,255,.8)",{padding:"6px 14px",fontSize:12,border:"1px solid rgba(255,255,255,.2)"})}>Close till</button>
        </>}
        <button onClick={onBack} style={mkBtn("transparent","rgba(255,255,255,.6)",{padding:"6px 14px",fontSize:12,border:"1px solid rgba(255,255,255,.15)"})}>← Site</button>
      </div>
    </div>
  );

  const pg={minHeight:"100vh",background:"#f7f7f5",fontFamily:CFG.FONTS.body};
  const acc2=mode==="deposit"?C.success:C.danger;

  if(step==="login") return (
    <div style={pg}>{hdr()}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 65px)",padding:40}}>
        <div style={{...crd,width:"100%",maxWidth:380}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:"#534AB7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:20,color:"#fff",fontWeight:700}}>T</div>
            <div style={{fontFamily:CFG.FONTS.display,fontSize:22,fontWeight:700,color:C.ink}}>Teller sign in</div>
            <div style={{fontSize:13,color:C.muted,marginTop:4}}>{CFG.FULL_NAME}</div>
          </div>
          <Fld label="Username"><input style={inp} value={user} onChange={e=>setUser(e.target.value)} placeholder="teller1"/></Fld>
          <Fld label="Password"><input style={inp} type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/></Fld>
          <Err msg={err}/>
          <button onClick={doLogin} disabled={loading} style={{...mkBtn("#534AB7"),width:"100%",opacity:loading?.7:1}}>{loading?"Signing in…":"Sign in"}</button>
        </div>
      </div>
    </div>
  );

  if(step==="open") return (
    <div style={pg}>{hdr()}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 65px)",padding:40}}>
        <div style={{...crd,width:"100%",maxWidth:420}}>
          <div style={{fontFamily:CFG.FONTS.display,fontSize:22,fontWeight:700,color:C.ink,marginBottom:4}}>Open till</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:24}}>Welcome, {teller?.full_name} — count your cash float</div>
          <Fld label="Opening cash float (BZD)"><input style={inp} type="number" value={float_} onChange={e=>setFloat(e.target.value)}/></Fld>
          <Err msg={err}/>
          <button onClick={openTill} disabled={loading} style={{...mkBtn("#534AB7"),width:"100%"}}>{loading?"Opening…":"Open till — start session"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={pg}>{hdr()}
      {/* Receipt overlay */}
      {receipt&&(
        <div onClick={()=>setReceipt(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{...crd,width:"100%",maxWidth:400}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:acc2+"18",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:22,color:acc2}}>✓</div>
              <div style={{fontSize:18,fontWeight:700,color:acc2}}>{receipt.type==="deposit"?"Deposit":"Withdrawal"} successful</div>
            </div>
            <div style={{background:"#f7f7f5",borderRadius:10,padding:"1rem",marginBottom:16}}>
              {[["Receipt",receipt.receipt_no],["Account",receipt.account_label],["Amount",`BZD ${fmt(receipt.amount)}`],["New balance",`BZD ${fmt(receipt.new_balance)}`],["Description",receipt.description],["Teller",receipt.teller],["Time",new Date(receipt.timestamp).toLocaleString("en-BZ")]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #e8e8e8",fontSize:13}}>
                  <span style={{color:C.muted}}>{k}</span><span style={{fontWeight:k==="Amount"||k==="New balance"?700:400}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>printRec(receipt)} style={{...mkBtn("#fff",C.ink,{border:`1px solid ${C.border}`}),flex:1}}>Print receipt</button>
              <button onClick={()=>setReceipt(null)} style={{...mkBtn("#534AB7"),flex:1}}>New transaction</button>
            </div>
          </div>
        </div>
      )}
      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 20px"}}>
        {/* Stats bar */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {[["Opening float",`BZD ${fmt(session?.opening_float)}`],["Deposits today",summary?`BZD ${fmt(summary.total_deposits)}`:"—"],["Withdrawals today",summary?`BZD ${fmt(summary.total_withdrawals)}`:"—"],["Transactions",summary?String(summary.transaction_count):"—"]].map(([l,v])=>(
            <div key={l} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"1rem"}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>{l}</div>
              <div style={{fontSize:18,fontWeight:600,color:C.ink}}>{v}</div>
            </div>
          ))}
        </div>

        {view==="transaction"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:20}}>
            <div style={crd}>
              {/* Mode toggle */}
              <div style={{display:"flex",gap:8,marginBottom:20}}>
                {["deposit","withdrawal"].map(m=>(
                  <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"10px",fontSize:13,fontWeight:600,borderRadius:8,cursor:"pointer",border:"none",background:mode===m?(m==="deposit"?C.success:C.danger):"#f7f7f5",color:mode===m?"#fff":C.muted}}>
                    {m.charAt(0).toUpperCase()+m.slice(1)}
                  </button>
                ))}
              </div>
              {/* Search */}
              <Fld label="Search member — name, email, or account ID">
                <input style={inp} value={q} onChange={e=>handleQ(e.target.value)} placeholder="e.g. Maria Chen"/>
              </Fld>
              {searching&&<div style={{fontSize:12,color:C.muted,marginBottom:8}}>Searching…</div>}
              {results.length>0&&!member&&(
                <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",marginBottom:14}}>
                  {results.map((r,i)=>(
                    <div key={r.account_id} onClick={()=>{setMember(r);setResults([]);setQ("");}}
                      style={{display:"flex",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer",background:"#fff",borderBottom:i<results.length-1?`1px solid ${C.border}`:"none"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f7f7f5"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <div><div style={{fontWeight:500,fontSize:13}}>{r.owner_name}</div><div style={{fontSize:11,color:C.muted}}>{r.account_id}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontWeight:600,fontSize:13}}>BZD {fmt(r.balance)}</div></div>
                    </div>
                  ))}
                </div>
              )}
              {member&&(
                <div style={{background:"#EAF3DE",borderRadius:10,padding:"12px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:600,fontSize:14,color:"#27500A"}}>{member.owner_name}</div><div style={{fontSize:11,color:"#3B6D11"}}>{member.account_id}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:15,color:"#27500A"}}>BZD {fmt(member.balance)}</div><button onClick={()=>setMember(null)} style={{fontSize:11,color:C.muted,background:"none",border:"none",cursor:"pointer"}}>Clear</button></div>
                </div>
              )}
              <Fld label="Amount (BZD)"><input style={{...inp,fontSize:20,fontWeight:600}} type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></Fld>
              {mode==="deposit"&&<Fld label="Source"><select style={inp} value={source} onChange={e=>setSource(e.target.value)}>{["Cash","Bank transfer","Cheque","Remittance","Payroll","Other"].map(s=><option key={s}>{s}</option>)}</select></Fld>}
              <Fld label="Description (optional)"><input style={inp} value={desc} onChange={e=>setDesc(e.target.value)} placeholder={mode==="deposit"?"e.g. Salary — Ministry of Agriculture":"e.g. Member withdrawal"}/></Fld>
              <Err msg={err}/>
              <button onClick={post} disabled={posting||!member||!amount} style={{...mkBtn(mode==="deposit"?C.success:C.danger),width:"100%",padding:13,fontSize:15,opacity:!member||!amount?.5:1}}>
                {posting?"Processing…":`Post ${mode} — BZD ${amount?fmt(parseFloat(amount)):"0.00"}`}
              </button>
            </div>
            {/* Right panel */}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {["deposit","withdrawal"].map(m=>(
                <div key={m} style={crd}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:12,color:C.ink}}>Quick {m}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {CFG.TELLER.quick_amounts.map(n=>(
                      <button key={n} onClick={()=>{setMode(m);setAmount(String(n));}} style={mkBtn("#fff",m==="withdrawal"?C.danger:C.ink,{border:`1px solid ${C.border}`,padding:"9px",fontSize:13,fontWeight:600})}>BZD {n.toLocaleString()}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={crd}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:10,color:C.ink}}>Teller rules</div>
                {[`Cash above BZD ${fmt(CFG.TELLER.large_cash_threshold,0)} — notify supervisor`,"Always verify member photo ID","Count cash before posting",`BZD ${fmt(CFG.TELLER.ctr_threshold,0)}+ — CTR required (FIU Belize)`,"Never tip off a member about AML reports"].map(r=>(
                  <div key={r} style={{display:"flex",gap:8,fontSize:12,color:"#666",marginBottom:8}}><span style={{color:"#534AB7",flexShrink:0}}>▸</span>{r}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view==="summary"&&summary&&(
          <div style={crd}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:CFG.FONTS.display,fontSize:20,fontWeight:700,color:C.ink}}>Today's transactions — {teller?.full_name}</div>
              <button onClick={()=>loadSum()} style={mkBtn("#fff",C.muted,{border:`1px solid ${C.border}`,padding:"7px 14px",fontSize:13})}>Refresh</button>
            </div>
            {!summary.transactions?.length
              ?<div style={{textAlign:"center",color:C.muted,padding:"2rem"}}>No transactions posted yet today.</div>
              :<>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{background:"#f7f7f5"}}>{["Receipt","Type","Account","Description","Amount","Time"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:500,fontSize:11,color:C.muted,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{summary.transactions.map((t,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                      <td style={{padding:"12px 14px",fontFamily:"monospace",fontSize:11,color:C.muted}}>{t.receipt_no}</td>
                      <td style={{padding:"12px 14px"}}><span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:t.txn_type==="DEPOSIT"?"#EAF3DE":"#FCEBEB",color:t.txn_type==="DEPOSIT"?C.success:C.danger}}>{t.txn_type}</span></td>
                      <td style={{padding:"12px 14px",fontWeight:500}}>{t.account_label}</td>
                      <td style={{padding:"12px 14px",color:C.muted}}>{t.description}</td>
                      <td style={{padding:"12px 14px",fontWeight:600,color:t.txn_type==="DEPOSIT"?C.success:C.danger}}>{t.txn_type==="DEPOSIT"?"+":"−"}BZD {fmt(t.amount)}</td>
                      <td style={{padding:"12px 14px",color:C.muted,fontSize:11}}>{new Date(t.created_at).toLocaleTimeString("en-BZ",{hour:"2-digit",minute:"2-digit"})}</td>
                    </tr>
                  ))}</tbody>
                </table>
                <div style={{display:"flex",gap:24,marginTop:16,padding:"14px 16px",background:"#f7f7f5",borderRadius:10,fontSize:13}}>
                  <span style={{color:C.muted}}>Deposits:</span><span style={{fontWeight:700,color:C.success}}>BZD {fmt(summary.total_deposits)}</span>
                  <span style={{color:C.muted,marginLeft:12}}>Withdrawals:</span><span style={{fontWeight:700,color:C.danger}}>BZD {fmt(summary.total_withdrawals)}</span>
                  <span style={{color:C.muted,marginLeft:12}}>Count:</span><span style={{fontWeight:700}}>{summary.transaction_count}</span>
                </div>
              </>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ADMIN PORTAL
// ══════════════════════════════════════════════════════════════
function AdminPortal({ onBack }) {
  const [step,setStep]       = useState("login");
  const [user,setUser]       = useState("");
  const [pass,setPass]       = useState("");
  const [err,setErr]         = useState("");
  const [loading,setLoading] = useState(false);
  const [tab,setTab]         = useState("dashboard");
  const [stats,setStats]     = useState(null);
  const [accounts,setAccounts]= useState([]);
  const [members,setMembers] = useState([]);
  const [txns,setTxns]       = useState([]);
  const [newOpen,setNewOpen] = useState(false);
  const [nF,setNF]           = useState({name:"",email:"",type:CFG.MEMBER_TYPES[0]||"",deposit:"500"});
  const [saving,setSaving]   = useState(false);
  const [saveMsg,setSaveMsg] = useState("");

  const doLogin = async () => {
    if(!user||!pass){setErr("Enter credentials");return;}
    setLoading(true);setErr("");
    try {
      const {ok,data}=await gwPost("/auth/login",{username:user,password:pass,institution:SH,role:"admin"});
      if(!ok) throw new Error(data.detail||"Login failed");
      setStep("portal");loadAll();
    } catch(e){setErr(e.message);}
    setLoading(false);
  };

  const loadAll = async () => {
    try {
      const [a,m,t]=await Promise.all([gwGet(`/institutions/${SH}/accounts`),gwGet(`/institutions/${SH}/members`),gwGet(`/institutions/${SH}/transactions?limit=30`)]);
      setAccounts(a.accounts||[]);setMembers(m.members||[]);setTxns(t.transactions||[]);
    } catch{}
  };

  const createAccount = async () => {
    setSaving(true);setSaveMsg("");
    await new Promise(r=>setTimeout(r,800));
    setSaveMsg(`Account for ${nF.name} queued — complete deposit via teller portal`);
    setNF({name:"",email:"",type:CFG.MEMBER_TYPES[0]||"",deposit:"500"});
    setTimeout(()=>{setNewOpen(false);setSaveMsg("");},3000);
    setSaving(false);
  };

  const topbar = () => (
    <div style={{background:C.primary,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,borderRadius:8,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="2"/><path d="M7 12h10M7 8h10M7 16h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div style={{fontFamily:CFG.FONTS.display,fontSize:15,fontWeight:700,color:C.white}}>{SH.toUpperCase()} Admin Portal</div>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:12,color:C.sand}}>{CFG.ADMIN.admin_username}</span>
        <button onClick={()=>step==="portal"?setStep("login"):onBack()} style={mkBtn("rgba(255,255,255,.15)",C.white,{padding:"6px 14px",fontSize:12,border:"1px solid rgba(255,255,255,.25)"})}>{step==="portal"?"Sign out":"← Back to site"}</button>
      </div>
    </div>
  );

  const totalAUM=accounts.reduce((s,a)=>s+(parseFloat(a.balance)||0),0);

  if(step==="login") return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:CFG.FONTS.body}}>
      <link href={CFG.FONTS.google} rel="stylesheet"/>{topbar()}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 65px)",padding:40}}>
        <div style={{...crd,width:"100%",maxWidth:400,boxShadow:"0 8px 40px rgba(11,61,107,.12)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontFamily:CFG.FONTS.display,fontSize:24,fontWeight:700,color:C.primary}}>Admin sign in</div>
            <div style={{fontSize:13,color:C.muted,marginTop:4}}>{CFG.FULL_NAME}</div>
          </div>
          <Fld label="Username"><input style={inp} value={user} onChange={e=>setUser(e.target.value)} placeholder={CFG.ADMIN.admin_username}/></Fld>
          <Fld label="Password"><input style={inp} type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/></Fld>
          <Err msg={err}/>
          <button onClick={doLogin} disabled={loading} style={{...mkBtn(C.primary),width:"100%",opacity:loading?.7:1}}>{loading?"Signing in…":"Sign in"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:CFG.FONTS.body}}>
      <link href={CFG.FONTS.google} rel="stylesheet"/>{topbar()}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
        <div style={{borderBottom:`1px solid ${C.border}`,marginBottom:28,display:"flex",gap:4}}>
          {[["dashboard","Dashboard"],["members","Members"],["accounts","Accounts"],["transactions","Transactions"],["compliance","Compliance"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 18px",fontSize:13,border:"none",background:"none",cursor:"pointer",fontFamily:CFG.FONTS.body,color:tab===t?C.primary:C.muted,fontWeight:tab===t?600:400,borderBottom:tab===t?`2px solid ${C.primary}`:"2px solid transparent"}}>{l}</button>
          ))}
        </div>

        {tab==="dashboard"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28}}>
              {[["Total AUM",`BZD ${fmt(totalAUM)}`],["Members",String(members.length)],["Accounts",String(accounts.length)],["Transactions",String(txns.length)]].map(([l,v])=>(
                <div key={l} style={{background:"#f5f7fa",borderRadius:10,padding:"1.2rem"}}>
                  <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{l}</div>
                  <div style={{fontSize:26,fontWeight:700,color:C.ink}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <div style={crd}>
                <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:16}}>Top accounts by balance</div>
                {[...accounts].sort((a,b)=>(b.balance||0)-(a.balance||0)).slice(0,6).map((a,i)=>(
                  <div key={i} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}><span>{a.owner_name||a.label}</span><span style={{fontWeight:600}}>BZD {fmt(a.balance)}</span></div>
                    <div style={{height:4,background:C.sandLight,borderRadius:2}}><div style={{height:"100%",width:`${Math.min(100,(a.balance/(totalAUM||1))*100)}%`,background:C.primary,borderRadius:2}}/></div>
                  </div>
                ))}
              </div>
              <div style={crd}>
                <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:16}}>Recent transactions</div>
                {txns.slice(0,6).map((t,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                    <div><div style={{fontWeight:500}}>{t.description||t.txn_type}</div><div style={{fontSize:11,color:C.muted}}>{t.receipt_no}</div></div>
                    <div style={{fontWeight:600,color:t.txn_type?.toUpperCase().includes("DEPOSIT")?C.success:C.danger}}>{t.txn_type?.toUpperCase().includes("DEPOSIT")?"+":"−"}BZD {fmt(t.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==="members"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontFamily:CFG.FONTS.display,fontSize:20,fontWeight:700,color:C.ink}}>{members.length} members</div>
              <button onClick={()=>setNewOpen(true)} style={mkBtn(C.primary)}>+ New account</button>
            </div>
            <div style={crd}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"#f5f7fa"}}>{["Member","Email","Balance","Status"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:500,fontSize:11,color:C.muted,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
                <tbody>{members.map((m,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:"12px 14px",fontWeight:500}}>{m.username||m.email}</td>
                    <td style={{padding:"12px 14px",color:C.muted}}>{m.email}</td>
                    <td style={{padding:"12px 14px",fontWeight:600}}>BZD {fmt(m.total_balance||0)}</td>
                    <td style={{padding:"12px 14px"}}><span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"#EAF3DE",color:C.success}}>Active</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==="accounts"&&(
          <div style={crd}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontFamily:CFG.FONTS.display,fontSize:20,fontWeight:700,color:C.ink}}>{accounts.length} accounts</div>
              <button onClick={loadAll} style={mkBtn("#fff",C.muted,{border:`1px solid ${C.border}`,padding:"7px 14px",fontSize:13})}>Refresh</button>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f5f7fa"}}>{["Owner","Account ID","Balance","Currency","Type"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:500,fontSize:11,color:C.muted,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
              <tbody>{accounts.map((a,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"12px 14px",fontWeight:500}}>{a.owner_name||"—"}</td>
                  <td style={{padding:"12px 14px",fontFamily:"monospace",fontSize:11,color:C.muted}}>{a.id}</td>
                  <td style={{padding:"12px 14px",fontWeight:600}}>BZD {fmt(a.balance)}</td>
                  <td style={{padding:"12px 14px",color:C.muted}}>{a.currency}</td>
                  <td style={{padding:"12px 14px"}}><span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:C.sandLight,color:C.accent}}>{a.type}</span></td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0 0",fontSize:13,color:C.muted}}>
              <span>Total AUM</span><span style={{fontWeight:700,color:C.ink}}>BZD {fmt(totalAUM)}</span>
            </div>
          </div>
        )}

        {tab==="transactions"&&(
          <div style={crd}>
            <div style={{fontFamily:CFG.FONTS.display,fontSize:20,fontWeight:700,color:C.ink,marginBottom:20}}>Recent transactions</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f5f7fa"}}>{["Receipt","Type","Amount","Description","Time"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:500,fontSize:11,color:C.muted,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
              <tbody>{txns.map((t,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"12px 14px",fontFamily:"monospace",fontSize:11,color:C.muted}}>{t.receipt_no}</td>
                  <td style={{padding:"12px 14px"}}><span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:t.txn_type?.includes("DEPOSIT")?"#EAF3DE":"#FCEBEB",color:t.txn_type?.includes("DEPOSIT")?C.success:C.danger}}>{t.txn_type}</span></td>
                  <td style={{padding:"12px 14px",fontWeight:600,color:t.txn_type?.includes("DEPOSIT")?C.success:C.danger}}>{t.txn_type?.includes("DEPOSIT")?"+":"−"}BZD {fmt(t.amount)}</td>
                  <td style={{padding:"12px 14px",color:C.muted}}>{t.description}</td>
                  <td style={{padding:"12px 14px",color:C.muted,fontSize:11}}>{t.created_at?new Date(t.created_at).toLocaleString("en-BZ"):"—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {tab==="compliance"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {[
              {title:"AML/CFT status",items:[["MLTPA Cap 104 framework",false],["FIU Belize registration",false],["CDD programme active",false],["STR filing system",false]]},
              {title:"CBB registration",items:[["Credit Unions Act Cap 314",false],["Fit & proper — officers",false],["IT risk assessment ready",true],["CBB submission Phase 0",false]]},
              {title:"Daily checklist",items:[["Transactions > BZD 5,000 reviewed",true],["New member KYC forms filed",true],["No overdraft accounts",true],["Failed logins reviewed",false]]},
              {title:"Data & privacy",items:[["Member data on-server Belize",true],["PostgreSQL persistent storage",true],["No data leaves Belize",true],["OBP audit metrics live",true]]},
            ].map(({title,items})=>(
              <div key={title} style={crd}>
                <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:14}}>{title}</div>
                {items.map(([text,done])=>(
                  <div key={text} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:C.muted,marginBottom:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:done?C.success:"#e0e0e0",flexShrink:0}}/>
                    {text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={newOpen} onClose={()=>setNewOpen(false)} title="Create new account">
        <p style={{fontSize:13,color:C.muted,marginBottom:16}}>Member must present valid ID. KYC form required before account creation.</p>
        <Fld label="Full name (legal)"><input style={inp} value={nF.name} onChange={e=>setNF(f=>({...f,name:e.target.value}))}/></Fld>
        <Fld label="Email address"><input style={inp} type="email" value={nF.email} onChange={e=>setNF(f=>({...f,email:e.target.value}))}/></Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Fld label="Membership type"><select style={inp} value={nF.type} onChange={e=>setNF(f=>({...f,type:e.target.value}))}>{CFG.MEMBER_TYPES.map(t=><option key={t}>{t}</option>)}</select></Fld>
          <Fld label="Opening deposit (BZD)"><input style={inp} type="number" value={nF.deposit} onChange={e=>setNF(f=>({...f,deposit:e.target.value}))}/></Fld>
        </div>
        {saveMsg&&<Ok msg={saveMsg}/>}
        <button onClick={createAccount} disabled={saving||!nF.name||!nF.email} style={{...mkBtn(C.primary),width:"100%",opacity:!nF.name||!nF.email?.5:1}}>{saving?"Creating…":"Create account"}</button>
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ROOT ROUTER
// ══════════════════════════════════════════════════════════════

// ── Chat Widget (SCCU/TACU) ────────────────────────────────────────
const QUICK_PROMPTS_CU = [
  "What savings accounts do you offer?",
  "How do I apply for a loan?",
  "How do I open an account?",
  "What is the BelizePay network?",
];

function ChatWidgetCU({ session }) {
  const [open,setOpen]     = useState(false);
  const [msgs,setMsgs]     = useState([{role:"ai",text:`Hello! I'm the ${SH.toUpperCase()} Assistant. I can help with accounts, loans, transfers, and more. What can I help you with?`}]);
  const [input,setInput]   = useState("");
  const [loading,setLoading] = useState(false);
  const [sessId]           = useState(()=>Math.random().toString(36).slice(2));
  const [pulsed,setPulsed] = useState(true);
  const bottomRef          = useRef(null);
  const primary = C?.primary || CFG?.COLORS?.primary || "#1A5FA8";
  const white   = C?.white   || "#FFFFFF";
  const border  = C?.border  || "#E8E5DE";
  const offWhite = C?.cream  || C?.sandLight || "#F9F8F5";
  const muted   = C?.muted   || "#6B6B6B";
  const ink     = C?.ink     || "#1A1A2E";

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);
  useEffect(()=>{if(open) setPulsed(false);},[open]);

  const send=async(text)=>{
    const msg=(text||input).trim();
    if(!msg||loading) return;
    setInput("");
    setMsgs(m=>[...m,{role:"user",text:msg}]);
    setLoading(true);
    try{
      const headers={"Content-Type":"application/json"};
      if(session?.token) headers.Authorization=`Bearer ${session.token}`;
      const r=await fetch(`${GW}/ai/chat`,{
        method:"POST",headers,
        body:JSON.stringify({message:msg,institution:SH,domain:"customer",session_id:sessId}),
      });
      const data=await r.json();
      setMsgs(m=>[...m,{role:"ai",text:data.response||data.detail||"Sorry, I couldn't get a response. Please try again."}]);
    }catch{
      setMsgs(m=>[...m,{role:"ai",text:"Connection error. Please try again."}]);
    }finally{setLoading(false);}
  };

  const fmt2=t=>t.replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/#{1,3}\s/g,"").trim();

  const fabStyle={position:"fixed",bottom:24,right:24,width:52,height:52,background:primary,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,boxShadow:`0 4px 16px ${primary}55`,transition:"transform .2s"};
  const panelStyle={position:"fixed",bottom:86,right:24,width:340,height:500,background:white,border:`1px solid ${border}`,borderRadius:12,display:"flex",flexDirection:"column",zIndex:200,boxShadow:"0 20px 60px rgba(0,0,0,.12)",animation:"slideUp2 .25s ease both"};

  return(
    <>
      <button style={fabStyle} onClick={()=>setOpen(o=>!o)} title={`${SH.toUpperCase()} AI Assistant`}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        {open?(
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={white} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ):(
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r="1" fill={white}/><circle cx="12" cy="10" r="1" fill={white}/><circle cx="15" cy="10" r="1" fill={white}/>
          </svg>
        )}
      </button>
      {open&&(
        <div style={panelStyle}>
          <div style={{background:primary,borderRadius:"12px 12px 0 0",padding:"13px 16px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,background:"rgba(255,255,255,.2)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:white,fontWeight:700,fontSize:".875rem"}}>{SH[0].toUpperCase()}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{color:white,fontWeight:600,fontSize:".875rem"}}>{CFG.FULL_NAME?.split(" ").slice(0,3).join(" ") || SH.toUpperCase()} Assistant</div>
              <div style={{color:"rgba(255,255,255,.7)",fontSize:".72rem"}}>{session?"Member session active":"Ask me anything"}</div>
            </div>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e"}}/>
          </div>
          <div style={{background:"#FFF8E6",borderBottom:`1px solid ${border}`,padding:"6px 14px",fontSize:".72rem",color:"#8B6914"}}>
            AI assistant — not a financial adviser. Contact {SH.toUpperCase()} for account decisions.
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column"}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{maxWidth:"85%",marginBottom:10,alignSelf:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{padding:"9px 13px",borderRadius:11,fontSize:".875rem",lineHeight:1.55,
                  background:m.role==="user"?primary:offWhite,color:m.role==="user"?white:ink,
                  borderBottomRightRadius:m.role==="user"?3:11,borderBottomLeftRadius:m.role==="ai"?3:11,
                  border:m.role==="ai"?`1px solid ${border}`:"none"}}>
                  {fmt2(m.text).split("\n").map((line,j,arr)=><span key={j}>{line}{j<arr.length-1&&<br/>}</span>)}
                </div>
              </div>
            ))}
            {loading&&(
              <div style={{maxWidth:"85%",marginBottom:10,alignSelf:"flex-start"}}>
                <div style={{padding:"12px 16px",borderRadius:11,background:offWhite,border:`1px solid ${border}`,display:"flex",gap:5,alignItems:"center"}}>
                  {[0,.2,.4].map((d,i)=>(
                    <span key={i} style={{width:7,height:7,background:muted,borderRadius:"50%",display:"inline-block",animation:`chatpulse 1s ${d}s ease-in-out infinite`}}/>
                  ))}
                </div>
              </div>
            )}
            {msgs.length===1&&!loading&&(
              <div style={{marginTop:8}}>
                {QUICK_PROMPTS_CU.map((q,i)=>(
                  <button key={i} onClick={()=>send(q)} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",marginBottom:6,background:offWhite,border:`1px solid ${border}`,borderRadius:6,fontSize:".8125rem",color:ink,cursor:"pointer"}}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          <div style={{borderTop:`1px solid ${border}`,padding:"11px 13px",display:"flex",gap:10,alignItems:"center",background:white,borderRadius:"0 0 12px 12px"}}>
            <input style={{flex:1,border:"none",outline:"none",fontSize:".875rem",background:"transparent",fontFamily:CFG.FONTS?.body||"sans-serif",color:ink}}
              placeholder="Ask about accounts, loans, transfers…"
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} disabled={loading}/>
            <button onClick={()=>send()} disabled={!input.trim()||loading}
              style={{width:32,height:32,borderRadius:"50%",border:"none",background:input.trim()?primary:"#E8E5DE",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .2s"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim()?white:muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function InstitutionApp() {
  const [route,setRoute] = useState(getRoute());
  const nav = (r) => { window.history.pushState({},"",`/${r==="public"?"":r}`); setRoute(r); };
  if (route==="teller") return <TellerPortal  onBack={()=>nav("public")}/>;
  if (route==="admin")  return <AdminPortal   onBack={()=>nav("public")}/>;
  return (
    <>
      <ChatWidgetCU session={null}/>
      {route==="member" ? <MemberPortal onBack={()=>nav("public")}/> : <PublicSite onNav={nav}/>}
    </>
  );
}
