import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LayoutDashboard, Briefcase, LogOut, Menu, X, Plus, Zap } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, toasts, removeToast } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    api.getProjects()
      .then(list => setProjects(list.slice(0, 8)))
      .catch(() => {});
  }, [user, location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Breadcrumb logic
  const pathMatch = location.pathname.match(/\/projects\/(\d+)/);
  const activeProjectId = pathMatch ? parseInt(pathMatch[1]) : null;
  const activeProject = projects.find(p => p.id === activeProjectId);

  const getBreadcrumb = () => {
    if (location.pathname === '/') return [{ label: 'Dashboard' }];
    if (location.pathname === '/projects') return [{ label: 'Projects' }];
    if (activeProject) return [
      { label: 'Projects', to: '/projects' },
      { label: activeProject.name }
    ];
    return [];
  };

  const crumbs = getBreadcrumb();

  return (
    <div className="app-shell">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
            <span>{t.message}</span>
            <X size={13} />
          </div>
        ))}
      </div>

      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="top-nav-brand">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: 'var(--accent)' }} />
            <span className="top-nav-brand-logo">TeamSync</span>
          </Link>
        </div>

        <div className="top-nav-center">
          <nav className="top-nav-breadcrumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">/</span>}
                {c.to
                  ? <Link to={c.to}>{c.label}</Link>
                  : <span className="current">{c.label}</span>
                }
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="top-nav-right">
          <Link to="/projects?create=true" className="btn btn-primary btn-sm">
            <Plus size={14} /> New Project
          </Link>
          <div className="nav-avatar" title={user?.name}>{getInitials(user?.name)}</div>
        </div>
      </nav>

      <div className="body-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
          <nav className="sidebar-menu" style={{ paddingTop: '16px' }}>
            <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Briefcase size={16} />
              <span>Projects</span>
            </NavLink>

            {projects.length > 0 && (
              <>
                <p className="sidebar-section-label">My Projects</p>
                {projects.map(proj => (
                  <NavLink
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    className={({ isActive }) => `sidebar-project-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="sidebar-project-dot" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          <div className="sidebar-footer">
            {user && (
              <div className="sidebar-user">
                <div className="user-avatar-sm">{getInitials(user.name)}</div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div className="user-name-sm">{user.name}</div>
                  <div className="user-email-sm">{user.email}</div>
                </div>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
