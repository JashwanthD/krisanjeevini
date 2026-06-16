import React, { useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface SowingResult {
  crop: string;
  confidence: number;
  sowing_window: string;
  sowing_weeks: Array<{ month: string; week: number }>;
}

interface FieldConfig {
  key: string;
  labelKey: string;
  unitKey: string;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
}

const FIELDS: FieldConfig[] = [
  { key: 'N', labelKey: 'sowing.nitrogen', unitKey: 'sowing.nitrogenUnit', min: 0, max: 200, step: 1, defaultVal: 50 },
  { key: 'P', labelKey: 'sowing.phosphorus', unitKey: 'sowing.phosphorusUnit', min: 0, max: 200, step: 1, defaultVal: 50 },
  { key: 'K', labelKey: 'sowing.potassium', unitKey: 'sowing.potassiumUnit', min: 0, max: 300, step: 1, defaultVal: 50 },
  { key: 'temperature', labelKey: 'sowing.temperature', unitKey: 'sowing.temperatureUnit', min: -5, max: 55, step: 0.5, defaultVal: 25 },
  { key: 'humidity', labelKey: 'sowing.humidity', unitKey: 'sowing.humidityUnit', min: 0, max: 100, step: 1, defaultVal: 70 },
  { key: 'rainfall', labelKey: 'sowing.rainfall', unitKey: 'sowing.rainfallUnit', min: 0, max: 500, step: 5, defaultVal: 100 },
  { key: 'ph', labelKey: 'sowing.ph', unitKey: 'sowing.phUnit', min: 0, max: 14, step: 0.1, defaultVal: 6.5 },
];

/**
 * Module A: Predictive Sowing Analytics
 * Step-by-step numeric input form with bilingual labels.
 * Calls backend API for crop recommendation.
 */
export default function ModuleSowing() {
  const { t, lang } = useLanguage();
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    FIELDS.forEach(f => { init[f.key] = f.defaultVal; });
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SowingResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = useCallback((key: string, value: string) => {
    const num = parseFloat(value);
    setValues(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    FIELDS.forEach(f => {
      const val = values[f.key];
      if (val === undefined || val === null || isNaN(val)) {
        newErrors[f.key] = t('sowing.validation.number');
      } else if (val < f.min) {
        newErrors[f.key] = t('sowing.validation.min');
      } else if (val > f.max) {
        newErrors[f.key] = t('sowing.validation.max');
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/sowing/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: SowingResult = await response.json();
      setResult(data);
    } catch (err) {
      setApiError(t('app.backendError'));
    } finally {
      setLoading(false);
    }
  }, [values, validate, t]);

  // Resolve crop name from translation
  const getCropName = (cropKey: string): string => {
    const translated = t(`sowing.crops.${cropKey}`);
    return translated !== `sowing.crops.${cropKey}` ? translated : cropKey;
  };

  return (
    <div>
      <div className="module-card">
        <h2 className="module-title" id="module-sowing-title">{t('sowing.title')}</h2>
        <p className="module-desc">{t('sowing.description')}</p>

        {FIELDS.map((field) => (
          <div className="form-group" key={field.key}>
            <label className="form-label" htmlFor={`sowing-${field.key}`}>
              {t(field.labelKey)}
              {t(field.unitKey) && (
                <span className="unit"> ({t(field.unitKey)})</span>
              )}
            </label>
            <input
              id={`sowing-${field.key}`}
              type="number"
              className={`form-input ${errors[field.key] ? 'error' : ''}`}
              value={values[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step}
              inputMode="decimal"
              aria-label={t(field.labelKey)}
            />
            {errors[field.key] && (
              <div className="form-error">{errors[field.key]}</div>
            )}
          </div>
        ))}

        <button
          id="sowing-predict-btn"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner">⏳</span>
              {t('sowing.predicting')}
            </>
          ) : (
            <>🌱 {t('sowing.predict')}</>
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
        <div className="module-card" id="sowing-result-card">
          <div className="result-card success">
            <div className="result-title">🌾 {t('sowing.result')}</div>
            <div className="result-value" style={{ textTransform: 'capitalize' }}>
              {getCropName(result.crop)}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="form-label">{t('sowing.confidence')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="confidence-bar" style={{ flex: 1 }}>
                <div
                  className="confidence-bar-fill"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="form-label">📅 {t('sowing.sowingWindow')}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {result.sowing_window}
            </div>
          </div>

          {result.sowing_weeks && result.sowing_weeks.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="form-label">{t('sowing.calendar')}</div>
              <div className="sowing-calendar">
                {result.sowing_weeks.map((w, i) => (
                  <span key={i} className="sowing-week">
                    {w.month} {t('sowing.weekStart')} {w.week}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
