import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Send, Trash2, Check, X, Clock, User } from 'lucide-react';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Issues = () => {
  const { role, user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'General'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    const result = await getCollection('issues');
    if (result.success) {
      const sorted = result.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setIssues(sorted);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      author: user.email,
      authorName: user.email.split('@')[0],
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await addDocument('issues', data);
    setShowForm(false);
    setFormData({ title: '', description: '', priority: 'Medium', category: 'General' });
    loadIssues();
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateDocument('issues', id, { 
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    loadIssues();
  };

  const handleDelete = async (id) => {
    if (role === 'Admin' && window.confirm('Are you sure you want to delete this issue?')) {
      await deleteDocument('issues', id);
      loadIssues();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Issues</h1>
            <p className="text-gray-600 mt-1">Raise and track community issues</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Raise Issue
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Raise New Issue</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Brief summary of the issue"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="General">General</option>
                    <option value="Facilities">Facilities</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[120px]"
                  placeholder="Detailed description of the issue"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Send size={18} />
                  Submit Issue
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {issues.length === 0 ? (
            <div className="card text-center py-12">
              <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No issues raised yet</p>
            </div>
          ) : (
            issues.map((issue) => (
              <div key={issue.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{issue.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{issue.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {issue.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      <span>Category: {issue.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {role === 'Admin' && (
                      <>
                        {issue.status === 'Open' && (
                          <button
                            onClick={() => handleStatusChange(issue.id, 'In Progress')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as In Progress"
                          >
                            <Clock size={18} />
                          </button>
                        )}
                        {issue.status === 'In Progress' && (
                          <button
                            onClick={() => handleStatusChange(issue.id, 'Resolved')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as Resolved"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(issue.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Issues;
