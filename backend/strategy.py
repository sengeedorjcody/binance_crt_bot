"""
Trading Strategy Module
Implements CRT (Candle Range Theory) + TBS (Turtle Body Soup) Strategy
with indicator calculations
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import statistics


@dataclass
class Candle:
    """Candlestick data"""
    time: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass
class Signal:
    """Trading signal"""
    type: str  # 'BUY', 'SELL', 'NONE'
    price: float
    time: datetime
    reason: str
    confidence: float  # 0-1
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None


@dataclass 
class IndicatorValues:
    """All indicator values for a candle"""
    time: datetime
    price: float
    
    # Moving Averages
    ema_9: Optional[float] = None
    ema_21: Optional[float] = None
    ema_50: Optional[float] = None
    sma_200: Optional[float] = None
    
    # RSI
    rsi: Optional[float] = None
    
    # MACD
    macd_line: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    
    # Bollinger Bands
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    
    # ATR
    atr: Optional[float] = None
    
    # CRT/TBS specific
    swing_high: Optional[float] = None
    swing_low: Optional[float] = None
    is_liquidity_sweep: bool = False
    is_fvg: bool = False  # Fair Value Gap
    fvg_high: Optional[float] = None
    fvg_low: Optional[float] = None
    
    # Signal
    signal: Optional[str] = None  # 'BUY', 'SELL', None


class TechnicalIndicators:
    """Calculate technical indicators"""
    
    @staticmethod
    def ema(prices: List[float], period: int) -> List[Optional[float]]:
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return [None] * len(prices)
        
        result = [None] * (period - 1)
        multiplier = 2 / (period + 1)
        
        # First EMA is SMA
        sma = sum(prices[:period]) / period
        result.append(sma)
        
        # Calculate EMA for remaining prices
        for i in range(period, len(prices)):
            ema_val = (prices[i] * multiplier) + (result[-1] * (1 - multiplier))
            result.append(ema_val)
        
        return result
    
    @staticmethod
    def sma(prices: List[float], period: int) -> List[Optional[float]]:
        """Calculate Simple Moving Average"""
        if len(prices) < period:
            return [None] * len(prices)
        
        result = [None] * (period - 1)
        for i in range(period - 1, len(prices)):
            sma_val = sum(prices[i - period + 1:i + 1]) / period
            result.append(sma_val)
        
        return result
    
    @staticmethod
    def rsi(prices: List[float], period: int = 14) -> List[Optional[float]]:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return [None] * len(prices)
        
        result = [None] * period
        
        # Calculate price changes
        changes = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        
        # Separate gains and losses
        gains = [max(0, c) for c in changes]
        losses = [abs(min(0, c)) for c in changes]
        
        # First average
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period
        
        if avg_loss == 0:
            result.append(100)
        else:
            rs = avg_gain / avg_loss
            result.append(100 - (100 / (1 + rs)))
        
        # Calculate remaining RSI values
        for i in range(period, len(changes)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period
            
            if avg_loss == 0:
                result.append(100)
            else:
                rs = avg_gain / avg_loss
                result.append(100 - (100 / (1 + rs)))
        
        return result
    
    @staticmethod
    def macd(prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[Optional[float]]]:
        """Calculate MACD"""
        ema_fast = TechnicalIndicators.ema(prices, fast)
        ema_slow = TechnicalIndicators.ema(prices, slow)
        
        macd_line = []
        for i in range(len(prices)):
            if ema_fast[i] is not None and ema_slow[i] is not None:
                macd_line.append(ema_fast[i] - ema_slow[i])
            else:
                macd_line.append(None)
        
        # Filter out None values for signal calculation
        valid_macd = [v for v in macd_line if v is not None]
        if len(valid_macd) >= signal:
            signal_line_values = TechnicalIndicators.ema(valid_macd, signal)
            # Pad with None to match original length
            signal_line = [None] * (len(macd_line) - len(signal_line_values)) + signal_line_values
        else:
            signal_line = [None] * len(prices)
        
        histogram = []
        for i in range(len(prices)):
            if macd_line[i] is not None and signal_line[i] is not None:
                histogram.append(macd_line[i] - signal_line[i])
            else:
                histogram.append(None)
        
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        }
    
    @staticmethod
    def bollinger_bands(prices: List[float], period: int = 20, std_dev: float = 2.0) -> Dict[str, List[Optional[float]]]:
        """Calculate Bollinger Bands"""
        sma = TechnicalIndicators.sma(prices, period)
        
        upper = []
        lower = []
        
        for i in range(len(prices)):
            if sma[i] is not None:
                window = prices[max(0, i - period + 1):i + 1]
                std = statistics.stdev(window) if len(window) > 1 else 0
                upper.append(sma[i] + (std_dev * std))
                lower.append(sma[i] - (std_dev * std))
            else:
                upper.append(None)
                lower.append(None)
        
        return {
            'upper': upper,
            'middle': sma,
            'lower': lower
        }
    
    @staticmethod
    def atr(candles: List[Candle], period: int = 14) -> List[Optional[float]]:
        """Calculate Average True Range"""
        if len(candles) < period + 1:
            return [None] * len(candles)
        
        true_ranges = [candles[0].high - candles[0].low]  # First TR is just range
        
        for i in range(1, len(candles)):
            high_low = candles[i].high - candles[i].low
            high_close = abs(candles[i].high - candles[i-1].close)
            low_close = abs(candles[i].low - candles[i-1].close)
            true_ranges.append(max(high_low, high_close, low_close))
        
        result = [None] * (period - 1)
        atr_val = sum(true_ranges[:period]) / period
        result.append(atr_val)
        
        for i in range(period, len(true_ranges)):
            atr_val = (atr_val * (period - 1) + true_ranges[i]) / period
            result.append(atr_val)
        
        return result

    @staticmethod
    def volume_profile(candles: List[Candle], num_bins: int = 20) -> Dict:
        """
        Calculate Volume Profile - volume distribution across price levels
        Returns price levels with corresponding volume
        """
        if len(candles) < 2:
            return {'levels': [], 'poc': None, 'vah': None, 'val': None}
        
        # Find price range
        all_highs = [c.high for c in candles]
        all_lows = [c.low for c in candles]
        price_high = max(all_highs)
        price_low = min(all_lows)
        price_range = price_high - price_low
        
        if price_range == 0:
            return {'levels': [], 'poc': None, 'vah': None, 'val': None}
        
        bin_size = price_range / num_bins
        
        # Initialize volume bins
        volume_bins = {}
        for i in range(num_bins):
            bin_price = price_low + (i + 0.5) * bin_size
            volume_bins[i] = {'price': bin_price, 'volume': 0, 'buy_volume': 0, 'sell_volume': 0}
        
        # Distribute volume across price bins
        for i, candle in enumerate(candles):
            # Determine which bins this candle touches
            candle_low_bin = int((candle.low - price_low) / bin_size)
            candle_high_bin = int((candle.high - price_low) / bin_size)
            
            candle_low_bin = max(0, min(candle_low_bin, num_bins - 1))
            candle_high_bin = max(0, min(candle_high_bin, num_bins - 1))
            
            # Distribute volume proportionally across bins
            bins_touched = candle_high_bin - candle_low_bin + 1
            vol_per_bin = candle.volume / bins_touched
            
            is_bullish = candle.close >= candle.open
            
            for bin_idx in range(candle_low_bin, candle_high_bin + 1):
                volume_bins[bin_idx]['volume'] += vol_per_bin
                if is_bullish:
                    volume_bins[bin_idx]['buy_volume'] += vol_per_bin
                else:
                    volume_bins[bin_idx]['sell_volume'] += vol_per_bin
        
        # Convert to list and sort by price
        levels = list(volume_bins.values())
        levels.sort(key=lambda x: x['price'])
        
        # Find POC (Point of Control) - price level with highest volume
        poc_level = max(levels, key=lambda x: x['volume'])
        poc = poc_level['price']
        
        # Calculate Value Area (70% of volume)
        total_volume = sum(l['volume'] for l in levels)
        value_area_volume = total_volume * 0.70
        
        # Start from POC and expand outward
        poc_idx = levels.index(poc_level)
        accumulated_volume = poc_level['volume']
        low_idx = poc_idx
        high_idx = poc_idx
        
        while accumulated_volume < value_area_volume:
            # Check which direction to expand
            expand_low = low_idx > 0
            expand_high = high_idx < len(levels) - 1
            
            if not expand_low and not expand_high:
                break
            
            low_vol = levels[low_idx - 1]['volume'] if expand_low else 0
            high_vol = levels[high_idx + 1]['volume'] if expand_high else 0
            
            if low_vol >= high_vol and expand_low:
                low_idx -= 1
                accumulated_volume += levels[low_idx]['volume']
            elif expand_high:
                high_idx += 1
                accumulated_volume += levels[high_idx]['volume']
            elif expand_low:
                low_idx -= 1
                accumulated_volume += levels[low_idx]['volume']
            else:
                break
        
        val = levels[low_idx]['price']  # Value Area Low
        vah = levels[high_idx]['price']  # Value Area High
        
        # Normalize volume for display (0-100%)
        max_volume = max(l['volume'] for l in levels) if levels else 1
        for level in levels:
            level['volume_pct'] = (level['volume'] / max_volume) * 100 if max_volume > 0 else 0
            level['buy_pct'] = (level['buy_volume'] / level['volume'] * 100) if level['volume'] > 0 else 50
        
        return {
            'levels': levels,
            'poc': poc,
            'vah': vah,
            'val': val,
            'price_high': price_high,
            'price_low': price_low
        }


class CRTStrategy:
    """
    CRT (Candle Range Theory) + TBS (Turtle Body Soup) Strategy
    
    Key concepts:
    - Liquidity sweeps: Price takes out swing highs/lows
    - Fair Value Gaps (FVG): Imbalance in price
    - Market structure shifts
    """
    
    def __init__(self, swing_lookback: int = 5, atr_multiplier: float = 1.5):
        self.swing_lookback = swing_lookback
        self.atr_multiplier = atr_multiplier
        self.indicators = TechnicalIndicators()
    
    def find_swing_highs(self, candles: List[Candle]) -> List[Dict]:
        """Find swing high points"""
        swings = []
        for i in range(self.swing_lookback, len(candles) - self.swing_lookback):
            is_swing = True
            for j in range(1, self.swing_lookback + 1):
                if candles[i].high <= candles[i-j].high or candles[i].high <= candles[i+j].high:
                    is_swing = False
                    break
            if is_swing:
                swings.append({
                    'index': i,
                    'price': candles[i].high,
                    'time': candles[i].time
                })
        return swings
    
    def find_swing_lows(self, candles: List[Candle]) -> List[Dict]:
        """Find swing low points"""
        swings = []
        for i in range(self.swing_lookback, len(candles) - self.swing_lookback):
            is_swing = True
            for j in range(1, self.swing_lookback + 1):
                if candles[i].low >= candles[i-j].low or candles[i].low >= candles[i+j].low:
                    is_swing = False
                    break
            if is_swing:
                swings.append({
                    'index': i,
                    'price': candles[i].low,
                    'time': candles[i].time
                })
        return swings
    
    def detect_liquidity_sweep(self, candles: List[Candle], index: int, swing_highs: List[Dict], swing_lows: List[Dict]) -> Dict:
        """
        Detect if current candle swept liquidity above swing high or below swing low
        """
        result = {'swept_high': False, 'swept_low': False, 'level': None}
        
        if index < 1:
            return result
        
        current = candles[index]
        prev = candles[index - 1]
        
        # Check for sweep of swing highs (bearish signal)
        for swing in swing_highs:
            if swing['index'] < index - 1:  # Must be a previous swing
                if prev.high < swing['price'] and current.high > swing['price'] and current.close < swing['price']:
                    result['swept_high'] = True
                    result['level'] = swing['price']
                    break
        
        # Check for sweep of swing lows (bullish signal)
        for swing in swing_lows:
            if swing['index'] < index - 1:
                if prev.low > swing['price'] and current.low < swing['price'] and current.close > swing['price']:
                    result['swept_low'] = True
                    result['level'] = swing['price']
                    break
        
        return result
    
    def detect_fvg(self, candles: List[Candle], index: int) -> Dict:
        """
        Detect Fair Value Gap (FVG)
        Bullish FVG: Gap between candle[i-2].high and candle[i].low
        Bearish FVG: Gap between candle[i-2].low and candle[i].high
        """
        result = {'bullish_fvg': False, 'bearish_fvg': False, 'fvg_high': None, 'fvg_low': None}
        
        if index < 2:
            return result
        
        c0 = candles[index]
        c2 = candles[index - 2]
        
        # Bullish FVG
        if c0.low > c2.high:
            result['bullish_fvg'] = True
            result['fvg_high'] = c0.low
            result['fvg_low'] = c2.high
        
        # Bearish FVG
        if c0.high < c2.low:
            result['bearish_fvg'] = True
            result['fvg_high'] = c2.low
            result['fvg_low'] = c0.high
        
        return result
    
    def analyze(self, candles: List[Candle]) -> List[IndicatorValues]:
        """
        Analyze candles and calculate all indicators
        Returns list of IndicatorValues for each candle
        """
        if len(candles) < 50:
            return []
        
        closes = [c.close for c in candles]
        
        # Calculate indicators
        ema_9 = self.indicators.ema(closes, 9)
        ema_21 = self.indicators.ema(closes, 21)
        ema_50 = self.indicators.ema(closes, 50)
        sma_200 = self.indicators.sma(closes, 200) if len(closes) >= 200 else [None] * len(closes)
        rsi = self.indicators.rsi(closes, 14)
        macd = self.indicators.macd(closes)
        bb = self.indicators.bollinger_bands(closes)
        atr = self.indicators.atr(candles)
        
        # Find swings
        swing_highs = self.find_swing_highs(candles)
        swing_lows = self.find_swing_lows(candles)
        
        results = []
        
        for i, candle in enumerate(candles):
            # Detect patterns
            liquidity = self.detect_liquidity_sweep(candles, i, swing_highs, swing_lows)
            fvg = self.detect_fvg(candles, i)
            
            # Find nearest swing levels
            nearest_high = None
            nearest_low = None
            for sh in swing_highs:
                if sh['index'] < i:
                    nearest_high = sh['price']
            for sl in swing_lows:
                if sl['index'] < i:
                    nearest_low = sl['price']
            
            # Generate signal
            signal = self._generate_signal(
                candle, i, candles,
                ema_9[i], ema_21[i], ema_50[i],
                rsi[i], macd, atr[i],
                liquidity, fvg
            )
            
            indicator_val = IndicatorValues(
                time=candle.time,
                price=candle.close,
                ema_9=ema_9[i],
                ema_21=ema_21[i],
                ema_50=ema_50[i],
                sma_200=sma_200[i],
                rsi=rsi[i],
                macd_line=macd['macd'][i],
                macd_signal=macd['signal'][i],
                macd_histogram=macd['histogram'][i],
                bb_upper=bb['upper'][i],
                bb_middle=bb['middle'][i],
                bb_lower=bb['lower'][i],
                atr=atr[i],
                swing_high=nearest_high,
                swing_low=nearest_low,
                is_liquidity_sweep=liquidity['swept_high'] or liquidity['swept_low'],
                is_fvg=fvg['bullish_fvg'] or fvg['bearish_fvg'],
                fvg_high=fvg['fvg_high'],
                fvg_low=fvg['fvg_low'],
                signal=signal
            )
            results.append(indicator_val)
        
        return results
    
    def _generate_signal(
        self, candle: Candle, index: int, candles: List[Candle],
        ema_9: float, ema_21: float, ema_50: float,
        rsi: float, macd: Dict, atr: float,
        liquidity: Dict, fvg: Dict
    ) -> Optional[str]:
        """Generate trading signal based on CRT strategy"""
        
        if not all([ema_9, ema_21, rsi, atr]):
            return None
        
        # CRT BUY Signal:
        # 1. Liquidity sweep below swing low
        # 2. Bullish FVG or close above EMA9
        # 3. RSI not overbought
        if liquidity['swept_low']:
            if fvg['bullish_fvg'] or candle.close > ema_9:
                if rsi < 70:
                    return 'BUY'
        
        # CRT SELL Signal:
        # 1. Liquidity sweep above swing high
        # 2. Bearish FVG or close below EMA9
        # 3. RSI not oversold
        if liquidity['swept_high']:
            if fvg['bearish_fvg'] or candle.close < ema_9:
                if rsi > 30:
                    return 'SELL'
        
        return None


# Helper function to convert API klines to Candle objects
def klines_to_candles(klines: List[Dict]) -> List[Candle]:
    """Convert API kline data to Candle objects"""
    candles = []
    for k in klines:
        candles.append(Candle(
            time=datetime.fromisoformat(k['open_time'].replace('Z', '+00:00')) if isinstance(k['open_time'], str) else k['open_time'],
            open=float(k['open']),
            high=float(k['high']),
            low=float(k['low']),
            close=float(k['close']),
            volume=float(k['volume'])
        ))
    return candles


# Singleton strategy instance
crt_strategy = CRTStrategy()
