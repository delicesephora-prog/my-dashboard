# My Dashboard

A glanceable personal dashboard with two worlds — **Work** and **Life** —
that saves everything automatically as you use it. Built with Next.js,
stored in Neon Postgres, deployed on Vercel.

Full plain-English setup instructions are in the message from Claude that
built this project. If you need them again, ask Claude to repeat the
"Deployment Walkthrough" steps.

## What this app is made of (for reference)

- **Next.js 14 (App Router)** — the web app itself
- **Neon Postgres** — where your data lives, as a single JSON object per
  save, so new features never require a database migration
- **Vercel** — hosting; deploys automatically every time this repo's main
  branch changes
- A 4-8 digit **PIN lock** (set via the `DASHBOARD_PIN` environment
  variable) so a stray link doesn't expose your data to strangers

## Environment variables

See `.env.example` for the three variables the app needs:
`DATABASE_URL`, `DASHBOARD_PIN`, `SESSION_SECRET`.

## Local development (optional, only if you install Node.js yourself)

```
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```
