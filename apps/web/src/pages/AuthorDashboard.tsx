import { useEffect, useState } from 'react';
import { manuscriptApi, journalApi } from '../services/api';
import { useStore } from '../store';
import type { Manuscript, Journal, CreateManuscriptRequest } from '../types';
import toast from 'react-hot-toast';

export default function AuthorDashboard() {
  const { user } = useStore();
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateManuscriptRequest>({ journalId: 0, title: '', abstract: '', keywords: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedMs, setSelectedMs] = useState<Manuscript | null>(null);

  useEffect(() => {
    manuscriptApi.getAll().then(setManuscripts).catch(console.error);
    journalApi.getAll().then(setJournals).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.journalId || !formData.title) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      const ms = await manuscriptApi.create(formData);
      setManuscripts([ms, ...manuscripts]);
      setShowForm(false);
      setFormData({ journalId: 0, title: '', abstract: '', keywords: '' });
      toast.success('Manuscript submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit manuscript');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (msId: number, file: File) => {
    setUploadingFile(true);
    try {
      await manuscriptApi.uploadVersion(msId, file);
      toast.success('File uploaded successfully!');
      const updated = await manuscriptApi.getById(msId);
      setManuscripts(manuscripts.map(m => m.id === msId ? updated : m));
    } catch (error) {
      toast.error('File upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Draft: 'badge-info', Submitted: 'badge-warning', UnderReview: 'badge-info',
      RevisionRequired: 'badge-danger', Accepted: 'badge-success', Rejected: 'badge-danger', Published: 'badge-success'
    };
    return <span className={`badge ${colors[status] || 'badge-info'}`}>{status}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>My Manuscripts</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Submission'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Submit New Manuscript</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Journal *</label>
              <select
                className="form-select"
                value={formData.journalId}
                onChange={e => setFormData({ ...formData, journalId: parseInt(e.target.value) })}
                required
              >
                <option value="">Select a journal</option>
                {journals.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Abstract</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={formData.abstract || ''}
                onChange={e => setFormData({ ...formData, abstract: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Keywords</label>
              <input
                type="text"
                className="form-input"
                placeholder="Comma-separated keywords"
                value={formData.keywords || ''}
                onChange={e => setFormData({ ...formData, keywords: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Manuscript'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {manuscripts.length === 0 ? (
          <div className="empty-state">
            <p>No manuscripts yet. Submit your first manuscript!</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Manuscript #</th>
                <th>Title</th>
                <th>Journal</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {manuscripts.map(ms => (
                <tr key={ms.id}>
                  <td style={{ fontWeight: 500 }}>{ms.manuscriptNumber}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ms.title}</td>
                  <td>{ms.journalName}</td>
                  <td>{getStatusBadge(ms.status)}</td>
                  <td>{new Date(ms.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => setSelectedMs(ms)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedMs && (
        <div className="modal-overlay" onClick={() => setSelectedMs(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedMs.manuscriptNumber}</h3>
              <button className="btn btn-secondary" onClick={() => setSelectedMs(null)}>✕</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Title:</strong> <p>{selectedMs.title}</p>
            </div>
            {selectedMs.abstract && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Abstract:</strong> <p>{selectedMs.abstract}</p>
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <strong>Status:</strong> {getStatusBadge(selectedMs.status)}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Versions:</strong>
              {selectedMs.versions.length === 0 ? (
                <p style={{ color: 'var(--text-light)' }}>No files uploaded yet.</p>
              ) : (
                <ul style={{ marginTop: '0.5rem' }}>
                  {selectedMs.versions.map(v => (
                    <li key={v.id} style={{ padding: '0.25rem 0' }}>
                      v{v.versionNumber}: {v.fileName} ({v.fileType}) - {new Date(v.uploadedAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Upload New Version</label>
              <input
                type="file"
                onChange={e => e.target.files?.[0] && handleFileUpload(selectedMs.id, e.target.files[0])}
                disabled={uploadingFile}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}