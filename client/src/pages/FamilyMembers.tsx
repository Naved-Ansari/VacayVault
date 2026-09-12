import React, { useState } from 'react';
import { Users, Plus, Edit3, Trash2, Receipt, IndianRupee, UserCheck } from 'lucide-react';
import { FamilyMember } from '../types';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';

interface FamilyMembersProps {
  members: FamilyMember[];
  onRefresh: () => void;
  onOpenCreateMember: () => void;
  onOpenEditMember: (member: FamilyMember) => void;
}

export const FamilyMembers: React.FC<FamilyMembersProps> = ({
  members,
  onRefresh,
  onOpenCreateMember,
  onOpenEditMember,
}) => {
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteMember(memberToDelete.id);
      setMemberToDelete(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatInr = (val?: number) =>
    `₹ ${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="members-view">
      <div className="view-header">
        <div>
          <h2>Family Members & Travelers</h2>
          <p className="view-subtitle">
            Track who paid for expenses during family trips without any complex settlements or splitting
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateMember}>
          <Plus size={18} strokeWidth={2.5} />
          <span>+ Add Family Member</span>
        </button>
      </div>

      <div className="members-grid">
        {members.map((m) => (
          <div key={m.id} className="glass-card member-card">
            <div className="card-top">
              <div
                className="member-large-avatar"
                style={{ background: m.avatar_color || '#3B82F6' }}
              >
                {m.name.charAt(0)}
              </div>
              <div className="member-names">
                <h3 className="member-heading">{m.name}</h3>
                {m.notes && <span className="member-role">{m.notes}</span>}
              </div>
              <div className="card-actions">
                <button
                  className="btn-icon btn-sm"
                  title="Edit Member"
                  onClick={() => onOpenEditMember(m)}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  className="btn-icon btn-sm"
                  title="Remove Member"
                  style={{ color: 'var(--status-danger)' }}
                  onClick={() => setMemberToDelete(m)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="member-stats-row">
              <div className="stat-box">
                <span className="stat-label">Expenses Paid</span>
                <span className="stat-number">
                  <Receipt size={14} /> {m.expense_count || 0}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Amount Paid</span>
                <span className="stat-number inr">
                  <IndianRupee size={14} /> {formatInr(m.total_spent_inr)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Remove Member Modal */}
      <ConfirmModal
        isOpen={memberToDelete !== null}
        title="Remove Family Member"
        message={`Are you sure you want to remove "${memberToDelete?.name}"? Previous expenses recorded for this member will remain safely preserved.`}
        confirmText="Remove Member"
        confirmType="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setMemberToDelete(null)}
      />

      <style>{`
        .members-view {
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

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .member-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .member-large-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          color: white;
          font-weight: 800;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }

        .member-names {
          flex: 1;
        }

        .member-heading {
          font-size: 1.15rem;
          margin-bottom: 0.15rem;
        }

        .member-role {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .member-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          padding: 0.85rem;
          background: var(--bg-subtle);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .stat-number {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .stat-number.inr {
          color: var(--status-success);
        }
      `}</style>
    </div>
  );
};
