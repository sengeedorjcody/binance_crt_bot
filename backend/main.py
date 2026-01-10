"""
Trading Bot Backend API
FastAPI server for Binance integration
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import Binance client
from binance_client import binance_client
from strategy import crt_strategy, klines_to_candles, IndicatorValues, TechnicalIndicators

app = FastAPI(
    title="Trading Bot API",
    description="API for Binance trading operations with testnet support",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Pydantic Models ====================

class BinanceCredentials(BaseModel):
    api_key: str
    api_secret: str
    testnet: bool = True


class OrderRequest(BaseModel):
    symbol: str = Field(..., example="BTCUSDT")
    side: str = Field(..., example="BUY")
    order_type: str = Field(..., example="MARKET")
    quantity: Optional[float] = Field(None, example=0.001)
    quote_quantity: Optional[float] = Field(None, example=100)
    price: Optional[float] = Field(None, example=50000)
    stop_price: Optional[float] = None
    time_in_force: str = "GTC"


class CancelOrderRequest(BaseModel):
    symbol: str
    order_id: int


class HistoryRequest(BaseModel):
    symbol: str
    limit: int = 500
    start_time: Optional[int] = None
    end_time: Optional[int] = None


class DepositAddressRequest(BaseModel):
    coin: str = Field(..., example="BTC")
    network: Optional[str] = Field(None, example="BTC")


class DepositHistoryRequest(BaseModel):
    coin: Optional[str] = None
    status: Optional[int] = None
    start_time: Optional[int] = None
    end_time: Optional[int] = None
    limit: int = 1000


# ==================== API Endpoints ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Trading Bot API",
        "version": "1.0.0",
        "exchange": "Binance"
    }


@app.get("/api/status")
async def get_status():
    """Get API connection status"""
    return {
        "configured": binance_client.is_configured(),
        "environment": binance_client.get_environment(),
        "timestamp": datetime.now().isoformat()
    }


# ==================== Connection ====================

@app.post("/api/connect")
async def connect_binance(credentials: BinanceCredentials):
    """Connect to Binance API with credentials"""
    result = binance_client.configure(
        api_key=credentials.api_key,
        api_secret=credentials.api_secret,
        testnet=credentials.testnet
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@app.post("/api/connect/env")
async def connect_from_env():
    """Connect using environment variables"""
    api_key = os.getenv("BINANCE_API_KEY")
    api_secret = os.getenv("BINANCE_API_SECRET")
    testnet = os.getenv("BINANCE_TESTNET", "true").lower() == "true"
    
    if not all([api_key, api_secret]):
        raise HTTPException(
            status_code=400,
            detail="Missing BINANCE_API_KEY or BINANCE_API_SECRET in environment"
        )
    
    result = binance_client.configure(
        api_key=api_key,
        api_secret=api_secret,
        testnet=testnet
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@app.get("/api/ping")
async def ping():
    """Test connectivity to Binance"""
    result = binance_client.ping()
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/time")
async def get_server_time():
    """Get Binance server time"""
    result = binance_client.get_server_time()
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


# ==================== Account ====================

@app.get("/api/account")
async def get_account():
    """Get account information (balances, permissions)"""
    result = binance_client.get_account_info()
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/balance")
async def get_balance(asset: Optional[str] = None):
    """Get balance for specific asset or all assets"""
    result = binance_client.get_balance(asset)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/balance/{asset}")
async def get_asset_balance(asset: str):
    """Get balance for specific asset"""
    result = binance_client.get_balance(asset)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


# ==================== Market Data ====================

@app.get("/api/ticker/price")
async def get_ticker_price(symbol: Optional[str] = None):
    """Get current price for symbol(s)"""
    result = binance_client.get_ticker_price(symbol)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/ticker/price/{symbol}")
async def get_symbol_price(symbol: str):
    """Get current price for specific symbol"""
    result = binance_client.get_ticker_price(symbol)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/ticker/24h")
async def get_ticker_24h(symbol: Optional[str] = None):
    """Get 24hr price statistics"""
    result = binance_client.get_ticker_24h(symbol)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/ticker/24h/{symbol}")
async def get_symbol_24h(symbol: str):
    """Get 24hr statistics for specific symbol"""
    result = binance_client.get_ticker_24h(symbol)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/orderbook/{symbol}")
async def get_orderbook(symbol: str, limit: int = 100):
    """Get order book depth"""
    result = binance_client.get_orderbook(symbol, limit)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/trades/{symbol}")
async def get_recent_trades(symbol: str, limit: int = 500):
    """Get recent trades for symbol"""
    result = binance_client.get_recent_trades(symbol, limit)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/klines/{symbol}")
async def get_klines(
    symbol: str,
    interval: str = "1h",
    limit: int = 500,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None
):
    """Get candlestick data"""
    result = binance_client.get_klines(symbol, interval, limit, start_time, end_time)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/exchange-info")
async def get_exchange_info(symbol: Optional[str] = None):
    """Get exchange trading rules"""
    result = binance_client.get_exchange_info(symbol)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


# ==================== Trading ====================

@app.post("/api/order")
async def place_order(order: OrderRequest):
    """Place a new order"""
    result = binance_client.place_order(
        symbol=order.symbol,
        side=order.side,
        order_type=order.order_type,
        quantity=order.quantity,
        quote_quantity=order.quote_quantity,
        price=order.price,
        stop_price=order.stop_price,
        time_in_force=order.time_in_force
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/order/market/buy")
async def market_buy(symbol: str, quantity: float):
    """Place market buy order"""
    result = binance_client.place_market_buy(symbol, quantity)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/order/market/sell")
async def market_sell(symbol: str, quantity: float):
    """Place market sell order"""
    result = binance_client.place_market_sell(symbol, quantity)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/order/limit/buy")
async def limit_buy(symbol: str, quantity: float, price: float, time_in_force: str = "GTC"):
    """Place limit buy order"""
    result = binance_client.place_limit_buy(symbol, quantity, price, time_in_force)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/order/limit/sell")
async def limit_sell(symbol: str, quantity: float, price: float, time_in_force: str = "GTC"):
    """Place limit sell order"""
    result = binance_client.place_limit_sell(symbol, quantity, price, time_in_force)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.delete("/api/order")
async def cancel_order(request: CancelOrderRequest):
    """Cancel an order"""
    result = binance_client.cancel_order(request.symbol, request.order_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.delete("/api/orders/{symbol}")
async def cancel_all_orders(symbol: str):
    """Cancel all open orders for a symbol"""
    result = binance_client.cancel_all_orders(symbol)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/order/{symbol}/{order_id}")
async def get_order(symbol: str, order_id: int):
    """Get order status"""
    result = binance_client.get_order(symbol, order_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/orders/open")
async def get_open_orders(symbol: Optional[str] = None):
    """Get all open orders"""
    result = binance_client.get_open_orders(symbol)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/orders/history")
async def get_all_orders(request: HistoryRequest):
    """Get all orders (including closed)"""
    result = binance_client.get_all_orders(
        symbol=request.symbol,
        limit=request.limit,
        start_time=request.start_time,
        end_time=request.end_time
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/trades/history")
async def get_my_trades(request: HistoryRequest):
    """Get trade history"""
    result = binance_client.get_my_trades(
        symbol=request.symbol,
        limit=request.limit,
        start_time=request.start_time,
        end_time=request.end_time
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


# ==================== Deposit/Withdrawal ====================

@app.post("/api/deposit/address")
async def get_deposit_address(request: DepositAddressRequest):
    """Get deposit address for a coin"""
    result = binance_client.get_deposit_address(request.coin, request.network)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/deposit/address/{coin}")
async def get_coin_deposit_address(coin: str, network: Optional[str] = None):
    """Get deposit address for a coin"""
    result = binance_client.get_deposit_address(coin, network)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/deposit/history")
async def get_deposit_history(request: DepositHistoryRequest):
    """Get deposit history"""
    result = binance_client.get_deposit_history(
        coin=request.coin,
        status=request.status,
        start_time=request.start_time,
        end_time=request.end_time,
        limit=request.limit
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/deposit/history")
async def get_deposits(
    coin: Optional[str] = None,
    status: Optional[int] = None,
    limit: int = 1000
):
    """Get deposit history (GET version)"""
    result = binance_client.get_deposit_history(
        coin=coin,
        status=status,
        limit=limit
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/withdraw/history")
async def get_withdraw_history(request: DepositHistoryRequest):
    """Get withdrawal history"""
    result = binance_client.get_withdraw_history(
        coin=request.coin,
        status=request.status,
        start_time=request.start_time,
        end_time=request.end_time,
        limit=request.limit
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/withdraw/history")
async def get_withdrawals(
    coin: Optional[str] = None,
    status: Optional[int] = None,
    limit: int = 1000
):
    """Get withdrawal history (GET version)"""
    result = binance_client.get_withdraw_history(
        coin=coin,
        status=status,
        limit=limit
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/api/coins")
async def get_coin_info():
    """Get information about all coins (networks, fees)"""
    result = binance_client.get_coin_info()
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ==================== Strategy Analysis ====================

class AnalysisRequest(BaseModel):
    symbol: str = "XAUUSDT"
    interval: str = "1h"
    limit: int = 200


@app.post("/api/analyze")
async def analyze_market(request: AnalysisRequest):
    """
    Analyze market with CRT strategy and return indicators
    """
    # Get klines data
    klines_result = binance_client.get_klines(
        symbol=request.symbol,
        interval=request.interval,
        limit=request.limit
    )
    
    if not klines_result["success"]:
        raise HTTPException(status_code=400, detail=klines_result["message"])
    
    # Convert to candles
    candles = klines_to_candles(klines_result["data"])
    
    # Analyze with strategy
    indicators = crt_strategy.analyze(candles)
    
    # Calculate Volume Profile
    volume_profile = TechnicalIndicators.volume_profile(candles, num_bins=24)
    
    # Convert to JSON-serializable format
    result = []
    for ind in indicators:
        result.append({
            "time": ind.time.isoformat() if ind.time else None,
            "price": ind.price,
            "ema_9": round(ind.ema_9, 2) if ind.ema_9 else None,
            "ema_21": round(ind.ema_21, 2) if ind.ema_21 else None,
            "ema_50": round(ind.ema_50, 2) if ind.ema_50 else None,
            "sma_200": round(ind.sma_200, 2) if ind.sma_200 else None,
            "rsi": round(ind.rsi, 2) if ind.rsi else None,
            "macd_line": round(ind.macd_line, 4) if ind.macd_line else None,
            "macd_signal": round(ind.macd_signal, 4) if ind.macd_signal else None,
            "macd_histogram": round(ind.macd_histogram, 4) if ind.macd_histogram else None,
            "bb_upper": round(ind.bb_upper, 2) if ind.bb_upper else None,
            "bb_middle": round(ind.bb_middle, 2) if ind.bb_middle else None,
            "bb_lower": round(ind.bb_lower, 2) if ind.bb_lower else None,
            "atr": round(ind.atr, 2) if ind.atr else None,
            "swing_high": ind.swing_high,
            "swing_low": ind.swing_low,
            "is_liquidity_sweep": ind.is_liquidity_sweep,
            "is_fvg": ind.is_fvg,
            "fvg_high": ind.fvg_high,
            "fvg_low": ind.fvg_low,
            "signal": ind.signal
        })
    
    # Get current signals
    signals = [r for r in result if r["signal"] is not None]
    latest_signal = signals[-1] if signals else None
    
    return {
        "success": True,
        "data": {
            "symbol": request.symbol,
            "interval": request.interval,
            "indicators": result,
            "latest_signal": latest_signal,
            "signal_count": len(signals),
            "volume_profile": {
                "levels": volume_profile['levels'],
                "poc": volume_profile['poc'],
                "vah": volume_profile['vah'],
                "val": volume_profile['val'],
                "price_high": volume_profile['price_high'],
                "price_low": volume_profile['price_low']
            }
        }
    }


@app.get("/api/analyze/{symbol}")
async def analyze_symbol(
    symbol: str,
    interval: str = "1h",
    limit: int = 200
):
    """Get analysis for a symbol (GET version)"""
    return await analyze_market(AnalysisRequest(
        symbol=symbol,
        interval=interval,
        limit=limit
    ))
