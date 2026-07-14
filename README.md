# Saffron & Sage

A production-ready restaurant experience built with React, Supabase, Netlify, and Gemini.

**Live site:** [my-web-saffron-sage.netlify.app](https://my-web-saffron-sage.netlify.app)

## Highlights

- Responsive, mobile-first restaurant website with a site-wide hamburger menu
- Branded navigation, account flow, footer, favicon, and Sage concierge
- Interactive menu with ingredients, allergens, dietary labels, and chef notes
- Supabase email/password authentication and password recovery
- Authenticated reservation creation, availability checks, history, and cancellation
- Row Level Security and database functions that enforce reservation ownership and capacity
- Netlify Forms submissions for bookings and general enquiries
- Gemini-powered food and restaurant concierge behind a server-side Netlify Function
- Fast local chatbot answers for menu, hours, events, contact details, and common recommendations
- Formal refusal for requests outside food, dining, and restaurant topics

## Technology

| Area | Implementation |
| --- | --- |
| Frontend | React 19, Vite 8, responsive CSS |
| Authentication | Supabase Auth |
| Reservations | Supabase Postgres, RLS, and RPC functions |
| Forms | Netlify Forms |
| Concierge | Gemini Flash through a Netlify Function |
| Hosting | Netlify |

## Architecture

```text
Browser
├── React interface
├── Supabase Auth ──> protected reservation functions ──> Postgres
├── Netlify Forms ──> booking and contact notifications
└── Ask Sage ──> /api/chat Netlify Function ──> Gemini API
```

The Gemini credential stays on the server. The browser receives only the public Supabase project URL and publishable key; database access is protected by Row Level Security and authenticated functions.

## Local development

### Prerequisites

- Node.js 22
- npm 10 or later
- A Supabase project for authentication and live reservations

### Install and run

```bash
git clone https://github.com/MuhammadWahab7/Saffron-Sage-Restaurant.git
cd Saffron-Sage-Restaurant
npm ci
```

Copy `.env.example` to `.env.local`, then add your public Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Start Vite:

```bash
npm run dev
```

The rule-based Sage responses work in Vite. Run the project through Netlify Dev, or use the deployed site, to exercise the server-side Gemini function.

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/setup.sql`](supabase/setup.sql) in the Supabase SQL Editor.
3. Add the two public Supabase variables shown above.
4. Configure the application URL and permitted redirect URLs in Supabase Auth settings.

The SQL migration creates the `reservations` table, indexes, RLS policy, availability function, transactional capacity protection, booking function, and customer-owned cancellation function.

## Environment variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Build/browser | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build/browser | Yes | Public Supabase client key |
| `GEMINI_API_KEY` | Netlify Functions | Yes for AI replies | Private Gemini API key |
| `GEMINI_MODEL` | Netlify Functions | No | Overrides the default `gemini-3.1-flash-lite` model |

Never prefix `GEMINI_API_KEY` with `VITE_` or `NEXT_PUBLIC_`; either prefix would expose it to the browser bundle.

## Production deployment

The repository includes [`netlify.toml`](netlify.toml), which defines the production build, publish directory, Node version, and Functions directory.

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

Add the environment variables in Netlify, deploy the repository, enable form-detection notifications for `restaurant-booking` and `contact`, and configure the production URL in Supabase Auth. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the complete checklist and [`CHATBOT_SETUP.md`](CHATBOT_SETUP.md) for Sage configuration.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run preview` | Preview the production bundle locally |

## Project structure

```text
netlify/functions/    Server-side Sage endpoint
public/assets/        Brand marks and browser icons
src/components/       Page sections, modals, forms, and chatbot UI
src/context/          Authentication state
src/lib/              Supabase client configuration
src/services/         Reservation data operations
src/utils/            Chat routing and Netlify form helpers
supabase/setup.sql    Reservation schema, RLS, and database functions
```

## Security notes

- Secrets and local environment files are excluded from Git.
- Gemini requests are made only from the Netlify Function.
- Reservation writes run through authenticated database functions.
- Customers can read and cancel only their own reservations.
- Capacity checks use a transaction-level advisory lock to prevent overselling a time slot.
- Allergy information is guidance only; guests with serious allergies should confirm directly with restaurant staff.
