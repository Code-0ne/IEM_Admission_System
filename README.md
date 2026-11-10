# IEM Admissions

An admissions portal with a Vite/React frontend and an Express API.

## Requirements

- Node.js and npm
- Windows PowerShell (the all-in-one launcher is `run-all.ps1`)
- Supabase credentials for persistent database-backed operation
- MongoDB is used for uploaded document storage

## Quick start

1. Install dependencies from the project root:

   ```powershell
   npm install --prefix .\server
   npm install --prefix .\client
   ```

2. Create `server\.env` from the template and fill in the credentials needed for your setup:

   ```powershell
   Copy-Item .\server\.env.example .\server\.env
   ```

   Do not commit or share `server\.env`. The example file lists the available Supabase, MongoDB, session, email, payment-gateway, and LLM settings.

3. From the project root, run the API and frontend with one command:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\run-all.ps1
   ```

   This opens a separate terminal for each service. Stop each server with **Ctrl+C** in its terminal. The launcher checks required ports first and will report if one is occupied.

## Local URLs

| Service | URL |
|---|---|
| Frontend | <http://localhost:5175> |
| API health | <http://localhost:5000/api/health> |

The frontend proxies `/api` requests to the API on port `5000`.

## Running services individually

Run each command from the project root in its own terminal:

```powershell
npm run dev --prefix .\server
npm run dev --prefix .\client
```

## Tests and production builds

```powershell
npm test --prefix .\server
npm run build --prefix .\client
```

## Database setup

The initial schema is in `server\src\db\migrations\001_initial_schema.sql`. The `npm run migrate --prefix .\server` command prepares/loads the schema SQL; apply that SQL through the Supabase SQL editor or your database administration workflow. The API can use an in-memory fallback for local/test operation, but that data is not persistent.

## Payment note

The current **Pay now** action is a development-only simulated payment. It records a demo receipt and updates an approved application, but does not transfer money or connect to a real payment gateway. Configure and implement server-side gateway verification before accepting real payments.

## Account verification

Email OTP verification is not required for registration. Newly created accounts can sign in immediately. OTP remains in use for password recovery.
