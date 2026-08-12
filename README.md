This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# AtlasOur 🗺️

A private, two-person relationship map — a shared, game-styled world where bucket-list pins unlock as you actually visit them together, and time capsules reveal themselves when you're finally standing in the right place.

Built as a cozy alternative to a plain map app: think *Animal Crossing* / *Zelda: Breath of the Wild* colors and character avatars layered on top of a real, navigable map.

## ✨ Concept

- **Bucket-list pins** — drop a pin anywhere for a place you want to go together. It stays locked until you're physically there.
- **Time capsules** — leave a note or photo behind, sealed until proximity (and sometimes your partner) unlocks it.
- **Fog-of-war** — the map starts desaturated and grayscale; places you've actually explored reveal themselves in full color. (Plan to implement in future)
- **Character avatars** — each partner has their own avatar on the map, with idle, in-range, and celebrate animation states.
- **No location history** — only your *current* position is ever stored, and only while location sharing is active. Nothing is logged over time.

## 🧠 How unlocking works

Pins move through a simple state machine:

```
locked → in_range → awaiting_partner* → revealed
```

\* only for "together mode" pins, which require both partners to tap within range inside a configurable time window. Solo pins unlock on a single tap.

## 🛠️ Tech stack

- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Backend/DB:** Supabase (Postgres + Row Level Security)
- **Maps:** Mapbox GL JS, with the Search Box API for place search and category search (cafes, restaurants, etc.)
- **Styling approach:** real Mapbox tiles pushed toward a stylized look via saturation boosts, custom markers, and overlay tricks — not a fully hand-illustrated map

### Notable implementation details

- 3D building extrusions with a tuned camera pitch for a more immersive feel
- In-app route preview via the Mapbox Directions API, with a "Start Navigation" button that deep-links to Google/Apple Maps for actual turn-by-turn
- Admin controls (password-gated `/admin` route) for global settings — together-mode time window, default pin radius, fog-of-war toggle, celebrate animation duration, icon uploads
- Sensitive writes (config, icons, avatars, pin creation, photo uploads) go through server-side API routes using a Supabase service role key — never exposed to the client
- Per-user password login, scoped so each partner can only edit their own profile/avatar

## 🚧 Status

This is a private, actively-developed 2-person app — not production-hardened for public/multi-user use. Known gaps:

- Row Level Security is not yet fully locked down on `pins`, `pin_presence`, and `live_location` (currently writable via the anon key)
- Fog-of-war overlay and full animation-state wiring are still in progress
- Admin pin management is currently manual (via SQL), no full CRUD UI yet
- Not yet deployed to production (dev/testing done over an ngrok HTTPS tunnel)

## 🔒 Privacy

AtlasOur is built with a "current position only" philosophy — no location history table exists. Location sharing is foreground-only and overwritten continuously, never appended to a log.
