import { useEffect, useState } from 'react';
import { instructionDocumentApi } from '../services/api';
import { useStore } from '../store';
import type { InstructionDocument, InstructionCategory, InstructionRoleType, CreateInstructionDocumentRequest } from '../types';
import toast from 'react-hot-toast';

export default function DocumentManagement() {
  const { user } = useStore();
  const [documents, setDocuments] = useState<InstructionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<CreateInstructionDocumentRequest>({
    title: '',
    description: '',
    category: 'Punctuation',
    roleType: 'CopyEditor',
    file: new File([], '')
  });

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === 'All' ? undefined : selectedCategory;
      const docs = await instructionDocumentApi.getAll(category);
      setDocuments(docs);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.file.name) {
      toast.error('Please fill in required fields');
      return;
    }
    setUploading(true);
    try {
      await instructionDocumentApi.create(formData);
      toast.success('Document uploaded successfully!');
      setShowUpload(false);
      setFormData({ title: '', description: '', category: 'Punctuation', roleType: 'CopyEditor', file: new File([], '') });
      loadDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await instructionDocumentApi.delete(id);
      toast.success('Document deleted');
      loadDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'Punctuation': return 'category-punctuation';
      case 'UKStyle': return 'category-ukstyle';
      case 'USStyle': return 'category-usstyle';
      default: return '';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case 'PDF': return '📄';
      case 'DOCX':
      case 'DOC': return '📝';
      case 'TXT': return '📃';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (user?.role !== 'Manager' && user?.role !== 'Admin') {
    return <div className="empty-state">You don't have access to this page.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Instruction Documents</h2>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Document</button>
      </div>

      <div className="filter-pills">
        {['All', 'Punctuation', 'UKStyle', 'USStyle'].map(cat => (
          <button
            key={cat}
            className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'All' ? 'All Documents' : cat === 'Punctuation' ? 'Punctuation' : cat === 'UKStyle' ? 'UK Style' : 'US Style'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">No documents found</div>
          <p>Upload your first instruction document to get started.</p>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">{getFileIcon(doc.fileType)}</div>
              <div className="document-title">{doc.title}</div>
              <div className="document-meta">{doc.fileName} • {formatFileSize(doc.fileSize)}</div>
              <div className="document-meta">Uploaded by {doc.uploadedByName}</div>
              <span className={`document-category ${getCategoryClass(doc.category)}`}>
                {doc.category === 'Punctuation' ? 'Punctuation' : doc.category === 'UKStyle' ? 'UK Style' : 'US Style'}
              </span>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => window.open(doc.fileName.includes('/') ? `/api${doc.fileName}` : `#`, '_blank')}>
                  View
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(doc.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Instruction Document</h3>
              <button className="modal-close" onClick={() => setShowUpload(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Punctuation Guide v1.0"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this document..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as InstructionCategory })}
                >
                  <option value="Punctuation">Punctuation</option>
                  <option value="UKStyle">UK Style</option>
                  <option value="USStyle">US Style</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To Role *</label>
                <select
                  className="form-select"
                  value={formData.roleType}
                  onChange={e => setFormData({ ...formData, roleType: e.target.value as InstructionRoleType })}
                >
                  <option value="CopyEditor">Copy Editor</option>
                  <option value="TechnicalEditor">Technical Editor</option>
                  <option value="Both">Both (Copy Editor & Technical Editor)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">File * (PDF, DOCX, TXT - max 50MB)</label>
                <input
                  type="file"
                  className="form-input"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setFormData({ ...formData, file });
                  }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}