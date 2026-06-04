import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  FolderPlus, 
  X, 
  Users, 
  CheckSquare, 
  ArrowRight 
} from 'lucide-react';

const Projects = () => {
  const { showToast } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Project Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync modal state with query parameter "?create=true"
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setIsModalOpen(true);
    }
  }, [location.search]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.getProjects();
      setProjects(list);
    } catch (error) {
      showToast(error.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // clear query param
    navigate('/projects');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name) {
      showToast('Project name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const data = await api.createProject(name, description);
      showToast(data.message || 'Project created successfully!', 'success');
      
      // Reset form
      setName('');
      setDescription('');
      handleCloseModal();
      
      // Refresh list
      fetchProjects();
    } catch (error) {
      showToast(error.message || 'Project creation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
    const descMatch = p.description ? p.description.toLowerCase().includes(q) : false;
    return nameMatch || descMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage workspaces, project scopes, and your team memberships</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          style={{ 
            background: 'transparent', 
            border: 'none', 
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '15px',
            width: '100%',
            fontFamily: 'var(--font-sans)'
          }}
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
          <p className="animate-pulse-slow" style={{ fontSize: '16px', fontWeight: 600 }}>Loading projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="glass-panel project-card"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="project-card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className={`project-badge ${(project.myRole || 'MEMBER').toLowerCase()}`}>
                    {project.myRole || 'MEMBER'}
                  </span>
                </div>
                <h3 className="project-card-title">{project.name}</h3>
                <p className="project-card-desc">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="project-card-footer">
                <div className="project-stats">
                  <div className="project-stat-item" title="Team members">
                    <Users size={14} />
                    <span>{project._count?.members || 0}</span>
                  </div>
                  <div className="project-stat-item" title="Project tasks">
                    <CheckSquare size={14} />
                    <span>{project._count?.tasks || 0}</span>
                  </div>
                </div>
                <div style={{ color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600 }}>
                  <span>Open board</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <FolderPlus size={48} style={{ color: 'var(--text-muted)' }} />
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>No projects found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Get started by creating a new workspace project</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Create Project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Design System V2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Summarize project scope, objectives, or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
