# HustleIN — Frontend

React frontend for **HustleIN**: a Kenyan-first workforce and operations platform designed for freelancers, consultants, and growing businesses. The name is a wordplay that reflects Kenya’s hustle culture. Built with Vite, TypeScript, and Tailwind CSS.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 6** — dev server and build
- **React Router 7** — routing
- **Tailwind CSS 4** — styling
- **Zustand** — state
- **Framer Motion** — animations
- **Recharts** — charts (reports/dashboard)
- **TipTap** — rich text / mentions (notes, chat)
- **@react-oauth/google** — Google sign-in
- **Lucide React** — icons

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** (or pnpm/yarn)

## Setup

1. **Clone and install**

   ```bash
   cd frontend
   npm install
   ```

2. **Environment**

   Create a `.env` in the project root (or copy from `.env.example` if present):

   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   ```

   Google sign-in is optional; the app runs without it (with a message that it’s not configured).

3. **Run locally**

   ```bash
   npm run dev
   ```

   App is available at `http://localhost:5173` (or the port Vite prints).

## Demo login credentials

If you run the backend with `SEED=1` (or `SEED=true`), the app is seeded with demo accounts (password: `password`).

You can log in with:

- Super Admin: `super@tekjuice.co.uk`
- Company Admin (Tekjuice): `admin@tekjuice.co.uk`
- Project Lead (Tekjuice): `lead@tekjuice.co.uk`
- Consultant (Tekjuice): `consultant@tekjuice.co.uk`
- Freelancer (Tekjuice): `freelancer@tekjuice.co.uk`

Additional seeded accounts are also created for other companies (e.g. `globex.com` and `initech.co.ke` emails).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint |

## App structure

- **`/`** — Redirects to `/app` if logged in, else `/auth`
- **`/auth/*`** — Login, signup, forgot/reset password, verify/check email
- **`/app`** — Protected app (requires auth)
  - **Dashboard** — `/app`
  - **Projects** — `/app/projects`, `/app/projects/:id`, milestone tasks
  - **Tasks** — `/app/tasks`
  - **Milestones** — `/app/milestones`
  - **Calendar** — `/app/calendar`
  - **Reports** — `/app/reports`
  - **Focus** — `/app/focus`
  - **Consultants** — `/app/consultants`
  - **Invoices** — `/app/invoices`
  - **Profile** — `/app/profile`
  - **Settings** — `/app/settings`
  - **Notes** — `/app/notes`

## Project layout

```
frontend/
├── src/
│   ├── components/   # Shared UI (base, layout, ui)
│   ├── data/        # Stores (e.g. Authstore)
│   ├── pages/       # Route-level pages
│   ├── routes/      # Router setup and auth/protected routes
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
└── package.json
```

## License

Private — see repository root for license and usage terms.
