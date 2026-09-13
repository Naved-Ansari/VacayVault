import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  FileDown,
  Filter,
  Calendar,
  CheckCircle,
  Receipt,
  IndianRupee,
  Plane,
  Eye,
} from 'lucide-react';
import { Trip, Category, FamilyMember, Expense } from '../types';
import { api } from '../api/client';
import { generateExpenseReportPdf } from '../utils/pdfGenerator';
import { formatDate } from '../utils/dateUtils';

interface ReportsProps {
  trips: Trip[];
  categories: Category[];
  members: FamilyMember[];
  refreshTrigger?: number;
}

export const Reports: React.FC<ReportsProps> = ({ trips, categories, members, refreshTrigger }) => {
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [matchingExpenses, setMatchingExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch expenses matching selected report criteria
  useEffect(() => {
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const data = await api.getExpenses({
          trip_id: selectedTripId !== 'all' ? selectedTripId : undefined,
          category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
          paid_by_member_id: selectedMember !== 'all' ? selectedMember : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        setMatchingExpenses(data);
      } catch (e) {
        console.error('Failed to fetch report data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltered();
  }, [selectedTripId, selectedCategory, selectedMember, startDate, endDate, refreshTrigger]);

  const selectedTripObj =
    selectedTripId !== 'all'
      ? trips.find((t) => t.id === Number(selectedTripId)) || null
      : null;

  const totalSpentInr = matchingExpenses.reduce(
    (acc, e) => acc + parseFloat(String(e.amount_inr || 0)),
    0
  );

  const handleDownloadPdf = () => {
    const filterSummary: string[] = [];
    if (selectedTripObj) filterSummary.push(`Trip: ${selectedTripObj.name}`);
    else filterSummary.push('All Vacations Combined');

    if (selectedCategory !== 'all') {
      const c = categories.find((cat) => cat.id === Number(selectedCategory));
      if (c) filterSummary.push(`Category: ${c.name}`);
    }
    if (selectedMember !== 'all') {
      const m = members.find((mem) => mem.id === Number(selectedMember));
      if (m) filterSummary.push(`Paid By: ${m.name}`);
    }
    if (startDate) filterSummary.push(`From: ${startDate}`);
    if (endDate) filterSummary.push(`To: ${endDate}`);

    generateExpenseReportPdf({
      title: selectedTripObj
        ? `${selectedTripObj.name} Expense Report`
        : 'Combined Vacations Expense Report',
      trip: selectedTripObj,
      expenses: matchingExpenses,
      filterSummary,
    });
  };

  const formatInr = (val: number) =>
    `₹ ${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="reports-view">
      <div className="view-header">
        <div>
          <h2>Generate Expense Reports</h2>
          <p className="view-subtitle">
            Create and download clean, structured PDF expense reports for tax, personal records, or reimbursement
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleDownloadPdf}
          disabled={matchingExpenses.length === 0}
        >
          <FileDown size={18} strokeWidth={2.5} />
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* Filter Options Card */}
      <div className="glass-card report-filters-card">
        <h3 className="section-title">Report Configuration</h3>

        <div className="filters-grid">
          {/* Trip selection */}
          <div className="form-group">
            <label className="form-label">Vacation / Trip</label>
            <select
              className="form-select"
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
            >
              <option value="all">🌟 All Vacations Combined</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category selection */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Family member */}
          <div className="form-group">
            <label className="form-label">Paid By (Family Member)</label>
            <select
              className="form-select"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
            >
              <option value="all">All Family Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="form-group">
            <label className="form-label">Date From</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div className="form-group">
            <label className="form-label">Date To</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Report Summary Live Preview Card */}
      <div className="glass-card preview-card">
        <div className="preview-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Eye size={18} color="var(--brand-primary)" />
            <h3>Report Live Preview</h3>
          </div>
          <div className="preview-badges">
            <span className="badge">
              <Receipt size={14} /> {matchingExpenses.length} items
            </span>
            <span className="badge badge-inr">
              <IndianRupee size={14} /> {formatInr(totalSpentInr)}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Updating preview...
          </div>
        ) : matchingExpenses.length > 0 ? (
          <div className="table-responsive">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense Name</th>
                  <th>Trip</th>
                  <th>Category</th>
                  <th>Destination</th>
                  <th>Paid By</th>
                  <th style={{ textAlign: 'right' }}>Original Amount</th>
                  <th style={{ textAlign: 'right' }}>INR Equivalent</th>
                </tr>
              </thead>
              <tbody>
                {matchingExpenses.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {formatDate(e.expense_date)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td>{e.trip_name}</td>
                    <td>{e.category_name || '-'}</td>
                    <td>{e.destination_name || '-'}</td>
                    <td>{e.paid_by_name || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {e.currency} {Number(e.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--status-success)' }}>
                      ₹ {Number(e.amount_inr).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No expenses found matching the selected filters.
          </div>
        )}
      </div>

      <style>{`
        .reports-view {
          display: flex;
          flex-direction: column;
        }

        .view-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
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

        .report-filters-card, .preview-card {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.15rem;
          margin-bottom: 1rem;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .preview-badges {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .preview-table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          background: var(--bg-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }

        .preview-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }

        .preview-table tr:hover td {
          background: var(--bg-subtle);
        }
      `}</style>
    </div>
  );
};
