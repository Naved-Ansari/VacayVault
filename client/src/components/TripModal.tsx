import React, { useState, useEffect } from 'react';
import { X, Plane, Plus, Trash2, MapPin, Calendar, Users, AlertCircle } from 'lucide-react';
import { Trip } from '../types';
import { api } from '../api/client';
import { toDateInputValue } from '../utils/dateUtils';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (trip: Trip) => void;
  tripToEdit?: Trip | null;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  tripToEdit,
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelersCount, setTravelersCount] = useState(1);
  const [tripType, setTripType] = useState<'single' | 'multi'>('single');
  const [notes, setNotes] = useState('');
  const [destinations, setDestinations] = useState<{ name: string; country?: string }[]>([]);
  const [newDestName, setNewDestName] = useState('');
  const [newDestCountry, setNewDestCountry] = useState('');
  const [previousDestinations, setPreviousDestinations] = useState<
    { name: string; country?: string; trips_count: number }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getPreviousDestinations()
        .then(setPreviousDestinations)
        .catch((e) => console.warn('Could not fetch previous destinations:', e));
    }
  }, [isOpen]);

  useEffect(() => {
    if (tripToEdit) {
      setName(tripToEdit.name);
      setStartDate(toDateInputValue(tripToEdit.start_date));
      setEndDate(toDateInputValue(tripToEdit.end_date));
      setTravelersCount(tripToEdit.travelers_count || 1);
      setTripType(tripToEdit.trip_type || 'single');
      setNotes(tripToEdit.notes || '');
      setDestinations(
        (tripToEdit.destinations || []).map((d) => ({
          name: d.name,
          country: d.country || '',
        }))
      );
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      setName('');
      setStartDate(today);
      setEndDate(nextWeek);
      setTravelersCount(1);
      setTripType('single');
      setNotes('');
      setDestinations([]);
    }
    setNewDestName('');
    setNewDestCountry('');
    setError(null);
  }, [tripToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreviousDest = (pd: { name: string; country?: string; trips_count: number }) => {
    if (tripType === 'single') {
      setDestinations([{ name: pd.name, country: pd.country || undefined }]);
      if (!name) {
        const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
        setName(`${pd.name} Vacation ${year}`);
      }
    } else {
      setNewDestName(pd.name);
      if (pd.country) setNewDestCountry(pd.country);
    }
  };

  const handleAddDestination = () => {
    if (!newDestName.trim()) return;
    const trimmedName = newDestName.trim();
    // Check if matching previous destination for auto country
    const matched = previousDestinations.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    const countryToUse = newDestCountry.trim() || matched?.country || undefined;

    // For single destination trips, replace the destination instead of adding
    if (tripType === 'single') {
      setDestinations([{ name: trimmedName, country: countryToUse }]);
      if (!name) {
        const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
        setName(`${trimmedName} Vacation ${year}`);
      }
    } else {
      setDestinations([
        ...destinations,
        { name: trimmedName, country: countryToUse },
      ]);
    }
    setNewDestName('');
    setNewDestCountry('');
  };

  const handleRemoveDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const handleTripTypeChange = (type: 'single' | 'multi') => {
    setTripType(type);
    // If switching to single and there are multiple destinations, keep only the first
    if (type === 'single' && destinations.length > 1) {
      setDestinations([destinations[0]]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a trip name.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please provide valid start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    // Include pending destination if typed in input
    let finalDestinations = [...destinations];
    if (newDestName.trim()) {
      if (tripType === 'single') {
        finalDestinations = [{ name: newDestName.trim(), country: newDestCountry.trim() || undefined }];
      } else {
        finalDestinations.push({
          name: newDestName.trim(),
          country: newDestCountry.trim() || undefined,
        });
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        travelers_count: Math.max(1, travelersCount),
        trip_type: tripType,
        notes: notes.trim(),
        destinations: finalDestinations,
      };

      let saved: Trip;
      if (tripToEdit && tripToEdit.id) {
        saved = await api.updateTrip(tripToEdit.id, payload);
      } else {
        saved = await api.createTrip(payload);
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save trip');
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
              <Plane size={18} />
            </div>
            <h3>{tripToEdit ? 'Edit Trip' : 'Create New Trip'}</h3>
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

            {/* Trip Name */}
            <div className="form-group">
              <label className="form-label">Trip Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Europe Vacation 2026, Kashmir Winter Trip"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Number of Travelers */}
            <div className="form-group">
              <label className="form-label">Number of Travelers</label>
              <input
                type="number"
                min="1"
                max="50"
                className="form-input"
                value={travelersCount}
                onChange={(e) => setTravelersCount(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            {/* Trip Type Toggle */}
            <div className="form-group">
              <label className="form-label">Destination Type</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleTripTypeChange('single')}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${tripType === 'single' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    background: tripType === 'single' ? 'var(--brand-primary-light)' : 'transparent',
                    color: tripType === 'single' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <MapPin size={15} />
                  Single Destination
                </button>
                <button
                  type="button"
                  onClick={() => handleTripTypeChange('multi')}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${tripType === 'multi' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    background: tripType === 'multi' ? 'var(--brand-primary-light)' : 'transparent',
                    color: tripType === 'multi' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <MapPin size={15} />
                  Multi Destination
                </button>
              </div>
            </div>

            {/* Destinations Section */}
            <div className="form-group">
              <label className="form-label">
                {tripType === 'single' ? 'Destination' : 'Destinations / Cities (Supports multiple)'}
              </label>

              {/* Show input only if single with no destination, or if multi */}
              {(tripType === 'multi' || destinations.length === 0) && (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      list="previous-dest-datalist"
                      placeholder={tripType === 'single' ? 'e.g. Goa, Paris, Dubai' : 'City / Destination (e.g. Paris)'}
                      value={newDestName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewDestName(val);
                        const matched = previousDestinations.find(
                          (p) => p.name.toLowerCase() === val.trim().toLowerCase()
                        );
                        if (matched && matched.country && !newDestCountry) {
                          setNewDestCountry(matched.country);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDestination();
                        }
                      }}
                    />
                    <datalist id="previous-dest-datalist">
                      {previousDestinations.map((pd) => (
                        <option key={pd.name} value={pd.name}>
                          {pd.country ? `${pd.country} • ${pd.trips_count} vacation(s)` : `${pd.trips_count} vacation(s)`}
                        </option>
                      ))}
                    </datalist>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '130px' }}
                      placeholder="Country"
                      value={newDestCountry}
                      onChange={(e) => setNewDestCountry(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDestination();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddDestination}
                      title="Add Destination"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Previous destinations quick-select pills */}
                  {previousDestinations.length > 0 && destinations.length === 0 && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Previously visited:</span>
                      {previousDestinations.slice(0, 6).map((pd) => (
                        <button
                          key={pd.name}
                          type="button"
                          onClick={() => handleSelectPreviousDest(pd)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px dashed var(--brand-primary)',
                            background: 'transparent',
                            color: 'var(--brand-primary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title={`Visited in ${pd.trips_count} previous vacation(s)`}
                        >
                          <MapPin size={10} />
                          {pd.name}
                          {pd.trips_count > 1 ? ` (${pd.trips_count}x)` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Destination Pills List */}
              {destinations.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {destinations.map((d, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.65rem',
                          background: 'var(--brand-primary-light)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          color: 'var(--brand-primary)',
                          fontWeight: 600,
                        }}
                      >
                        <MapPin size={13} />
                        {d.name} {d.country ? `(${d.country})` : ''}
                        <button
                          type="button"
                          onClick={() => handleRemoveDestination(index)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '2px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Repeat Destination Banner */}
                  {(() => {
                    const repeat = previousDestinations.find(
                      (p) => p.name.toLowerCase() === destinations[0]?.name.toLowerCase()
                    );
                    if (!repeat) return null;
                    return (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.45rem 0.75rem',
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          color: 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <MapPin size={13} />
                        <span>
                          <strong>Repeat Destination:</strong> You've taken {repeat.trips_count} previous vacation{repeat.trips_count > 1 ? 's' : ''} to {repeat.name}. This trip will be saved as a separate vacation.
                        </span>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  No destinations added yet. Type above or pick a previously visited destination.
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Trip highlights, planned itinerary, hotel details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : tripToEdit ? 'Update Trip' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
