import React, { useState, useEffect } from 'react';
import {
  Plane,
  IndianRupee,
  MapPin,
  Tags,
  Users,
  Calendar,
  TrendingUp,
  Award,
} from 'lucide-react';
import { CombinedData } from '../types';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { CategoryDoughnutChart, DestinationBarChart } from '../components/Charts';

interface CombinedViewProps {
  refreshTrigger?: number;
}

export const CombinedView: React.FC<CombinedViewProps> = ({ refreshTrigger }) => {
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCombined();
      setData(res);
    } catch (err) {
      console.error('Failed to load combined data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Analyzing all vacation histories...
      </div>
    );
  }

  const formatInr = (val: number) =>
    `₹ ${Number(val).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const topTrip = data?.trips && data.trips.length > 0 ? data.trips[0] : null;

  return (
    <div className="combined-view">
      <div className="view-header">
        <div>
          <h2>Combined Vacation Analytics</h2>
          <p className="view-subtitle">
            Holistic lifetime analysis and breakdown across all the vacations you have taken
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid-stats">
        <StatCard
          title="All-Time Vacations"
          value={data?.total_trips || 0}
          subtitle="Lifetime trips logged"
          icon={Plane}
          iconColor="#3B82F6"
        />
        <StatCard
          title="Lifetime Travel Spend"
          value={formatInr(data?.total_spent_inr || 0)}
          subtitle="Consolidated total in INR"
          icon={IndianRupee}
          iconColor="#10B981"
        />
        <StatCard
          title="Average Spend Per Trip"
          value={
            data?.total_trips && data.total_trips > 0
              ? formatInr(data.total_spent_inr / data.total_trips)
              : '₹ 0'
          }
          subtitle="Mean vacation expenditure"
          icon={TrendingUp}
          iconColor="#F59E0B"
        />
      </div>

      {/* Visual Charts */}
      <div className="grid-2col">
        <div className="glass-card chart-card">
          <div className="card-head">
            <Tags size={18} color="var(--brand-primary)" />
            <h3>Consolidated Category Distribution</h3>
          </div>
          <CategoryDoughnutChart data={data?.category_breakdown || []} />
        </div>

        <div className="glass-card chart-card">
          <div className="card-head">
            <MapPin size={18} color="#06B6D4" />
            <h3>Spending Across Destinations</h3>
          </div>
          <DestinationBarChart data={data?.destination_breakdown || []} />
        </div>
      </div>

      {/* Detailed Category Table with Visual Percentage Bars */}
      <div className="glass-card table-section">
        <div className="card-head">
          <Award size={18} color="#F59E0B" />
          <h3>Category Spending Breakdown & Share</h3>
        </div>

        <div className="category-bars-list">
          {data?.category_breakdown && data.category_breakdown.length > 0 ? (
            data.category_breakdown.map((cat, idx) => (
              <div key={idx} className="category-bar-item">
                <div className="bar-header">
                  <div className="cat-name-box">
                    <span
                      className="cat-dot"
                      style={{ background: cat.color || '#3B82F6' }}
                    />
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-count">({cat.count} items)</span>
                  </div>
                  <div className="cat-totals">
                    <span className="cat-amount">{formatInr(cat.total)}</span>
                    <span className="cat-pct">{cat.percentage}%</span>
                  </div>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${cat.percentage}%`,
                      background: cat.color || '#3B82F6',
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No category data available.</p>
          )}
        </div>
      </div>

      {/* Member Spending Table if available */}
      {data?.member_spending && data.member_spending.length > 0 && (
        <div className="glass-card member-section">
          <div className="card-head">
            <Users size={18} color="#8B5CF6" />
            <h3>Spending by Family Member</h3>
          </div>

          <div className="members-grid">
            {data.member_spending.map((m, idx) => (
              <div key={idx} className="member-spent-card">
                <div
                  className="member-avatar"
                  style={{ background: m.avatar_color || '#8B5CF6' }}
                >
                  {m.name.charAt(0)}
                </div>
                <div className="member-info">
                  <span className="member-name">{m.name}</span>
                  <span className="member-count">{m.count} expenses paid</span>
                </div>
                <div className="member-amount">
                  <span className="amount-inr">{formatInr(m.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .combined-view {
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

        .chart-card, .table-section, .member-section {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .card-head {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.25rem;
        }

        .card-head h3 {
          font-size: 1.15rem;
        }

        .category-bars-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .category-bar-item {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .bar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cat-name-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cat-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .cat-name {
          font-size: 0.925rem;
          font-weight: 600;
        }

        .cat-count {
          font-size: 0.775rem;
          color: var(--text-muted);
        }

        .cat-totals {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cat-amount {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .cat-pct {
          font-size: 0.8rem;
          color: var(--text-muted);
          min-width: 42px;
          text-align: right;
        }

        .progress-track {
          width: 100%;
          height: 8px;
          background: var(--bg-subtle);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.5s ease-in-out;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }

        .member-spent-card {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1rem;
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }

        .member-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .member-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .member-name {
          font-weight: 600;
          font-size: 0.925rem;
        }

        .member-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .member-amount {
          text-align: right;
        }

        .amount-inr {
          font-weight: 700;
          color: var(--status-success);
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};
