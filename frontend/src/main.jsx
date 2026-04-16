import React from "react"
import ReactDOM from "react-dom/client"
import { useState } from "react"
import App from "./App.jsx"
import MemberPortal from "./MemberPortal.jsx"
import TellerPortal from "./TellerPortal.jsx"

const path = window.location.pathname
const isBase = path === "/" || path.startsWith("/sccu")

function Root() {
  const [view, setView] = useState("admin")
  if (path.includes("teller") || view === "teller") return <TellerPortal />
  if (path.includes("member") || view === "member") return <MemberPortal />
  return (
    <div>
      <div style={{ position: "fixed", top: 12, right: 16, display: "flex", gap: 8, zIndex: 999 }}>
        <button onClick={() => setView("member")} style={{ padding: "6px 14px", fontSize: 12, border: "1px solid #e8e8e8", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Member portal</button>
        <button onClick={() => setView("teller")} style={{ padding: "6px 14px", fontSize: 12, border: "1px solid #e8e8e8", borderRadius: 8, background: "#534AB7", color: "#fff", cursor: "pointer" }}>Teller portal</button>
      </div>
      <App />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><Root /></React.StrictMode>)
