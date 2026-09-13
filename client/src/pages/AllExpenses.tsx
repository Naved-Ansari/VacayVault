import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Copy,
  Edit3,
  Trash2,
  Calendar,
  IndianRupee,
  RotateCcw,
} from 'lucide-react';
import { Expense, Trip, Category, FamilyMember } from '../types';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDate } from '../utils/dateUtils';

interface AllExpensesProps {
  trips: Trip[];
  categories: Category[];
  members: FamilyMember[];
  onOpenEditExpense: (expense: Expense) => void;
  refreshTrigger?: number;
}

export const AllExpenses: React.FC<AllExpensesProps> = ({
  trips,
  categories,
  members,
  onOpenEditExpense,
  refreshTrigger,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await api.getExpenses({
        trip_id: selectedTripId || undefined,
        category_id: selectedCategoryId || undefined,
        paid_by_member_id: selectedMemberId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
      });
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedTripId, selectedCategoryId, selectedMemberId, startDate, endDate, refreshTrigger]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadExpenses();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleResetFilters = () => {
    setSelectedTripId('');
    setSelectedCategoryId('');
    setSelectedMemberId('');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const [expenseToDelete, setExpenseToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await api.duplicateExpense(id);
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate expense');
    }
  };

  const totalFilteredInr = expenses.reduce(
    (acc, e) => acc + parseFloat(String(e.amount_inr || 0)),
    0
  );

  return (
    <div className="all-expenses-view">
      <div className="view-header">
        <div>
          <h2>All Vacation Expenses</h2>
          <p className="view-subtitle">
            Search, filter, and review all travel expenditures across all your trips
          </p>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="glass-card filter-toolbar">
        <div className="filter-grid">
          {/* Search */}
          <div className="filter-item search-item">
            <label className="filter-label">Search Expense</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Trip Filter */}
          <div className="filter-item">
            <label className="filter-label">Trip</label>
            <select
              className="form-select"
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
            >
              <option value="">All Trips</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-item">
            <label className="filter-label">Category</label>
            <select
              className="form-select"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Family Member Filter */}
          <div className="filter-item">
            <label className="filter-label">Family Member</label>
            <select
              className="form-select"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <option value="">All Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range From */}
          <div className="filter-item">
            <label className="filter-label">From Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date Range To */}
          <div className="filter-item">
            <label className="filter-label">To Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Toolbar bottom row: Count & Total summary */}
        <div className="toolbar-bottom">
          <div className="summary-pills">
            <span className="summary-pill">
              <Receipt size={14} />
              <span>{expenses.length} expenses found</span>
            </span>
            <span className="summary-pill highlight">
              <IndianRupee size={14} />
              <span>
                Total:{' '}
                <strong>
                  ₹{' '}
                  {totalFilteredInr.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </span>
            </span>
          </div>

          {(selectedTripId || selectedCategoryId || selectedMemberId || startDate || endDate || search) && (
            <button className="btn-icon btn-sm" onClick={handleResetFilters} title="Reset Filters">
              <RotateCcw size={14} />
              <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table Card */}
      <div className="glass-card table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading expenses...
          </div>
        ) : expenses.length > 0 ? (
          <div className="table-responsive">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Expense Name</th>
                  <th>Trip</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Destination</th>
                  <th>Paid By</th>
                  <th style={{ textAlign: 'right' }}>Original Amount</th>
                  <th style={{ textAlign: 'right' }}>INR Equivalent</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <span className="row-title">{exp.name}</span>
                      {exp.comment && <span className="row-comment">{exp.comment}</span>}
                    </td>
                    <td>
                      <span className="trip-tag">{exp.trip_name}</span>
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
                      {formatDate(exp.expense_date)}
                    </td>
                    <td>
                      <span className="dest-text">{exp.destination_name || '-'}</span>
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
                          onClick={() => handleDuplicate(exp.id)}
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
          <div className="empty-state">
            <p>No expenses match your active filter criteria.</p>
            <button className="btn btn-secondary btn-sm" onClick={handleResetFilters} style={{ marginTop: '0.75rem' }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Confirm Delete Expense Modal */}
      <ConfirmModal
        isOpen={expenseToDelete !== null}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expenseToDelete?.name}"? This expense will be permanently removed.`}
        confirmText="Delete Expense"
        confirmType="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setExpenseToDelete(null)}
      />

      <style>{`
        .all-expenses-view {
          display: flex;
          flex-direction: column;
        }

        .view-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          gap: 1rem;
        }

        .view-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .view-subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .filter-toolbar {
          padding: 1.35rem 1.5rem;
          margin-bottom: 1.5rem;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: 1.5fr repeat(5, 1fr);
          gap: 0.85rem;
          margin-bottom: 1rem;
        }

        @media (max-width: 1100px) {
          .filter-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .filter-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input-wrapper input {
          padding-left: 2.2rem;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-muted);
        }

        .toolbar-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .summary-pills {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.75rem;
          background: var(--bg-subtle);
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          color: var(--text-secondary);
        }

        .summary-pill.highlight {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: var(--status-success);
        }

        .table-card {
          padding: 0;
          overflow: hidden;
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
          padding: 0.85rem 1.25rem;
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          background: var(--bg-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }

        .expenses-table td {
          padding: 0.95rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
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

        .trip-tag {
          font-size: 0.825rem;
          color: var(--brand-primary);
          font-weight: 600;
        }

        .dest-text {
          font-size: 0.825rem;
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
          font-size: 0.975rem;
          font-weight: 700;
          color: var(--status-success);
        }

        .row-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
        }

        .empty-state {
          padding: 3.5rem 1.5rem;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
