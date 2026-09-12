import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Edit3,
  Trash2,
  X,
  PlusCircle,
  Receipt,
  IndianRupee,
} from 'lucide-react';
import { Category } from '../types';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';

interface CategoriesProps {
  categories: Category[];
  onRefresh: () => void;
  onOpenCreateCategory: () => void;
  onOpenEditCategory: (category: Category) => void;
}

export const Categories: React.FC<CategoriesProps> = ({
  categories,
  onRefresh,
  onOpenCreateCategory,
  onOpenEditCategory,
}) => {
  const [newSubName, setNewSubName] = useState<Record<number, string>>({});
  const [activeAddingSub, setActiveAddingSub] = useState<number | null>(null);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteCategory(catToDelete.id);
      setCatToDelete(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSubcategory = async (catId: number) => {
    const name = (newSubName[catId] || '').trim();
    if (!name) return;

    try {
      await api.addSubcategory(catId, name);
      setNewSubName({ ...newSubName, [catId]: '' });
      setActiveAddingSub(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add subcategory');
    }
  };

  const handleDeleteSubcategory = async (catId: number, subId: number) => {
    try {
      await api.deleteSubcategory(catId, subId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete subcategory');
    }
  };

  const formatInr = (val?: number) =>
    `₹ ${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="categories-view">
      <div className="view-header">
        <div>
          <h2>Expense Categories & Subcategories</h2>
          <p className="view-subtitle">
            Organize and classify your vacation spendings into clear parent categories and nested subcategories
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateCategory}>
          <Plus size={18} strokeWidth={2.5} />
          <span>+ Add Custom Category</span>
        </button>
      </div>

      <div className="categories-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="glass-card category-card">
            {/* Card Top */}
            <div className="cat-card-header">
              <div className="cat-brand-box">
                <span
                  className="cat-color-badge"
                  style={{ background: cat.color || '#3B82F6' }}
                />
                <h3 className="cat-title">{cat.name}</h3>
                {cat.is_default && <span className="default-pill">Default</span>}
              </div>

              <div className="cat-actions">
                <button
                  className="btn-icon btn-sm"
                  title="Edit Category"
                  onClick={() => onOpenEditCategory(cat)}
                >
                  <Edit3 size={15} />
                </button>
                {!cat.is_default && (
                  <button
                    className="btn-icon btn-sm"
                    title="Delete Category"
                    style={{ color: 'var(--status-danger)' }}
                    onClick={() => setCatToDelete(cat)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Spent & Count Stats */}
            <div className="cat-card-stats">
              <span className="stat-badge">
                <Receipt size={13} /> {cat.expense_count || 0} expenses
              </span>
              <span className="stat-badge highlight">
                <IndianRupee size={13} /> {formatInr(cat.total_spent_inr)}
              </span>
            </div>

            {/* Subcategories list */}
            <div className="subcategories-section">
              <div className="subs-header">
                <span className="subs-label">Subcategories</span>
                <button
                  type="button"
                  className="add-sub-link"
                  onClick={() =>
                    setActiveAddingSub(activeAddingSub === cat.id ? null : cat.id)
                  }
                >
                  <PlusCircle size={14} />
                  <span>Add Subcategory</span>
                </button>
              </div>

              {/* Add subcategory input form */}
              {activeAddingSub === cat.id && (
                <div className="add-sub-input-row">
                  <input
                    type="text"
                    placeholder="e.g. Street Food, Metro Pass..."
                    value={newSubName[cat.id] || ''}
                    onChange={(e) =>
                      setNewSubName({ ...newSubName, [cat.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategory(cat.id);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddSubcategory(cat.id)}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-sm"
                    onClick={() => setActiveAddingSub(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Subcategories pills */}
              <div className="sub-pills-list">
                {cat.subcategories && cat.subcategories.length > 0 ? (
                  cat.subcategories.map((sub) => (
                    <span key={sub.id} className="sub-pill">
                      {sub.name}
                      <button
                        type="button"
                        onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                        className="del-sub-btn"
                        title="Delete subcategory"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="no-subs-text">No subcategories defined yet.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Delete Category Modal */}
      <ConfirmModal
        isOpen={catToDelete !== null}
        title="Delete Expense Category"
        message={`Are you sure you want to delete the category "${catToDelete?.name}"? Any subcategories under it will also be deleted.`}
        confirmText="Delete Category"
        confirmType="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setCatToDelete(null)}
      />

      <style>{`
        .categories-view {
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

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .category-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .cat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }

        .cat-brand-box {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .cat-color-badge {
          width: 14px;
          height: 14px;
          border-radius: 4px;
        }

        .cat-title {
          font-size: 1.15rem;
        }

        .default-pill {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.15rem 0.45rem;
          background: var(--bg-subtle);
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          font-weight: 600;
        }

        .cat-actions {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .cat-card-stats {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.25rem;
        }

        .stat-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.6rem;
          background: var(--bg-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.775rem;
          color: var(--text-secondary);
        }

        .stat-badge.highlight {
          color: var(--status-success);
          font-weight: 600;
        }

        .subcategories-section {
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-top: auto;
        }

        .subs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .subs-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .add-sub-link {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          color: var(--brand-primary);
          font-weight: 600;
        }
        .add-sub-link:hover {
          text-decoration: underline;
        }

        .add-sub-input-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }

        .add-sub-input-row input {
          flex: 1;
          padding: 0.35rem 0.65rem;
          font-size: 0.825rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          background: var(--bg-input);
          color: var(--text-main);
          outline: none;
        }

        .sub-pills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .sub-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.55rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.775rem;
          color: var(--text-main);
        }

        .del-sub-btn {
          display: flex;
          align-items: center;
          color: var(--text-muted);
        }
        .del-sub-btn:hover {
          color: var(--status-danger);
        }

        .no-subs-text {
          font-size: 0.775rem;
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
