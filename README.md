# SkyRush - Premium Crash Game

A world-class, production-ready crash game built on a universal, reusable crash engine. SkyRush represents the pinnacle of modern crash game design with premium visuals, smooth animations, and robust backend architecture.

## 🎯 Overview

**SkyRush** is a sleek futuristic aircraft-themed crash game where players place bets and watch as a multiplier climbs continuously from 1.00x. Players must decide when to cash out before the aircraft crashes, locking in their profit at that multiplier.

### Core Features

- 🎮 **Fast-paced gameplay** with smooth 50ms update cycles
- ✈️ **Premium aircraft animations** with dynamic background progression
- 💰 **Two-bet mode** allowing independent bets per round
- ⚡ **Auto-bet & auto-cashout** features for advanced players
- 📊 **Real-time stats** and live player feed
- 🛡️ **Provably fair** crash point generation
- 📱 **Fully responsive** mobile and tablet design
- 🎛️ **Admin dashboard** for game configuration and metrics
- 🔐 **Secure backend** with PostgreSQL via Drizzle ORM

## 🏗️ Architecture

### Universal Crash Engine

The foundation of SkyRush is built on a **Universal Crash Engine** - a reusable, theme-agnostic backend that can power multiple crash games. Simply swap themes and presentation layers to create new games like:

- **TurboX** - Racing-themed crash game
- **MarketX** - Stock market themed crash game
- **DeepDive** - Submarine-themed crash game
- **GoldRush** - Mining-themed crash game

### Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand (state management)
- Framer Motion (animations)
- Lucide React (icons)

**Backend:**
- Next.js API Routes
- PostgreSQL 14+
- Drizzle ORM 0.45
- Node.js 20+

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main game page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Premium design system
│   ├── admin/
│   │   └── page.tsx             # Admin dashboard
│   └── api/
│       ├── crash/
│       │   ├── round/route.ts    # Round management
│       │   ├── bet/route.ts      # Bet operations
│       │   └── stats/route.ts    # Game statistics
│       ├── admin/
│       │   ├── init-game/route.ts
│       │   ├── config/route.ts
│       │   └── metrics/route.ts
│       └── health/route.ts
│
├── components/game/
│   ├── game-container.tsx       # Main game wrapper
│   ├── game-header.tsx          # Top bar with balance
│   ├── multiplier-display.tsx   # Large multiplier UI
│   ├── aircraft-stage.tsx       # Canvas aircraft animation
│   ├── responsive-bet-panel.tsx # Bet placement UI
│   ├── history-strip.tsx        # Recent crash history
│   ├── live-feed.tsx            # Live player activity
│   ├── stats-panel.tsx          # Player statistics
│   ├── round-countdown.tsx      # Round timer
│   ├── settings-modal.tsx       # Settings dialog
│   └── info-modal.tsx           # How to play
│
├── lib/
│   ├── crash-engine/
│   │   ├── engine.ts            # Core crash engine
│   │   └── multiplier.ts        # Multiplier math & fairness
│   ├── types/
│   │   └── crash-engine.ts      # TypeScript interfaces
│   ├── services/
│   │   └── game-service.ts      # API client
│   ├── store/
│   │   └── game-store.ts        # Zustand state management
│   └── hooks/
│       └── use-game-loop.ts     # Game loop logic
│
└── db/
    ├── index.ts                 # Database connection
    └── schema.ts                # Drizzle schema definitions
```

## 🎮 Gameplay Mechanics

### Round Flow

1. **Waiting** (5 seconds) - Countdown before bets open
2. **Accepting Bets** (3 seconds) - Players place up to 2 independent bets
3. **Active Flight** - Multiplier increases, players can cashout anytime
4. **Crashed** - Round ends, multiplier locks, results calculated
5. **Settlement** - Winners paid, losers marked, history updated

### Multiplier Growth

The multiplier uses **exponential growth** with cryptographically generated crash points:

```
Multiplier = 1 + (e^(elapsed_seconds × growth_rate) - 1)
```

Each crash point is determined server-side using:
- Seed (random hex string)
- SHA256 hash (for fairness verification)
- Deterministic calculation (unseeded generation)

### Profit Calculation

```
Win Amount = Bet × Cashout Multiplier
Profit = Win Amount - Bet
```

## 🗄️ Database Schema

### Core Tables

- **users** - Player accounts and balances
- **gameConfig** - Game settings (min/max bets, RTP, etc.)
- **crashRounds** - Round history with crash points
- **bets** - Individual bet records
- **transactions** - Audit trail of all balance changes
- **userStats** - Aggregated player statistics

All data is normalized, indexed, and supports high-volume operations.

## 🔐 Security & Fairness

### Provably Fair System

Each round's crash point is determined using:

1. **Seed Generation** - Random 16-byte hex string
2. **Hash Commitment** - SHA256 of seed
3. **Deterministic Calculation** - Crash point = generateCrashPoint(seed)
4. **Player Verification** - Clients can verify seed + hash = crash point

### Backend Authority

- All critical logic (bet validation, balance updates, crash settlement) runs server-side
- Client cannot influence round outcomes
- Disconnect/reconnection handled gracefully with authoritative server state
- All transactions audit-logged for compliance

## 📊 Admin Dashboard

Access at `/admin` to:

- View real-time game metrics
- Configure min/max bets
- Enable/disable game
- Monitor player activity
- Check revenue and RTP

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/skyrush_db

# Initialize database
npx drizzle-kit push

# Initialize game config
curl -X POST http://localhost:3000/api/admin/init-game

# Run development server
npm run dev
```

Visit `http://localhost:3000` to play!

### Production Build

```bash
npm run build
npm run start
```

## 🎨 Design System

### Color Palette

- **Primary**: Dark slate (#0f172a)
- **Accent Gold**: #fbbf24
- **Accent Orange**: #f97316
- **Accent Cyan**: #06b6d4
- **Success**: #22c55e
- **Danger**: #ef4444

### Typography

- **Display**: Bold, letter-spaced, premium fonts
- **Body**: Clear, readable, high contrast
- **Numbers**: Monospace for precision

### Visual Effects

- **Glassmorphism** - Semi-transparent panels with blur
- **Glow effects** - Accent color glows on multiplier milestones
- **Smooth animations** - Framer Motion for UI transitions
- **Canvas animations** - Aircraft movement with parallax

## 📈 Performance

- **Game loop**: 50ms update cycle (20fps for smooth animation)
- **Round duration**: ~60 seconds typical
- **Database**: Optimized queries, indexed lookups
- **API**: Sub-100ms response times typical
- **Frontend**: Responsive, mobile-first design

## 🔄 Extending the Engine

### Creating a New Game Theme

1. **Create new component set** in `src/components/games/your-game/`
2. **Reuse crash engine** from `src/lib/crash-engine/`
3. **Implement custom visuals** (hero object, background, animations)
4. **Update game settings** (theme name, branding, limits)
5. **Deploy alongside SkyRush** - single engine powers multiple games

### Key Reusable Parts

- CrashEngine class (core logic)
- Multiplier calculations (fairness algorithms)
- API routes (standard for all games)
- Database schema (extensible for game-specific data)
- State management (Zustand store)

## 🧪 Testing

```bash
# Type checking
npm exec tsc -- --noEmit

# Type generation
npx next typegen

# Build verification
npm run build

# Run development
npm run dev
```

## 📝 API Reference

### POST /api/crash/round

Start a new round.

**Response:**
```json
{
  "success": true,
  "round": {
    "id": 1,
    "roundNumber": 1,
    "crashPoint": 7.48,
    "status": "active"
  }
}
```

### POST /api/crash/bet

Place or cash out a bet.

**Place Bet:**
```json
{
  "action": "place_bet",
  "userId": "user-123",
  "betAmount": 50,
  "betPanel": 1,
  "autoCashout": 2.5
}
```

**Cashout:**
```json
{
  "action": "cashout",
  "betId": 42
}
```

### GET /api/crash/stats

Get game statistics.

**Parameters:**
- `action`: "history" | "player_stats" | "player_balance"
- `userId`: (optional) for player queries
- `limit`: (optional) default 50

## 🎯 Future Enhancements

- [ ] WebSocket for real-time multiplayer
- [ ] Leaderboard rankings
- [ ] Tournament mode
- [ ] Mobile app native wrapper
- [ ] Blockchain verification (optional)
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Affiliate system
- [ ] VIP tiers with boosted returns
- [ ] Daily bonuses and challenges

## 📄 License

Private/Commercial - SkyRush Game © 2024

## 🤝 Support

For issues or questions about the crash engine or game implementation, refer to the inline documentation and type definitions throughout the codebase.

---

**Built with ❤️ as a flagship product on the Universal Crash Engine**
