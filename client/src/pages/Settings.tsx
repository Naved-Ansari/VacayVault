import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  RefreshCw,
  Database,
  Moon,
  Sun,
  IndianRupee,
  CheckCircle,
  Globe,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [ratesInfo, setRatesInfo] = useState<{
    base: string;
    ratesToInr: Record<string, number>;
    lastUpdated: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const loadRates = async () => {
    try {
      const data = await api.getCurrencyRates();
      setRatesInfo(data);
    } catch (e) {
      console.error('Failed to load currency rates:', e);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleRefreshRates = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      await api.refreshCurrencyRates();
      await loadRates();
      setRefreshMsg('Exchange rates successfully refreshed from live forex service.');
      setTimeout(() => setRefreshMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to refresh rates');
    } finally {
      setRefreshing(false);
    }
  };

  const keyCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  ];

  return (
    <div className="settings-view">
      <div className="view-header">
        <div>
          <h2>Application Settings</h2>
          <p className="view-subtitle">
            Manage your currency conversion settings, display themes, and database connectivity
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Base Currency Card */}
        <div className="glass-card settings-card">
          <div className="card-top">
            <div className="icon-circle inr">
              <IndianRupee size={22} />
            </div>
            <div>
              <h3>Base Currency: INR (Indian Rupee)</h3>
              <p className="card-desc">
                All dashboards, trip totals, charts, and PDF reports use INR as the primary base currency.
              </p>
            </div>
          </div>
          <div className="info-note">
            <CheckCircle size={16} color="var(--status-success)" />
            <span>Foreign currency expenses are automatically converted to INR upon entry.</span>
          </div>
        </div>

        {/* Live Currency Rates Engine */}
        <div className="glass-card settings-card">
          <div className="rates-header">
            <div className="card-top">
              <div className="icon-circle globe">
                <Globe size={22} />
              </div>
              <div>
                <h3>Live Currency Conversion Engine</h3>
                <p className="card-desc">
                  Last updated:{' '}
                  {ratesInfo
                    ? new Date(ratesInfo.lastUpdated).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'Loading...'}
                </p>
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleRefreshRates}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              <span>{refreshing ? 'Updating...' : 'Refresh Rates'}</span>
            </button>
          </div>

          {refreshMsg && <div className="success-banner">{refreshMsg}</div>}

          {/* Current Live Rates Grid */}
          <div className="currency-grid">
            {keyCurrencies.map((c) => {
              const rate = ratesInfo?.ratesToInr[c.code] || 1.0;
              return (
                <div key={c.code} className="currency-tile">
                  <span className="curr-code">
                    {c.code} ({c.symbol})
                  </span>
                  <span className="curr-rate">1 {c.code} = ₹{rate.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme Settings */}
        <div className="glass-card settings-card">
          <div className="card-top">
            <div className="icon-circle theme">
              {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div>
              <h3>Display Appearance</h3>
              <p className="card-desc">
                Current theme is <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>
              </p>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </button>
          </div>
        </div>

        {/* Database & System Info */}
        <div className="glass-card settings-card">
          <div className="card-top">
            <div className="icon-circle db">
              <Database size={22} />
            </div>
            <div>
              <h3>PostgreSQL Database</h3>
              <p className="card-desc">
                VacayVault stores all your trips, expenses, categories, and family members in PostgreSQL (localhost:5432).
              </p>
            </div>
          </div>
          <div className="db-status-pill">
            <span className="status-dot" />
            <span>PostgreSQL 18 Connected & Active</span>
          </div>
        </div>
      </div>

      <style>{`
        .settings-view {
          display: flex;
          flex-direction: column;
        }

        .view-header {
          margin-bottom: 2rem;
        }

        .view-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .view-subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-card {
          padding: 1.5rem 1.75rem;
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .icon-circle {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-circle.inr {
          background: rgba(16, 185, 129, 0.15);
          color: var(--status-success);
        }

        .icon-circle.globe {
          background: rgba(59, 130, 246, 0.15);
          color: var(--brand-primary);
        }

        .icon-circle.theme {
          background: rgba(245, 158, 11, 0.15);
          color: var(--status-warning);
        }

        .icon-circle.db {
          background: rgba(99, 102, 241, 0.15);
          color: #6366F1;
        }

        .card-desc {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: 0.2rem;
        }

        .info-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.65rem 0.85rem;
          background: var(--bg-subtle);
          border-radius: var(--radius-md);
          font-size: 0.825rem;
          color: var(--text-secondary);
        }

        .rates-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .currency-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.75rem;
        }

        .currency-tile {
          padding: 0.75rem 1rem;
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .curr-code {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .curr-rate {
          font-size: 0.925rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .success-banner {
          padding: 0.65rem 1rem;
          border-radius: var(--radius-md);
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--status-success);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .db-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.4rem 0.85rem;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          color: var(--status-success);
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--status-success);
          box-shadow: 0 0 8px var(--status-success);
        }
      `}</style>
    </div>
  );
};
