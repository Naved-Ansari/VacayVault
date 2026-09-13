import React, { useState } from 'react';
import {
  Compass,
  LayoutDashboard,
  Plane,
  Receipt,
  Tags,
  Users,
  FileBarChart,
  Settings,
  Plus,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddExpense?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddExpense,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trips', label: 'Trips', icon: Plane },
    { id: 'expenses', label: 'All Expenses', icon: Receipt },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'members', label: 'Family Members', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => handleNavClick('dashboard')}>
          <div className="brand-icon-wrapper">
            <Compass className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">VacayVault</span>
            <span className="brand-subtitle">Expense Tracker</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-icon theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-content">
            <div className="mobile-nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`mobile-nav-item ${isActive ? 'mobile-nav-active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--navbar-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .navbar-inner {
          max-width: 1380px;
          margin: 0 auto;
          padding: 0.85rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          user-select: none;
        }

        .brand-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--brand-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--brand-glow);
          color: white;
        }

        .brand-icon {
          animation: spinSlow 30s linear infinite;
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.25rem;
          line-height: 1.1;
          background: var(--brand-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }

        .brand-subtitle {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.9rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .nav-link:hover {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .nav-link-active {
          color: var(--brand-primary) !important;
          background: var(--brand-primary-light) !important;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .quick-add-btn {
          padding: 0.55rem 1.15rem;
          font-size: 0.875rem;
          border-radius: var(--radius-md);
        }

        .mobile-menu-btn {
          display: none;
        }

        .mobile-drawer {
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-surface-elevated);
          padding: 1.25rem;
          animation: fadeIn 150ms ease-out;
        }

        .mobile-add-btn {
          width: 100%;
          margin-bottom: 1rem;
        }

        .mobile-nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-align: left;
          width: 100%;
        }

        .mobile-nav-item:hover, .mobile-nav-active {
          color: var(--brand-primary);
          background: var(--brand-primary-light);
        }

        @media (max-width: 1080px) {
          .desktop-nav {
            display: none;
          }
          .mobile-menu-btn {
            display: flex;
          }
          .quick-add-btn span {
            display: none;
          }
          .quick-add-btn {
            padding: 0.55rem;
          }
        }
      `}</style>
    </header>
  );
};
