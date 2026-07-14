# Production Deployment

## 1. Connect the repository

Create or import a Netlify project from the GitHub repository. The included `netlify.toml` supplies these settings:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
Node.js: 22
```

## 2. Configure environment variables

Add these values in **Project configuration → Environment variables**:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY
```

Optional model override:

```text
GEMINI_MODEL=gemini-3.1-flash-lite
```

The Supabase variables must be available during builds. `GEMINI_API_KEY` must be available to Functions and must never use a public frontend prefix.

## 3. Prepare Supabase

1. Run `supabase/setup.sql` in the Supabase SQL Editor.
2. In Supabase Auth URL configuration, set the Netlify production URL as the site URL.
3. Add local and deploy-preview URLs only when those environments need authentication redirects.
4. Confirm email/password authentication and the desired email-confirmation policy.

## 4. Configure form notifications

After the first successful deploy, verify that Netlify detected these forms:

- `restaurant-booking`
- `contact`

Add an email notification for each form, or use a site-wide form notification, in Netlify's Forms settings. Notification recipients are deployment settings and should not be hardcoded in source.

## 5. Deploy and verify

Trigger a production deploy after changing any build variable. Then verify:

- the homepage and mobile navigation
- account registration, email confirmation, sign-in, sign-out, and password recovery
- availability checks, booking creation, reservation history, and cancellation
- booking and contact form submissions in Netlify Forms
- local Sage answers, Gemini-backed food questions, and formal out-of-scope refusals
- `/api/chat` returns a handled response rather than exposing function errors

## 6. Operational checks

- Review Netlify Function logs for server errors without logging secrets.
- Rotate any credential that is accidentally exposed.
- Keep Supabase RLS enabled and re-run security checks after schema changes.
- Redeploy after rotating build-time Supabase values.
