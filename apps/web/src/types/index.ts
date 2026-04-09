export type UserRole = 'Author' | 'Manager' | 'TechnicalEditor' | 'Editor' | 'Reviewer' | 'Admin';
export type ResourceType = 'TechnicalEditor' | 'Copyeditor' | 'Proofreader' | 'Reviewer';
export type ManuscriptStatus = 'Draft' | 'Submitted' | 'UnderReview' | 'RevisionRequired' | 'Accepted' | 'Rejected' | 'Published';
export type AssignmentStatus = 'Todo' | 'Assigned' | 'InProgress' | 'Review' | 'Completed';
export type TaskType = 'Copyediting' | 'ProofReading' | 'TEReview' | 'QACheck' | 'PeerReview';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  orcidId?: string;
  isExternal: boolean;
  specialty?: string;
  resourceType?: ResourceType;
}

export interface Journal {
  id: number;
  name: string;
  slug: string;
  issn?: string;
  description?: string;
}

export interface ManuscriptVersion {
  id: number;
  versionNumber: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Assignment {
  id: number;
  manuscriptId: number;
  manuscriptTitle: string;
  assigneeId: number;
  assigneeName: string;
  taskType: TaskType;
  status: AssignmentStatus;
  slaHours?: number;
  deadline?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface KanbanBoard {
  todo: Assignment[];
  assigned: Assignment[];
  inProgress: Assignment[];
  review: Assignment[];
  completed: Assignment[];
}

export interface Manuscript {
  id: number;
  manuscriptNumber: string;
  journalId: number;
  journalName: string;
  authorId: number;
  authorName: string;
  title: string;
  abstract?: string;
  keywords?: string;
  status: ManuscriptStatus;
  createdAt: string;
  updatedAt?: string;
  versions: ManuscriptVersion[];
  assignments?: Assignment[];
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
}

export interface CreateManuscriptRequest {
  journalId: number;
  title: string;
  abstract?: string;
  keywords?: string;
}

export interface CreateAssignmentRequest {
  manuscriptId: number;
  assigneeId: number;
  taskType: TaskType;
  slaHours?: number;
}

export interface UpdateAssignmentRequest {
  status?: AssignmentStatus;
  slaHours?: number;
  notes?: string;
}

export interface CreateJournalRequest {
  name: string;
  issn?: string;
  description?: string;
}

export interface AddFreelancerRequest {
  name: string;
  email: string;
  specialty: string;
  hourlyRate: number;
}

export type InstructionCategory = 'Punctuation' | 'UKStyle' | 'USStyle';
export type InstructionRoleType = 'CopyEditor' | 'TechnicalEditor' | 'Both';

export interface InstructionDocument {
  id: number;
  title: string;
  description?: string;
  category: InstructionCategory;
  roleType: InstructionRoleType;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedByName: string;
  createdAt: string;
}

export interface CreateInstructionDocumentRequest {
  title: string;
  description?: string;
  category: InstructionCategory;
  roleType: InstructionRoleType;
  file: File;
}