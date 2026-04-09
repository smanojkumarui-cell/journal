import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { assignmentApi, manuscriptApi } from '../services/api';
import type { Assignment, Manuscript } from '../types';
import toast from 'react-hot-toast';

export default function TechnicalEditorDashboard() {
  const { user, kanban, setKanban } = useStore();
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null);
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    assignmentApi.getKanban().then(k => {
      setKanban(k);
      const myTasks = [...k.todo, ...k.assigned, ...k.inProgress, ...k.review].filter(a => a.assigneeId === user?.id);
      setTasks(myTasks);
    }).catch(console.error);
  }, [user?.id]);

  const handleStatusChange = async (assignmentId: number, newStatus: string) => {
    try {
      await assignmentApi.updateStatus(assignmentId, newStatus);
      assignmentApi.getKanban().then(k => {
        setKanban(k);
        const myTasks = [...k.todo, ...k.assigned, ...k.inProgress, ...k.review].filter(a => a.assigneeId === user?.id);
        setTasks(myTasks);
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleViewManuscript = async (assignment: Assignment) => {
    setSelectedTask(assignment);
    try {
      const ms = await manuscriptApi.getById(assignment.manuscriptId);
      setManuscript(ms);
    } catch (error) {
      toast.error('Failed to load manuscript');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Todo: 'badge-info', Assigned: 'badge-warning', InProgress: 'badge-info', Review: 'badge-warning', Completed: 'badge-success'
    };
    return <span className={`badge ${colors[status] || 'badge-info'}`}>{status}</span>;
  };

  const getTaskTypeBadge = (taskType: string) => {
    const colors: Record<string, string> = {
      Copyediting: 'status-copyediting', ProofReading: 'status-proofreading', TEReview: 'status-tereview', QACheck: 'status-qacheck'
    };
    return <span className={`kanban-card-status ${colors[taskType] || ''}`}>{taskType}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Technical Editor Dashboard</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-info">My Tasks: {tasks.length}</span>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-value">{tasks.filter(t => t.status === 'Assigned').length}</div>
          <div className="stat-label">Assigned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tasks.filter(t => t.status === 'InProgress').length}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tasks.filter(t => t.status === 'Review').length}</div>
          <div className="stat-label">Under Review</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">My Tasks</h3>
        </div>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks assigned. Check the queue for new assignments.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Manuscript</th>
                <th>Task Type</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 500 }}>{task.manuscriptTitle}</td>
                  <td>{getTaskTypeBadge(task.taskType)}</td>
                  <td>{getStatusBadge(task.status)}</td>
                  <td>
                    {task.deadline ? (
                      <span style={{ color: new Date(task.deadline) < new Date() ? 'var(--danger)' : 'inherit' }}>
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', marginRight: '0.5rem' }} onClick={() => handleViewManuscript(task)}>
                      View
                    </button>
                    {task.status === 'Assigned' && (
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChange(task.id, 'InProgress')}>
                        Start
                      </button>
                    )}
                    {task.status === 'InProgress' && (
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChange(task.id, 'Review')}>
                        Submit for Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedTask && manuscript && (
        <div className="modal-overlay" onClick={() => { setSelectedTask(null); setManuscript(null); }}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{manuscript.manuscriptNumber}</h3>
              <button className="btn btn-secondary" onClick={() => { setSelectedTask(null); setManuscript(null); }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>{manuscript.title}</h4>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>{manuscript.journalName}</p>
            </div>

            {manuscript.abstract && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Abstract:</strong>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>{manuscript.abstract}</p>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Task:</strong> {getTaskTypeBadge(selectedTask.taskType)}
              <span style={{ marginLeft: '1rem' }}>{getStatusBadge(selectedTask.status)}</span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Files:</strong>
              {manuscript.versions.length === 0 ? (
                <p style={{ color: 'var(--text-light)' }}>No files uploaded</p>
              ) : (
                <ul style={{ marginTop: '0.5rem' }}>
                  {manuscript.versions.map(v => (
                    <li key={v.id} style={{ padding: '0.25rem 0' }}>
                      v{v.versionNumber}: {v.fileName} ({v.fileType}) - {new Date(v.uploadedAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Notes (internal)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Add notes about this task..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {selectedTask.status === 'Assigned' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange(selectedTask.id, 'InProgress')}>
                  Start Working
                </button>
              )}
              {selectedTask.status === 'InProgress' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange(selectedTask.id, 'Review')}>
                  Submit for Review
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => { setSelectedTask(null); setManuscript(null); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}