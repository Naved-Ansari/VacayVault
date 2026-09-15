import React, { useState, useEffect, useRef } from 'react';
import { X, IndianRupee, Sparkles, AlertCircle, CheckCircle2, BedDouble } from 'lucide-react';
import { Trip, Category, FamilyMember, Expense } from '../types';
import { api } from '../api/client';
import { toDateInputValue } from '../utils/dateUtils';

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
  const [expenseDate, setExpenseDate] = useState(toDateInputValue(new Date()));
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [subcategoryId, setSubcategoryId] = useState<number | ''>('');
  const [paidByMemberId, setPaidByMemberId] = useState<number | ''>('');
  const [comment, setComment] = useState('');
  const [isSpreadAcrossTrip, setIsSpreadAcrossTrip] = useState(false);

  const [ratesMap, setRatesMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

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
    setSuccessMessage(null);
    if (expenseToEdit) {
      setTripId(expenseToEdit.trip_id);
      setDestinationId(expenseToEdit.destination_id || '');
      setName(expenseToEdit.name);
      setAmount(String(expenseToEdit.amount));
      setCurrency(expenseToEdit.currency || 'INR');
      setCustomRate(String(expenseToEdit.exchange_rate_to_inr || ''));
      setExpenseDate(toDateInputValue(expenseToEdit.expense_date));
      setCategoryId(expenseToEdit.category_id || '');
      setSubcategoryId(expenseToEdit.subcategory_id || '');
      setPaidByMemberId(expenseToEdit.paid_by_member_id || '');
      setComment(expenseToEdit.comment || '');
      setIsSpreadAcrossTrip(!!expenseToEdit.is_spread_across_trip);
    } else {
      // New expense defaults
      const chosenTripId = defaultTripId || (trips.length > 0 ? trips[0].id : '');
      setTripId(chosenTripId);

      // Auto-prepopulate destination if single destination trip
      const chosenTrip = trips.find((t) => t.id === Number(chosenTripId));
      if (
        chosenTrip &&
        chosenTrip.trip_type === 'single' &&
        chosenTrip.destinations &&
        chosenTrip.destinations.length > 0
      ) {
        setDestinationId(chosenTrip.destinations[0].id || '');
      } else {
        setDestinationId('');
      }

      setName('');
      setAmount('');
      setCurrency('INR');
      setCustomRate('');
      setShowRateOverride(false);
      setExpenseDate(toDateInputValue(new Date()));
      const defaultCatId = categories.length > 0 ? categories[0].id : '';
      setCategoryId(defaultCatId);
      const defaultCat = categories.find((c) => c.id === Number(defaultCatId));
      setIsSpreadAcrossTrip(defaultCat?.name?.toLowerCase().includes('accommodat') || false);
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
  const isAccommodation = currentCat?.name?.toLowerCase().includes('accommodat') || false;

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
        is_spread_across_trip: isAccommodation ? isSpreadAcrossTrip : false,
      };

      if (expenseToEdit && expenseToEdit.id) {
        await api.updateExpense(expenseToEdit.id, payload);
        onSaved();
        onClose();
      } else {
        await api.createExpense(payload);
        // Trigger background refresh immediately
        onSaved();
        // Show success banner and keep popup open for rapid entry
        const inrFormatted = (numAmount * activeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 });
        setSuccessMessage(`✓ Expense "${name.trim()}" (${currency} ${numAmount} = ₹${inrFormatted}) added successfully! Add another below or click Close.`);
        // Reset only expense-specific fields, retaining trip, destination, currency, date, category, and paidBy!
        setName('');
        setAmount('');
        setComment('');
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 50);
      }
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
            {successMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10B981',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', padding: '2px' }}
                  aria-label="Dismiss success message"
                >
                  <X size={15} />
                </button>
              </div>
            )}

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
                    const newTripId = e.target.value ? Number(e.target.value) : '';
                    setTripId(newTripId);
                    const selected = trips.find((t) => t.id === newTripId);
                    if (
                      selected &&
                      selected.trip_type === 'single' &&
                      selected.destinations &&
                      selected.destinations.length > 0
                    ) {
                      setDestinationId(selected.destinations[0].id || '');
                    } else {
                      setDestinationId('');
                    }
                  }}
                  required
                >
                  <option value="">-- Select Trip --</option>
                  {trips.map((t) => {
                    const yearStr = t.start_date ? t.start_date.substring(0, 4) : '';
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} {yearStr ? `(${yearStr})` : ''}
                      </option>
                    );
                  })}
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
                ref={nameInputRef}
                type="text"
                className="form-input"
                placeholder="e.g. Louvre Museum Tickets, Dinner at Bistro"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
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
                    const newCatId = e.target.value ? Number(e.target.value) : '';
                    setCategoryId(newCatId);
                    setSubcategoryId('');
                    const selectedCatObj = categories.find((c) => c.id === newCatId);
                    const isAcc = selectedCatObj?.name?.toLowerCase().includes('accommodat') || false;
                    setIsSpreadAcrossTrip(isAcc);
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

            {/* Accommodation Spread Across Trip Toggle (Exclusive to Accommodation) */}
            {isAccommodation && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.28)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setIsSpreadAcrossTrip(!isSpreadAcrossTrip)}
              >
                <div style={{ paddingTop: '2px', color: '#8B5CF6' }}>
                  <BedDouble size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Spread across entire trip
                    </span>
                    <input
                      type="checkbox"
                      id="isSpreadAcrossTrip"
                      checked={isSpreadAcrossTrip}
                      onChange={(e) => setIsSpreadAcrossTrip(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'pointer',
                        accentColor: '#8B5CF6',
                        width: '18px',
                        height: '18px',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    Multi-day accommodation usually spans the trip. When enabled, this amount will be distributed evenly across all days in the daily spending timeline instead of spiking on a single date.
                  </div>
                </div>
              </div>
            )}

            {/* Comment / Notes */}
            <div className="form-group" style={{ marginBottom: 0, marginTop: '1rem' }}>
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
              {expenseToEdit ? 'Cancel' : 'Close'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : expenseToEdit ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
