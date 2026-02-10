# Crowd Crush

A mobile-first hyper-casual crowd runner browser game built with Next.js and HTML5 Canvas.

## Game Overview

Control a crowd of units that runs forward automatically. Swipe/drag left and right to steer through multiplier gates, avoid obstacles, and clash with enemies at the end of each level. Grow your crowd, upgrade between levels, and crush increasingly difficult enemies.

## Features

- **Touch-first controls** - Drag to steer, optimized for mobile Safari
- **Procedural level generation** - Every level is unique with scaling difficulty
- **Gate mechanics** - Add, multiply, subtract, and divide gates
- **Obstacles** - Spinning blades, walls, and pits
- **Enemy clashes** - 1:1 unit battles at level end
- **Boss fights** - Every 5 levels, fight a boss with HP
- **Upgrade system** - Starting units, power, speed, income
- **Persistent progress** - Saved to localStorage
- **PWA support** - Add to home screen on mobile
- **60fps performance** - Canvas rendering with object pooling

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **HTML5 Canvas** (2D rendering)
- **Tailwind CSS** (UI overlays)
- **localStorage** (save data)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser (or phone).

## Build & Deploy

```bash
npm run build
npm start
```

### Vercel Deployment

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Deploy - no configuration needed

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React UI components (HUD, menus, shop)
└── game/          # Game engine (pure TypeScript)
    ├── entities/  # Crowd, Gate, Obstacle, Enemy, Boss
    ├── systems/   # Renderer, Physics, Particles
    ├── managers/  # Progress, Screen state
    └── utils/     # Constants, helpers
```

## Controls

- **Mobile**: Touch and drag left/right to steer
- **Desktop**: Click and drag left/right to steer
- **Tap**: Start game from title screen
