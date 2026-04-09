import { useEffect, useState } from 'react';
import { instructionDocumentApi } from '../services/api';
import type { InstructionDocument } from '../types';
import toast from 'react-hot-toast';

export default function TechnicalEditorDocuments() {
  const [documents, setDocuments] = useState<InstructionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === 'All' ? undefined : selectedCategory;
      const docs = await instructionDocumentApi.getAll(category, 'TechnicalEditor');
      setDocuments(docs);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>My Reference Documents</h2>
          <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>Style guides and instruction documents for technical editing</p>
        </div>
      </div>

      <div className="filter-pills">
        {['All', 'Punctuation', 'UKStyle', 'USStyle'].map(cat => (
          <button
            key={cat}
            className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'All' ? 'All' : cat === 'Punctuation' ? 'Punctuation' : cat === 'UKStyle' ? 'UK Style' : 'US Style'}
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
          <div className="empty-state-title">No documents available</div>
          <p>Contact your manager to upload style guides.</p>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">{getFileIcon(doc.fileType)}</div>
              <div className="document-title">{doc.title}</div>
              {doc.description && (
                <div className="document-meta" style={{ marginBottom: '0.5rem' }}>{doc.description}</div>
              )}
              <div className="document-meta">{doc.fileName} • {formatFileSize(doc.fileSize)}</div>
              <span className={`document-category ${getCategoryClass(doc.category)}`}>
                {doc.category === 'Punctuation' ? 'Punctuation' : doc.category === 'UKStyle' ? 'UK Style' : 'US Style'}
              </span>
              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-sm btn-primary" onClick={() => window.open(`/api${doc.fileName}`, '_blank')}>
                  View Document
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}