from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import psycopg2.extras
import httpx
import secrets
import string

app = FastAPI(title="SCCU API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def add_ngrok_header(request, call_next):
    response = await call_next(request)
    response.headers["ngrok-skip-browser-warning"] = "true"
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

DB = {
    "host": "localhost",
    "port": 5432,
    "database": "sccu",
    "user": "sccu_admin",
    "password": "Sccu2026#DB",
}

OBP = "http://127.0.0.1:8080"
BANK_ID = "93dba562-eb4f-4a69-949f-0fe9bb6a5644"
CONSUMER_KEY = "sccu-key-2026"
ADMIN_USER = "nyanavila_20"
ADMIN_PASS = "Sccu2026#Admin"

def db():
    return psycopg2.connect(**DB)

def generate_password():
    chars = string.ascii_letters + string.digits
    return "Sccu2026#" + "".join(secrets.choice(chars) for _ in range(8))

async def get_admin_token():
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{OBP}/my/logins/direct",
            headers={
                "Content-Type": "application/json",
                "Authorization": f'DirectLogin username="{ADMIN_USER}",password="{ADMIN_PASS}",consumer_key="{CONSUMER_KEY}"',
            },
        )
        text = r.text
        if not text:
            raise HTTPException(status_code=500, detail="OBP returned empty response for admin login")
        data = r.json()
        if "token" not in data:
            raise HTTPException(status_code=500, detail=f"Admin token failed: {data}")
        return data["token"]

@app.get("/health")
def health():
    return {"status": "live", "service": "SCCU API", "bank": "bz.sccu"}

@app.post("/auth/login")
async def login(body: dict):
    username = body.get("username")
    password = body.get("password")
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{OBP}/my/logins/direct",
            headers={
                "Content-Type": "application/json",
                "Authorization": f'DirectLogin username="{username}",password="{password}",consumer_key="{CONSUMER_KEY}"',
            },
        )
    data = r.json()
    if "token" not in data:
        raise HTTPException(status_code=401, detail=data.get("message", "Login failed"))
    return {"token": data["token"], "username": username}

@app.get("/accounts")
def get_accounts():
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT
            a.theaccountid as id,
            a.accountlabel as label,
            a.accountbalance as balance,
            a.accountcurrency as currency,
            a.kind as type,
            a.accountnumber as number,
            r.name_ as owner_name,
            r.userid_ as owner_id,
            au.email as owner_email
        FROM mappedbankaccount a
        LEFT JOIN mapperaccountholders h ON h.accountpermalink = a.theaccountid
        LEFT JOIN resourceuser r ON r.id = h.user_c
        LEFT JOIN authuser au ON au.username = r.name_
        WHERE a.bank != 'obp1'
        AND a.kind != 'SETTLEMENT'
        ORDER BY a.accountlabel
    """)
    rows = cur.fetchall()
    conn.close()
    return {"accounts": [dict(r) for r in rows]}

@app.get("/accounts/{account_id}")
def get_account(account_id: str):
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT
            a.theaccountid as id,
            a.accountlabel as label,
            a.accountbalance as balance,
            a.accountcurrency as currency,
            a.kind as type,
            a.accountnumber as number,
            r.name_ as owner_name,
            r.userid_ as owner_id,
            au.email as owner_email
        FROM mappedbankaccount a
        LEFT JOIN mapperaccountholders h ON h.accountpermalink = a.theaccountid
        LEFT JOIN resourceuser r ON r.id = h.user_c
        LEFT JOIN authuser au ON au.username = r.name_
        WHERE a.theaccountid = %s
    """, (account_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Account not found")
    return dict(row)

@app.get("/members")
def get_members():
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT r.userid_ as id, r.id as db_id, r.name_ as username,
               a.email, a.validated, a.createdat as joined
        FROM resourceuser r
        JOIN authuser a ON a.username = r.name_
        WHERE r.name_ != 'nyanavila_20'
        AND r.name_ NOT LIKE 'test%'
        ORDER BY r.id
    """)
    rows = cur.fetchall()
    conn.close()
    return {"members": [dict(r) for r in rows]}

@app.get("/members/{user_id}")
def get_member(user_id: str):
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT r.userid_ as id, r.id as db_id, r.name_ as username,
               a.email, a.validated, a.createdat as joined
        FROM resourceuser r
        JOIN authuser a ON a.username = r.name_
        WHERE r.userid_ = %s
    """, (user_id,))
    member = cur.fetchone()
    if not member:
        conn.close()
        raise HTTPException(status_code=404, detail="Member not found")
    cur.execute("""
        SELECT a.theaccountid as id, a.accountlabel as label,
               a.accountbalance as balance, a.accountcurrency as currency
        FROM mappedbankaccount a
        JOIN mapperaccountholders h ON h.accountpermalink = a.theaccountid
        JOIN resourceuser r ON r.id = h.user_c
        WHERE r.userid_ = %s AND a.kind != 'SETTLEMENT'
    """, (user_id,))
    accounts = cur.fetchall()
    conn.close()
    result = dict(member)
    result["accounts"] = [dict(a) for a in accounts]
    return result

@app.get("/stats")
def get_stats():
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT COUNT(*) as total_accounts,
               SUM(accountbalance) as total_assets,
               AVG(accountbalance) as avg_balance,
               MAX(accountbalance) as max_balance,
               MIN(accountbalance) as min_balance,
               accountcurrency as currency
        FROM mappedbankaccount
        WHERE bank != 'obp1' AND kind != 'SETTLEMENT'
        GROUP BY accountcurrency
    """)
    stats = cur.fetchone()
    cur.execute("""
        SELECT COUNT(*) as members FROM resourceuser
        WHERE name_ != 'nyanavila_20' AND name_ NOT LIKE 'test%'
    """)
    members = cur.fetchone()
    conn.close()
    return {**dict(stats), **dict(members)}

@app.post("/members")
async def create_member(body: dict):
    first_name  = body.get("first_name", "").strip()
    last_name   = body.get("last_name", "").strip()
    email       = body.get("email", "").strip()
    member_type = body.get("member_type", "Community")
    deposit     = float(body.get("initial_deposit", 0))

    if not all([first_name, last_name, email]):
        raise HTTPException(status_code=400, detail="first_name, last_name and email are required")

    password = body.get("password") or generate_password()

    # Step 1 — get admin token
    admin_token = await get_admin_token()

    # Step 2 — create user in OBP
    async with httpx.AsyncClient() as client:
        user_r = await client.post(
            f"{OBP}/obp/v6.0.0/users",
            headers={
                "Content-Type": "application/json",
                "Authorization": f'DirectLogin token="{admin_token}"',
            },
            json={
                "email": email,
                "username": email,
                "password": password,
                "first_name": first_name,
                "last_name": last_name,
            },
        )
        if not user_r.text:
            raise HTTPException(status_code=500, detail="OBP returned empty response for user creation")
        user_data = user_r.json()
        if "user_id" not in user_data:
            raise HTTPException(status_code=400, detail=f"User creation failed: {user_data.get('message', user_data)}")
        user_id = user_data["user_id"]

    # Step 3 — validate user in DB
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("UPDATE authuser SET validated = true WHERE username = %s", (email,))

    # Step 4 — get resourceuser db id
    cur.execute("SELECT id FROM resourceuser WHERE userid_ = %s", (user_id,))
    ru = cur.fetchone()
    if not ru:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail="resourceuser not found after creation")
    ru_db_id = ru["id"]

    # Step 5 — build account ID and number
    first_slug = first_name.lower().replace(" ", "-")
    last_slug  = last_name.lower().replace(" ", "-")
    account_id = f"sccu-savings-{first_slug}-{last_slug}-001"
    account_number = f"SCCU-BZ-{ru_db_id}-{first_slug[:3].upper()}{last_slug[:3].upper()}"
    label = f"{first_name} {last_name} Share Savings"

    # Step 6 — create account via OBP
    async with httpx.AsyncClient() as client:
        acc_r = await client.put(
            f"{OBP}/obp/v5.1.0/banks/{BANK_ID}/accounts/{account_id}",
            headers={
                "Content-Type": "application/json",
                "Authorization": f'DirectLogin token="{admin_token}"',
            },
            json={
                "user_id": user_id,
                "label": label,
                "product_code": "SHARE_SAVINGS",
                "balance": {"currency": "BZD", "amount": "0.00"},
                "branch_id": "SCCU-MAIN",
                "account_routings": [{"scheme": "IBAN", "address": account_number}],
            },
        )
        if not acc_r.text:
            raise HTTPException(status_code=500, detail="OBP returned empty response for account creation")
        acc_data = acc_r.json()
        if "account_id" not in acc_data and "id" not in acc_data:
            raise HTTPException(status_code=400, detail=f"Account creation failed: {acc_data.get('message', acc_data)}")

    # Step 7 — grant owner view + admin access
    cur.execute("""
        INSERT INTO accountaccess
          (consumer_id, bank_id, account_id, view_id, user_fk, updatedat, createdat)
        VALUES ('ALL_CONSUMERS', %s, %s, 'owner', %s, NOW(), NOW())
        ON CONFLICT DO NOTHING
    """, (BANK_ID, account_id, ru_db_id))

    cur.execute("""
        INSERT INTO accountaccess
          (consumer_id, bank_id, account_id, view_id, user_fk, updatedat, createdat)
        VALUES ('ALL_CONSUMERS', %s, %s, 'owner', 1, NOW(), NOW())
        ON CONFLICT DO NOTHING
    """, (BANK_ID, account_id))

    # Step 8 — set account holder (delete first to prevent duplicates)
    cur.execute(
        "DELETE FROM mapperaccountholders WHERE accountpermalink = %s",
        (account_id,)
    )
    cur.execute("""
        INSERT INTO mapperaccountholders
          (user_c, accountbankpermalink, accountpermalink)
        VALUES (%s, %s, %s)
    """, (ru_db_id, BANK_ID, account_id))

    # Step 9 — set initial deposit
    if deposit > 0:
        cur.execute("""
            UPDATE mappedbankaccount
            SET accountbalance = %s
            WHERE theaccountid = %s
        """, (deposit, account_id))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "member": {
            "user_id": user_id,
            "email": email,
            "full_name": f"{first_name} {last_name}",
            "password": password,
            "account_id": account_id,
            "account_number": account_number,
            "initial_balance": deposit,
            "currency": "BZD",
        }
    }

from datetime import datetime

@app.post("/transactions")
async def post_transaction(body: dict):
    from_account = body.get("from_account_id")
    to_account   = body.get("to_account_id")
    amount       = float(body.get("amount", 0))
    description  = body.get("description", "Member transfer")
    txn_type     = body.get("type", "TRANSFER")

    if not from_account or not to_account:
        raise HTTPException(status_code=400, detail="from_account_id and to_account_id are required")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    if from_account == to_account:
        raise HTTPException(status_code=400, detail="Cannot transfer to same account")

    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Check sender balance
    cur.execute("SELECT accountbalance, accountlabel FROM mappedbankaccount WHERE theaccountid = %s", (from_account,))
    sender = cur.fetchone()
    if not sender:
        conn.close()
        raise HTTPException(status_code=404, detail="Sender account not found")
    if sender["accountbalance"] < amount:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Insufficient funds. Balance: BZD {sender['accountbalance']:.2f}")

    # Check receiver exists
    cur.execute("SELECT accountbalance, accountlabel FROM mappedbankaccount WHERE theaccountid = %s", (to_account,))
    receiver = cur.fetchone()
    if not receiver:
        conn.close()
        raise HTTPException(status_code=404, detail="Receiver account not found")

    # Debit sender
    cur.execute("""
        UPDATE mappedbankaccount 
        SET accountbalance = accountbalance - %s,
            accountlastupdate = NOW()
        WHERE theaccountid = %s
    """, (amount, from_account))

    # Credit receiver
    cur.execute("""
        UPDATE mappedbankaccount
        SET accountbalance = accountbalance + %s,
            accountlastupdate = NOW()
        WHERE theaccountid = %s
    """, (amount, to_account))

    # Record transaction in sccu ledger
    txn_id = f"txn-{from_account[:8]}-{int(datetime.now().timestamp())}"
    cur.execute("""
        INSERT INTO sccu_transactions
          (txn_id, from_account, to_account, amount, currency,
           txn_type, description, status)
        VALUES (%s, %s, %s, %s, 'BZD', %s, %s, 'completed')
        ON CONFLICT DO NOTHING
    """, (txn_id, from_account, to_account, amount, txn_type, description))

    conn.commit()

    # Return updated balances
    cur.execute("SELECT accountbalance FROM mappedbankaccount WHERE theaccountid = %s", (from_account,))
    new_sender_bal = cur.fetchone()["accountbalance"]
    cur.execute("SELECT accountbalance FROM mappedbankaccount WHERE theaccountid = %s", (to_account,))
    new_receiver_bal = cur.fetchone()["accountbalance"]
    conn.close()

    return {
        "success": True,
        "transaction_id": txn_id,
        "from_account": from_account,
        "to_account": to_account,
        "amount": amount,
        "currency": "BZD",
        "description": description,
        "sender_new_balance": new_sender_bal,
        "receiver_new_balance": new_receiver_bal,
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/transactions/{account_id}")
def get_transactions(account_id: str):
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT
            t.txn_id,
            t.txn_type as type,
            t.description,
            t.amount,
            t.currency,
            t.status,
            t.created_at,
            CASE
                WHEN t.to_account = %s THEN 'credit'
                ELSE 'debit'
            END as direction,
            CASE
                WHEN t.to_account = %s THEN t.amount
                ELSE -t.amount
            END as net_amount,
            fa.accountlabel as from_label,
            ta.accountlabel as to_label
        FROM sccu_transactions t
        LEFT JOIN mappedbankaccount fa ON fa.theaccountid = t.from_account
        LEFT JOIN mappedbankaccount ta ON ta.theaccountid = t.to_account
        WHERE t.from_account = %s OR t.to_account = %s
        ORDER BY t.created_at DESC
        LIMIT 50
    """, (account_id, account_id, account_id, account_id))
    rows = cur.fetchall()
    conn.close()
    return {"account_id": account_id, "transactions": [dict(r) for r in rows]}

# ═══════════════════════════════════════════════════════════
# TELLER MODULE
# ═══════════════════════════════════════════════════════════
import secrets
from datetime import datetime

TELLER_SESSIONS = {}

def teller_from_token(token: str):
    s = TELLER_SESSIONS.get(token)
    if not s:
        raise HTTPException(status_code=401, detail="Invalid or expired teller session")
    return s

def gen_receipt(teller_id: int) -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    rand = secrets.token_hex(3).upper()
    return f"RCP-{teller_id:02d}-{ts}-{rand}"

@app.post("/teller/login")
def teller_login(body: dict):
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, username, full_name, branch, active, password_hash FROM sccu_tellers WHERE username = %s", (username,))
    teller = cur.fetchone()
    conn.close()
    if not teller:
        raise HTTPException(status_code=401, detail="Teller not found")
    if not teller["active"]:
        raise HTTPException(status_code=403, detail="Teller account is inactive")
    if teller["password_hash"] != password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = secrets.token_hex(32)
    TELLER_SESSIONS[token] = {"teller_id": teller["id"], "username": teller["username"], "full_name": teller["full_name"], "branch": teller["branch"], "opened_at": datetime.now().isoformat(), "session_id": None, "float": 0.0}
    return {"token": token, "teller_id": teller["id"], "full_name": teller["full_name"], "branch": teller["branch"]}

@app.post("/teller/session/open")
def teller_open_session(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess = teller_from_token(token)
    opening_float = float(body.get("opening_float", 0))
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("INSERT INTO bp_teller_sessions (teller_id, opening_float, status) VALUES (%s, %s, 'open') RETURNING id, opened_at", (sess["teller_id"], opening_float))
    row = cur.fetchone()
    conn.commit()
    conn.close()
    TELLER_SESSIONS[token]["session_id"] = row["id"]
    TELLER_SESSIONS[token]["float"] = opening_float
    return {"session_id": row["id"], "teller_id": sess["teller_id"], "full_name": sess["full_name"], "branch": sess["branch"], "opening_float": opening_float, "opened_at": row["opened_at"].isoformat(), "status": "open"}

@app.post("/teller/deposit")
def teller_deposit(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess = teller_from_token(token)
    account_id = (body.get("account_id") or "").strip()
    amount = float(body.get("amount", 0))
    description = body.get("description", "Cash deposit").strip() or "Cash deposit"
    source = body.get("source", "Cash").strip() or "Cash"
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT accountbalance, accountlabel FROM mappedbankaccount WHERE theaccountid = %s", (account_id,))
    account = cur.fetchone()
    if not account:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")
    cur.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance + %s, accountlastupdate = NOW() WHERE theaccountid = %s", (amount, account_id))
    txn_id = f"dep-{account_id[:8]}-{int(datetime.now().timestamp())}"
    full_desc = f"{source} — {description}" if description != "Cash deposit" else source
    cur.execute("INSERT INTO sccu_transactions (txn_id, from_account, to_account, amount, currency, txn_type, description, status) VALUES (%s, 'TELLER', %s, %s, 'BZD', 'DEPOSIT', %s, 'completed')", (txn_id, account_id, amount, full_desc))
    receipt_no = gen_receipt(sess["teller_id"])
    session_id = sess.get("session_id")
    if session_id:
        cur.execute("INSERT INTO bp_teller_transactions (session_id, teller_id, account_id, txn_type, amount, currency, description, receipt_no) VALUES (%s, %s, %s, 'DEPOSIT', %s, 'BZD', %s, %s)", (session_id, sess["teller_id"], account_id, amount, full_desc, receipt_no))
        cur.execute("UPDATE bp_teller_sessions SET total_deposits = total_deposits + %s, transaction_count = transaction_count + 1 WHERE id = %s", (amount, session_id))
    conn.commit()
    cur.execute("SELECT accountbalance FROM mappedbankaccount WHERE theaccountid = %s", (account_id,))
    new_balance = cur.fetchone()["accountbalance"]
    conn.close()
    return {"success": True, "receipt_no": receipt_no, "transaction_id": txn_id, "account_id": account_id, "account_label": account["accountlabel"], "amount": amount, "new_balance": float(new_balance), "currency": "BZD", "description": full_desc, "teller": sess["full_name"], "branch": sess["branch"], "timestamp": datetime.now().isoformat()}

@app.post("/teller/withdrawal")
def teller_withdrawal(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess = teller_from_token(token)
    account_id = (body.get("account_id") or "").strip()
    amount = float(body.get("amount", 0))
    description = body.get("description", "Cash withdrawal").strip() or "Cash withdrawal"
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT accountbalance, accountlabel FROM mappedbankaccount WHERE theaccountid = %s", (account_id,))
    account = cur.fetchone()
    if not account:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")
    if float(account["accountbalance"]) < amount:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Insufficient funds. Balance: BZD {account['accountbalance']:.2f}")
    cur.execute("UPDATE mappedbankaccount SET accountbalance = accountbalance - %s, accountlastupdate = NOW() WHERE theaccountid = %s", (amount, account_id))
    txn_id = f"wdl-{account_id[:8]}-{int(datetime.now().timestamp())}"
    cur.execute("INSERT INTO sccu_transactions (txn_id, from_account, to_account, amount, currency, txn_type, description, status) VALUES (%s, %s, 'TELLER', %s, 'BZD', 'WITHDRAWAL', %s, 'completed')", (txn_id, account_id, amount, description))
    receipt_no = gen_receipt(sess["teller_id"])
    session_id = sess.get("session_id")
    if session_id:
        cur.execute("INSERT INTO bp_teller_transactions (session_id, teller_id, account_id, txn_type, amount, currency, description, receipt_no) VALUES (%s, %s, %s, 'WITHDRAWAL', %s, 'BZD', %s, %s)", (session_id, sess["teller_id"], account_id, amount, description, receipt_no))
        cur.execute("UPDATE bp_teller_sessions SET total_withdrawals = total_withdrawals + %s, transaction_count = transaction_count + 1 WHERE id = %s", (amount, session_id))
    conn.commit()
    cur.execute("SELECT accountbalance FROM mappedbankaccount WHERE theaccountid = %s", (account_id,))
    new_balance = cur.fetchone()["accountbalance"]
    conn.close()
    return {"success": True, "receipt_no": receipt_no, "transaction_id": txn_id, "account_id": account_id, "account_label": account["accountlabel"], "amount": amount, "new_balance": float(new_balance), "currency": "BZD", "description": description, "teller": sess["full_name"], "branch": sess["branch"], "timestamp": datetime.now().isoformat()}

@app.get("/teller/member-lookup")
def teller_member_lookup(q: str = "", authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    teller_from_token(token)
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT a.theaccountid AS account_id, a.accountlabel AS label, a.accountbalance AS balance, a.accountcurrency AS currency, r.name_ AS owner_name, au.email AS owner_email
        FROM mappedbankaccount a
        JOIN mapperaccountholders h ON h.accountpermalink = a.theaccountid
        JOIN resourceuser r ON r.id = h.user_c
        JOIN authuser au ON au.username = r.name_
        WHERE a.bank != 'obp1' AND a.kind != 'SETTLEMENT'
        AND (LOWER(r.name_) LIKE LOWER(%s) OR LOWER(au.email) LIKE LOWER(%s) OR LOWER(a.theaccountid) LIKE LOWER(%s) OR LOWER(a.accountlabel) LIKE LOWER(%s))
        ORDER BY r.name_ LIMIT 10
    """, (f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"))
    rows = cur.fetchall()
    conn.close()
    return {"results": [dict(r) for r in rows]}

@app.get("/teller/session/summary")
def teller_session_summary(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess = teller_from_token(token)
    session_id = sess.get("session_id")
    if not session_id:
        return {"session_id": None, "teller": sess["full_name"], "branch": sess["branch"], "opened_at": sess["opened_at"], "status": "no_session", "opening_float": 0, "total_deposits": 0, "total_withdrawals": 0, "transaction_count": 0, "transactions": []}
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, teller_id, opened_at, closing_float, opening_float, total_deposits, total_withdrawals, transaction_count, status FROM bp_teller_sessions WHERE id = %s", (session_id,))
    session = cur.fetchone()
    cur.execute("""
        SELECT bt.receipt_no, bt.txn_type, bt.amount, bt.currency, bt.description, bt.created_at, a.accountlabel AS account_label
        FROM bp_teller_transactions bt
        JOIN mappedbankaccount a ON a.theaccountid = bt.account_id
        WHERE bt.session_id = %s ORDER BY bt.created_at DESC
    """, (session_id,))
    transactions = cur.fetchall()
    conn.close()
    return {**dict(session), "teller": sess["full_name"], "branch": sess["branch"], "transactions": [dict(t) for t in transactions]}

@app.post("/teller/session/close")
def teller_close_session(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    sess = teller_from_token(token)
    session_id = sess.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="No open session to close")
    closing_float = float(body.get("closing_float", 0))
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("UPDATE bp_teller_sessions SET closed_at = NOW(), closing_float = %s, status = 'closed' WHERE id = %s RETURNING *", (closing_float, session_id))
    session = cur.fetchone()
    conn.commit()
    conn.close()
    TELLER_SESSIONS[token]["session_id"] = None
    return {**dict(session), "teller": sess["full_name"], "variance": closing_float - float(session["opening_float"])}

@app.post("/teller/logout")
def teller_logout(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    TELLER_SESSIONS.pop(token, None)
    return {"success": True}
