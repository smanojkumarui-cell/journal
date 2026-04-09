import { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCenter, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { assignmentApi, authApi, manuscriptApi } from '../services/api';
import type { Assignment, KanbanBoard, User, Manuscript, TaskType, AssignmentStatus } from '../types';
import toast from 'react-hot-toast';

function SortableCard({ assignment, onClick }: { assignment: Assignment; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: assignment.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  
  const getTaskColor = (task: string) => {
    const colors: Record<string, string> = { Copyediting: 'status-copyediting', ProofReading: 'status-proofreading', TEReview: 'status-tereview', QACheck: 'status-qacheck' };
    return colors[task] || 'status-copyediting';
  };

  const getTimeRemaining = () => {
    if (!assignment.deadline) return '';
    const diff = new Date(assignment.deadline).getTime() - Date.now();
    if (diff < 0) return 'Overdue';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Due today' : `${days}d left`;
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="kanban-card" onClick={onClick}>
        <div className="kanban-card-title">{assignment.manuscriptTitle}</div>
        <div className="kanban-card-meta">{assignment.assigneeName || 'Unassigned'}</div>
        <span className={`kanban-card-status ${getTaskColor(assignment.taskType)}`}>{assignment.taskType}</span>
        {assignment.deadline && <span className="kanban-card-meta" style={{ marginLeft: '0.5rem' }}>{getTimeRemaining()}</span>}
      </div>
    </div>
  );
}

export default function ManagerKanban() {
  const { kanban, setKanban } = useStore();
  const [resources, setResources] = useState<User[]>([]);
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFreelancerModal, setShowFreelancerModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignForm, setAssignForm] = useState({ manuscriptId: 0, assigneeId: 0, taskType: 'Copyediting' as TaskType, slaHours: 168 });
  const [freelancerForm, setFreelancerForm] = useState({ name: '', email: '', specialty: '', hourlyRate: 25 });
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    assignmentApi.getKanban().then(setKanban).catch(console.error);
    authApi.getResources().then(setResources).catch(console.error);
    manuscriptApi.getAll().then(setManuscripts).catch(console.error);
  }, []);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as number);
  
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const assignmentId = active.id as number;
    const newStatus = over.id as AssignmentStatus;
    
    try {
      await assignmentApi.updateStatus(assignmentId, newStatus);
      assignmentApi.getKanban().then(setKanban).catch(console.error);
      toast.success(`Moved to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.manuscriptId || !assignForm.assigneeId) {
      toast.error('Please select manuscript and assignee');
      return;
    }
    try {
      await assignmentApi.create(assignForm);
      assignmentApi.getKanban().then(setKanban).catch(console.error);
      setShowAssignModal(false);
      setAssignForm({ manuscriptId: 0, assigneeId: 0, taskType: 'Copyediting', slaHours: 168 });
      toast.success('Assignment created!');
    } catch (error) {
      toast.error('Failed to create assignment');
    }
  };

  const handleAddFreelancer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.addFreelancer(freelancerForm);
      authApi.getResources().then(setResources).catch(console.error);
      setShowFreelancerModal(false);
      setFreelancerForm({ name: '', email: '', specialty: '', hourlyRate: 25 });
      toast.success('Freelancer added!');
    } catch (error) {
      toast.error('Failed to add freelancer');
    }
  };

  const getColumnAssignments = (status: AssignmentStatus): Assignment[] => {
    if (!kanban) return [];
    switch (status) {
      case 'Todo': return kanban.todo;
      case 'Assigned': return kanban.assigned;
      case 'InProgress': return kanban.inProgress;
      case 'Review': return kanban.review;
      case 'Completed': return kanban.completed;
      default: return [];
    }
  };

  const getAllAssignments = (): Assignment[] => kanban ? [...kanban.todo, ...kanban.assigned, ...kanban.inProgress, ...kanban.review, ...kanban.completed] : [];

  const columns: { id: AssignmentStatus; title: string; class: string }[] = [
    { id: 'Todo', title: 'TO DO', class: 'todo' },
    { id: 'Assigned', title: 'ASSIGNED', class: 'assigned' },
    { id: 'InProgress', title: 'IN PROGRESS', class: 'inprogress' },
    { id: 'Review', title: 'REVIEW', class: 'review' },
    { id: 'Completed', title: 'COMPLETED', class: 'completed' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Manager Dashboard - Kanban Board</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowFreelancerModal(true)}>Add Freelancer</button>
          <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>+ New Assignment</button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '2rem' }}>
        <div style={{ fontSize: '0.875rem' }}>
          <strong>Resources:</strong> {resources.filter(r => !r.isExternal).length} internal, {resources.filter(r => r.isExternal).length} external
        </div>
        <div style={{ fontSize: '0.875rem' }}>
          <strong>SLA:</strong> Copyediting 7d | ProofReading 5d | TEReview 3d | QACheck 2d
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {columns.map(col => (
            <div key={col.id} className="kanban-column">
              <div className={`kanban-column-header ${col.class}`}>{col.title} ({getColumnAssignments(col.id).length})</div>
              <SortableContext items={getColumnAssignments(col.id).map(a => a.id)} strategy={verticalListSortingStrategy}>
                {getColumnAssignments(col.id).map(assignment => (
                  <SortableCard key={assignment.id} assignment={assignment} onClick={() => setSelectedAssignment(assignment)} />
                ))}
              </SortableContext>
              <DropZone id={col.id} />
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeId ? <div className="kanban-card" style={{ transform: 'rotate(3deg)' }}>Moving...</div> : null}
        </DragOverlay>
      </DndContext>

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Assignment</h3>
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label className="form-label">Manuscript</label>
                <select className="form-select" value={assignForm.manuscriptId} onChange={e => setAssignForm({ ...assignForm, manuscriptId: parseInt(e.target.value) })} required>
                  <option value={0}>Select manuscript</option>
                  {manuscripts.map(m => <option key={m.id} value={m.id}>{m.manuscriptNumber} - {m.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={assignForm.assigneeId} onChange={e => setAssignForm({ ...assignForm, assigneeId: parseInt(e.target.value) })} required>
                  <option value={0}>Select resource</option>
                  {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.specialty || r.resourceType})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Task Type</label>
                <select className="form-select" value={assignForm.taskType} onChange={e => setAssignForm({ ...assignForm, taskType: e.target.value as TaskType })}>
                  <option value="Copyediting">Copyediting</option>
                  <option value="ProofReading">Proof Reading</option>
                  <option value="TEReview">TE Review</option>
                  <option value="QACheck">QA Check</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">SLA (hours)</label>
                <input type="number" className="form-input" value={assignForm.slaHours} onChange={e => setAssignForm({ ...assignForm, slaHours: parseInt(e.target.value) })} />
              </div>
              <button type="submit" className="btn btn-primary">Create Assignment</button>
            </form>
          </div>
        </div>
      )}

      {showFreelancerModal && (
        <div className="modal-overlay" onClick={() => setShowFreelancerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add External Freelancer</h3>
              <button className="btn btn-secondary" onClick={() => setShowFreelancerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddFreelancer}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={freelancerForm.name} onChange={e => setFreelancerForm({ ...freelancerForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={freelancerForm.email} onChange={e => setFreelancerForm({ ...freelancerForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Specialty</label>
                <select className="form-select" value={freelancerForm.specialty} onChange={e => setFreelancerForm({ ...freelancerForm, specialty: e.target.value })} required>
                  <option value="">Select specialty</option>
                  <option value="Copyediting">Copyediting</option>
                  <option value="ProofReading">Proof Reading</option>
                  <option value="TEReview">TE Review</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hourly Rate ($)</label>
                <input type="number" className="form-input" value={freelancerForm.hourlyRate} onChange={e => setFreelancerForm({ ...freelancerForm, hourlyRate: parseFloat(e.target.value) })} required />
              </div>
              <button type="submit" className="btn btn-primary">Add Freelancer</button>
            </form>
          </div>
        </div>
      )}

      {selectedAssignment && (
        <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assignment Details</h3>
              <button className="btn btn-secondary" onClick={() => setSelectedAssignment(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div><strong>Manuscript:</strong> {selectedAssignment.manuscriptTitle}</div>
              <div><strong>Assignee:</strong> {selectedAssignment.assigneeName}</div>
              <div><strong>Task Type:</strong> {selectedAssignment.taskType}</div>
              <div><strong>Status:</strong> {selectedAssignment.status}</div>
              <div><strong>SLA:</strong> {selectedAssignment.slaHours} hours</div>
              {selectedAssignment.deadline && <div><strong>Deadline:</strong> {new Date(selectedAssignment.deadline).toLocaleDateString()}</div>}
              {selectedAssignment.notes && <div><strong>Notes:</strong> {selectedAssignment.notes}</div>}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              {selectedAssignment.status !== 'Completed' && (
                <button className="btn btn-primary" onClick={async () => {
                  await assignmentApi.updateStatus(selectedAssignment.id, 'Completed');
                  assignmentApi.getKanban().then(setKanban).catch(console.error);
                  setSelectedAssignment(null);
                  toast.success('Marked as completed!');
                }}>Mark Complete</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DropZone({ id }: { id: string }) {
  return <div data-droppable-id={id} style={{ minHeight: 50, border: '2px dashed transparent', borderRadius: 4, marginTop: '0.5rem' }} />;
}