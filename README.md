<p align="center">
  <img src="public/assets/saffron-sage-logo.png" alt="Saffron & Sage Garden Kitchen" width="360" />
</p>

<h1 align="center">Saffron & Sage</h1>

<p align="center">
  A production-ready garden restaurant experience for menu discovery, guest accounts, secure reservations, and food-focused concierge assistance.
</p>

<p align="center">
  <a href="https://github.com/MuhammadWahab7/Saffron-Sage-Restaurant/actions/workflows/ci.yml"><img src="https://github.com/MuhammadWahab7/Saffron-Sage-Restaurant/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="https://my-web-saffron-sage.netlify.app"><img src="https://img.shields.io/badge/live-Netlify-00C7B7?logo=netlify&logoColor=white" alt="Open live application" /></a>
</p>

Saffron & Sage is built with React and Vite, uses Supabase for authentication and reservations, sends operational form notifications through Netlify Forms, and keeps Gemini requests behind a Netlify Function.

## Features

### Guest experience

- Responsive, mobile-first pages with a site-wide hamburger menu
- Interactive menu with search, categories, favourites, ingredients, allergens, dietary labels, calories, pairings, and chef notes
- Event, gallery, story, visit, testimonial, and contact sections
- Email/password account creation, sign-in, sign-out, email confirmation, and password recovery
- Authenticated table reservations with live seat checks, booking history, and customer-owned cancellation
- Booking rules for opening days, service times, party size, minimum notice, and per-slot capacity
- “Ask Sage” concierge for menu recommendations, food and dining questions, restaurant information, and formal out-of-scope refusals
- Mobile safeguards for navigation, search-input zoom, menu scrolling, and account controls

### Platform capabilities

- Supabase Postgres with Row Level Security and authenticated RPC functions
- Transaction-level capacity protection to prevent concurrent overbooking
- Netlify Forms blueprints for `restaurant-booking` and `contact`
- Server-side Gemini integration with no AI credential in the browser bundle
- Build-time checks for chatbot routing and Netlify form detection

## Architecture

```text
Visitor
└── React + Vite application
    ├── Supabase Auth
    │   └── authenticated reservation RPCs ──> Postgres + RLS
    ├── Booking success ──> Netlify Forms ──> restaurant notification
    ├── Contact form ─────> Netlify Forms ──> restaurant notification
    └── Ask Sage
        ├── deterministic local answers for known restaurant facts
        └── /api/chat Netlify Function ──> Gemini API
```

Supabase is the source of truth for customer accounts and reservations. After a reservation is stored successfully, the application submits a separate Netlify form notification. A notification failure does not remove an otherwise valid reservation.

## Technology

| Area | Implementation |
| --- | --- |
| Frontend | React 19, Vite 8, JavaScript, responsive CSS |
| Authentication | Supabase Auth |
| Data | Supabase Postgres |
| Reservation security | Row Level Security and `security definer` RPC functions |
| Operational forms | Netlify Forms |
| Concierge | Gemini through a server-side Netlify Function |
| Hosting | Netlify |

## Getting started

### Prerequisites

- Node.js 22
- npm 10 or later
- A Supabase project
- A Gemini API key if model-backed concierge replies are required
- A Netlify account for Functions, live forms, notifications, and deployment

### 1. Install the project

```bash
git clone https://github.com/MuhammadWahab7/Saffron-Sage-Restaurant.git
cd Saffron-Sage-Restaurant
npm ci
```

### 2. Configure environment variables

Copy [`.env.example`](.env.example) to `.env.local` and replace only the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY=YOUR_PRIVATE_GEMINI_API_KEY
```

An optional `GEMINI_MODEL` variable can override the model used by the server-side chat function.

The two `NEXT_PUBLIC_SUPABASE_*` values are intentionally available to the browser. Supabase protects data through RLS and authenticated database functions. `GEMINI_API_KEY` is private and must never be given a `VITE_` or `NEXT_PUBLIC_` prefix.

Vite accepts the `NEXT_PUBLIC_` prefix in this project through [`vite.config.js`](vite.config.js). No service-role key is required or permitted in the frontend.

### 3. Prepare Supabase

1. Open **Supabase Dashboard → SQL Editor**.
2. Run the complete [`supabase/setup.sql`](supabase/setup.sql) file.
3. In **Authentication → URL Configuration**, set the application origin as the Site URL.
4. Add the local origin and any Netlify deploy-preview origins that should be allowed to receive authentication and password-recovery redirects.
5. Confirm the desired email-confirmation policy. For production email delivery, configure an appropriate SMTP provider in Supabase.

The SQL creates the reservation table and indexes, enables RLS, limits reads to the owning user, and installs authenticated functions for availability, booking creation, and cancellation.

### 4. Run locally

For the React application and deterministic concierge replies:

```bash
npm run dev
```

Vite normally serves the site at `http://localhost:5173`. To exercise `/api/chat` through the Netlify Function, run the project with Netlify Dev and make the private Gemini variable available to that local Functions environment:

```bash
npx netlify-cli@latest dev
```

Netlify form submissions are simulated on `localhost`; use a Netlify deploy to verify real form capture and email notifications.

## Verification

Create and validate the production bundle with:

```bash
npm run build
```

The build command performs three checks:

1. Vite compiles the production assets into `dist/`.
2. `scripts/verify-netlify-forms.mjs` checks that both form blueprints and their expected fields are present.
3. `scripts/verify-chatbot.mjs` checks common recommendations, dietary filtering, competitor handling, booking guidance, prompt-injection refusal, and out-of-scope routing.

Preview the generated frontend locally with:

```bash
npm run preview
```

External services still require manual end-to-end verification after deployment. Test account registration, email confirmation, password recovery, booking creation and cancellation, Netlify form capture, notification receipt, Gemini-backed answers, and the mobile layout on a real device.

## Deployment

The included [`netlify.toml`](netlify.toml) configures:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
Node.js: 22
```

Add the same three required environment variables in Netlify, enable form detection, configure form notifications outside the source code, and deploy. See [DEPLOYMENT.md](DEPLOYMENT.md) for the production checklist and [CHATBOT_SETUP.md](CHATBOT_SETUP.md) for concierge-specific guidance.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the site and run repository verification scripts |
| `npm run preview` | Preview the generated `dist/` bundle |
| `npx netlify-cli@latest dev` | Run the frontend and Netlify Function locally |

## Project structure

```text
netlify/functions/        Server-side Ask Sage endpoint
public/assets/            Logo, emblem, and browser icons
public/netlify-forms.html Static Netlify form blueprints
scripts/                  Build-time verification scripts
src/components/           Sections, navigation, modals, forms, and chatbot UI
src/context/              Supabase authentication state
src/lib/                  Supabase client configuration
src/services/             Reservation operations
src/utils/                Chat routing and form helpers
src/data.js               Menu, event, gallery, and testimonial content
supabase/setup.sql        Reservation schema, RLS, and RPC functions
netlify.toml              Netlify build and Functions configuration
```

## Security notes

- Local environment files, Netlify state, logs, dependencies, and build output are excluded from Git.
- The Supabase publishable key is public by design; data protection depends on RLS and restricted RPC grants.
- The project does not require a Supabase service-role key in the browser or repository.
- Gemini requests are made only from the Netlify Function, and the API key must remain server-side.
- Anonymous users cannot execute reservation RPCs. Signed-in users can read and cancel only their own reservations.
- Reservation capacity is checked inside a locked database transaction to prevent overselling a time slot.
- Netlify Forms include honeypot fields, but production operators should still monitor spam and define appropriate data-retention practices.
- Allergy information is guidance only. Guests with serious allergies must confirm requirements and cross-contact risk directly with restaurant staff.
- If a credential is ever exposed, revoke or rotate it immediately and redeploy.
