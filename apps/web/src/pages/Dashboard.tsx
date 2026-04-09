import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { manuscriptApi, assignmentApi } from '../services/api';

export default function Dashboard() {
  const { user } = useStore();
  const [stats, setStats] = useState({ manuscripts: 0, assignments: 0, pending: 0, completed: 0 });

  useEffect(() => {
    if (user?.role === 'Manager' || user?.role === 'Admin') {
      assignmentApi.getKanban().then(kanban => {
        const all = [...kanban.todo, ...kanban.assigned, ...kanban.inProgress, ...kanban.review, ...kanban.completed];
        setStats({
          manuscripts: 0,
          assignments: all.length,
          pending: kanban.todo.length + kanban.assigned.length,
          completed: kanban.completed.length
        });
      });
    } else {
      manuscriptApi.getAll().then(ms => {
        setStats({ manuscripts: ms.length, assignments: 0, pending: ms.filter(m => m.status === 'Submitted').length, completed: ms.filter(m => m.status === 'Published').length });
      });
    }
  }, [user?.role]);

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'Manager': return 'Manager Dashboard - Track and assign work';
      case 'TechnicalEditor': return 'Technical Editor Dashboard - Your tasks';
      case 'Editor': return 'Editor Dashboard - Manage peer reviews';
      case 'Author': return 'Author Dashboard - Submit and track manuscripts';
      default: return 'Dashboard';
    }
  };

  return (
    <div>
      <h2>{getWelcomeMessage()}</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.manuscripts}</div>
          <div className="stat-label">Total Manuscripts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.assignments}</div>
          <div className="stat-label">Total Assignments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {user?.role === 'Author' && (
            <button className="btn btn-primary" onClick={() => window.location.href = '/author'}>New Submission</button>
          )}
          {user?.role === 'Manager' && (
            <button className="btn btn-primary" onClick={() => window.location.href = '/manager'}>View Queue</button>
          )}
          {user?.role === 'TechnicalEditor' && (
            <button className="btn btn-primary" onClick={() => window.location.href = '/te'}>My Tasks</button>
          )}
        </div>
      </div>
    </div>
  );
}