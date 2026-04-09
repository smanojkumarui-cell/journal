import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { notificationApi } from '../services/api';
import { useEffect, useState } from 'react';

export default function Layout() {
  const { user, logout, notifications, setNotifications } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    notificationApi.getAll().then(setNotifications).catch(console.error);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    switch (user?.role) {
      case 'Manager':
      case 'Admin':
        return [
          { path: '/manager', label: 'Dashboard', icon: '📊' },
          { path: '/manager/documents', label: 'Documents', icon: '📁' }
        ];
      case 'TechnicalEditor':
        return [
          { path: '/te', label: 'Tasks', icon: '📝' },
          { path: '/te/documents', label: 'Reference Docs', icon: '📖' }
        ];
      case 'Editor':
        return [
          { path: '/', label: 'Dashboard', icon: '📊' },
          { path: '/te/documents', label: 'Reference Docs', icon: '📖' }
        ];
      default:
        return [
          { path: '/', label: 'Dashboard', icon: '📊' },
          { path: '/author', label: 'My Manuscripts', icon: '📝' }
        ];
    }
  };

  const navItems = getNavItems();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Tech <span>Editor</span></div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      
      <main className="main-content">
        <header className="header">
          <h1>Welcome, {user?.name}</h1>
          <div className="header-actions">
            <div className="notification-badge">
              <button type="button" className="btn btn-ghost notification-button" onClick={() => setShowNotifications(!showNotifications)}>
                <svg className="notification-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 16a2 2 0 0 0 1.985-1.75H6.015A2 2 0 0 0 8 16zm6-5c0-1.098-.235-2.138-.654-3.07-.406-.9-1.014-1.617-1.73-2.121C11.657 5.562 11 4.776 11 4V3a3 3 0 0 0-6 0v1c0 .776-.657 1.562-1.616 1.809-.716.504-1.324 1.221-1.731 2.121A7.97 7.97 0 0 0 2 11c0 1.094.24 2.136.664 3.066.35.702.918 1.25 1.64 1.579.492.227 1.05.355 1.64.355h6.392c.589 0 1.147-.128 1.639-.355.722-.329 1.29-.877 1.64-1.579C13.76 13.136 14 12.094 14 11z" />
                </svg>
              </button>
              {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
              {showNotifications && (
                <div style={{ position: 'absolute', right: 100, top: 60, width: 300, background: 'white', borderRadius: 8, border: '1px solid var(--border)', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Notifications</h4>
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.id} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="user-menu">
              <div className="user-avatar">{user?.name?.charAt(0)}</div>
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </header>
        
        <Outlet />
      </main>
    </div>
  );
}