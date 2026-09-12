import React, { useState } from 'react';
import {
  Plane,
  Plus,
  Calendar,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { Trip } from '../types';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';

interface TripsProps {
  trips: Trip[];
  onRefresh: () => void;
  onOpenCreateTrip: () => void;
  onOpenEditTrip: (trip: Trip) => void;
  onSelectTrip: (tripId: number) => void;
}

export const Trips: React.FC<TripsProps> = ({
  trips,
  onRefresh,
  onOpenCreateTrip,
  onOpenEditTrip,
  onSelectTrip,
}) => {
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!tripToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTrip(tripToDelete.id);
      setTripToDelete(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatInr = (val: number) =>
    `₹ ${Number(val).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="trips-view">
      {/* Header bar */}
      <div className="view-header">
        <div>
          <h2>My Vacations & Trips</h2>
          <p className="view-subtitle">Manage all your travel itineraries and total trip expenditures</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateTrip}>
          <Plus size={18} strokeWidth={2.5} />
          <span>+ Create Trip</span>
        </button>
      </div>

      {/* Trips Grid */}
      {trips.length > 0 ? (
        <div className="trips-grid">
          {trips.map((trip) => {
            const startDate = new Date(trip.start_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const endDate = new Date(trip.end_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={trip.id}
                className="glass-card trip-card"
                onClick={() => onSelectTrip(trip.id)}
              >
                <div className="trip-card-header">
                  <div className="trip-badge">
                    <Plane size={14} />
                    <span>Vacation</span>
                  </div>
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="trip-action-btn edit-btn"
                      title="Edit Trip"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditTrip(trip);
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="trip-action-btn delete-btn"
                      title="Delete Trip"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTripToDelete(trip);
                      }}
                      disabled={isDeleting && tripToDelete?.id === trip.id}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="trip-card-title">{trip.name}</h3>

                {/* Destinations tags */}
                {trip.destinations && trip.destinations.length > 0 && (
                  <div className="destinations-container">
                    {trip.destinations.map((d: any, idx: number) => (
                      <span key={idx} className="dest-pill">
                        <MapPin size={12} />
                        {typeof d === 'string' ? d : d.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata details */}
                <div className="trip-details-grid">
                  <div className="detail-item">
                    <Calendar size={15} className="detail-icon" />
                    <div>
                      <span className="detail-label">Dates</span>
                      <span className="detail-value">
                        {startDate} - {endDate}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Users size={15} className="detail-icon" />
                    <div>
                      <span className="detail-label">Travelers</span>
                      <span className="detail-value">{trip.travelers_count} person(s)</span>
                    </div>
                  </div>
                </div>

                {trip.notes && <p className="trip-card-notes">{trip.notes}</p>}

                {/* Card Footer with Amount */}
                <div className="trip-card-footer">
                  <div className="expenses-count">
                    <Receipt size={14} />
                    <span>{trip.expense_count || 0} expenses</span>
                  </div>
                  <div className="footer-amount">
                    <span className="spent-label">Total Spent</span>
                    <span className="spent-val">{formatInr(trip.total_spent_inr || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card empty-trips-card">
          <div className="empty-icon-box">
            <Plane size={36} />
          </div>
          <h3>No Vacations Recorded Yet</h3>
          <p>
            Start your travel journey by creating your first trip. You can add multiple destinations,
            dates, and track expenses effortlessly.
          </p>
          <button className="btn btn-primary" onClick={onOpenCreateTrip}>
            <Plus size={18} />
            <span>Create Your First Trip</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={tripToDelete !== null}
        title="Delete Vacation Trip"
        message={`Are you sure you want to delete "${tripToDelete?.name}"? All associated expenses, itinerary destinations, and reports for this trip will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Trip"
        confirmType="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setTripToDelete(null)}
      />

      <style>{`
        .trips-view {
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

        .trips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.5rem;
        }

        .trip-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .trip-card:hover {
          transform: translateY(-4px);
          border-color: var(--brand-primary);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
        }

        .trip-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }

        .trip-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.65rem;
          background: var(--brand-primary-light);
          color: var(--brand-primary);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          position: relative;
          z-index: 10;
        }

        .trip-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          z-index: 11;
        }

        .trip-action-btn:hover {
          transform: scale(1.1);
        }

        .trip-action-btn svg {
          pointer-events: none;
        }

        .edit-btn:hover {
          color: var(--brand-primary);
          background: var(--brand-primary-light);
          border-color: var(--brand-primary);
        }

        .delete-btn {
          color: var(--status-danger);
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: var(--status-danger);
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .trip-card-title {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .destinations-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }

        .dest-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.55rem;
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .trip-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 0.85rem;
          background: var(--bg-subtle);
          border-radius: var(--radius-md);
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .detail-icon {
          color: var(--brand-primary);
          margin-top: 2px;
        }

        .detail-label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
        }

        .detail-value {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .trip-card-notes {
          font-size: 0.825rem;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .trip-card-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .expenses-count {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .footer-amount {
          text-align: right;
        }

        .spent-label {
          display: block;
          font-size: 0.68rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
        }

        .spent-val {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--status-success);
        }

        .empty-trips-card {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 500px;
          margin: 3rem auto;
        }

        .empty-icon-box {
          width: 70px;
          height: 70px;
          border-radius: var(--radius-xl);
          background: var(--brand-primary-light);
          color: var(--brand-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .empty-trips-card h3 {
          font-size: 1.35rem;
          margin-bottom: 0.5rem;
        }

        .empty-trips-card p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
