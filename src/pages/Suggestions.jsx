import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Send, Trash2, Check, X } from 'lucide-react';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { canViewSuggestions, canDeleteSuggestions } from '../utils/permissions';

const Suggestions = () => {
  const { role, user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [memberPermissions, setMemberPermissions] = useState({
    canViewSuggestions: false,
    canDeleteSuggestions: false
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'feature'
  });

  const canView = role === 'Admin' || canViewSuggestions(role, memberPermissions);

  useEffect(() => {
    loadSuggestions();
    if (role && role !== 'Admin' && user) {
      loadMemberPermissions();
    }
  }, [role, user]);

  const loadMemberPermissions = async () => {
    const { getMemberPermissions } = await import('../utils/permissions');
    const permissions = await getMemberPermissions(user.email);
    setMemberPermissions(permissions);
  };

  const loadSuggestions = async () => {
    const result = await getCollection('suggestions');
    if (result.success) {
      const sorted = result.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSuggestions(sorted);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      status: 'pending',
      author: user.email,
      authorName: user.email.split('@')[0],
      createdAt: new Date().toISOString()
    };

    await addDocument('suggestions', data);
    setShowForm(false);
    setFormData({ title: '', description: '', category: 'feature' });
    loadSuggestions();
  };

  const handleStatusChange = async (id, status) => {
    await updateDocument('suggestions', id, { status });
    loadSuggestions();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this suggestion?')) {
      await deleteDocument('suggestions', id);
      loadSuggestions();
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'feature': return 'bg-blue-100 text-blue-700';
      case 'bug': return 'bg-red-100 text-red-700';
      case 'improvement': return 'bg-green-100 text-green-700';
      case 'other': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'implemented': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Development Box</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Submit Suggestion
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit App Improvement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Brief title of your suggestion"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  <option value="feature">New Feature</option>
                  <option value="bug">Bug Fix</option>
                  <option value="improvement">Improvement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe your suggestion in detail..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Send size={18} />
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', description: '', category: 'feature' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Suggestions List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            All Suggestions ({suggestions.length})
          </h2>
          
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No suggestions yet. Be the first to submit one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const canManage = role === 'Admin' || canDeleteSuggestions(role, memberPermissions) || (canView && suggestion.author === user.email);
                
                return (
                  <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(suggestion.category)}`}>
                            {suggestion.category}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                            {suggestion.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">{suggestion.title}</h3>
                        <p className="text-gray-700 mt-2">{suggestion.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>By {suggestion.authorName}</span>
                          <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {role === 'Admin' && (
                          <>
                            {suggestion.status !== 'approved' && (
                              <button
                                onClick={() => handleStatusChange(suggestion.id, 'approved')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check size={18} />
                              </button>
                            )}
                            {suggestion.status !== 'rejected' && (
                              <button
                                onClick={() => handleStatusChange(suggestion.id, 'rejected')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X size={18} />
                              </button>
                            )}
                            {suggestion.status !== 'implemented' && (
                              <button
                                onClick={() => handleStatusChange(suggestion.id, 'implemented')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Mark as Implemented"
                              >
                                <Check size={18} />
                              </button>
                            )}
                          </>
                        )}
                        {canManage && (
                          <button
                            onClick={() => handleDelete(suggestion.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info for Admin */}
        {role === 'Admin' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Admin Info</h3>
            <p className="text-sm text-blue-800">
              As Admin, you can approve, reject, or mark suggestions as implemented. 
              Only you and members with "Can View Suggestions" permission can see all suggestions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suggestions;
