# AWS Cognito Setup Guide (First-Time AWS User)

## Overview

This guide walks through creating an AWS account and setting up a Cognito User Pool for the expense splitter app. This is the only AWS resource needed before implementing the login page. Other AWS resources (ECS, RDS, ECR, etc.) will be added later when containerizing and deploying the app.

---

## Step 1: Create an AWS Account

1. Go to [https://aws.amazon.com](https://aws.amazon.com) and click **Create an AWS Account**
2. Enter your email address and choose an account name (e.g. "weeven")
3. Choose **Personal** account type
4. Enter payment info (required, but Cognito's free tier covers 50,000 monthly active users — you won't be charged for normal use)
5. Complete identity verification (phone call or SMS)
6. Choose the **Free** support plan
7. Sign in to the **AWS Management Console**

---

## Step 2: Set Up a Budget Alert

Since this is a new AWS account, it's worth setting up a billing alert before doing anything else so you're never surprised by a charge.

1. In the AWS Console search bar, type **Billing** and click **Billing and Cost Management**
2. In the left sidebar, click **Budgets**
3. Click **Create budget**
4. Select **Use a template** → choose **Zero spend budget**
   - This alerts you the moment any charge above $0.01 appears (catches anything outside the free tier)
   - Click **Next**, enter your email, and click **Create budget**
5. Optionally, create a second budget with a hard ceiling:
   - Choose **Monthly cost budget**
   - Set amount to e.g. **$10** (a safe ceiling while the app is small)
   - Add your email as an alert recipient at 80% and 100% of the budget
   - Click **Create budget**

---

## Step 4: Choose a Region

All AWS resources you create must live in the same region. Pick one close to you and stick with it throughout all future AWS setup.

1. Navigate to Cognito — the region dropdown becomes active once you're on a regional service page
2. The console may default to **US East (Ohio) — us-east-2**, which is fine to use
3. Whatever region is selected here, use it consistently for all future AWS resources (RDS, ECS, ECR, etc.)
4. Note your region — you'll need it as an env var: `AWS_REGION=us-east-2` (or whichever you chose)

---

## Step 5: Create a Cognito User Pool

1. In the AWS Console search bar, type **Cognito** and click it
2. Click **Create user pool**

### Authentication providers
- Sign-in options: check **Email** only
- Click **Next**

### Security requirements
- Password policy: leave as default (Cognito defaults are fine)
- Multi-factor authentication: select **No MFA** (can add later)
- User account recovery: leave **Enable self-service account recovery** checked, email selected
- Click **Next**

### Sign-up experience
- Leave **Enable self-registration** checked (allows users to sign up themselves)
- Required attributes: make sure **email** is checked
- Click **Next**

### Message delivery
- Email provider: select **Send email with Cognito** (free, no extra setup)
  - Note: for production scale you'd switch to SES, but Cognito's built-in is fine to start
- Click **Next**

### Integrate your app
- User pool name: `expense-splitter-pool`
- **Uncheck** "Use the Cognito Hosted UI" — you'll build your own login page
- App type: **Single-page application (SPA)**
- App client name: `expense-splitter-web`
- Client secret: **Don't generate** (SPAs can't keep secrets)
- Click **Next**

### Review and create
- Review the settings and click **Create user pool**

---

## Step 6: Note Your Credentials

After the pool is created, you'll land on the User Pool detail page. Find and save these values — you'll need them as env vars:

| Value | Where to find it | Env var name |
|---|---|---|
| User Pool ID | Overview tab, e.g. `us-east-1_AbCdEfGhI` | `COGNITO_USER_POOL_ID` |
| Region | Same as what you chose in Step 2 | `AWS_REGION` |
| Client ID | **App clients** tab → click your client → App client ID | `COGNITO_CLIENT_ID` |

---

## Step 7: Create a Test User

Before writing any code you can create a test user to verify the pool works:

1. On your User Pool page, go to the **Users** tab
2. Click **Create user**
3. Invitation message: **Don't send an invitation**
4. Enter an email address you control
5. Temporary password: enter something (e.g. `TempPass1!`)
6. Click **Create user**

You'll use this account to test the login flow once the login page is built.

---

## What's Next (Later — Not Now)

These AWS resources will be added when containerizing and deploying:

| Resource | Purpose |
|---|---|
| **ECR** (Elastic Container Registry) | Store Docker images |
| **ECS** (Elastic Container Service) | Run containers |
| **RDS** (PostgreSQL) | Managed database |
| **ALB** (Application Load Balancer) | Route traffic to containers |
| **IAM roles** | Permissions for GitHub Actions → ECR/ECS |
| **Secrets Manager** | Store DB credentials, Cognito config |

The Cognito User Pool created here will be reused as-is when the full deployment is set up — no changes needed to it later.
