# Firebase Auth & RBAC — Migration Guide

## Why custom claims are required

Firebase Authentication only proves **who someone is** — `verifyIdToken()` confirms
a token is genuinely signed by Firebase for a specific user (`uid`, `email`).
It says nothing about **what that user is allowed to do**. This app's role model
(`ADMIN`, `ENGINEER`, `MANAGER`, `VIEWER`) doesn't exist anywhere in core Firebase
Auth — it's an application-level concept we attach to a user via a **custom
claim** (`{ role: "ADMIN" }`), set server-side with the Admin SDK
(`getAuth().setCustomUserClaims(uid, { role })`).

Once set, that claim is baked into every ID token the user's client mints from
then on, and `authenticate.middleware.js` reads it straight off the verified
token (`decodedToken.role`) — no extra database lookup per request.

## Why `verifyIdToken()` alone is not enough

`verifyIdToken()` succeeding only means "this is a real, unexpired token for a
real user in this Firebase project." A user can authenticate successfully and
still have `role: undefined` if no custom claim was ever set for them —
exactly what happened after this project's migration: the `admin@platform.com`
account existed in the new project, but custom claims are **not** part of a
user's core profile and are never copied automatically. `requireRole(...)`
then rejects every request from that user with `403`, even though
authentication is working perfectly. Authentication and authorization are two
separate steps, and only the first one migrates for free.

## How to add a new user

Firebase Auth users are scoped to a single project — creating a user in one
project never creates them in another, including during a "migration" (which
is really: point the app at a new, empty project).

```bash
node scripts/setupRoles.js <email> <ROLE>
```
Creates the user if they don't exist (default password `Password@123` —
change it after first login) and sets their role claim. Example:
```bash
node scripts/setupRoles.js jane@company.com ENGINEER
```

## How to assign roles

Same script, no arguments, bootstraps the standard 4-role test set
(`admin@platform.com` / `engineer@platform.com` / `manager@platform.com` /
`viewer@platform.com`, one per role):
```bash
node scripts/setupRoles.js
```
It's idempotent — safe to re-run any time; existing users are left alone
except for having their role claim (re-)set to the given value.

**After assigning or changing a role, the user must get a new ID token** —
either by logging out and back in, or by their session naturally refreshing.
`frontend/src/context/AuthContext.jsx` already forces this correctly: every
`onAuthStateChanged` event (including the one that fires on page load if a
session already exists) calls `firebaseUser.getIdTokenResult(true)` — the
`true` forces a live round-trip to Firebase rather than serving a cached
token, so the very next login or reload picks up the current claim. No code
change was needed here; this was already correct.

## How to migrate to a new Firebase project without breaking RBAC

1. Swap `backend/src/config/firebase/*.json` (the new project's service
   account) and `frontend/.env` (the new project's web config).
2. **Restart the backend process.** The Admin SDK reads the service account
   file once, at process start — an already-running process keeps using the
   old project's credentials indefinitely even after the file on disk
   changes. (This caused a separate "Invalid or expired token" incident
   during this migration — see the auth investigation for that root cause.)
3. Run `node scripts/setupRoles.js` to recreate the standard users with
   correct role claims in the new project — custom claims never carry over,
   even if the same email/uid happens to exist.
4. If migrating real (non-test) users, use `setupRoles.js <email> <ROLE>` per
   user, or extend the script's `DEFAULT_USERS` list.
5. Verify with the same technique used here: mint a token for each role and
   confirm the expected 200/403 pattern against a representative endpoint
   from each tier (any-authenticated, `WRITE_ROLES`, `ADMIN`-only).
