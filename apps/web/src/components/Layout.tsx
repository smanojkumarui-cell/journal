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
              <button className="btn btn-ghost" onClick={() => setShowNotifications(!showNotifications)}>
                🔔
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