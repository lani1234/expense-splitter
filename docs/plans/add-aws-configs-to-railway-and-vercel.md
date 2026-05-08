# Add AWS Cognito Config to Railway and Vercel

## Overview

With Cognito authentication added, the deployed app needs the Cognito env vars configured in Railway (backend) and Vercel (frontend) before the login will work in production.

---

## Railway (Backend)

In your Railway project, go to your backend service → **Variables** and add:

| Variable | Value |
|---|---|
| `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI` | `https://cognito-idp.us-east-2.amazonaws.com/us-east-2_wkz7j3NTS/.well-known/jwks.json` |

> Note: `application.properties` is not tracked in git (it contains credentials), so the full URI must be set directly as an env var in Railway. Spring Boot automatically maps `SPRING_*` uppercase env vars to their corresponding properties.
>
> If you previously added `AWS_REGION` and `COGNITO_USER_POOL_ID` to Railway, you can remove them — they are no longer needed.

---

## Vercel (Frontend)

In your Vercel project, go to **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `VITE_COGNITO_USER_POOL_ID` | `us-east-2_wkz7j3NTS` |
| `VITE_COGNITO_CLIENT_ID` | *(your App Client ID from Cognito)* |
| `VITE_COGNITO_REGION` | `us-east-2` |

After adding variables in Vercel, you must **redeploy** for them to take effect.

---

## Supabase

No changes needed — the `user_id` column already exists on the `template` table.
