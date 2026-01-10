"""
Binance Connection Test Script
Run this to verify your Binance API connection works

Usage:
    python test_connection.py
    
    Or with credentials:
    python test_connection.py --api-key YOUR_KEY --api-secret YOUR_SECRET --testnet
"""

import argparse
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from binance_client import BinanceClient


def test_connection(api_key: str, api_secret: str, testnet: bool = True):
    """Test Binance API connection and display account info"""
    
    client = BinanceClient()
    env_name = "Testnet" if testnet else "Production"
    
    print("=" * 60)
    print(f"Binance {env_name} Connection Test")
    print("=" * 60)
    
    # Configure client
    print(f"\n1. Connecting to Binance {env_name}...")
    result = client.configure(api_key, api_secret, testnet)
    
    if not result["success"]:
        print(f"   ❌ Connection failed: {result['message']}")
        return False
    
    print(f"   ✅ Connected to {result['environment']}")
    
    # Test ping
    print("\n2. Testing connectivity (ping)...")
    ping_result = client.ping()
    if ping_result["success"]:
        print("   ✅ Pong! Connection is alive")
    else:
        print(f"   ❌ Ping failed: {ping_result['message']}")
    
    # Server time
    print("\n3. Server Time:")
    time_result = client.get_server_time()
    if time_result["success"]:
        print(f"   Server time: {time_result['data']['server_time']}")
    
    # Account info
    print("\n4. Account Information:")
    account = client.get_account_info()
    if account["success"]:
        data = account["data"]
        print(f"   Can Trade: {data['can_trade']}")
        print(f"   Can Deposit: {data['can_deposit']}")
        print(f"   Can Withdraw: {data['can_withdraw']}")
        print(f"   Maker Commission: {data['maker_commission']}%")
        print(f"   Taker Commission: {data['taker_commission']}%")
    else:
        print(f"   ❌ Failed to get account: {account['message']}")
    
    # Balances
    print("\n5. Account Balances:")
    if account["success"] and account["data"]["balances"]:
        for balance in account["data"]["balances"][:10]:  # Show top 10
            print(f"   {balance['asset']}: {balance['free']:.8f} (free) + {balance['locked']:.8f} (locked)")
        if len(account["data"]["balances"]) > 10:
            print(f"   ... and {len(account['data']['balances']) - 10} more assets")
    else:
        print("   No balances found")
    
    # Price test
    print("\n6. Price Test (BTCUSDT):")
    price = client.get_ticker_price("BTCUSDT")
    if price["success"]:
        print(f"   BTCUSDT Price: ${float(price['data']['price']):,.2f}")
    else:
        print(f"   ❌ Failed to get price: {price['message']}")
    
    # 24h stats
    print("\n7. 24h Statistics (BTCUSDT):")
    stats = client.get_ticker_24h("BTCUSDT")
    if stats["success"]:
        data = stats["data"]
        print(f"   Price Change: {float(data['priceChangePercent']):.2f}%")
        print(f"   High: ${float(data['highPrice']):,.2f}")
        print(f"   Low: ${float(data['lowPrice']):,.2f}")
        print(f"   Volume: {float(data['volume']):,.2f} BTC")
    
    # Open orders
    print("\n8. Open Orders:")
    orders = client.get_open_orders()
    if orders["success"]:
        if orders["data"]:
            print(f"   Found {len(orders['data'])} open order(s):")
            for order in orders["data"][:5]:
                print(f"   - {order['symbol']}: {order['side']} {order['quantity']} @ {order['price']}")
        else:
            print("   No open orders")
    else:
        print(f"   ❌ Failed to get orders: {orders['message']}")
    
    # Recent trades (if any)
    print("\n9. Recent Trades (BTCUSDT):")
    trades = client.get_my_trades("BTCUSDT", limit=5)
    if trades["success"]:
        if trades["data"]:
            print(f"   Found {trades['count']} trade(s):")
            for trade in trades["data"]:
                side = "BUY" if trade["is_buyer"] else "SELL"
                print(f"   - {side} {trade['quantity']} @ {trade['price']} = {trade['quote_qty']} USDT")
        else:
            print("   No trades found")
    
    # Deposit info (may not work on testnet)
    print("\n10. Deposit Info Test:")
    if testnet:
        print("   ⚠️  Deposit/Withdraw APIs have limited support on testnet")
    else:
        deposit = client.get_deposit_address("BTC")
        if deposit["success"]:
            print(f"   BTC Deposit Address: {deposit['data']['address'][:20]}...")
        else:
            print(f"   Note: {deposit['message']}")
    
    print("\n" + "=" * 60)
    print("✅ Connection test completed!")
    print("=" * 60)
    
    print("\nYour Binance connection is working. You can now start the API:")
    print("  cd backend")
    print("  uvicorn main:app --reload --port 8000")
    print("\nAPI docs will be available at: http://localhost:8000/docs")
    
    return True


def main():
    parser = argparse.ArgumentParser(description="Test Binance API Connection")
    parser.add_argument("--api-key", type=str, help="Binance API key")
    parser.add_argument("--api-secret", type=str, help="Binance API secret")
    parser.add_argument("--testnet", action="store_true", default=True, help="Use testnet (default: True)")
    parser.add_argument("--production", action="store_true", help="Use production API")
    args = parser.parse_args()
    
    # Load from .env if no args provided
    load_dotenv()
    
    api_key = args.api_key or os.getenv("BINANCE_API_KEY")
    api_secret = args.api_secret or os.getenv("BINANCE_API_SECRET")
    testnet = not args.production
    
    if not all([api_key, api_secret]):
        print("=" * 60)
        print("ERROR: Missing API credentials")
        print("=" * 60)
        print("\nPlease provide credentials via:")
        print("  1. Command line: --api-key YOUR_KEY --api-secret YOUR_SECRET")
        print("  2. Environment file (.env):")
        print("     BINANCE_API_KEY=your_key")
        print("     BINANCE_API_SECRET=your_secret")
        print("\nTo get testnet credentials:")
        print("  1. Go to https://testnet.binance.vision/")
        print("  2. Login with GitHub")
        print("  3. Generate HMAC_SHA256 Key")
        sys.exit(1)
    
    test_connection(api_key, api_secret, testnet)


if __name__ == "__main__":
    main()
