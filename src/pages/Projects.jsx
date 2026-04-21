import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Download, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getMemberPermissions, canEditContent, canDeleteProjects } from '../utils/permissions';
import { jsPDF } from 'jspdf';

const Projects = () => {
  const { role, user } = useAuth();
  const canDownload = role === 'Admin' || role === 'Secretary';
  const [projects, setProjects] = useState([]);
  const [memberPermissions, setMemberPermissions] = useState({
    canEditMinutes: false,
    canEditProjects: false,
    canEditAttendance: false,
    canDeleteProjects: false
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'In Progress',
    report: ''
  });

  const statusColors = {
    'Success': 'bg-green-100 text-green-700 border-green-200',
    'Failed': 'bg-red-100 text-red-700 border-red-200',
    'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  const statusIcons = {
    'Success': CheckCircle,
    'Failed': XCircle,
    'In Progress': Clock
  };

  useEffect(() => {
    loadProjects();
    if (role && role !== 'Admin' && user) {
      loadMemberPermissions();
    }
  }, [role, user]);

  const loadMemberPermissions = async () => {
    const permissions = await getMemberPermissions(user.email);
    setMemberPermissions(permissions);
  };

  const loadProjects = async () => {
    const result = await getCollection('projects');
    if (result.success) {
      setProjects(result.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      author: user.email,
      authorName: user.email.split('@')[0]
    };
    
    if (editingProject) {
      await updateDocument('projects', editingProject.id, data);
    } else {
      await addDocument('projects', data);
    }
    
    setShowForm(false);
    setEditingProject(null);
    setFormData({ title: '', description: '', status: 'In Progress', report: '' });
    loadProjects();
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData(project);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (canDeleteProjects(role, memberPermissions)) {
      if (window.confirm('Are you sure you want to delete this project?')) {
        await deleteDocument('projects', id);
        loadProjects();
      }
    }
  };

  const canEditProject = (project) => {
    if (role === 'Admin') return true;
    if (project.author === user.email) return true;
    return canEditContent(role, 'canEditProjects', memberPermissions);
  };

  const downloadProject = (project) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Project Details', 20, 20);
    doc.setFontSize(14);
    doc.text(project.title, 20, 40);
    
    const StatusIcon = statusIcons[project.status];
    doc.setFontSize(10);
    doc.text(`Status: ${project.status}`, 20, 50);
    doc.text(`Author: ${project.authorName} (${project.author})`, 20, 58);
    doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, 20, 66);
    
    doc.setFontSize(12);
    doc.text('Description:', 20, 85);
    doc.text(project.description, 20, 95, { maxWidth: 170 });
    
    if (project.report) {
      let yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 150;
      if (yPosition < 120) yPosition = 120;
      doc.text('Project Report:', 20, yPosition);
      doc.text(project.report, 20, yPosition + 10, { maxWidth: 170 });
    }
    
    doc.save(`project-${project.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Projects & Ideas</h1>
          <button
            onClick={() => {
              setEditingProject(null);
              setFormData({ title: '', description: '', status: 'In Progress', report: '' });
              setShowForm(!showForm);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            {showForm ? 'Cancel' : 'Add Project'}
          </button>
        </div>

        {/* Project Form */}
        {showForm && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Campus Supply Initiative"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[120px]"
                  placeholder="Describe the project idea..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Report (Optional)</label>
                <textarea
                  value={formData.report}
                  onChange={(e) => setFormData({ ...formData, report: e.target.value })}
                  className="input-field min-h-[120px]"
                  placeholder="Add success/failed report, lessons learned, etc."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProject(null);
                    setFormData({ title: '', description: '', status: 'In Progress', report: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProject ? 'Update' : 'Add'} Project
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full card text-center py-12">
              <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No projects added yet.</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary mt-4"
              >
                Add First Project
              </button>
            </div>
          ) : (
            projects.map((project) => {
              const StatusIcon = statusIcons[project.status];
              return (
                <div key={project.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusColors[project.status]}`}>
                        <StatusIcon size={14} />
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>

                  {project.report && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Project Report</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{project.report}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    By {project.authorName} • {new Date(project.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    {canDownload && (
                      <button
                        onClick={() => downloadProject(project)}
                        className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    )}
                    {canEditProject(project) && (
                      <button
                        onClick={() => handleEdit(project)}
                        className="btn-secondary text-sm"
                        title="Edit"
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteProjects(role, memberPermissions) && (
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="btn-danger text-sm"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;
