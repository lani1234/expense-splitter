# Brainstorming: Guest / Portfolio User Flow

## Goal

When someone visits the app (e.g. a recruiter, friend, or family member), they should be able to understand what the app does and explore it without needing to create an account or be handed a walkthrough. Authentication is still required to create/manage real data.

---

## Chosen Direction: Explainer Login Page + Read-Only Guest Access

### Login Page (new homepage)

The login page doubles as a landing page. It should include:

- Brief description of what weeven is: "A tool for tracking and splitting shared expenses between people. Define your expense categories and participants once as a template, then create monthly instances to track actuals."
- Sign in form (email + password)
- "Continue as Guest" button — logs in as a read-only guest with pre-seeded demo data
- "Create an account to start building your own templates and instances" — CTA for new users who want to use the app for real

### Screenshots / Visuals

Including 1–2 annotated screenshots on the login page could replace the need for an onboarding flow entirely:
- A screenshot of the template editor (showing participants, fields, split rules)
- A screenshot of an instance detail view (showing expense entries with participant splits)

This gives visitors enough context to understand the app before they even log in, reducing the need for in-app onboarding.

### Guest Experience

- Guest logs in via "Continue as Guest" — receives a short-lived JWT for the seeded guest account
- Guest sees pre-populated demo templates and instances that illustrate a realistic use case (e.g. a "Monthly Expenses" template with a few settled instances)
- Guest is **read-only** — no ability to create, edit, or delete anything
- A persistent banner is shown: *"You're viewing a demo. [Create an account] to track your own expenses."*
- "Create an account" link in the banner routes to `/login?register=true` to open the register form

---

## Open Questions

- **Registration**: Should registration be open to anyone, or invite/seed only? Since this is primarily a personal tool, open registration could allow strangers to create accounts. Consider disabling public registration and only seeding accounts (user + partner) unless there's a reason to allow sign-ups.
- **Guest data mutability**: Confirmed read-only. Needs enforcement both in the UI (hide edit/delete/create buttons) and in the backend (guest role check before any write operation).
- **Demo data**: What should the pre-seeded guest templates/instances look like? Should reflect a realistic personal use case — e.g. a couple tracking monthly household expenses across a few categories.
- **Screenshots on login page**: Static images vs. live embedded preview? Static is much simpler and avoids any risk of guest data being shown in a broken state.

---

## Implementation Notes (rough, not finalized)

- Guest user seeded in V9 migration with role `GUEST` and a fixed UUID
- Backend: write endpoints check for `GUEST` role and return 403
- Frontend: `AuthContext` exposes `user.role`; UI conditionally hides action buttons when `role === 'GUEST'`
- Login page lives outside `AppShell` and `ProtectedRoute` (same as current plan)
- Demo data seeded in a later migration (V11 per current plan)
- `?register=true` query param on `/login` pre-opens the register tab
