from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import psycopg2.extras
import httpx

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
CONSUMER_KEY = "sccu-key-2026"

def db():
    return psycopg2.connect(**DB)

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
        SELECT
            r.userid_ as id,
            r.id as db_id,
            r.name_ as username,
            a.email as email,
            a.validated as validated,
            a.createdat as joined
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
