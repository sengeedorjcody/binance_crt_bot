# Trading Bot - Binance Integration

A full-stack trading bot with Binance integration, Python backend (FastAPI), and Next.js web interface.

## Project Structure

```
trading-bot/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── binance_client.py    # Binance API client module
│   ├── test_connection.py   # Connection test script
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── hooks/           # Custom React hooks
    │   ├── lib/             # API client
    │   ├── pages/           # Next.js pages
    │   └── styles/          # CSS styles
    ├── package.json
    └── tailwind.config.js
```

## Features

### Backend (Python/FastAPI)
- ✅ Binance Testnet & Production support
- ✅ Account info & balances
- ✅ Market data (prices, 24h stats, klines)
- ✅ Trading (market/limit orders)
- ✅ Order management (open, history, cancel)
- ✅ Deposit/withdrawal info

### Frontend (Next.js/React)
- ✅ Dark terminal-style UI
- ✅ Real-time price charts
- ✅ Live price updates
- ✅ Trading form (market/limit)
- ✅ Open orders & trade history
- ✅ Account balance overview
- ✅ Connection modal

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Binance Testnet API keys (https://testnet.binance.vision/)

### 1. Setup Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Binance API keys

# Test connection
python test_connection.py

# Start server
uvicorn main:app --reload --port 8000
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Open Dashboard

Open http://localhost:3000 in your browser.

## Getting Binance Testnet Keys

1. Go to https://testnet.binance.vision/
2. Click "Log In with GitHub"
3. Click "Generate HMAC_SHA256 Key"
4. Copy both API Key and Secret Key

## API Endpoints

### Connection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connect` | Connect with credentials |
| POST | `/api/connect/env` | Connect using .env |
| GET | `/api/status` | Check connection status |

### Account
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/account` | Get account info |
| GET | `/api/balance` | Get all balances |
| GET | `/api/balance/{asset}` | Get specific balance |

### Market Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ticker/price/{symbol}` | Current price |
| GET | `/api/ticker/24h/{symbol}` | 24h statistics |
| GET | `/api/klines/{symbol}` | Candlestick data |

### Trading
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/order` | Place order |
| POST | `/api/order/market/buy` | Market buy |
| POST | `/api/order/market/sell` | Market sell |
| POST | `/api/order/limit/buy` | Limit buy |
| POST | `/api/order/limit/sell` | Limit sell |
| DELETE | `/api/order` | Cancel order |
| GET | `/api/orders/open` | Open orders |

### Deposit/Withdrawal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deposit/address/{coin}` | Deposit address |
| GET | `/api/deposit/history` | Deposit history |
| GET | `/api/withdraw/history` | Withdrawal history |

## Configuration

### Backend (.env)
```env
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
BINANCE_TESTNET=true
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Tech Stack

### Backend
- FastAPI
- Python 3.8+
- Requests

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts
- Lucide Icons

## Next Steps

- [ ] Database integration (SQLite/PostgreSQL)
- [ ] Trade history persistence
- [ ] WebSocket for real-time updates
- [ ] Trading strategies automation
- [ ] Backtesting module

## License

MIT
