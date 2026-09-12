import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Sparkles, AlertCircle } from 'lucide-react';
import { Trip, Category, FamilyMember, Expense } from '../types';
import { api } from '../api/client';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  expenseToEdit?: Expense | null;
  defaultTripId?: number;
  trips: Trip[];
  categories: Category[];
  members: FamilyMember[];
}

const COMMON_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  expenseToEdit,
  defaultTripId,
  trips,
  categories,
  members,
}) => {
  const [tripId, setTripId] = useState<number | ''>('');
  const [destinationId, setDestinationId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [customRate, setCustomRate] = useState<string>('');
  const [showRateOverride, setShowRateOverride] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [subcategoryId, setSubcategoryId] = useState<number | ''>('');
  const [paidByMemberId, setPaidByMemberId] = useState<number | ''>('');
  const [comment, setComment] = useState('');

  const [ratesMap, setRatesMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch exchange rates on open
  useEffect(() => {
    if (isOpen) {
      api.getCurrencyRates()
        .then((res) => setRatesMap(res.ratesToInr))
        .catch((e) => console.warn('Could not fetch rates in modal:', e));
    }
  }, [isOpen]);

  // Pre-fill form when editing or resetting
  useEffect(() => {
    if (expenseToEdit) {
      setTripId(expenseToEdit.trip_id);
      setDestinationId(expenseToEdit.destination_id || '');
      setName(expenseToEdit.name);
      setAmount(String(expenseToEdit.amount));
      setCurrency(expenseToEdit.currency || 'INR');
      setCustomRate(String(expenseToEdit.exchange_rate_to_inr || ''));
      setExpenseDate(
        typeof expenseToEdit.expense_date === 'string'
          ? expenseToEdit.expense_date.split('T')[0]
          : new Date(expenseToEdit.expense_date).toISOString().split('T')[0]
      );
      setCategoryId(expenseToEdit.category_id || '');
      setSubcategoryId(expenseToEdit.subcategory_id || '');
      setPaidByMemberId(expenseToEdit.paid_by_member_id || '');
      setComment(expenseToEdit.comment || '');
    } else {
      // New expense defaults
      const chosenTrip = defaultTripId || (trips.length > 0 ? trips[0].id : '');
      setTripId(chosenTrip);
      setDestinationId('');
      setName('');
      setAmount('');
      setCurrency('INR');
      setCustomRate('');
      setShowRateOverride(false);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setSubcategoryId('');
      setPaidByMemberId(members.length > 0 ? members[0].id : '');
      setComment('');
    }
    setError(null);
  }, [expenseToEdit, defaultTripId, trips, categories, members, isOpen]);

  // Selected trip's destinations
  const currentTrip = trips.find((t) => t.id === Number(tripId));
  const destinations = currentTrip ? currentTrip.destinations : [];

  // Selected category's subcategories
  const currentCat = categories.find((c) => c.id === Number(categoryId));
  const subcategories = currentCat ? currentCat.subcategories : [];

  // Computed rate and converted amount in INR
  const activeRate =
    currency === 'INR'
      ? 1.0
      : customRate && parseFloat(customRate) > 0
      ? parseFloat(customRate)
      : ratesMap[currency] || 1.0;

  const convertedInr = amount && !isNaN(parseFloat(amount))
    ? (parseFloat(amount) * activeRate).toFixed(2)
    : '0.00';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId) {
      setError('Please select a trip.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter an expense name.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Partial<Expense> = {
        trip_id: Number(tripId),
        destination_id: destinationId ? Number(destinationId) : null,
        name: name.trim(),
        amount: numAmount,
        currency,
        exchange_rate_to_inr: activeRate,
        expense_date: expenseDate,
        category_id: categoryId ? Number(categoryId) : null,
        subcategory_id: subcategoryId ? Number(subcategoryId) : null,
        paid_by_member_id: paidByMemberId ? Number(paidByMemberId) : null,
        comment: comment.trim(),
      };

      if (expenseToEdit && expenseToEdit.id) {
        await api.updateExpense(expenseToEdit.id, payload);
      } else {
        await api.createExpense(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <IndianRupee size={18} />
            </div>
            <h3>{expenseToEdit ? 'Edit Expense' : 'Add New Expense'}</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--status-danger)',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Trip & Destination */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Trip / Vacation *</label>
                <select
                  className="form-select"
                  value={tripId}
                  onChange={(e) => {
                    setTripId(e.target.value ? Number(e.target.value) : '');
                    setDestinationId('');
                  }}
                  required
                >
                  <option value="">-- Select Trip --</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Destination</label>
                <select
                  className="form-select"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Trip-wide / None</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.country ? `(${d.country})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expense Name */}
            <div className="form-group">
              <label className="form-label">Expense Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Louvre Museum Tickets, Dinner at Bistro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Amount & Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Amount *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  className="form-select"
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setCustomRate('');
                  }}
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live INR Conversion Preview */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={18} color="var(--brand-primary)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  INR Equivalent:
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-success)' }}>
                  ₹ {parseFloat(convertedInr).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {currency !== 'INR' && (
                <button
                  type="button"
                  onClick={() => setShowRateOverride(!showRateOverride)}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--brand-primary)',
                    textDecoration: 'underline',
                    fontWeight: 600,
                  }}
                >
                  {showRateOverride ? 'Hide Rate' : `Rate: 1 ${currency} = ₹${activeRate.toFixed(2)}`}
                </button>
              )}
            </div>

            {/* Rate Override input if foreign currency */}
            {currency !== 'INR' && showRateOverride && (
              <div
                className="form-group"
                style={{
                  background: 'rgba(59, 130, 246, 0.07)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(59, 130, 246, 0.3)',
                }}
              >
                <label className="form-label" style={{ color: 'var(--brand-primary)' }}>
                  Custom Exchange Rate (1 {currency} = ? INR)
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder={String(ratesMap[currency] || 1.0)}
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                />
              </div>
            )}

            {/* Date & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Expense Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value ? Number(e.target.value) : '');
                    setSubcategoryId('');
                  }}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subcategory & Paid By */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Subcategory</label>
                <select
                  className="form-select"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!categoryId || subcategories.length === 0}
                >
                  <option value="">
                    {!categoryId
                      ? '-- Select Category first --'
                      : subcategories.length === 0
                      ? 'No subcategories'
                      : '-- Select Subcategory --'}
                  </option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Paid By (Family Member)</label>
                <select
                  className="form-select"
                  value={paidByMemberId}
                  onChange={(e) => setPaidByMemberId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">None / Unspecified</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comment / Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Comment / Notes (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Additional details, shop name, ticket confirmation number, etc."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : expenseToEdit ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
