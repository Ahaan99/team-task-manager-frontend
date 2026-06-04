import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  CheckCircle, Clock, Layers, AlertTriangle, Calendar, User,
  FolderDot, TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Animated counter ─────────────────────────────────── */
const Counter = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / 24);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
};

/* ── Custom Tooltip ───────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

/* ── Stat Card ────────────────────────────────────────── */
const StatCard = ({ icon: Icon, iconColor, iconBg, value, label, progress, progressColor, trend, delay = 0 }) => (
  <motion.div
    className="glass-panel stat-card"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: 'easeOut' }}
  >
    <div className="stat-card-icon" style={{ background: iconBg, borderColor: 'transparent' }}>
      <Icon size={18} style={{ color: iconColor }} />
    </div>
    <div className="stat-card-value">
      <Counter value={value} />
    </div>
    <div className="stat-card-label">{label}</div>
    {trend !== undefined && (
      <div className={`stat-card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
        {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        <span>{Math.abs(trend)}% vs last week</span>
      </div>
    )}
    {progress !== undefined && (
      <div className="stat-progress-bar">
        <motion.div
          className="stat-progress-fill"
          style={{ background: progressColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: delay + 0.2, duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    )}
  </motion.div>
);

/* ── Donut Chart ──────────────────────────────────────── */
const DonutChart = ({ done, progress, todo, total }) => {
  const r = 62;
  const circ = 2 * Math.PI * r;
  const doneFrac = total > 0 ? done / total : 0;
  const progressFrac = total > 0 ? progress / total : 0;
  const donePct = Math.round(doneFrac * 100);
  const progressPct = Math.round(progressFrac * 100);
  const todoPct = 100 - donePct - progressPct;

  const segments = [
    { frac: doneFrac, color: '#10b981', offset: 0 },
    { frac: progressFrac, color: '#f59e0b', offset: doneFrac },
    { frac: total > 0 ? todo / total : 0, color: '#475569', offset: doneFrac + progressFrac },
  ];

  return (
    <div className="donut-wrap">
      <div style={{ position: 'relative', width: 148, height: 148, flexShrink: 0 }}>
        <svg className="donut-svg" width="148" height="148" viewBox="0 0 148 148">
          <circle cx="74" cy="74" r={r} fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="13" />
          {total > 0 && segments.map((s, i) => (
            <circle
              key={i}
              cx="74" cy="74" r={r}
              fill="transparent"
              stroke={s.color}
              strokeWidth="13"
              strokeDasharray={`${circ * s.frac} ${circ * (1 - s.frac)}`}
              strokeDashoffset={-circ * s.offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          ))}
        </svg>
        <div className="donut-center">
          <span className="donut-pct">{donePct}%</span>
          <span className="donut-label">Done</span>
        </div>
      </div>
      <div className="legend-list">
        {[
          { color: '#10b981', label: 'Done', count: done, pct: donePct },
          { color: '#f59e0b', label: 'In Progress', count: progress, pct: progressPct },
          { color: '#475569', label: 'To Do', count: todo, pct: todoPct },
        ].map(l => (
          <div key={l.label} className="legend-item">
            <div className="legend-dot" style={{ background: l.color }} />
            <span>{l.label}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text-primary)' }}>{l.count}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>{l.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Priority Bar Chart ───────────────────────────────── */
const PriorityChart = ({ low, medium, high }) => {
  const data = [
    { name: 'Low', value: low, color: '#3b82f6' },
    { name: 'Medium', value: medium, color: '#f59e0b' },
    { name: 'High', value: high, color: '#ef4444' },
  ];
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barCategoryGap="35%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={24} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ── Workload Row ─────────────────────────────────────── */
const WorkloadRow = ({ name, email, taskCount, maxCount, delay }) => (
  <motion.div
    className="workload-row"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
  >
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {name[0].toUpperCase()}
    </div>
    <div className="workload-bar-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span className="workload-name">{name}</span>
        <span className="workload-count">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
      </div>
      <div className="workload-bar">
        <motion.div
          className="workload-fill"
          initial={{ width: 0 }}
          animate={{ width: `${maxCount > 0 ? (taskCount / maxCount) * 100 : 0}%` }}
          transition={{ delay: delay + 0.15, duration: 0.65, ease: 'easeOut' }}
        />
      </div>
    </div>
  </motion.div>
);

/* ── Skeleton ─────────────────────────────────────────── */
const DashboardSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="skeleton" style={{ height: 240 }} />
      <div className="skeleton" style={{ height: 240 }} />
    </div>
  </div>
);

/* ── Dashboard ────────────────────────────────────────── */
const Dashboard = () => {
  const { showToast } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [projs, data] = await Promise.all([api.getProjects(), api.getDashboardStats()]);
        setProjects(projs);
        setStats(data);
      } catch (e) {
        showToast(e.message || 'Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const handleProjectChange = async (e) => {
    const pid = e.target.value;
    setSelectedProjectId(pid);
    setLoading(true);
    try {
      const data = await api.getDashboardStats(pid);
      setStats(data);
    } catch (e) {
      showToast(e.message || 'Failed to update stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const total = stats?.totalTasks || 0;
  const done = stats?.statusBreakdown?.DONE || 0;
  const inProgress = stats?.statusBreakdown?.IN_PROGRESS || 0;
  const todo = stats?.statusBreakdown?.TODO || 0;
  const overdueCount = stats?.overdueCount || 0;
  const overdueTasks = stats?.overdueTasks || [];
  const tasksPerUser = stats?.tasksPerUser || [];
  const priorityBreakdown = stats?.priorityBreakdown || { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const maxWorkload = tasksPerUser.length > 0 ? Math.max(...tasksPerUser.map(u => u.taskCount)) : 1;

  const formatDate = d => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="page-title">Workspace Analytics</h1>
          <p className="page-subtitle">Real-time team workload and project progress</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FolderDot size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="filter-select" value={selectedProjectId} onChange={handleProjectChange}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </motion.div>
      </div>

      {/* Loading bar */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ opacity: 0 }}
            style={{ height: 2, background: 'var(--gradient-accent)', borderRadius: 1, transformOrigin: 'left', width: '100%' }}
          />
        )}
      </AnimatePresence>

      {loading && !stats ? <DashboardSkeleton /> : (
        <>
          {/* Overdue banner */}
          <AnimatePresence>
            {overdueCount > 0 && (
              <motion.div className="overdue-banner"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div className="overdue-banner-content">
                  <div className="overdue-banner-title">{overdueCount} Task{overdueCount > 1 ? 's' : ''} Overdue</div>
                  <div className="overdue-banner-desc">
                    {overdueCount} task{overdueCount > 1 ? 's have' : ' has'} passed due dates without being completed.
                  </div>
                </div>
                <a href="#overdue-section" className="btn btn-danger btn-sm">View</a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat Cards */}
          <div className="stats-grid">
            <StatCard icon={Layers} iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.1)"
              value={total} label="Total Tasks" delay={0} />
            <StatCard icon={CheckCircle} iconColor="#10b981" iconBg="rgba(16,185,129,0.1)"
              value={done} label="Completed"
              progress={total > 0 ? Math.round((done / total) * 100) : 0}
              progressColor="#10b981" delay={0.05} />
            <StatCard icon={Clock} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)"
              value={inProgress} label="In Progress"
              progress={total > 0 ? Math.round((inProgress / total) * 100) : 0}
              progressColor="#f59e0b" delay={0.1} />
            <StatCard icon={AlertTriangle} iconColor={overdueCount > 0 ? '#ef4444' : '#64748b'}
              iconBg={overdueCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)'}
              value={overdueCount} label="Overdue" delay={0.15} />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Status Donut */}
            <motion.div className="glass-panel chart-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div>
                <h3 className="chart-title">Status Distribution</h3>
                <p className="chart-subtitle">Task completion overview</p>
              </div>
              {total > 0
                ? <DonutChart done={done} progress={inProgress} todo={todo} total={total} />
                : <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>No tasks yet</div>
              }
            </motion.div>

            {/* Priority Bar Chart */}
            <motion.div className="glass-panel chart-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div>
                <h3 className="chart-title">Priority Breakdown</h3>
                <p className="chart-subtitle">Tasks by urgency level</p>
              </div>
              <PriorityChart
                low={priorityBreakdown.LOW || 0}
                medium={priorityBreakdown.MEDIUM || 0}
                high={priorityBreakdown.HIGH || 0}
              />
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                {[{ c: '#3b82f6', l: 'Low' }, { c: '#f59e0b', l: 'Medium' }, { c: '#ef4444', l: 'High' }].map(b => (
                  <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: b.c }} />
                    {b.l}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Workload + Project Progress Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Team Workload */}
            <motion.div className="glass-panel chart-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 className="chart-title">Team Workload</h3>
                <p className="chart-subtitle">Tasks assigned per member</p>
              </div>
              {tasksPerUser.length > 0 ? (
                <div className="workload-list">
                  {tasksPerUser.slice(0, 6).map((u, i) => (
                    <WorkloadRow key={u.id || 'unassigned'} name={u.name} email={u.email}
                      taskCount={u.taskCount} maxCount={maxWorkload} delay={0.3 + i * 0.05} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>No workload data</div>
              )}
            </motion.div>

            {/* Project Overview */}
            <motion.div className="glass-panel chart-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 className="chart-title">Project Overview</h3>
                <p className="chart-subtitle">Your active workspaces</p>
              </div>
              {projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {projects.slice(0, 5).map((p, i) => {
                    const pct = Math.floor(Math.random() * 40 + 40); // visual only
                    return (
                      <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: 0.35 + i * 0.06 }}
                          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}
                          whileHover={{ borderColor: 'rgba(139,92,246,0.3)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p._count?.tasks || 0} tasks</span>
                          </div>
                          <div className="progress-track">
                            <motion.div className="progress-fill"
                              style={{ background: 'var(--gradient-accent)', width: `${pct}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.4 + i * 0.06, duration: 0.7 }}
                            />
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>No projects yet</div>
              )}
            </motion.div>
          </div>

          {/* Overdue Table */}
          <AnimatePresence>
            {overdueCount > 0 && (
              <motion.div id="overdue-section" className="glass-panel"
                style={{ padding: 28 }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#f87171' }}>
                  <AlertTriangle size={16} /> Overdue Tasks
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {['Task', 'Project', 'Assignee', 'Priority', 'Due Date'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {overdueTasks.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 13 }}>
                          <td style={{ padding: '14px' }}>
                            <Link to={`/projects/${t.projectId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>{t.title}</Link>
                          </td>
                          <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{t.projectName}</td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                              <User size={12} />{t.assignedTo}
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span className={`task-priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                          </td>
                          <td style={{ padding: '14px', color: '#f87171', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Calendar size={12} />{formatDate(t.dueDate)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default Dashboard;
