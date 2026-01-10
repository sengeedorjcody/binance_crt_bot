# Trading Bot Frontend

A modern Next.js dashboard for the Binance trading bot.

## Features

- 🎨 Dark terminal-style UI with glow effects
- 📊 Real-time price charts with Recharts
- 💹 Live price updates (auto-refresh every 3-5 seconds)
- 📝 Place market and limit orders
- 📋 View open orders and trade history
- 💰 Account balance overview
- 🔌 Easy API connection modal

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Charts
- **Lucide React** - Icons
- **Axios** - API client
- **date-fns** - Date formatting

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` if your backend runs on a different port:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── ui.tsx           # Reusable UI components
│   │   ├── PriceChart.tsx   # Price chart
│   │   ├── TradingForm.tsx  # Order form
│   │   ├── OrdersTable.tsx  # Orders/trades tables
│   │   └── ConnectModal.tsx # API connection modal
│   ├── hooks/
│   │   └── useApi.ts        # Data fetching hooks
│   ├── lib/
│   │   └── api.ts           # API client
│   ├── pages/
│   │   ├── _app.tsx         # App wrapper
│   │   └── index.tsx        # Main dashboard
│   └── styles/
│       └── globals.css      # Global styles
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Components

### UI Components (`ui.tsx`)
- `Spinner` - Loading indicator
- `LoadingCard` - Loading state card
- `ErrorCard` - Error display
- `ConnectionStatus` - Connection badge
- `PriceDisplay` - Price with change indicator
- `BalanceDisplay` - Asset balance row
- `OrderStatusBadge` - Order status badge
- `SideBadge` - BUY/SELL badge
- `StatCard` - Statistics card
- `EmptyState` - Empty state placeholder

### Custom Hooks (`useApi.ts`)
- `useConnectionStatus()` - API connection status
- `useAccount()` - Account info with auto-refresh
- `useTicker(symbol)` - Price ticker with auto-refresh
- `useKlines(symbol, interval)` - Candlestick data
- `useOpenOrders()` - Open orders with auto-refresh
- `useTradeHistory(symbol)` - Trade history

## Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:

```js
colors: {
  terminal: {
    bg: '#0a0e17',      // Background
    card: '#111827',    // Card background
    border: '#1e293b',  // Borders
    accent: '#00ff88',  // Accent (green)
    profit: '#00ff88',  // Profit color
    loss: '#ef4444',    // Loss color
  }
}
```

### Trading Pairs
Edit the `TRADING_PAIRS` array in `index.tsx`:

```js
const TRADING_PAIRS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
```

### Refresh Intervals
Adjust auto-refresh intervals in hooks:

```js
const { ticker } = useTicker(selectedPair, 3000);  // 3 seconds
const { orders } = useOpenOrders(undefined, 5000); // 5 seconds
```

## Screenshots

The dashboard includes:
- Header with connection status
- Left sidebar: Account overview, balances
- Center: Price chart, orders/trades tabs
- Right sidebar: Trading form

## Building for Production

```bash
npm run build
npm start
```

## Deployment

The frontend can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Docker
- Any Node.js hosting

Make sure to set `NEXT_PUBLIC_API_URL` to your production backend URL.
