import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Plus,
  Receipt,
  FileDown,
  Edit3,
  Trash2,
  Copy,
  Search,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { Trip, Expense } from '../types';
import { api } from '../api/client';
import { CategoryDoughnutChart, DestinationBarChart, DailyTrendLineChart } from '../components/Charts';
import { generateExpenseReportPdf } from '../utils/pdfGenerator';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDate } from '../utils/dateUtils';

interface TripDetailsProps {
  tripId: number;
  onBack: () => void;
  onOpenAddExpense: (tripId?: number) => void;
  onOpenEditExpense: (expense: Expense) => void;
  onOpenEditTrip: (trip: Trip) => void;
  onDeleteTrip?: (tripId: number) => void;
  refreshTrigger?: number;
}

export const TripDetails: React.FC<TripDetailsProps> = ({
  tripId,
  onBack,
  onOpenAddExpense,
  onOpenEditExpense,
  onOpenEditTrip,
  onDeleteTrip,
  refreshTrigger,
}) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDest, setSelectedDest] = useState<string>('all');

  const loadTrip = async () => {
    try {
      setLoading(true);
      const data = await api.getTrip(tripId);
      setTrip(data);
    } catch (err) {
      console.error('Failed to load trip details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [tripId, refreshTrigger]);

  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState(false);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);

  const [expenseToDelete, setExpenseToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  const handleConfirmDeleteTrip = async () => {
    if (!trip) return;
    setIsDeletingTrip(true);
    try {
      await api.deleteTrip(trip.id);
      setConfirmDeleteTrip(false);
      if (onDeleteTrip) {
        onDeleteTrip(trip.id);
      } else {
        onBack();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip');
    } finally {
      setIsDeletingTrip(false);
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      await api.deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      loadTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const handleDuplicateExpense = async (id: number) => {
    try {
      await api.duplicateExpense(id);
      loadTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate expense');
    }
  };

  const handleExportPdf = () => {
    if (!trip || !trip.expenses) return;
    generateExpenseReportPdf({
      title: `${trip.name} Expense Report`,
      trip,
      expenses: trip.expenses,
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading trip details...
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <p>Trip not found.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Trips
        </button>
      </div>
    );
  }

  // Filter expenses based on search & category
  const filteredExpenses = (trip.expenses || []).filter((exp) => {
    const matchesSearch =
      exp.name.toLowerCase().includes(search.toLowerCase()) ||
      (exp.comment && exp.comment.toLowerCase().includes(search.toLowerCase()));
    const matchesCat =
      selectedCategory === 'all' || exp.category_name === selectedCategory;
    const matchesDest =
      selectedDest === 'all' || exp.destination_name === selectedDest;
    return matchesSearch && matchesCat && matchesDest;
  });

  const formatInr = (val: number) =>
    `₹ ${Number(val).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  const startDateStr = formatDate(trip.start_date);
  const endDateStr = formatDate(trip.end_date);

  // Unique categories in this trip for filter dropdown
  const uniqueCategories = Array.from(
    new Set((trip.expenses || []).map((e) => e.category_name).filter((c): c is string => Boolean(c)))
  );
  const uniqueDestinations = Array.from(
    new Set((trip.expenses || []).map((e) => e.destination_name).filter((d): d is string => Boolean(d)))
  );

  return (
    <div className="trip-details-view">
      {/* Top back & actions bar */}
      <div className="top-nav-bar">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>All Trips</span>
        </button>

        <div className="top-actions">
          <button className="btn btn-primary btn-sm" onClick={() => onOpenAddExpense(trip.id)}>
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}>
            <FileDown size={16} />
            <span>Export PDF</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onOpenEditTrip(trip)}>
            <Edit3 size={16} />
            <span>Edit Trip</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setConfirmDeleteTrip(true)}
            style={{ color: 'var(--status-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            title="Delete this entire trip"
          >
            <Trash2 size={16} />
            <span>Delete Trip</span>
          </button>
        </div>
      </div>

      {/* Trip Header Banner */}
      <div className="glass-card trip-hero">
        <div className="hero-content">
          <div className="hero-destinations">
            {trip.destinations && trip.destinations.length > 0 ? (
              trip.destinations.map((d: any, idx: number) => (
                <span key={idx} className="dest-tag">
                  <MapPin size={13} />
                  {typeof d === 'string' ? d : d.name}
                  {d.country ? ` (${d.country})` : ''}
                </span>
              ))
            ) : (
              <span className="dest-tag">Trip Destinations</span>
            )}
          </div>

          <h1 className="hero-title">{trip.name}</h1>

          <div className="hero-meta">
            <span className="meta-item">
              <Calendar size={15} />
              {startDateStr} – {endDateStr}
            </span>
            <span className="meta-item">
              <Users size={15} />
              {trip.travelers_count} Traveler(s)
            </span>
          </div>

          {trip.notes && <p className="hero-notes">{trip.notes}</p>}
        </div>

        {/* Total Spent Stat Box */}
        <div className="hero-total-box">
          <span className="total-label">Total Trip Expenses</span>
          <h2 className="total-val">{formatInr(trip.total_spent_inr || 0)}</h2>
          <span className="total-count">{(trip.expenses || []).length} expense items recorded</span>
        </div>
      </div>

      {/* Visual Breakdowns: Category Donut & Destination Bar */}
      <div className="grid-2col">
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Category Spending</h3>
            <span className="chart-sub">Distribution of funds</span>
          </div>
          <CategoryDoughnutChart data={trip.category_breakdown || []} />
        </div>

        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Destination Spending</h3>
            <span className="chart-sub">City/Region allocation</span>
          </div>
          <DestinationBarChart data={trip.destination_breakdown || []} />
        </div>
      </div>

      {/* Daily Spending Timeline Chart if multiple days */}
      {trip.daily_spending && trip.daily_spending.length > 1 && (
        <div className="glass-card timeline-card">
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#10B981" />
              <h3>Daily Spending Timeline</h3>
            </div>
            <span className="chart-sub">Day-by-day expense curve</span>
          </div>
          <DailyTrendLineChart data={trip.daily_spending} />
        </div>
      )}

      {/* Trip Expenses Table & Filters */}
      <div className="glass-card expenses-card">
        <div className="expenses-card-header">
          <div>
            <h3>Trip Expenses</h3>
            <span className="chart-sub">
              Showing {filteredExpenses.length} of {(trip.expenses || []).length} transactions
            </span>
          </div>

          {/* Filter and Search Controls */}
          <div className="table-controls">
            <div className="search-box">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search expense..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {uniqueDestinations.length > 1 && (
              <select
                className="filter-select"
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
              >
                <option value="all">All Destinations</option>
                {uniqueDestinations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            <button
              className="btn btn-primary btn-sm"
              onClick={() => onOpenAddExpense(trip.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Expenses List / Table */}
        {filteredExpenses.length > 0 ? (
          <div className="table-responsive">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Expense Name</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Destination</th>
                  <th>Paid By</th>
                  <th style={{ textAlign: 'right' }}>Original</th>
                  <th style={{ textAlign: 'right' }}>INR Equivalent</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <span className="row-title">{exp.name}</span>
                      {exp.comment && <span className="row-comment">{exp.comment}</span>}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${exp.category_color || '#3B82F6'}18`,
                          color: exp.category_color || '#3B82F6',
                          border: `1px solid ${exp.category_color || '#3B82F6'}33`,
                        }}
                      >
                        {exp.category_name || 'General'}
                        {exp.subcategory_name ? ` (${exp.subcategory_name})` : ''}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {formatDate(exp.expense_date, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td>
                      <span className="dest-text">{exp.destination_name || 'General'}</span>
                    </td>
                    <td>
                      {exp.paid_by_name ? (
                        <span
                          className="badge"
                          style={{
                            background: `${exp.paid_by_color || '#6366F1'}18`,
                            color: exp.paid_by_color || '#6366F1',
                          }}
                        >
                          {exp.paid_by_name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="orig-amount">
                        {exp.currency} {Number(exp.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                      {exp.currency !== 'INR' && (
                        <span className="orig-rate">
                          (1 {exp.currency} = ₹{Number(exp.exchange_rate_to_inr).toFixed(2)})
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="inr-amount">
                        ₹ {Number(exp.amount_inr).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="row-actions">
                        <button
                          className="btn-icon btn-sm"
                          title="Duplicate Expense"
                          onClick={() => handleDuplicateExpense(exp.id)}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="btn-icon btn-sm"
                          title="Edit Expense"
                          onClick={() => onOpenEditExpense(exp)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn-icon btn-sm"
                          title="Delete Expense"
                          style={{ color: 'var(--status-danger)' }}
                          onClick={() => setExpenseToDelete({ id: exp.id, name: exp.name })}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-expenses">
            <p>No matching expenses found.</p>
            <button
              className="btn btn-primary"
              onClick={() => onOpenAddExpense(trip.id)}
              style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirm Delete Trip Modal */}
      <ConfirmModal
        isOpen={confirmDeleteTrip}
        title="Delete Vacation Trip"
        message={`Are you sure you want to delete "${trip.name}"? All associated expenses (${(trip.expenses || []).length} items), itineraries, and charts will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Trip"
        confirmType="danger"
        loading={isDeletingTrip}
        onConfirm={handleConfirmDeleteTrip}
        onClose={() => setConfirmDeleteTrip(false)}
      />

      {/* Confirm Delete Expense Modal */}
      <ConfirmModal
        isOpen={expenseToDelete !== null}
        title="Delete Expense Item"
        message={`Are you sure you want to delete "${expenseToDelete?.name}"? This expense will be permanently removed from this trip.`}
        confirmText="Delete Expense"
        confirmType="danger"
        loading={isDeletingExpense}
        onConfirm={handleConfirmDeleteExpense}
        onClose={() => setExpenseToDelete(null)}
      />

      <style>{`
        .trip-details-view {
          display: flex;
          flex-direction: column;
        }

        .top-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .trip-hero {
          padding: 2rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%), var(--bg-card);
        }

        .hero-destinations {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }

        .dest-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.65rem;
          background: var(--brand-primary-light);
          color: var(--brand-primary);
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .hero-title {
          font-size: 2.1rem;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .hero-notes {
          font-size: 0.9rem;
          color: var(--text-secondary);
          max-width: 600px;
          line-height: 1.5;
        }

        .hero-total-box {
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 1.5rem 1.75rem;
          text-align: right;
          min-width: 250px;
          box-shadow: var(--shadow-md);
        }

        .total-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 700;
          display: block;
          margin-bottom: 0.25rem;
        }

        .total-val {
          font-size: 2rem;
          font-weight: 800;
          color: var(--status-success);
          line-height: 1.1;
          margin-bottom: 0.25rem;
        }

        .total-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          display: block;
          margin-bottom: 1rem;
        }

        .add-expense-cta {
          width: 100%;
        }

        .chart-card, .timeline-card, .expenses-card {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-header {
          margin-bottom: 1.25rem;
        }

        .chart-header h3 {
          font-size: 1.15rem;
        }

        .chart-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .expenses-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .table-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box input {
          padding: 0.5rem 0.85rem 0.5rem 2.2rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: var(--bg-input);
          color: var(--text-main);
          font-size: 0.85rem;
          outline: none;
          min-width: 180px;
        }

        .search-box input:focus {
          border-color: var(--brand-primary);
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-muted);
        }

        .filter-select {
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: var(--bg-input);
          color: var(--text-main);
          font-size: 0.85rem;
          outline: none;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .expenses-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .expenses-table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-subtle);
        }

        .expenses-table td {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }

        .expenses-table tr:last-child td {
          border-bottom: none;
        }

        .expenses-table tr:hover td {
          background: var(--bg-subtle);
        }

        .row-title {
          font-weight: 600;
          color: var(--text-main);
          display: block;
        }

        .row-comment {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: block;
          margin-top: 2px;
        }

        .dest-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .orig-amount {
          display: block;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .orig-rate {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .inr-amount {
          font-size: 1rem;
          font-weight: 700;
          color: var(--status-success);
        }

        .row-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
        }

        .empty-expenses {
          padding: 3rem;
          text-align: center;
          color: var(--text-muted);
        }

        @media (max-width: 900px) {
          .trip-hero {
            flex-direction: column;
            align-items: flex-start;
          }
          .hero-total-box {
            width: 100%;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};
