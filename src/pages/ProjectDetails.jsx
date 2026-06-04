import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, X, Calendar, CheckSquare,
  UserPlus, AlertTriangle, Activity, CheckCircle,
  Clock, Layers, ArrowRight, Zap
} from 'lucide-react';

/* ── Initials helper ─────────────────────────────────── */
const initials = name => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

/* ── Mini stat pill ──────────────────────────────────── */
const MiniStat = ({ icon: Icon, iconColor, iconBg, value, label, delay }) => (
  <motion.div
    className="glass-panel"
    style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
  >
    <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} style={{ color: iconColor }} />
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  </motion.div>
);

/* ── Task Card ───────────────────────────────────────── */
const TaskCard = ({ task, onClick, delay }) => {
  const overdue = task.status !== 'DONE' && new Date(task.dueDate) < new Date();
  return (
    <motion.div
      className={`glass-panel task-card priority-${task.priority.toLowerCase()}`}
      onClick={() => onClick(task)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <div className="task-card-top">
        <span className={`task-priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
        {overdue && <AlertTriangle size={12} style={{ color: 'var(--color-high)', flexShrink: 0 }} />}
      </div>
      <h4 className="task-card-title">{task.title}</h4>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-footer">
        {task.status === 'DONE'
          ? <span className="task-due" style={{ color: 'var(--color-done)' }}><CheckSquare size={11} /><span>Done</span></span>
          : <span className={`task-due ${overdue ? 'overdue' : ''}`}>
              <Calendar size={11} />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </span>
        }
        {task.assignedTo
          ? <div className="task-assignee" title={`Assigned to ${task.assignedTo.name}`}>{initials(task.assignedTo.name)}</div>
          : <div className="task-assignee" style={{ background: '#374151', color: 'var(--text-muted)' }} title="Unassigned">?</div>
        }
      </div>
    </motion.div>
  );
};

/* ── Activity Item ───────────────────────────────────── */
const ActivityItem = ({ icon: Icon, iconColor, iconBg, text, time }) => (
  <div className="activity-item">
    <div className="activity-icon" style={{ background: iconBg }}>
      <Icon size={12} style={{ color: iconColor }} />
    </div>
    <div className="activity-text">
      <div className="activity-action" dangerouslySetInnerHTML={{ __html: text }} />
      <div className="activity-time">{time}</div>
    </div>
  </div>
);

/* ── Main Component ──────────────────────────────────── */
const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, showToast } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskStatus, setTaskStatus] = useState('TODO');
  const [submittingTask, setSubmittingTask] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProjectById(id);
      setProject(data);
    } catch (e) {
      showToast(e.message || 'Failed to load project', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, navigate]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const isAdmin = project?.myRole === 'ADMIN';
  const tasks = project?.tasks || [];
  const todoTasks = useMemo(() => tasks.filter(t => t.status === 'TODO'), [tasks]);
  const progressTasks = useMemo(() => tasks.filter(t => t.status === 'IN_PROGRESS'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter(t => t.status === 'DONE'), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter(t => t.status !== 'DONE' && new Date(t.dueDate) < new Date()), [tasks]);
  const donePct = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const openCreate = () => {
    setSelectedTask(null); setTaskTitle(''); setTaskDescription('');
    setTaskDueDate(''); setTaskPriority('MEDIUM'); setTaskAssigneeId(''); setTaskStatus('TODO');
    setIsTaskModalOpen(true);
  };

  const openEdit = (task) => {
    setSelectedTask(task); setTaskTitle(task.title); setTaskDescription(task.description || '');
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setTaskPriority(task.priority); setTaskAssigneeId(task.assignedToId ? String(task.assignedToId) : '');
    setTaskStatus(task.status); setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle) { showToast('Title is required', 'error'); return; }
    if (!taskDueDate) { showToast('Due date is required', 'error'); return; }
    try {
      setSubmittingTask(true);
      const payload = { title: taskTitle, description: taskDescription, dueDate: taskDueDate, priority: taskPriority, projectId: parseInt(id), assignedToId: taskAssigneeId ? parseInt(taskAssigneeId) : null, status: taskStatus };
      const res = selectedTask
        ? await api.updateTask(selectedTask.id, isAdmin ? payload : { status: taskStatus })
        : await api.createTask(payload);
      showToast(res.message || 'Saved!', 'success');
      setIsTaskModalOpen(false); setSelectedTask(null);
      fetchProject();
    } catch (e) { showToast(e.message || 'Save failed', 'error'); }
    finally { setSubmittingTask(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await api.deleteTask(taskId);
      showToast(res.message || 'Deleted', 'success');
      setIsTaskModalOpen(false); setSelectedTask(null);
      fetchProject();
    } catch (e) { showToast(e.message || 'Delete failed', 'error'); }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Permanently delete this project and all its tasks?')) return;
    try {
      const res = await api.deleteProject(id);
      showToast(res.message || 'Project deleted', 'success');
      navigate('/projects');
    } catch (e) { showToast(e.message || 'Delete failed', 'error'); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) { showToast('Email required', 'error'); return; }
    try {
      setSubmittingInvite(true);
      const res = await api.addProjectMember(id, inviteEmail, inviteRole);
      showToast(res.message || 'Member added', 'success');
      setInviteEmail(''); setInviteRole('MEMBER');
      fetchProject();
    } catch (e) { showToast(e.message || 'Failed to add member', 'error'); }
    finally { setSubmittingInvite(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await api.removeProjectMember(id, userId);
      showToast(res.message || 'Removed', 'success');
      fetchProject();
    } catch (e) { showToast(e.message || 'Remove failed', 'error'); }
  };

  // Synthesize activity feed from tasks
  const activityFeed = useMemo(() => {
    if (!project) return [];
    const items = [];
    doneTasks.slice(0, 3).forEach(t => items.push({
      icon: CheckCircle, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)',
      text: `<strong>${t.assignedTo?.name || 'Someone'}</strong> completed <strong>${t.title}</strong>`,
      time: new Date(t.updatedAt || t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
    progressTasks.slice(0, 2).forEach(t => items.push({
      icon: Clock, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)',
      text: `<strong>${t.title}</strong> is in progress`,
      time: new Date(t.updatedAt || t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
    overdueTasks.slice(0, 2).forEach(t => items.push({
      icon: AlertTriangle, iconColor: '#ef4444', iconBg: 'rgba(239,68,68,0.1)',
      text: `<strong>${t.title}</strong> is overdue`,
      time: new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
    project.members?.slice(0, 2).forEach(m => items.push({
      icon: UserPlus, iconColor: '#8B5CF6', iconBg: 'rgba(139,92,246,0.1)',
      text: `<strong>${m.user.name}</strong> joined as ${m.role}`,
      time: new Date(m.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
    return items.slice(0, 10);
  }, [project, doneTasks, progressTasks, overdueTasks]);

  if (loading && !project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 28 }}>
        <div className="skeleton" style={{ height: 64, borderRadius: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 86 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 400 }} />)}
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="project-shell">
      {/* Project Top Bar */}
      <div className="project-topbar">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="page-title">{project.name}</h1>
            <span className={`project-badge ${project.myRole.toLowerCase()}`}>{project.myRole}</span>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>{project.description || 'No description.'}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsMembersModalOpen(true)}>
            <Users size={15} />
            <span>Team · {project.members?.length || 0}</span>
          </button>
          {isAdmin && (
            <>
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={15} /><span>Add Task</span>
              </button>
              {project.creatorId === currentUser.id && (
                <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
                  <Trash2 size={15} />
                </button>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Analytics Strip */}
      <div className="project-analytics-strip">
        <MiniStat icon={Layers} iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.1)" value={tasks.length} label="Total Tasks" delay={0.05} />
        <MiniStat icon={CheckCircle} iconColor="#10b981" iconBg="rgba(16,185,129,0.1)" value={doneTasks.length} label={`Done · ${donePct}%`} delay={0.1} />
        <MiniStat icon={Clock} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" value={progressTasks.length} label="In Progress" delay={0.15} />
        <MiniStat icon={AlertTriangle} iconColor={overdueTasks.length > 0 ? '#ef4444' : '#64748b'} iconBg={overdueTasks.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)'} value={overdueTasks.length} label="Overdue" delay={0.2} />
      </div>

      {/* Project progress bar */}
      <div style={{ padding: '0 28px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Project completion</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{donePct}%</span>
        </div>
        <div className="progress-track" style={{ height: 5 }}>
          <motion.div className="progress-fill" style={{ background: 'var(--gradient-accent)' }}
            initial={{ width: 0 }} animate={{ width: `${donePct}%` }} transition={{ delay: 0.25, duration: 0.8 }} />
        </div>
      </div>

      {/* Body: Kanban + Activity */}
      <div className="project-body">
        {/* Kanban */}
        <div className="kanban-area">
          <div className="kanban-board">
            {/* TO DO */}
            <div className="kanban-column">
              <div className="kanban-col-header">
                <div className="kanban-col-title-wrap">
                  <div className="col-dot todo" />
                  <span className="kanban-col-title">To Do</span>
                </div>
                <span className="kanban-col-count">{todoTasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {todoTasks.map((t, i) => <TaskCard key={t.id} task={t} onClick={openEdit} delay={i * 0.04} />)}
                {isAdmin && (
                  <motion.button
                    onClick={openCreate}
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', marginTop: 4 }}
                    whileHover={{ x: 2 }}
                  >
                    <Plus size={14} /> Add task
                  </motion.button>
                )}
              </div>
            </div>

            {/* IN PROGRESS */}
            <div className="kanban-column">
              <div className="kanban-col-header">
                <div className="kanban-col-title-wrap">
                  <div className="col-dot progress" />
                  <span className="kanban-col-title">In Progress</span>
                </div>
                <span className="kanban-col-count">{progressTasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {progressTasks.map((t, i) => <TaskCard key={t.id} task={t} onClick={openEdit} delay={i * 0.04} />)}
              </div>
            </div>

            {/* DONE */}
            <div className="kanban-column">
              <div className="kanban-col-header">
                <div className="kanban-col-title-wrap">
                  <div className="col-dot done" />
                  <span className="kanban-col-title">Done</span>
                </div>
                <span className="kanban-col-count">{doneTasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {doneTasks.map((t, i) => <TaskCard key={t.id} task={t} onClick={openEdit} delay={i * 0.04} />)}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Panel */}
        <aside className="activity-panel">
          <div className="activity-panel-header">
            <Activity size={14} style={{ color: 'var(--accent)' }} />
            Activity
          </div>

          <div className="activity-feed">
            {activityFeed.length > 0
              ? activityFeed.map((item, i) => <ActivityItem key={i} {...item} />)
              : <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 32 }}>No activity yet</div>
            }
          </div>

          {/* Members compact list */}
          <div className="members-compact">
            <p className="members-compact-title">Team · {project.members?.length || 0}</p>
            {project.members?.slice(0, 5).map(m => (
              <div key={m.userId} className="member-row">
                <div className="member-avatar">{initials(m.user.name)}</div>
                <span className="member-name">{m.user.name}</span>
                <span className="member-role-tag">{m.role}</span>
              </div>
            ))}
            {project.members?.length > 5 && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, width: '100%', fontSize: 12 }} onClick={() => setIsMembersModalOpen(true)}>
                +{project.members.length - 5} more <ArrowRight size={12} />
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* ── Task Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-panel modal-box"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}>

              <div className="modal-header">
                <h2 className="modal-title">
                  {selectedTask ? (isAdmin ? 'Edit Task' : 'Update Status') : 'New Task'}
                </h2>
                <button className="modal-close" onClick={() => { setIsTaskModalOpen(false); setSelectedTask(null); }}>
                  <X size={18} />
                </button>
              </div>

              {!isAdmin && selectedTask && selectedTask.assignedToId !== currentUser.id && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} /> This task isn't assigned to you — view only.
                </div>
              )}

              <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} disabled={!isAdmin} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" style={{ minHeight: 72, resize: 'vertical' }} value={taskDescription} onChange={e => setTaskDescription(e.target.value)} disabled={!isAdmin} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} disabled={!isAdmin} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={taskPriority} onChange={e => setTaskPriority(e.target.value)} disabled={!isAdmin}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select className="form-input" value={taskAssigneeId} onChange={e => setTaskAssigneeId(e.target.value)} disabled={!isAdmin}>
                      <option value="">Unassigned</option>
                      {project.members?.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={taskStatus} onChange={e => setTaskStatus(e.target.value)}
                      disabled={!isAdmin && selectedTask?.assignedToId !== currentUser.id}>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions-split">
                  {isAdmin && selectedTask
                    ? <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(selectedTask.id)}><Trash2 size={14} /> Delete</button>
                    : <div />
                  }
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setIsTaskModalOpen(false); setSelectedTask(null); }}>Cancel</button>
                    {(isAdmin || (selectedTask && selectedTask.assignedToId === currentUser.id)) && (
                      <button type="submit" className="btn btn-primary btn-sm" disabled={submittingTask}>
                        {submittingTask ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Members Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {isMembersModalOpen && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-panel modal-box" style={{ maxWidth: 480 }}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}>

              <div className="modal-header">
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={20} style={{ color: 'var(--accent)' }} /> Team Members
                </h2>
                <button className="modal-close" onClick={() => setIsMembersModalOpen(false)}><X size={18} /></button>
              </div>

              {isAdmin && (
                <form onSubmit={handleInvite} style={{ marginBottom: 22, paddingBottom: 22, borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 500 }}>Add Member</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="email" className="form-input" placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required style={{ flex: 1 }} />
                    <select className="form-input" style={{ width: 110 }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button type="submit" className="btn btn-primary btn-icon" disabled={submittingInvite}><UserPlus size={16} /></button>
                  </div>
                </form>
              )}

              <div className="members-list">
                {project.members?.map(m => (
                  <div key={m.userId} className="member-item">
                    <div className="member-user-details">
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                        {initials(m.user.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.user.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`member-role-badge ${m.role.toLowerCase()}`}>{m.role}</span>
                      {isAdmin && m.userId !== project.creatorId && m.userId !== currentUser.id && (
                        <button onClick={() => handleRemoveMember(m.userId)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }} title="Remove">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 18, marginTop: 18 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsMembersModalOpen(false)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetails;
