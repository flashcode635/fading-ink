# fading-ink

> *What if your notes could rot?*

**fading-ink** is an information decay engine — a note-taking app where content doesn't just sit there. It watches how often you ignore it, and it starts to fall apart.

Built for the **System Collapse Hackathon**.

🔗 [Live Demo](https://fading-ink.vercel.app)

---

## What It Does

Every note has a decay state. The longer you leave it untouched — or the less you interact with it — the more it visually degrades. Text blurs. Ink bleeds. The UI distorts.

Come back to it, read it, engage with it — and it stabilizes.

It's a weird experiment in making forgetting *visible*.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Animations | Framer Motion |
| Visual FX | CSS filters + SVG `feDisplacementMap` |
| Database | PostgreSQL via Prisma ORM |
| Styling | Tailwind CSS + shadcn/ui |
| Language | TypeScript |
| Testing | Vitest |
| Deploy | Vercel |

---

## How the Decay System Works

1. **Interaction tracking** — a custom hook (`useDecayState`) monitors how often a note is viewed/touched and timestamps those events.
2. **Decay score** — a time-weighted score is computed from interaction frequency and last-accessed timestamp, persisted in PostgreSQL via Prisma.
3. **Visual distortion** — the decay score drives real-time CSS filter values (`blur`, `contrast`, `opacity`) and SVG `feDisplacementMap` turbulence, applied directly to the note element.
4. **State transitions** — Framer Motion animates transitions between decay stages — *fresh → fading → corrupted → collapsed*.

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL instance

### Setup

```bash
git clone https://github.com/flashcode635/fading-ink.git
cd fading-ink
```

```bash
# Install dependencies
npm install
# or
bun install
```

```bash
# Set up environment variables
cp sample.env .env.local
# Fill in your DATABASE_URL and any other required vars
```

```bash
# Push Prisma schema to your DB
npx prisma db push
```

```bash
# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/          # Next.js App Router pages & API routes
├── components/   # UI components
├── hooks/        # useDecayState and other custom hooks
└── lib/          # Prisma client, utilities

prisma/
└── schema.prisma # DB schema
```

---

## Built At

**System Collapse Hackathon** — a hackathon themed around managing the broken systems, collapsed or changing states . We selected the entropy theme and decide to show our creativity in portraying a collapsed system as one with a graceful landing than a crash


