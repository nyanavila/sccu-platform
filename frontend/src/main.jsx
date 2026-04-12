import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import MemberPortal from "./MemberPortal.jsx";

function Root() {
  const [mode, setMode] = useState("member");
  return (
    <div>
      <div style={{
        position: "fixed", top: 12, right: 12, zIndex: 9999,
        display: "flex", gap: 6, background: "#fff",
        border: "1px solid #e8e8e8", borderRadius: 10, padding: 6,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
      }}>
        <button onClick={() => setMode("member")} style={{
          padding: "6px 14px", fontSize: 12, border: "none", borderRadius: 7, cursor: "pointer",
          background: mode === "member" ? "#0F6E56" : "transparent",
          color: mode === "member" ? "#fff" : "#888", fontWeight: 500,
        }}>Member</button>
        <button onClick={() => setMode("admin")} style={{
          padding: "6px 14px", fontSize: 12, border: "none", borderRadius: 7, cursor: "pointer",
          background: mode === "admin" ? "#0F6E56" : "transparent",
          color: mode === "admin" ? "#fff" : "#888", fontWeight: 500,
        }}>Admin</button>
      </div>
      {mode === "member" ? <MemberPortal /> : <App />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode><Root /></StrictMode>
);
