import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'var(--brand-primary)',
  trend,
}) => {
  return (
    <div className="glass-card stat-card">
      <div className="stat-card-inner">
        <div>
          <span className="stat-title">{title}</span>
          <h2 className="stat-value">{value}</h2>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
          {trend && <span className="stat-trend">{trend}</span>}
        </div>
        <div
          className="stat-icon-box"
          style={{
            background: `${iconColor}18`,
            color: iconColor,
            border: `1px solid ${iconColor}33`,
          }}
        >
          <Icon size={24} />
        </div>
      </div>

      <style>{`
        .stat-card {
          padding: 1.35rem 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .stat-card-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .stat-title {
          font-size: 0.825rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          display: block;
          margin-bottom: 0.4rem;
        }
        .stat-value {
          font-size: 1.85rem;
          font-weight: 800;
          line-height: 1.1;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        .stat-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .stat-trend {
          display: inline-block;
          margin-top: 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--status-success);
        }
        .stat-icon-box {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
