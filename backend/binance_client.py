"""
Binance Client Module
Handles connection, account info, trading, and deposit/withdrawal operations
Supports both Testnet and Production environments
"""

import hashlib
import hmac
import time
import requests
from datetime import datetime
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from enum import Enum
from urllib.parse import urlencode


class Environment(Enum):
    TESTNET = "testnet"
    PRODUCTION = "production"


class OrderSide(Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(Enum):
    LIMIT = "LIMIT"
    MARKET = "MARKET"
    STOP_LOSS = "STOP_LOSS"
    STOP_LOSS_LIMIT = "STOP_LOSS_LIMIT"
    TAKE_PROFIT = "TAKE_PROFIT"
    TAKE_PROFIT_LIMIT = "TAKE_PROFIT_LIMIT"
    LIMIT_MAKER = "LIMIT_MAKER"


class TimeInForce(Enum):
    GTC = "GTC"  # Good Till Cancel
    IOC = "IOC"  # Immediate or Cancel
    FOK = "FOK"  # Fill or Kill


@dataclass
class BinanceConfig:
    """Binance API Configuration"""
    api_key: str
    api_secret: str
    environment: Environment = Environment.TESTNET
    
    @property
    def base_url(self) -> str:
        if self.environment == Environment.TESTNET:
            return "https://testnet.binance.vision"
        return "https://api.binance.com"
    
    @property
    def ws_url(self) -> str:
        if self.environment == Environment.TESTNET:
            return "wss://testnet.binance.vision/ws"
        return "wss://stream.binance.com:9443/ws"


class BinanceClient:
    """Binance API Client for trading operations"""
    
    def __init__(self):
        self._config: Optional[BinanceConfig] = None
        self._session = requests.Session()
    
    def configure(
        self,
        api_key: str,
        api_secret: str,
        testnet: bool = True
    ) -> Dict[str, Any]:
        """
        Configure Binance API credentials
        
        Args:
            api_key: Binance API key
            api_secret: Binance API secret
            testnet: Use testnet (True) or production (False)
        
        Returns:
            Dict with success status
        """
        self._config = BinanceConfig(
            api_key=api_key,
            api_secret=api_secret,
            environment=Environment.TESTNET if testnet else Environment.PRODUCTION
        )
        
        self._session.headers.update({
            "X-MBX-APIKEY": api_key
        })
        
        # Test connection
        result = self.get_account_info()
        if result["success"]:
            return {
                "success": True,
                "message": f"Connected to Binance {'Testnet' if testnet else 'Production'}",
                "environment": self._config.environment.value
            }
        return result
    
    def _generate_signature(self, params: Dict) -> str:
        """Generate HMAC SHA256 signature"""
        query_string = urlencode(params)
        signature = hmac.new(
            self._config.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _get_timestamp(self) -> int:
        """Get current timestamp in milliseconds"""
        return int(time.time() * 1000)
    
    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        signed: bool = False
    ) -> Dict[str, Any]:
        """
        Make API request
        
        Args:
            method: HTTP method (GET, POST, DELETE)
            endpoint: API endpoint
            params: Query parameters
            signed: Whether to sign the request
        
        Returns:
            API response
        """
        if not self._config:
            return {"success": False, "message": "Client not configured"}
        
        url = f"{self._config.base_url}{endpoint}"
        params = params or {}
        
        if signed:
            params["timestamp"] = self._get_timestamp()
            params["signature"] = self._generate_signature(params)
        
        try:
            if method == "GET":
                response = self._session.get(url, params=params)
            elif method == "POST":
                response = self._session.post(url, params=params)
            elif method == "DELETE":
                response = self._session.delete(url, params=params)
            else:
                return {"success": False, "message": f"Invalid method: {method}"}
            
            data = response.json()
            
            if response.status_code != 200:
                return {
                    "success": False,
                    "message": data.get("msg", "Unknown error"),
                    "code": data.get("code"),
                    "status_code": response.status_code
                }
            
            return {"success": True, "data": data}
            
        except requests.exceptions.RequestException as e:
            return {"success": False, "message": f"Request failed: {str(e)}"}
        except Exception as e:
            return {"success": False, "message": f"Error: {str(e)}"}
    
    def is_configured(self) -> bool:
        """Check if client is configured"""
        return self._config is not None
    
    def get_environment(self) -> str:
        """Get current environment"""
        if self._config:
            return self._config.environment.value
        return "not_configured"
    
    # ==================== Public Endpoints ====================
    
    def ping(self) -> Dict[str, Any]:
        """Test connectivity"""
        result = self._request("GET", "/api/v3/ping")
        if result["success"]:
            return {"success": True, "message": "Pong!"}
        return result
    
    def get_server_time(self) -> Dict[str, Any]:
        """Get server time"""
        result = self._request("GET", "/api/v3/time")
        if result["success"]:
            server_time = datetime.fromtimestamp(result["data"]["serverTime"] / 1000)
            return {
                "success": True,
                "data": {
                    "server_time": server_time.isoformat(),
                    "timestamp": result["data"]["serverTime"]
                }
            }
        return result
    
    def get_exchange_info(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """Get exchange trading rules and symbol info"""
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        
        result = self._request("GET", "/api/v3/exchangeInfo", params)
        if result["success"]:
            data = result["data"]
            if symbol:
                symbols = [s for s in data["symbols"] if s["symbol"] == symbol.upper()]
                if symbols:
                    return {"success": True, "data": symbols[0]}
                return {"success": False, "message": f"Symbol {symbol} not found"}
            return {"success": True, "data": data}
        return result
    
    def get_ticker_price(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """Get current price for symbol(s)"""
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        
        result = self._request("GET", "/api/v3/ticker/price", params)
        return result
    
    def get_ticker_24h(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """Get 24hr price change statistics"""
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        
        result = self._request("GET", "/api/v3/ticker/24hr", params)
        return result
    
    def get_orderbook(self, symbol: str, limit: int = 100) -> Dict[str, Any]:
        """Get order book depth"""
        params = {
            "symbol": symbol.upper(),
            "limit": min(limit, 5000)
        }
        return self._request("GET", "/api/v3/depth", params)
    
    def get_recent_trades(self, symbol: str, limit: int = 500) -> Dict[str, Any]:
        """Get recent trades"""
        params = {
            "symbol": symbol.upper(),
            "limit": min(limit, 1000)
        }
        return self._request("GET", "/api/v3/trades", params)
    
    def get_klines(
        self,
        symbol: str,
        interval: str = "1h",
        limit: int = 500,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get kline/candlestick data
        
        Intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
        """
        params = {
            "symbol": symbol.upper(),
            "interval": interval,
            "limit": min(limit, 1000)
        }
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        
        result = self._request("GET", "/api/v3/klines", params)
        
        if result["success"]:
            klines = []
            for k in result["data"]:
                klines.append({
                    "open_time": datetime.fromtimestamp(k[0] / 1000).isoformat(),
                    "open": float(k[1]),
                    "high": float(k[2]),
                    "low": float(k[3]),
                    "close": float(k[4]),
                    "volume": float(k[5]),
                    "close_time": datetime.fromtimestamp(k[6] / 1000).isoformat(),
                    "quote_volume": float(k[7]),
                    "trades": k[8]
                })
            return {"success": True, "data": klines}
        return result
    
    # ==================== Account Endpoints ====================
    
    def get_account_info(self) -> Dict[str, Any]:
        """Get account information including balances"""
        result = self._request("GET", "/api/v3/account", signed=True)
        
        if result["success"]:
            data = result["data"]
            balances = [
                {
                    "asset": b["asset"],
                    "free": float(b["free"]),
                    "locked": float(b["locked"]),
                    "total": float(b["free"]) + float(b["locked"])
                }
                for b in data["balances"]
                if float(b["free"]) > 0 or float(b["locked"]) > 0
            ]
            
            return {
                "success": True,
                "data": {
                    "maker_commission": data["makerCommission"],
                    "taker_commission": data["takerCommission"],
                    "can_trade": data["canTrade"],
                    "can_withdraw": data["canWithdraw"],
                    "can_deposit": data["canDeposit"],
                    "balances": balances,
                    "update_time": datetime.fromtimestamp(data["updateTime"] / 1000).isoformat()
                }
            }
        return result
    
    def get_balance(self, asset: Optional[str] = None) -> Dict[str, Any]:
        """Get balance for specific asset or all assets"""
        result = self.get_account_info()
        
        if result["success"]:
            balances = result["data"]["balances"]
            
            if asset:
                asset = asset.upper()
                for b in balances:
                    if b["asset"] == asset:
                        return {"success": True, "data": b}
                return {
                    "success": True,
                    "data": {
                        "asset": asset,
                        "free": 0.0,
                        "locked": 0.0,
                        "total": 0.0
                    }
                }
            
            return {"success": True, "data": balances}
        return result
    
    # ==================== Trading Endpoints ====================
    
    def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: Optional[float] = None,
        quote_quantity: Optional[float] = None,
        price: Optional[float] = None,
        stop_price: Optional[float] = None,
        time_in_force: str = "GTC"
    ) -> Dict[str, Any]:
        """
        Place a new order
        """
        params = {
            "symbol": symbol.upper(),
            "side": side.upper(),
            "type": order_type.upper()
        }
        
        if quantity:
            params["quantity"] = f"{quantity:.8f}".rstrip('0').rstrip('.')
        if quote_quantity:
            params["quoteOrderQty"] = f"{quote_quantity:.8f}".rstrip('0').rstrip('.')
        if price:
            params["price"] = f"{price:.8f}".rstrip('0').rstrip('.')
        if stop_price:
            params["stopPrice"] = f"{stop_price:.8f}".rstrip('0').rstrip('.')
        if order_type.upper() in ["LIMIT", "STOP_LOSS_LIMIT", "TAKE_PROFIT_LIMIT"]:
            params["timeInForce"] = time_in_force
        
        result = self._request("POST", "/api/v3/order", params, signed=True)
        
        if result["success"]:
            order = result["data"]
            return {
                "success": True,
                "data": {
                    "order_id": order["orderId"],
                    "client_order_id": order["clientOrderId"],
                    "symbol": order["symbol"],
                    "side": order["side"],
                    "type": order["type"],
                    "status": order["status"],
                    "price": float(order.get("price", 0)),
                    "quantity": float(order.get("origQty", 0)),
                    "executed_qty": float(order.get("executedQty", 0)),
                    "time": datetime.fromtimestamp(order["transactTime"] / 1000).isoformat()
                }
            }
        return result
    
    def place_market_buy(self, symbol: str, quantity: float) -> Dict[str, Any]:
        """Place market buy order"""
        return self.place_order(symbol, "BUY", "MARKET", quantity=quantity)
    
    def place_market_sell(self, symbol: str, quantity: float) -> Dict[str, Any]:
        """Place market sell order"""
        return self.place_order(symbol, "SELL", "MARKET", quantity=quantity)
    
    def place_limit_buy(
        self,
        symbol: str,
        quantity: float,
        price: float,
        time_in_force: str = "GTC"
    ) -> Dict[str, Any]:
        """Place limit buy order"""
        return self.place_order(
            symbol, "BUY", "LIMIT",
            quantity=quantity,
            price=price,
            time_in_force=time_in_force
        )
    
    def place_limit_sell(
        self,
        symbol: str,
        quantity: float,
        price: float,
        time_in_force: str = "GTC"
    ) -> Dict[str, Any]:
        """Place limit sell order"""
        return self.place_order(
            symbol, "SELL", "LIMIT",
            quantity=quantity,
            price=price,
            time_in_force=time_in_force
        )
    
    def cancel_order(self, symbol: str, order_id: int) -> Dict[str, Any]:
        """Cancel an open order"""
        params = {
            "symbol": symbol.upper(),
            "orderId": order_id
        }
        return self._request("DELETE", "/api/v3/order", params, signed=True)
    
    def cancel_all_orders(self, symbol: str) -> Dict[str, Any]:
        """Cancel all open orders for a symbol"""
        params = {"symbol": symbol.upper()}
        return self._request("DELETE", "/api/v3/openOrders", params, signed=True)
    
    def get_order(self, symbol: str, order_id: int) -> Dict[str, Any]:
        """Get order status"""
        params = {
            "symbol": symbol.upper(),
            "orderId": order_id
        }
        return self._request("GET", "/api/v3/order", params, signed=True)
    
    def get_open_orders(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """Get all open orders"""
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        
        result = self._request("GET", "/api/v3/openOrders", params, signed=True)
        
        if result["success"]:
            orders = []
            for order in result["data"]:
                orders.append({
                    "order_id": order["orderId"],
                    "symbol": order["symbol"],
                    "side": order["side"],
                    "type": order["type"],
                    "status": order["status"],
                    "price": float(order["price"]),
                    "quantity": float(order["origQty"]),
                    "executed_qty": float(order["executedQty"]),
                    "time": datetime.fromtimestamp(order["time"] / 1000).isoformat()
                })
            return {"success": True, "data": orders, "count": len(orders)}
        return result
    
    def get_all_orders(
        self,
        symbol: str,
        limit: int = 500,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get all orders (including closed)"""
        params = {
            "symbol": symbol.upper(),
            "limit": min(limit, 1000)
        }
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        
        result = self._request("GET", "/api/v3/allOrders", params, signed=True)
        
        if result["success"]:
            orders = []
            for order in result["data"]:
                orders.append({
                    "order_id": order["orderId"],
                    "symbol": order["symbol"],
                    "side": order["side"],
                    "type": order["type"],
                    "status": order["status"],
                    "price": float(order["price"]),
                    "quantity": float(order["origQty"]),
                    "executed_qty": float(order["executedQty"]),
                    "time": datetime.fromtimestamp(order["time"] / 1000).isoformat()
                })
            return {"success": True, "data": orders, "count": len(orders)}
        return result
    
    def get_my_trades(
        self,
        symbol: str,
        limit: int = 500,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get trade history"""
        params = {
            "symbol": symbol.upper(),
            "limit": min(limit, 1000)
        }
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        
        result = self._request("GET", "/api/v3/myTrades", params, signed=True)
        
        if result["success"]:
            trades = []
            for trade in result["data"]:
                trades.append({
                    "trade_id": trade["id"],
                    "order_id": trade["orderId"],
                    "symbol": trade["symbol"],
                    "price": float(trade["price"]),
                    "quantity": float(trade["qty"]),
                    "quote_qty": float(trade["quoteQty"]),
                    "commission": float(trade["commission"]),
                    "commission_asset": trade["commissionAsset"],
                    "is_buyer": trade["isBuyer"],
                    "is_maker": trade["isMaker"],
                    "time": datetime.fromtimestamp(trade["time"] / 1000).isoformat()
                })
            return {"success": True, "data": trades, "count": len(trades)}
        return result
    
    # ==================== Deposit/Withdrawal Info ====================
    # Note: Testnet has limited support for these endpoints
    
    def get_deposit_address(self, coin: str, network: Optional[str] = None) -> Dict[str, Any]:
        """
        Get deposit address for a coin
        Note: Limited availability on testnet
        """
        params = {"coin": coin.upper()}
        if network:
            params["network"] = network
        
        result = self._request("GET", "/sapi/v1/capital/deposit/address", params, signed=True)
        
        if result["success"]:
            data = result["data"]
            return {
                "success": True,
                "data": {
                    "coin": data["coin"],
                    "address": data["address"],
                    "tag": data.get("tag"),
                    "network": data.get("network"),
                    "url": data.get("url")
                }
            }
        return result
    
    def get_deposit_history(
        self,
        coin: Optional[str] = None,
        status: Optional[int] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """
        Get deposit history
        Status: 0-pending, 6-credited, 1-success
        """
        params = {"limit": min(limit, 1000)}
        if coin:
            params["coin"] = coin.upper()
        if status is not None:
            params["status"] = status
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        
        result = self._request("GET", "/sapi/v1/capital/deposit/hisrec", params, signed=True)
        
        if result["success"]:
            deposits = []
            for d in result["data"]:
                deposits.append({
                    "id": d.get("id"),
                    "tx_id": d.get("txId"),
                    "coin": d["coin"],
                    "amount": float(d["amount"]),
                    "network": d.get("network"),
                    "address": d.get("address"),
                    "status": d["status"],
                    "insert_time": datetime.fromtimestamp(d["insertTime"] / 1000).isoformat()
                })
            return {"success": True, "data": deposits, "count": len(deposits)}
        return result
    
    def get_withdraw_history(
        self,
        coin: Optional[str] = None,
        status: Optional[int] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """Get withdrawal history"""
        params = {"limit": min(limit, 1000)}
        if coin:
            params["coin"] = coin.upper()
        if status is not None:
            params["status"] = status
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        
        result = self._request("GET", "/sapi/v1/capital/withdraw/history", params, signed=True)
        
        if result["success"]:
            withdrawals = []
            for w in result["data"]:
                withdrawals.append({
                    "id": w.get("id"),
                    "tx_id": w.get("txId"),
                    "coin": w["coin"],
                    "amount": float(w["amount"]),
                    "network": w.get("network"),
                    "address": w["address"],
                    "status": w["status"],
                    "apply_time": w.get("applyTime"),
                    "transaction_fee": float(w.get("transactionFee", 0))
                })
            return {"success": True, "data": withdrawals, "count": len(withdrawals)}
        return result
    
    def get_coin_info(self) -> Dict[str, Any]:
        """Get information about all coins (networks, deposit/withdraw status)"""
        result = self._request("GET", "/sapi/v1/capital/config/getall", signed=True)
        
        if result["success"]:
            coins = []
            for c in result["data"]:
                networks = []
                for n in c.get("networkList", []):
                    networks.append({
                        "network": n["network"],
                        "name": n.get("name"),
                        "deposit_enable": n.get("depositEnable"),
                        "withdraw_enable": n.get("withdrawEnable"),
                        "withdraw_fee": float(n.get("withdrawFee", 0)),
                        "withdraw_min": float(n.get("withdrawMin", 0)),
                        "withdraw_max": float(n.get("withdrawMax", 0))
                    })
                coins.append({
                    "coin": c["coin"],
                    "name": c.get("name"),
                    "deposit_all_enable": c.get("depositAllEnable"),
                    "withdraw_all_enable": c.get("withdrawAllEnable"),
                    "free": float(c.get("free", 0)),
                    "locked": float(c.get("locked", 0)),
                    "networks": networks
                })
            return {"success": True, "data": coins}
        return result


# Singleton instance
binance_client = BinanceClient()
