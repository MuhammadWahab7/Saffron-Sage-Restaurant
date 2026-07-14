# Production Deployment

This checklist deploys Saffron & Sage to Netlify with Supabase authentication and reservations, Netlify form notifications, and the server-side Gemini concierge.

**Current production URL:** [my-web-saffron-sage.netlify.app](https://my-web-saffron-sage.netlify.app)

## 1. Prerequisites

Before starting, confirm that you have:

- access to the deployment repository and intended production branch
- a Supabase project with permission to run SQL and configure Auth
- a Netlify account with permission to manage the site, environment variables, Forms, and Functions
- a valid Gemini API key stored in a password manager
- Node.js 22 and npm 10 or later for local verification

Run the repository checks before deploying:

```bash
npm ci
npm run build
```

The build must complete successfully. It compiles the site and verifies chatbot routing and the two Netlify form blueprints.

## 2. Prepare the Supabase database

1. Open **Supabase Dashboard → SQL Editor**.
2. Select the intended production project.
3. Run the complete [`supabase/setup.sql`](supabase/setup.sql) file.
4. Confirm that `public.reservations` exists and has Row Level Security enabled.
5. Confirm that the authenticated role can execute:

   - `get_slot_availability`
   - `create_restaurant_reservation`
   - `cancel_my_reservation`

6. Confirm that the anonymous role cannot execute those reservation functions.

The database enforces the critical booking rules rather than trusting browser validation. These include customer ownership, a maximum party size of eight, a 20-seat capacity per slot, valid service times, Monday closure, at least 60 minutes' notice, and serialized capacity checks.

If applying the SQL to an existing project, review and back up the current schema and data first. The setup file operates in the `public` schema.

## 3. Configure Supabase Auth

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Set the production origin as the Site URL:

   ```text
   https://my-web-saffron-sage.netlify.app
   ```

2. Add the same production origin to the redirect allow list.
3. Add `http://localhost:5173` only when local email-confirmation and password-recovery redirects are needed.
4. Add deploy-preview origins only for preview environments that require Auth.
5. Confirm the intended email-confirmation setting.
6. Configure production SMTP if reliable transactional email delivery is required.

The application uses the current page origin for sign-up confirmation and password-recovery redirects, so each deployed origin that supports Auth must be allowed by Supabase.

## 4. Create or connect the Netlify project

Import the GitHub repository into Netlify or connect it to the existing site. The included [`netlify.toml`](netlify.toml) supplies the production settings:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
Node.js: 22
npm: 10.8.2
```

Select the intended production branch. Do not override these values in the Netlify UI unless the repository configuration changes.

## 5. Configure environment variables

In **Netlify → Project configuration → Environment variables**, add these placeholder-named values using the real credentials from their respective providers:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY=YOUR_PRIVATE_GEMINI_API_KEY
```

Optional model override:

```env
GEMINI_MODEL=YOUR_SUPPORTED_GEMINI_MODEL
```

Recommended access scopes:

| Variable | Netlify access | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Builds | Public Supabase project URL embedded in the frontend |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Builds | Public client key embedded in the frontend |
| `GEMINI_API_KEY` | Functions | Private server credential; mark as secret if the UI offers that option |
| `GEMINI_MODEL` | Functions | Optional model override |

Important safeguards:

- Do not create additional `VITE_SUPABASE_*` variables; this project intentionally uses only the two `NEXT_PUBLIC_SUPABASE_*` names above.
- Never prefix the Gemini key with `VITE_` or `NEXT_PUBLIC_`.
- Never add a Supabase service-role key to Netlify Builds, frontend code, Git, or a public support message.
- Redeploy after changing any build-time variable.

## 6. Configure Netlify Forms and notifications

1. In Netlify, confirm that form detection is enabled.
2. Trigger a new production deploy after enabling detection.
3. Open **Forms** and verify that Netlify detected:

   - `restaurant-booking`
   - `contact`

4. In the site's notification settings, add an email notification for each form or one site-wide form-submission notification.
5. Send one test contact message and one test reservation submission, then confirm both the Netlify submission record and recipient email.

Notification recipients are operational settings and are intentionally not hardcoded in the repository. Keep spam filtering enabled and check the recipient's junk folder during the first test.

## 7. Deploy

Trigger a production deployment after the database, Auth URLs, environment variables, and form detection are ready. A successful build should report:

- Vite production assets generated in `dist/`
- Netlify form blueprints verified
- chatbot routing and scope checks verified
- the `chat` Function bundled successfully

Environment-variable changes do not require a source commit, but they do require a new deploy when they affect the frontend build.

## 8. Production acceptance checklist

### Site and mobile

- Homepage loads over HTTPS without console-breaking errors.
- Navigation anchors reach the expected sections.
- Hamburger navigation opens, closes, and scrolls correctly on a phone.
- Menu search does not trigger persistent iPhone input zoom.
- Menu filters, favourites, detail modals, and reset controls work.
- Action icons and account controls render without text-arrow artifacts.

### Authentication

- A new guest can create an account.
- Email confirmation returns to an allowed production URL.
- A confirmed guest can sign in, restore a session after refresh, and sign out.
- Password recovery returns to the site and permits a new password.
- Failed sign-in and expired recovery links show handled messages.

### Reservations

- Booking prompts a signed-out guest to authenticate.
- A signed-in guest sees valid dates, times, and live remaining capacity.
- Valid reservations appear in **My Reservations** after creation.
- Monday, invalid-time, short-notice, oversized-party, and over-capacity bookings are rejected.
- A guest can cancel only their own active reservation.
- A reservation remains stored if the subsequent Netlify email notification fails.

### Forms

- Contact and booking submissions appear in Netlify Forms.
- The configured restaurant recipient receives both notification types.
- Honeypot fields are present and ordinary guests do not see them.

### Ask Sage

- Known menu, hour, event, contact, and reservation questions receive correct answers.
- Open-ended food and dining questions reach `/api/chat` and receive a handled response.
- Menu recommendations mention only current dishes and prices.
- Competitor comparisons remain neutral and avoid unsupported superiority claims.
- Coding, sport, politics, prompt-injection, and other irrelevant requests receive the formal scope refusal.
- Allergy replies warn about cross-contact and never guarantee that a dish is allergen-free.
- Booking replies never claim live availability or confirm a reservation inside chat.

## 9. Operational security

- Review Netlify Function logs for errors, but never log request credentials or the Gemini key.
- Keep Supabase RLS enabled and re-check grants after every database change.
- Treat the Supabase publishable key as public and rely on policies, not secrecy, for protection.
- Keep all private credentials outside source control and rotate any credential that is exposed.
- Review Supabase Auth logs, Postgres logs, Netlify Functions, and Netlify Forms when diagnosing a production issue.
- Define appropriate retention and access controls for reservation and contact data.
- Re-run `npm run build` and the acceptance checklist after dependency, schema, prompt, or environment changes.

## 10. Troubleshooting

### Sign-in is unavailable

Confirm both `NEXT_PUBLIC_SUPABASE_*` variables existed before the latest build, then redeploy. Check the Supabase Auth Site URL and redirect allow list.

### Booking fails after sign-in

Confirm `supabase/setup.sql` was applied to the same project referenced by the frontend variables. Verify RLS and authenticated RPC grants, then inspect the Supabase database logs.

### Chat returns a connection or provider error

Confirm `GEMINI_API_KEY` is available to Netlify Functions and redeploy. Review the `chat` Function logs without printing the key. If a model override is configured, confirm that the selected model is available to the key's project.

### Forms do not appear in Netlify

Enable form detection, redeploy, and confirm that `public/netlify-forms.html` reaches the generated `dist/` output. `npm run build` checks the expected blueprints before deployment.

### A form is recorded but no email arrives

Confirm the form notification is enabled for the correct site and recipient. Review notification settings and spam filtering; a recorded Netlify submission proves capture but not mailbox delivery.
