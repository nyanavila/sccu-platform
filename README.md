# Sensu Community Credit Union — sccu-platform

BelizePay institution frontend for Sensu Community Credit Union.

## Stack
- React + Vite (dev server, port 5173)
- Served via Cloudflare Tunnel → sccu.aonedatasolution.com
- API: https://api.aonedatasolution.com (BelizePay gateway)

## Portals
| Portal | URL |
|---|---|
| Public site | https://sccu.aonedatasolution.com |
| Member portal | https://sccu.aonedatasolution.com/member |
| Teller portal | https://sccu.aonedatasolution.com/teller |
| Admin portal | https://sccu.aonedatasolution.com/admin |

## Start dev server
```bash
npm install
npm run dev
```

## Customise
Edit `src/institution.config.js` only. All branding, products,
contacts, and thresholds are controlled from that single file.

## Institution parameters
| Parameter | Value |
|---|---|
| SHORT | sccu |
| ROUTING | bz.sccu |
| OBP port | 8080 |
| PostgreSQL port | 5432 |
| Vite port | 5173 |

## Credentials (rotate before go-live)
- Admin: nyanavila_20 / Sccu2026#Admin
- Teller 1: teller1 / Sccu2026#Teller1
- Teller 2: teller2 / Sccu2026#Teller2
