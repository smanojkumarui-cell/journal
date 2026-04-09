import axios from 'axios';
import type { AuthResponse, User, Manuscript, Journal, KanbanBoard, Assignment, Notification, CreateManuscriptRequest, CreateAssignmentRequest, AddFreelancerRequest, CreateJournalRequest, InstructionDocument, CreateInstructionDocumentRequest } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  me: () => api.get<User>('/auth/me').then(r => r.data),
  login: (email: string) => api.post<AuthResponse>('/auth/login', { email }).then(r => r.data),
  getResources: () => api.get<User[]>('/auth/resources').then(r => r.data),
  addFreelancer: (data: AddFreelancerRequest) => api.post<User>('/auth/freelancer', data).then(r => r.data),
};

export const journalApi = {
  getAll: () => api.get<Journal[]>('/journals').then(r => r.data),
  getById: (id: number) => api.get<Journal>(`/journals/${id}`).then(r => r.data),
  create: (data: CreateJournalRequest) => api.post<Journal>('/journals', data).then(r => r.data),
};

export const manuscriptApi = {
  getAll: () => api.get<Manuscript[]>('/manuscripts').then(r => r.data),
  getById: (id: number) => api.get<Manuscript>(`/manuscripts/${id}`).then(r => r.data),
  create: (data: CreateManuscriptRequest) => api.post<Manuscript>('/manuscripts', data).then(r => r.data),
  uploadVersion: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('File', file);
    return api.post(`/manuscripts/${id}/versions`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  updateStatus: (id: number, status: string) => api.put(`/manuscripts/${id}/status`, { status }),
};

export const assignmentApi = {
  getKanban: () => api.get<KanbanBoard>('/assignments/kanban').then(r => r.data),
  create: (data: CreateAssignmentRequest) => api.post<Assignment>('/assignments', data).then(r => r.data),
  updateStatus: (id: number, status: string) => api.put<Assignment>(`/assignments/${id}/status`, { status }).then(r => r.data),
};

export const notificationApi = {
  getAll: () => api.get<Notification[]>('/notifications').then(r => r.data),
  markRead: (id: number, isRead: boolean) => api.put(`/notifications/${id}/read`, { isRead }),
};

export const instructionDocumentApi = {
  getAll: (category?: string, roleType?: string) => 
    api.get<InstructionDocument[]>('/instruction-documents', { params: { category, roleType } }).then(r => r.data),
  getById: (id: number) => api.get<InstructionDocument>(`/instruction-documents/${id}`).then(r => r.data),
  getByRole: (roleType: string) => api.get<InstructionDocument[]>(`/instruction-documents/role/${roleType}`).then(r => r.data),
  create: (data: CreateInstructionDocumentRequest) => {
    const formData = new FormData();
    formData.append('Title', data.title);
    if (data.description) formData.append('Description', data.description);
    formData.append('Category', data.category);
    formData.append('RoleType', data.roleType);
    formData.append('File', data.file);
    return api.post<InstructionDocument>('/instruction-documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (id: number) => api.delete(`/instruction-documents/${id}`),
};

export default api;