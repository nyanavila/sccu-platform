"""
BelizePay Financial Technologies
Multi-institution API gateway — port 3002
"""

from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2, psycopg2.extras
import os, json, uuid, hashlib
from datetime import datetime
from pathlib import Path

app = FastAPI(title="BelizePay Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Institution registry ────────────────────────────────────────────
REGISTRY_FILE = Path.home() / "belizepay" / "institution_registry.json"

HARDCODED_INSTITUTIONS = [
    {
        "short": "sccu",
        "name": "Sensu Community Credit Union",
        "routing": "bz.sccu",
        "bank_id": "93dba562-eb4f-4a69-949f-0fe9bb6a5644",
        "obp_port": 8080,
        "pg_port": 5432,
        "pg_user": "sccu_admin",
        "pg_db": "sccu",
        "pg_pass": "Sccu2026#DB",
        "currency": "BZD",
        "type": "credit_union",
        "status": "active",
        "members": 9,
        "aum_bzd": 75450,
        "founded": "2026-04-11",
        "location": "Belize City",
        "teller_enabled": True,
        "admin_username": "nyanavila_20",
        "admin_pass": "Sccu2026#Admin",
    },
    {
        "short": "tacu",
        "name": "Toledo Agricultural Credit Union",
        "routing": "bz.tacu",
        "bank_id": "00d0a45b-4e32-4d7a-99ba-6b5053216f3e",
        "obp_port": 8082,
        "pg_port": 5434,
        "pg_user": "tacu_admin",
        "pg_db": "tacu",
        "pg_pass": "BelizePay2026#tacu",
        "currency": "BZD",
        "type": "credit_union",
        "status": "active",
        "members": 1,
        "aum_bzd": 500,
        "founded": "2026-04-17",
        "location": "Toledo District",
        "teller_enabled": True,
        "admin_username": "tacu_admin",
        "admin_pass": "Tacu2026#Admin",
    },
    {
        "short": "ngb",
        "name": "National Garifuna Bank",
        "routing": "bz.ngb",
        "bank_id": "",
        "obp_port": 8084,
        "pg_port": 5436,
        "pg_user": "ngb_admin",
        "pg_db": "ngb",
        "pg_pass": "BelizePay2026#ngb",
        "currency": "BZD",
        "type": "bank",
        "status": "active",
        "members": 0,
        "aum_bzd": 0,
        "founded": "2026-04-21",
        "location": "Dangriga, Stann Creek",
        "teller_enabled": True,
        "admin_username": "ngb_admin",
        "admin_pass": "Ngb2026#Admin",
    },
]

def get_institutions():
    insts = list(HARDCODED_INSTITUTIONS)
    if REGISTRY_FILE.exists():
        try:
            for line in REGISTRY_FILE.read_text().strip().split("\n"):
                if line.strip():
                    d = json.loads(line)
                    if not any(i["short"] == d["short"] for i in insts):
                        insts.append(d)
        except Exception:
            pass
    return insts

def get_institution(short: str):
    for inst in get_institutions():
        if inst["short"] == short:
            return inst
    return None

def pg_conn(inst: dict):
    return psycopg2.connect(
        host="localhost",
        port=inst.get("pg_port", 5432),
        dbname=inst.get("pg_db", inst["short"]),
        user=inst.get("pg_user", f"{inst['short']}_admin"),
        password=inst.get("pg_pass", f"BelizePay2026#{inst['short']}"),
    )

def sccu_conn():
    return pg_conn(get_institution("sccu"))

# ── Health ──────────────────────────────────────────────────────────
@app.get("/health")
def health():
    insts = get_institutions()
    return {
        "status": "live",
        "platform": "BelizePay Financial Technologies",
        "version": "1.0.0",
        "institutions": len(insts),
        "timestamp": datetime.utcnow().isoformat(),
    }

# ── Institution registry ────────────────────────────────────────────
@app.get("/institutions")
def list_institutions():
    return {"institutions": get_institutions(), "count": len(get_institutions())}

@app.get("/institutions/{short}")
def get_institution_detail(short: str):
    inst = get_institution(short)
    if not inst:
        raise HTTPException(404, f"Institution '{short}' not found")
    # Get live stats from its PostgreSQL
    try:
        conn = pg_conn(inst)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) AS members FROM resourceuser WHERE provider_ != 'None' AND provider_ != ''")
        members = cur.fetchone()["members"]
        cur.execute("SELECT COALESCE(SUM(accountbalance),0) AS aum FROM mappedbankaccount WHERE accountcurrency = %s", (inst["currency"],))
        aum = float(cur.fetchone()["aum"])
        conn.close()
        inst["live_members"] = members
        inst["live_aum"] = aum
    except Exception as e:
        inst["live_members"] = inst.get("members", 0)
        inst["live_aum"] = inst.get("aum_bzd", 0)
    return inst

# ── Platform stats ──────────────────────────────────────────────────
@app.get("/platform/stats")
def platform_stats():
    insts = get_institutions()
    total_aum = 0
    total_members = 0
    active = 0
    for inst in insts:
        if inst.get("status") == "active":
            active += 1
            try:
                conn = pg_conn(inst)
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute("SELECT COALESCE(SUM(accountbalance),0) AS aum FROM mappedbankaccount WHERE accountcurrency = %s", (inst["currency"],))
                total_aum += float(cur.fetchone()["aum"])
                cur.execute("SELECT COUNT(*) AS m FROM resourceuser WHERE provider_ != 'None'")
                total_members += int(cur.fetchone()["m"])
                conn.close()
            except Exception:
                total_aum += inst.get("aum_bzd", 0)
                total_members += inst.get("members", 0)
    return {
        "institutions_total": len(insts),
        "institutions_active": active,
        "total_members": total_members,
        "total_aum_bzd": round(total_aum, 2),
        "total_aum_usd": round(total_aum / 2, 2),
        "platform": "BelizePay Financial Technologies",
        "timestamp": datetime.utcnow().isoformat(),
    }

# ── Accounts (per institution) ──────────────────────────────────────
@app.get("/institutions/{short}/accounts")
def get_accounts(short: str):
    inst = get_institution(short)
    if not inst:
        raise HTTPException(404, "Institution not found")
    try:
        conn = pg_conn(inst)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT a.theaccountid AS id, a.accountlabel AS label,
                   a.accountbalance AS balance, a.accountcurrency AS currency,
                   a.kind AS type, u.name_ AS owner_name, au.email AS owner_email
            FROM mappedbankaccount a
            LEFT JOIN mapperaccountholders h ON h.accountpermalink = a.theaccountid
            LEFT JOIN resourceuser u ON u.id = h.user_c
            LEFT JOIN authuser au ON au.username = u.name_
            WHERE a.accountcurrency = %s
            ORDER BY a.accountbalance DESC
        """, (inst["currency"],))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        total = sum(r["balance"] or 0 for r in rows)
        return {"institution": short, "accounts": rows, "total_aum": round(total, 2), "count": len(rows)}
    except Exception as e:
        raise HTTPException(500, str(e))

# ── Members (per institution) ───────────────────────────────────────
@app.get("/institutions/{short}/members")
def get_members(short: str):
    inst = get_institution(short)
    if not inst:
        raise HTTPException(404, "Institution not found")
    try:
        conn = pg_conn(inst)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT u.userid_ AS id, u.name_ AS username, au.email,
                   COALESCE(SUM(a.accountbalance), 0) AS total_balance
            FROM resourceuser u
            JOIN authuser au ON au.username = u.name_
            LEFT JOIN mapperaccountholders h ON h.user_c = u.id
            LEFT JOIN mappedbankaccount a ON a.theaccountid = h.accountpermalink
            WHERE au.provider = 'OBP' AND au.validated = true
            GROUP BY u.userid_, u.name_, au.email
            ORDER BY total_balance DESC
        """)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return {"institution": short, "members": rows, "count": len(rows)}
    except Exception as e:
        raise HTTPException(500, str(e))

# ── Interbank transfer ──────────────────────────────────────────────
class InterbankTransfer(BaseModel):
    from_institution: str
    from_account: str
    to_institution: str
    to_account: str
    amount: float
    currency: str = "BZD"
    description: str = ""
    initiated_by: str = ""

@app.post("/interbank/transfer")
def interbank_transfer(tx: InterbankTransfer):
    from_inst = get_institution(tx.from_institution)
    to_inst = get_institution(tx.to_institution)
    if not from_inst:
        raise HTTPException(404, f"Source institution '{tx.from_institution}' not found")
    if not to_inst:
        raise HTTPException(404, f"Destination institution '{tx.to_institution}' not found")
    if tx.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    # Debit source
    try:
        conn_from = pg_conn(from_inst)
        cur = conn_from.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT accountbalance FROM mappedbankaccount WHERE theaccountid = %s", (tx.from_account,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Source account not found")
        if float(row["accountbalance"]) < tx.amount:
            raise HTTPException(400, "Insufficient funds")
        cur.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance - %s WHERE theaccountid = %s",
                    (tx.amount, tx.from_account))
        conn_from.commit()
        conn_from.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Debit failed: {e}")

    # Credit destination — create account if it doesn't exist (interbank settlement)
    try:
        conn_to = pg_conn(to_inst)
        cur = conn_to.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT theaccountid FROM mappedbankaccount WHERE theaccountid = %s", (tx.to_account,))
        dest = cur.fetchone()
        if not dest:
            cur.execute(
                "INSERT INTO mappedbankaccount (theaccountid, accountlabel, accountbalance, accountcurrency, kind, bankid) VALUES (%s, %s, %s, %s, 'CURRENT', %s)",
                (tx.to_account, f"Interbank settlement from {tx.from_institution.upper()}", tx.amount, tx.currency, to_inst["routing"])
            )
        else:
            cur.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance + %s WHERE theaccountid = %s",
                        (tx.amount, tx.to_account))
        conn_to.commit()
        conn_to.close()
    except Exception as e:
        try:
            conn_from = pg_conn(from_inst)
            cur2 = conn_from.cursor()
            cur2.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance + %s WHERE theaccountid = %s",
                        (tx.amount, tx.from_account))
            conn_from.commit()
            conn_from.close()
        except Exception:
            pass
        raise HTTPException(500, f"Credit failed (debit reversed): {e}")

    txn_id = f"ibk-{tx.from_institution}-{tx.to_institution}-{uuid.uuid4().hex[:8]}"
    fee = round(tx.amount * 0.002, 2)  # 0.2% interbank fee
    return {
        "success": True,
        "transaction_id": txn_id,
        "from_institution": tx.from_institution,
        "to_institution": tx.to_institution,
        "amount": tx.amount,
        "fee_bzd": fee,
        "currency": tx.currency,
        "description": tx.description,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Auth login (member + admin) ────────────────────────────────────
class AuthLogin(BaseModel):
    username: str
    password: str
    institution: str
    role: str = "member"

@app.post("/auth/login")
def auth_login(req: AuthLogin):
    inst = get_institution(req.institution)
    if not inst:
        raise HTTPException(404, "Institution not found")
    # Admin login
    if req.username == inst.get("admin_username"):
        if req.password == inst.get("admin_pass"):
            token = hashlib.sha256(f"admin:{req.institution}:{req.username}:{datetime.utcnow().isoformat()}".encode()).hexdigest()[:32]
            return {"ok": True, "role": "admin", "token": token, "username": req.username, "institution": req.institution}
        raise HTTPException(401, "Invalid credentials")
    # Member login via OBP DirectLogin
    inst_key = f"{req.institution}-key-2026"
    import urllib.request, urllib.error
    obp_url = f"http://localhost:{inst['obp_port']}/my/logins/direct"
    auth_str = f'DirectLogin username="{req.username}",password="{req.password}",consumer_key="{inst_key}"'
    obp_req = urllib.request.Request(obp_url, data=b"", headers={"Authorization": auth_str, "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(obp_req, timeout=5) as resp:
            obp_data = json.loads(resp.read())
            obp_token = obp_data.get("token", "")
    except Exception:
        raise HTTPException(401, "Invalid credentials")
    if not obp_token:
        raise HTTPException(401, "Invalid credentials")
    try:
        conn = pg_conn(inst)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT au.email, u.userid_ AS user_id, a.theaccountid AS account_id,
                   a.accountlabel AS label, a.accountbalance AS balance, a.accountcurrency AS currency
            FROM authuser au JOIN resourceuser u ON u.name_ = au.username
            LEFT JOIN mapperaccountholders h ON h.user_c = u.id
            LEFT JOIN mappedbankaccount a ON a.theaccountid = h.accountpermalink
            WHERE au.email = %s AND au.validated = true LIMIT 1
        """, (req.username,))
        row = cur.fetchone() or {}
        conn.close()
    except Exception:
        row = {}
    return {"ok": True, "role": "member", "token": obp_token, "username": req.username,
            "email": row.get("email", req.username), "account_id": row.get("account_id"),
            "balance": float(row.get("balance") or 0), "institution": req.institution}

# ── Intra-institution transfer ──────────────────────────────────────
class IntraTransfer(BaseModel):
    from_account: str
    to_account: str
    amount: float
    currency: str = "BZD"
    description: str = "Member transfer"
    institution: str

@app.post("/transactions")
def intra_transfer(tx: IntraTransfer):
    inst = get_institution(tx.institution)
    if not inst:
        raise HTTPException(404, "Institution not found")
    if tx.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    try:
        conn = pg_conn(inst)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT accountbalance FROM mappedbankaccount WHERE theaccountid = %s", (tx.from_account,))
        src = cur.fetchone()
        if not src:
            raise HTTPException(404, "Source account not found")
        if float(src["accountbalance"]) - tx.amount < 100:
            raise HTTPException(400, "Insufficient funds — minimum balance BZD 100 must be maintained")
        cur.execute("SELECT theaccountid FROM mappedbankaccount WHERE theaccountid = %s", (tx.to_account,))
        if not cur.fetchone():
            raise HTTPException(404, "Destination account not found")
        cur.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance - %s WHERE theaccountid = %s", (tx.amount, tx.from_account))
        cur.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance + %s WHERE theaccountid = %s", (tx.amount, tx.to_account))
        txn_id = f"txn-{tx.institution}-{uuid.uuid4().hex[:8]}"
        try:
            cur.execute("INSERT INTO sccu_transactions (id, institution, from_account, to_account, amount, currency, description, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,NOW())", (txn_id, tx.institution, tx.from_account, tx.to_account, tx.amount, tx.currency, tx.description))
        except Exception:
            pass
        conn.commit()
        conn.close()
        return {"ok": True, "transaction_id": txn_id, "amount": tx.amount, "currency": tx.currency}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

# ── Teller module ──────────────────────────────────────────────────
import secrets

# In-memory session store: token -> session dict
# Keyed per institution so SCCU and TACU sessions don't collide
TELLER_SESSIONS: dict = {}

def teller_from_token(token: str) -> dict:
    s = TELLER_SESSIONS.get(token)
    if not s:
        raise HTTPException(401, "Invalid or expired teller session")
    return s

def gen_receipt(institution: str, teller_id) -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    rand = secrets.token_hex(3).upper()
    return f"RCP-{institution.upper()}-{teller_id}-{ts}-{rand}"

class TellerLogin(BaseModel):
    institution: str
    username: str
    password: str

@app.post("/teller/login")
def teller_login(req: TellerLogin):
    inst = get_institution(req.institution)
    if not inst:
        raise HTTPException(404, "Institution not found")
    try:
        conn = pg_conn(inst)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, username, full_name, branch, active, password_hash FROM sccu_tellers WHERE username = %s",
            (req.username,)
        )
        teller = cur.fetchone()
        conn.close()
        if not teller:
            raise HTTPException(401, "Invalid credentials")
        if not teller["active"]:
            raise HTTPException(403, "Teller account inactive")
        # plaintext comparison — replace with bcrypt when passwords are hashed
        if teller["password_hash"] != req.password:
            raise HTTPException(401, "Invalid credentials")
        token = secrets.token_hex(32)
        TELLER_SESSIONS[token] = {
            "institution": req.institution,
            "teller_id":   teller["id"],
            "username":    teller["username"],
            "full_name":   teller["full_name"],
            "branch":      teller["branch"],
            "opened_at":   datetime.utcnow().isoformat(),
            "session_id":  None,
            "float":       0.0,
        }
        return {
            "token":     token,
            "teller_id": teller["id"],
            "full_name": teller["full_name"],
            "branch":    teller["branch"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/teller/session/open")
def teller_open_session(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess  = teller_from_token(token)
    inst  = get_institution(sess["institution"])
    opening_float = float(body.get("opening_float", 0))
    try:
        conn = pg_conn(inst)
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO bp_teller_sessions (teller_id, opening_float, status)
            VALUES (%s, %s, 'open') RETURNING id, opened_at
        """, (sess["teller_id"], opening_float))
        row = cur.fetchone()
        conn.commit()
        conn.close()
        TELLER_SESSIONS[token]["session_id"] = row["id"]
        TELLER_SESSIONS[token]["float"]      = opening_float
        return {
            "session_id":    row["id"],
            "teller_id":     sess["teller_id"],
            "full_name":     sess["full_name"],
            "branch":        sess["branch"],
            "opening_float": opening_float,
            "opened_at":     row["opened_at"].isoformat(),
            "status":        "open",
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/teller/session/summary")
def teller_session_summary(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess  = teller_from_token(token)
    inst  = get_institution(sess["institution"])
    session_id = sess.get("session_id")
    if not session_id:
        return {
            "session_id": None, "teller": sess["full_name"],
            "branch": sess["branch"], "opened_at": sess["opened_at"],
            "status": "no_session", "opening_float": 0,
            "total_deposits": 0, "total_withdrawals": 0,
            "transaction_count": 0, "transactions": [],
        }
    try:
        conn = pg_conn(inst)
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, teller_id, opened_at, opening_float,
                   closing_float, total_deposits, total_withdrawals,
                   transaction_count, status
            FROM bp_teller_sessions WHERE id = %s
        """, (session_id,))
        session = dict(cur.fetchone() or {})
        cur.execute("""
            SELECT bt.receipt_no, bt.txn_type, bt.amount, bt.currency,
                   bt.description, bt.created_at, a.accountlabel AS account_label
            FROM bp_teller_transactions bt
            JOIN mappedbankaccount a ON a.theaccountid = bt.account_id
            WHERE bt.session_id = %s ORDER BY bt.created_at DESC
        """, (session_id,))
        txns = [dict(r) for r in cur.fetchall()]
        conn.close()
        return {**session, "teller": sess["full_name"], "branch": sess["branch"], "transactions": txns}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/teller/session/close")
def teller_close_session(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess  = teller_from_token(token)
    inst  = get_institution(sess["institution"])
    session_id = sess.get("session_id")
    if not session_id:
        raise HTTPException(400, "No open session to close")
    closing_float = float(body.get("closing_float", 0))
    try:
        conn = pg_conn(inst)
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            UPDATE bp_teller_sessions
            SET closed_at = NOW(), closing_float = %s, status = 'closed'
            WHERE id = %s RETURNING *
        """, (closing_float, session_id))
        session = dict(cur.fetchone())
        conn.commit()
        conn.close()
        TELLER_SESSIONS[token]["session_id"] = None
        return {**session, "teller": sess["full_name"],
                "variance": closing_float - float(session["opening_float"])}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/teller/member-lookup")
def teller_member_lookup(q: str = "", authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess  = teller_from_token(token)
    inst  = get_institution(sess["institution"])
    if not q or len(q) < 2:
        raise HTTPException(400, "Query must be at least 2 characters")
    try:
        conn = pg_conn(inst)
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT a.theaccountid AS account_id, a.accountlabel AS label,
                   a.accountbalance AS balance, a.accountcurrency AS currency,
                   r.name_ AS owner_name, au.email AS owner_email
            FROM mappedbankaccount a
            JOIN mapperaccountholders h ON h.accountpermalink = a.theaccountid
            JOIN resourceuser r         ON r.id = h.user_c
            JOIN authuser au            ON au.username = r.name_
            WHERE a.kind NOT IN ('SETTLEMENT', 'RESERVE')
              AND (LOWER(r.name_) LIKE LOWER(%s) OR LOWER(au.email) LIKE LOWER(%s)
                OR LOWER(a.theaccountid) LIKE LOWER(%s) OR LOWER(a.accountlabel) LIKE LOWER(%s))
            ORDER BY r.name_ LIMIT 10
        """, (f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return {"results": rows}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/teller/deposit")
def teller_deposit(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess  = teller_from_token(token)
    inst  = get_institution(sess["institution"])
    account_id  = (body.get("account_id") or "").strip()
    amount      = float(body.get("amount", 0))
    description = body.get("description", "Cash deposit") or "Cash deposit"
    source      = body.get("source", "Cash") or "Cash"
    if not account_id: raise HTTPException(400, "account_id required")
    if amount <= 0:    raise HTTPException(400, "Amount must be greater than zero")
    try:
        conn = pg_conn(inst)
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT accountbalance, accountlabel FROM mappedbankaccount WHERE theaccountid = %s", (account_id,))
        account = cur.fetchone()
        if not account: raise HTTPException(404, "Account not found")
        full_desc = f"{source} — {description}" if description != "Cash deposit" else source
        cur.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance + %s WHERE theaccountid = %s",
                    (amount, account_id))
        txn_id     = f"dep-{inst['short']}-{uuid.uuid4().hex[:8]}"
        receipt_no = gen_receipt(inst["short"], sess["teller_id"])
        session_id = sess.get("session_id")
        try:
            cur.execute("""
                INSERT INTO sccu_transactions (txn_id, from_account, to_account, amount, currency, txn_type, description, status)
                VALUES (%s, 'TELLER', %s, %s, 'BZD', 'DEPOSIT', %s, 'completed')
            """, (txn_id, account_id, amount, full_desc))
        except Exception: pass
        if session_id:
            try:
                cur.execute("""
                    INSERT INTO bp_teller_transactions (session_id, teller_id, account_id, txn_type, amount, currency, description, receipt_no)
                    VALUES (%s, %s, %s, 'DEPOSIT', %s, 'BZD', %s, %s)
                """, (session_id, sess["teller_id"], account_id, amount, full_desc, receipt_no))
                cur.execute("""
                    UPDATE bp_teller_sessions
                    SET total_deposits = total_deposits + %s, transaction_count = transaction_count + 1
                    WHERE id = %s
                """, (amount, session_id))
            except Exception: pass
        conn.commit()
        cur.execute("SELECT accountbalance FROM mappedbankaccount WHERE theaccountid = %s", (account_id,))
        new_balance = cur.fetchone()["accountbalance"]
        conn.close()
        return {
            "success": True, "receipt_no": receipt_no, "transaction_id": txn_id,
            "account_id": account_id, "account_label": account["accountlabel"],
            "amount": amount, "new_balance": float(new_balance), "currency": "BZD",
            "description": full_desc, "teller": sess["full_name"],
            "branch": sess["branch"], "timestamp": datetime.utcnow().isoformat(),
        }
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/teller/withdrawal")
def teller_withdrawal(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess  = teller_from_token(token)
    inst  = get_institution(sess["institution"])
    account_id  = (body.get("account_id") or "").strip()
    amount      = float(body.get("amount", 0))
    description = body.get("description", "Cash withdrawal") or "Cash withdrawal"
    if not account_id: raise HTTPException(400, "account_id required")
    if amount <= 0:    raise HTTPException(400, "Amount must be greater than zero")
    try:
        conn = pg_conn(inst)
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT accountbalance, accountlabel FROM mappedbankaccount WHERE theaccountid = %s", (account_id,))
        account = cur.fetchone()
        if not account: raise HTTPException(404, "Account not found")
        if float(account["accountbalance"]) - amount < 100:
            raise HTTPException(400, f"Insufficient funds — BZD 100 minimum balance must be maintained")
        cur.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance - %s WHERE theaccountid = %s",
                    (amount, account_id))
        txn_id     = f"wdl-{inst['short']}-{uuid.uuid4().hex[:8]}"
        receipt_no = gen_receipt(inst["short"], sess["teller_id"])
        session_id = sess.get("session_id")
        try:
            cur.execute("""
                INSERT INTO sccu_transactions (txn_id, from_account, to_account, amount, currency, txn_type, description, status)
                VALUES (%s, %s, 'TELLER', %s, 'BZD', 'WITHDRAWAL', %s, 'completed')
            """, (txn_id, account_id, amount, description))
        except Exception: pass
        if session_id:
            try:
                cur.execute("""
                    INSERT INTO bp_teller_transactions (session_id, teller_id, account_id, txn_type, amount, currency, description, receipt_no)
                    VALUES (%s, %s, %s, 'WITHDRAWAL', %s, 'BZD', %s, %s)
                """, (session_id, sess["teller_id"], account_id, amount, description, receipt_no))
                cur.execute("""
                    UPDATE bp_teller_sessions
                    SET total_withdrawals = total_withdrawals + %s, transaction_count = transaction_count + 1
                    WHERE id = %s
                """, (amount, session_id))
            except Exception: pass
        conn.commit()
        cur.execute("SELECT accountbalance FROM mappedbankaccount WHERE theaccountid = %s", (account_id,))
        new_balance = cur.fetchone()["accountbalance"]
        conn.close()
        return {
            "success": True, "receipt_no": receipt_no, "transaction_id": txn_id,
            "account_id": account_id, "account_label": account["accountlabel"],
            "amount": amount, "new_balance": float(new_balance), "currency": "BZD",
            "description": description, "teller": sess["full_name"],
            "branch": sess["branch"], "timestamp": datetime.utcnow().isoformat(),
        }
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))

# ── Recent transactions (per institution) ──────────────────────────
@app.get("/institutions/{short}/transactions")
def get_transactions(short: str, limit: int = Query(20)):
    inst = get_institution(short)
    if not inst:
        raise HTTPException(404, "Institution not found")
    try:
        conn = pg_conn(inst)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT * FROM sccu_transactions
            ORDER BY created_at DESC LIMIT %s
        """, (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return {"institution": short, "transactions": rows, "count": len(rows)}
    except Exception as e:
        return {"institution": short, "transactions": [], "count": 0}

# ── MCP tool endpoints (AI agents call these) ───────────────────────
@app.get("/mcp/tools")
def mcp_tools():
    return {
        "tools": [
            {"name": "bp_list_institutions", "description": "List all institutions on BelizePay platform"},
            {"name": "bp_get_accounts", "description": "Get accounts for an institution", "params": ["institution"]},
            {"name": "bp_get_members", "description": "Get members for an institution", "params": ["institution"]},
            {"name": "bp_platform_stats", "description": "Get platform-wide statistics"},
            {"name": "bp_interbank_transfer", "description": "Transfer funds between institutions"},
            {"name": "bp_get_transactions", "description": "Get recent transactions for an institution", "params": ["institution"]},
        ]
    }

@app.get("/mcp/call/bp_list_institutions")
def mcp_list_institutions():
    return list_institutions()

@app.get("/mcp/call/bp_platform_stats")
def mcp_platform_stats():
    return platform_stats()

@app.get("/mcp/call/bp_get_accounts")
def mcp_get_accounts(institution: str):
    return get_accounts(institution)

@app.get("/mcp/call/bp_get_members")
def mcp_get_members(institution: str):
    return get_members(institution)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("bp_gateway:app", host="0.0.0.0", port=3002, reload=False)

