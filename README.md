# Sensu Community Credit Union — sccu-platform

BelizePay institution frontend for SCCU.

## Stack
- React + Vite · Port 5173
- Cloudflare Tunnel → sccu.aonedatasolution.com
- API: https://api.aonedatasolution.com

## Portals
| Portal | URL |
|---|---|
| Public | https://sccu.aonedatasolution.com |
| Member | https://sccu.aonedatasolution.com/member |
| Teller | https://sccu.aonedatasolution.com/teller |
| Admin  | https://sccu.aonedatasolution.com/admin |

## Setup
```bash
npm install && npm run dev
```

## Customise
Edit `src/institution.config.js` only.

## Key parameters
| | |
|---|---|
| SHORT | sccu |
| ROUTING | bz.sccu |
| OBP port | 8080 |
| PG port | 5432 |
| Vite port | 5173 |
