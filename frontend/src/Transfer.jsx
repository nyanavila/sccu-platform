import { useState, useEffect } from "react";

import API from "./config.js";
const SCCU_API = API;
const fmt = (n) => new Intl.NumberFormat("en-BZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function Transfer({ account, onClose, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`${SCCU_API}/accounts`)
      .then(r => r.json())
      .then(d => setAccounts((d.accounts || []).filter(a => a.id !== account.id)));
  }, []);

  const submit = async () => {
    if (!toAccount) { setError("Please select a recipient"); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Please enter a valid amount"); return; }
    if (amt > account.balance) { setError(`Insufficient funds. Balance: BZD ${fmt(account.balance)}`); return; }
    if (!description) { setError("Please enter a description"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${SCCU_API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_account_id: account.id,
          to_account_id: toAccount,
          amount: amt,
          description,
          type: "TRANSFER",
        }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setResult(d);
        onSuccess(d);
      } else {
        setError(d.detail || "Transfer failed");
      }
    } catch {
      setError("Cannot reach SCCU API");
    }
    setLoading(false);
  };

  const overlay = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem",
  };
  const modal = {
    background: "#fff", borderRadius: 20, padding: "2rem",
    width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  };
  const inp = {
    width: "100%", padding: "12px 14px", fontSize: 14,
    border: "1px solid #e8e8e8", borderRadius: 10,
    boxSizing: "border-box", outline: "none", fontFamily: "inherit",
  };

  if (result) {
    return (
      <div style={overlay}>
        <div style={modal}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, color: "#0F6E56" }}>✓</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>Transfer complete</h2>
            <p style={{ margin: 0, color: "#888", fontSize: 14 }}>BZD {fmt(result.amount)} sent successfully</p>
          </div>
          <div style={{ background: "#f7f7f5", borderRadius: 12, padding: "1.25rem", marginBottom: 20 }}>
            {[
              ["Amount sent", `BZD ${fmt(result.amount)}`],
              ["Your new balance", `BZD ${fmt(result.sender_new_balance)}`],
              ["Transaction ID", result.transaction_id],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e8e8e8", fontSize: 13 }}>
                <span style={{ color: "#888" }}>{k}</span>
                <span style={{ fontWeight: 500, fontFamily: k === "Transaction ID" ? "monospace" : "inherit", fontSize: k === "Transaction ID" ? 11 : 13 }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ width: "100%", padding: "13px", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 10, cursor: "pointer", background: "#0F6E56", color: "#fff" }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>Send money</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Available: BZD {fmt(account.balance)}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e8e8e8", background: "#fff", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#888", marginBottom: 5, display: "block", fontWeight: 500 }}>Send to</label>
          <select style={inp} value={toAccount} onChange={e => setToAccount(e.target.value)}>
            <option value="">Select SCCU member</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.owner_name} — BZD {fmt(a.balance)}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#888", marginBottom: 5, display: "block", fontWeight: 500 }}>Amount (BZD)</label>
          <input style={{ ...inp, fontSize: 24, fontWeight: 700, padding: "14px" }} type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}/>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#888", marginBottom: 5, display: "block", fontWeight: 500 }}>Description</label>
          <input style={inp} placeholder="What is this transfer for?" value={description} onChange={e => setDescription(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}/>
        </div>

        {error && <div style={{ padding: "12px 14px", background: "#FCEBEB", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#A32D2D" }}>{error}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", fontSize: 14, fontWeight: 600, border: "1px solid #e8e8e8", borderRadius: 10, cursor: "pointer", background: "#fff" }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ flex: 1, padding: "13px", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 10, cursor: loading ? "wait" : "pointer", background: "#0F6E56", color: "#fff" }}>
            {loading ? "Processing..." : "Send money"}
          </button>
        </div>
      </div>
    </div>
  );
}
