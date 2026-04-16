import { useState } from "react";

import API from "./config.js";
const SCCU_API = API;

const MEMBER_TYPES = ["Community", "Business", "Agricultural", "Diaspora", "Trade"];

export default function NewMember({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "",
    member_type: "Community", initial_deposit: "500",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      setError("First name, last name and email are required.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${SCCU_API}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          initial_deposit: parseFloat(form.initial_deposit) || 0,
        }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setResult(d.member);
      } else {
        setError(d.detail || "Member creation failed");
      }
    } catch {
      setError("Cannot reach SCCU API");
    }
    setLoading(false);
  };

  const s = {
    card: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1.5rem" },
    label: { fontSize: 12, color: "#888", marginBottom: 5, display: "block", fontWeight: 500 },
    input: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #e8e8e8", borderRadius: 8, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
    select: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #e8e8e8", borderRadius: 8, boxSizing: "border-box", outline: "none", fontFamily: "inherit", background: "#fff" },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    btn: (primary) => ({ padding: "11px 20px", fontSize: 13, fontWeight: 600, border: primary ? "none" : "1px solid #e8e8e8", borderRadius: 8, cursor: "pointer", background: primary ? "#0F6E56" : "#fff", color: primary ? "#fff" : "#1a1a1a" }),
  };

  if (result) {
    return (
      <div style={s.card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 }}>✓</div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, color: "#0F6E56" }}>Member created!</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#888" }}>Share this information with the new member</p>
        </div>

        <div style={{ background: "#f7f7f5", borderRadius: 10, padding: "1.25rem", marginBottom: 20 }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            {[
              ["Full name", result.full_name],
              ["Email", result.email],
              ["Temporary password", result.password],
              ["Account ID", result.account_id],
              ["Account number", result.account_number],
              ["Opening balance", `BZD ${result.initial_balance.toFixed(2)}`],
              ["Currency", result.currency],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: "1px solid #e8e8e8" }}>
                <td style={{ padding: "10px 0", color: "#888", width: 160 }}>{k}</td>
                <td style={{ padding: "10px 0", fontWeight: k === "Temporary password" ? 600 : 400, fontFamily: k.includes("Account") || k === "Temporary password" ? "monospace" : "inherit", fontSize: k === "Temporary password" ? 15 : 13 }}>{v}</td>
              </tr>
            ))}
          </table>
        </div>

        <div style={{ padding: "12px 16px", background: "#FAEEDA", borderRadius: 8, marginBottom: 20, fontSize: 13, color: "#854F0B" }}>
          ⚠ Save the temporary password now — it cannot be retrieved later. Ask the member to change it on first login.
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => { setResult(null); setForm({ first_name: "", last_name: "", email: "", member_type: "Community", initial_deposit: "500" }); }} style={s.btn(false)}>
            Add another member
          </button>
          <button onClick={() => onSuccess(result)} style={s.btn(true)}>
            Done — back to members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>New member</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Create a member account with BZD share savings</p>
        </div>
        <button onClick={onCancel} style={s.btn(false)}>Cancel</button>
      </div>

      <div style={s.row}>
        <div>
          <label style={s.label}>First name *</label>
          <input style={s.input} placeholder="Maria" value={form.first_name} onChange={e => set("first_name", e.target.value)}/>
        </div>
        <div>
          <label style={s.label}>Last name *</label>
          <input style={s.input} placeholder="Santos" value={form.last_name} onChange={e => set("last_name", e.target.value)}/>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={s.label}>Email address *</label>
        <input style={s.input} type="email" placeholder="member@sccu.bz" value={form.email} onChange={e => set("email", e.target.value)}/>
      </div>

      <div style={s.row}>
        <div>
          <label style={s.label}>Member type</label>
          <select style={s.select} value={form.member_type} onChange={e => set("member_type", e.target.value)}>
            {MEMBER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Initial deposit (BZD)</label>
          <input style={s.input} type="number" placeholder="500" value={form.initial_deposit} onChange={e => set("initial_deposit", e.target.value)}/>
        </div>
      </div>

      <div style={{ padding: "12px 16px", background: "#E6F1FB", borderRadius: 8, marginBottom: 20, fontSize: 13, color: "#185FA5" }}>
        A secure temporary password will be auto-generated. The member's BZD share savings account will be created immediately.
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FCEBEB", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#A32D2D" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={submit} disabled={loading} style={s.btn(true)}>
          {loading ? "Creating member..." : "Create member + account"}
        </button>
        <button onClick={onCancel} style={s.btn(false)}>Cancel</button>
      </div>
    </div>
  );
}
