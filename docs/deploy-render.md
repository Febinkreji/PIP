# Deploying the Backend to Render

The backend (`backend/`) is a standard Express API — deploy it on Render as a **Web Service**.

## 1. Create the service

1. In the [Render dashboard](https://dashboard.render.com), click **New → Web Service** and connect this GitHub repository.
2. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (runs `node src/server.js`)
   - **Instance Type:** Free is sufficient for a demo

## 2. Environment variables

Add these under the service's **Environment** tab:

| Variable | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | The Firebase service account JSON — see below |
| `CORS_ORIGINS` | Your deployed frontend origin(s), comma-separated, e.g. `https://pip-app.vercel.app` |
| `PORT` | Leave unset — Render injects this automatically and the app already reads `process.env.PORT` |

Render does not let you commit or deploy the service account file itself (it's git-ignored, and shouldn't be in the repo either way), so the credential is passed as an environment variable instead:

1. Open the JSON key file you downloaded from **Firebase Console → Project Settings → Service Accounts**.
2. Either:
   - Paste the **entire raw JSON** as the value of `FIREBASE_SERVICE_ACCOUNT`, or
   - Base64-encode it first (`base64 -w0 service-account.json` on Linux/macOS, or `[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))` in PowerShell) and paste the resulting string instead.

`backend/src/config/firebase/firebase.js` accepts either form automatically — it checks whether the value starts with `{` and falls back to base64-decoding it if not.

## 3. Health check

Render can use the existing health endpoint to monitor the service:

- **Health Check Path:** `/health`

This returns `{ status: 'OK', service: 'PIP (Payment Incident Platform) Backend', version: '1.0.0' }` with a `200` when the service is up.

## 4. Deploy

Click **Create Web Service**. Render builds and starts the service, then gives you a URL like `https://pip-backend.onrender.com` — this is the value to put in the frontend's `VITE_API_BASE_URL` (see [deploy-vercel.md](deploy-vercel.md)).

## Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| Service crashes on boot with "Firebase service account not found" | `FIREBASE_SERVICE_ACCOUNT` not set | Set it in the Environment tab (see step 2) and redeploy |
| Service crashes with a JSON parse error on boot | Service account value truncated or malformed when pasted | Re-paste carefully, or use the base64-encoded form to avoid whitespace/quote issues |
| Frontend requests fail with a CORS error in the browser console | `CORS_ORIGINS` missing the frontend's exact origin | Set `CORS_ORIGINS` to the exact Vercel URL(s), no trailing slash, redeploy |
| First request after idle is very slow | Free-tier Render services spin down when idle | Expected on the free tier; upgrade the instance type if this matters for the demo |
| 401 on every authenticated request | Frontend `VITE_API_BASE_URL` points at the wrong backend, or Firebase project mismatch between frontend/backend | Confirm both frontend and backend point at the same Firebase project |
