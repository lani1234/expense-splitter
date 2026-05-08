# Add AWS Cognito Config to Railway and Vercel

## Overview

With Cognito authentication added, the deployed app needs the Cognito env vars configured in Railway (backend) and Vercel (frontend) before the login will work in production.

---

## Railway (Backend)

In your Railway project, go to your backend service → **Variables** and add:

| Variable | Value |
|---|---|
| `AWS_REGION` | `us-east-2` |
| `COGNITO_USER_POOL_ID` | `us-east-2_wkz7j3NTS` |

These are read by `application.properties` via:
```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://cognito-idp.${AWS_REGION:us-east-2}.amazonaws.com/${COGNITO_USER_POOL_ID:us-east-2_wkz7j3NTS}
```

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
