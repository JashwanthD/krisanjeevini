import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface ForecastResult {
  commodity: string;
  region: string;
  days: number;
  prices: number[];
  current_price: number;
  predicted_price: number;
  price_change_pct: number;
  signal: 'HOLD' | 'SELL';
}

const COMMODITIES = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'tur', 'jowar', 'ragi', 'groundnut', 'soybean'];
const REGIONS = ['bangalore_rural', 'belgaum', 'bellary', 'mysore', 'hubli', 'gulbarga', 'raichur', 'shimoga', 'davangere', 'tumkur'];

/**
 * Module C: Distributed Market Price Forecasting
 * Commodity + region selector, 30-day canvas chart, SELL/HOLD signal.
 */
export default function ModuleMarket() {
  const { t } = useLanguage();
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const [commodity, setCommodity] = useState(COMMODITIES[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Draw chart when result changes
  useEffect(() => {
    if (result && chartCanvasRef.current) {
      drawChart(chartCanvasRef.current, result.prices, result.signal);
    }
  }, [result]);

  const handleForecast = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/market/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commodity, region, days: 30 }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: ForecastResult = await response.json();
      setResult(data);
    } catch (err) {
      setApiError(t('app.backendError'));
    } finally {
      setLoading(false);
    }
  }, [commodity, region, t]);

  /**
   * Draw a simple price trend line chart on canvas.
   * No external charting library — lightweight and fast.
   */
  function drawChart(canvas: HTMLCanvasElement, prices: number[], signal: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padding = { top: 20, right: 16, bottom: 30, left: 50 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, W, H);

    if (prices.length < 2) return;

    const minPrice = Math.min(...prices) * 0.98;
    const maxPrice = Math.max(...prices) * 1.02;
    const priceRange = maxPrice - minPrice || 1;

    const toX = (i: number) => padding.left + (i / (prices.length - 1)) * chartW;
    const toY = (p: number) => padding.top + (1 - (p - minPrice) / priceRange) * chartH;

    // Grid lines
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 0.5;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (i / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      // Price label
      const priceVal = maxPrice - (i / gridLines) * priceRange;
      ctx.fillStyle = '#9E9E9E';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`₹${Math.round(priceVal)}`, padding.left - 6, y + 3);
    }

    // X-axis labels
    ctx.fillStyle = '#9E9E9E';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const xLabels = [0, 7, 14, 21, 29];
    xLabels.forEach(i => {
      if (i < prices.length) {
        ctx.fillText(`D${i + 1}`, toX(i), H - 8);
      }
    });

    // Area fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    if (signal === 'HOLD') {
      gradient.addColorStop(0, 'rgba(46, 125, 50, 0.2)');
      gradient.addColorStop(1, 'rgba(46, 125, 50, 0.02)');
    } else {
      gradient.addColorStop(0, 'rgba(198, 40, 40, 0.2)');
      gradient.addColorStop(1, 'rgba(198, 40, 40, 0.02)');
    }

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(prices[0]));
    for (let i = 1; i < prices.length; i++) {
      ctx.lineTo(toX(i), toY(prices[i]));
    }
    ctx.lineTo(toX(prices.length - 1), padding.top + chartH);
    ctx.lineTo(toX(0), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(prices[0]));
    for (let i = 1; i < prices.length; i++) {
      ctx.lineTo(toX(i), toY(prices[i]));
    }
    ctx.strokeStyle = signal === 'HOLD' ? '#2E7D32' : '#C62828';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Start & end dots
    [0, prices.length - 1].forEach(i => {
      ctx.beginPath();
      ctx.arc(toX(i), toY(prices[i]), 4, 0, Math.PI * 2);
      ctx.fillStyle = signal === 'HOLD' ? '#2E7D32' : '#C62828';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  return (
    <div>
      <div className="module-card">
        <h2 className="module-title" id="module-market-title">{t('market.title')}</h2>
        <p className="module-desc">{t('market.description')}</p>

        {/* Commodity Selector */}
        <div className="form-group">
          <label className="form-label" htmlFor="market-commodity">
            {t('market.commodity')}
          </label>
          <select
            id="market-commodity"
            className="form-select"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
          >
            {COMMODITIES.map(c => (
              <option key={c} value={c}>
                {t(`market.commodities.${c}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Region Selector */}
        <div className="form-group">
          <label className="form-label" htmlFor="market-region">
            {t('market.region')}
          </label>
          <select
            id="market-region"
            className="form-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {REGIONS.map(r => (
              <option key={r} value={r}>
                {t(`market.regions.${r}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Forecast Button */}
        <button
          id="market-forecast-btn"
          className="btn btn-primary"
          onClick={handleForecast}
          disabled={loading}
        >
          {loading ? (
            <>⏳ {t('market.forecasting')}</>
          ) : (
            <>📊 {t('market.forecast')}</>
          )}
        </button>

        {apiError && (
          <div className="result-card danger" style={{ marginTop: 16 }}>
            <div className="result-title">⚠️ {t('app.error')}</div>
            <div className="result-value" style={{ fontSize: '0.95rem' }}>{apiError}</div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="module-card" id="market-result-card">
          {/* Price Chart */}
          <div className="form-label">📈 {t('market.priceChart')}</div>
          <div className="price-chart-container">
            <canvas ref={chartCanvasRef} />
          </div>

          {/* Price Stats Grid */}
          <div className="price-stats">
            <div className="price-stat">
              <div className="stat-label">{t('market.currentPrice')}</div>
              <div className="stat-value">₹{result.current_price.toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: '#9E9E9E' }}>{t('market.perQuintal')}</div>
            </div>
            <div className="price-stat">
              <div className="stat-label">{t('market.predictedPrice')}</div>
              <div className="stat-value">₹{result.predicted_price.toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: '#9E9E9E' }}>{t('market.perQuintal')}</div>
            </div>
            <div className="price-stat" style={{ gridColumn: '1 / -1' }}>
              <div className="stat-label">{t('market.priceChange')}</div>
              <div className={`stat-value ${result.price_change_pct >= 0 ? 'positive' : 'negative'}`}>
                {result.price_change_pct >= 0 ? '▲' : '▼'} {Math.abs(result.price_change_pct)}%
              </div>
            </div>
          </div>

          {/* SELL / HOLD Signal Banner */}
          <div className={`signal-banner ${result.signal === 'HOLD' ? 'hold' : 'sell'}`}>
            <div className="signal-label">
              {result.signal === 'HOLD' ? '🟢' : '🔴'}{' '}
              {result.signal === 'HOLD' ? t('market.hold') : t('market.sell')}
            </div>
            <div className="signal-desc">
              {result.signal === 'HOLD' ? t('market.holdDesc') : t('market.sellDesc')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
