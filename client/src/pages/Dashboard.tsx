import React, { useEffect, useState } from 'react';
import {
  Plane,
  Receipt,
  IndianRupee,
  Plus,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { CategoryDoughnutChart, DestinationBarChart } from '../components/Charts';
import { DashboardData, Trip } from '../types';
import { api } from '../api/client';
import { formatDate } from '../utils/dateUtils';

interface DashboardProps {
  onOpenCreateTrip: () => void;
  onSelectTrip: (tripId: number) => void;
  onNavigate: (tab: string) => void;
  refreshTrigger?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenCreateTrip,
  onSelectTrip,
  onNavigate,
  refreshTrigger,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
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
        Loading your travel vault...
      </div>
    );
  }

  const formatInr = (val: number) =>
    `₹ ${Number(val).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="dashboard-view">
      {/* Welcome Banner */}
      <div className="welcome-banner glass-card">
        <div className="welcome-text">
          <span className="welcome-pill">
            <Sparkles size={14} /> Personal Travel Vault
          </span>
          <h1>Welcome to VacayVault</h1>
          <p>
            Track and review your vacation expenses effortlessly. All your foreign expenditures
            are automatically converted to INR in real-time.
          </p>
        </div>
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={onOpenCreateTrip}>
            <Plane size={18} />
            <span>Create Trip</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-stats">
        <StatCard
          title="Total Vacations"
          value={data?.total_trips || 0}
          subtitle="Trips recorded"
          icon={Plane}
          iconColor="#3B82F6"
        />
        <StatCard
          title="Total Travel Spent"
          value={formatInr(data?.total_spent_inr || 0)}
          subtitle="Across all vacations (INR)"
          icon={IndianRupee}
          iconColor="#10B981"
        />
        <StatCard
          title="Total Expenses Logged"
          value={data?.total_expenses_count || 0}
          subtitle="Individual expense entries"
          icon={Receipt}
          iconColor="#F59E0B"
        />
      </div>

      {/* Charts Section: Category Donut & Destination Bar */}
      <div className="grid-2col">
        <div className="glass-card chart-container">
          <div className="section-header">
            <div>
              <h3>Spending by Category</h3>
              <span className="section-subtitle">Categorized expense distribution across all trips</span>
            </div>
          </div>
          <CategoryDoughnutChart data={data?.category_spending || []} />
        </div>

        <div className="glass-card chart-container">
          <div className="section-header">
            <div>
              <h3>Spending by Destination</h3>
              <span className="section-subtitle">Top expenditure locations across all trips</span>
            </div>
          </div>
          <DestinationBarChart data={data?.destination_spending || []} />
        </div>
      </div>

      {/* Recent Trips & Recent Expenses Two-Column Layout */}
      <div className="grid-2col">
        {/* Recent Vacations */}
        <div className="glass-card section-card">
          <div className="section-header">
            <div>
              <h3>Recent Vacations</h3>
              <span className="section-subtitle">Latest recorded travel adventures</span>
            </div>
            <button className="btn-link" onClick={() => onNavigate('trips')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="trips-list">
            {data?.recent_trips && data.recent_trips.length > 0 ? (
              data.recent_trips.map((trip) => (
                <div
                  key={trip.id}
                  className="recent-trip-item"
                  onClick={() => onSelectTrip(trip.id)}
                >
                  <div className="trip-main-info">
                    <h4 className="trip-name">{trip.name}</h4>
                    <div className="trip-meta">
                      <span className="meta-tag">
                        <Calendar size={13} />
                        {formatDate(trip.start_date, {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {trip.destinations && trip.destinations.length > 0 && (
                        <span className="meta-tag">
                          <MapPin size={13} />
                          {Array.isArray(trip.destinations)
                            ? trip.destinations.map((d: any) => (typeof d === 'string' ? d : d.name)).join(', ')
                            : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="trip-amount">
                    <span className="amount-label">Spent</span>
                    <span className="amount-val">{formatInr(trip.total_spent_inr || 0)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No trips added yet. Click "+ New Trip" to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="glass-card section-card">
          <div className="section-header">
            <div>
              <h3>Recent Expenses</h3>
              <span className="section-subtitle">Latest transactions added</span>
            </div>
            <button className="btn-link" onClick={() => onNavigate('expenses')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="expenses-list">
            {data?.recent_expenses && data.recent_expenses.length > 0 ? (
              data.recent_expenses.map((exp) => (
                <div key={exp.id} className="recent-expense-item">
                  <div className="expense-left">
                    <div
                      className="category-pill"
                      style={{
                        background: `${exp.category_color || '#3B82F6'}18`,
                        color: exp.category_color || '#3B82F6',
                        border: `1px solid ${exp.category_color || '#3B82F6'}33`,
                      }}
                    >
                      {exp.category_name || 'General'}
                    </div>
                    <div>
                      <h4 className="expense-title">{exp.name}</h4>
                      <span className="expense-sub">
                        {exp.trip_name} •{' '}
                        {formatDate(exp.expense_date, {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {exp.paid_by_name ? ` • ${exp.paid_by_name}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="expense-right">
                    <span className="expense-inr">
                      ₹ {Number(exp.amount_inr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                    {exp.currency !== 'INR' && (
                      <span className="expense-orig">
                        {exp.currency} {Number(exp.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No expenses logged yet. Select a trip to add your first expense!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-view {
          display: flex;
          flex-direction: column;
        }

        .welcome-banner {
          padding: 1.85rem 2rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%), var(--bg-card);
          border: 1px solid rgba(59, 130, 246, 0.25);
        }

        .welcome-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.75rem;
          background: var(--brand-primary-light);
          color: var(--brand-primary);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .welcome-text h1 {
          font-size: 1.85rem;
          margin-bottom: 0.35rem;
        }

        .welcome-text p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          max-width: 620px;
        }

        .welcome-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .chart-container, .section-card {
          padding: 1.5rem;
        }

        .section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .section-header h3 {
          font-size: 1.15rem;
          margin-bottom: 0.15rem;
        }

        .section-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .btn-link {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--brand-primary);
        }
        .btn-link:hover {
          text-decoration: underline;
        }

        .trips-list, .expenses-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .recent-trip-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          background: var(--bg-subtle);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .recent-trip-item:hover {
          background: var(--bg-card-hover);
          border-color: var(--brand-primary);
          transform: translateX(4px);
        }

        .trip-name {
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .trip-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .trip-amount {
          text-align: right;
        }

        .amount-label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
        }

        .amount-val {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--status-success);
        }

        .recent-expense-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--bg-subtle);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .expense-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .category-pill {
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .expense-title {
          font-size: 0.925rem;
          margin-bottom: 0.15rem;
        }

        .expense-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .expense-right {
          text-align: right;
        }

        .expense-inr {
          display: block;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .expense-orig {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .empty-state {
          padding: 2.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .welcome-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .welcome-actions {
            width: 100%;
          }
          .welcome-actions button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};
