from fastapi import FastAPI, HTTPException
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
)

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
