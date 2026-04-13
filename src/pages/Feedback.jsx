import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Eye, EyeOff, Send, Trash2, User } from 'lucide-react';
import { getCollection, addDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { canViewFeedback, canDeleteFeedback } from '../utils/permissions';

const Feedback = () => {
  const { role, user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [memberPermissions, setMemberPermissions] = useState({
    canViewFeedback: false,
    canDeleteFeedback: false
  });
  const [formData, setFormData] = useState({
    message: '',
    anonymous: false
  });

  const canView = role === 'Admin' || canViewFeedback(role, memberPermissions);

  useEffect(() => {
    loadFeedbacks();
    if (role === 'Member' && user) {
      loadMemberPermissions();
    }
  }, [role, user]);

  const loadMemberPermissions = async () => {
    const { getMemberPermissions } = await import('../utils/permissions');
    const permissions = await getMemberPermissions(user.email);
    setMemberPermissions(permissions);
  };

  const loadFeedbacks = async () => {
    const result = await getCollection('feedback');
    if (result.success) {
      // Sort by date descending
      const sorted = result.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFeedbacks(sorted);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      message: formData.message,
      anonymous: formData.anonymous,
      author: user.email,
      authorName: formData.anonymous ? 'Anonymous' : user.email.split('@')[0],
      createdAt: new Date().toISOString()
    };

    await addDocument('feedback', data);
    setShowForm(false);
    setFormData({ message: '', anonymous: false });
    loadFeedbacks();
  };

  const handleDelete = async (id) => {
    if (role === 'Admin' || user.email === feedbacks.find(f => f.id === id)?.author) {
      if (window.confirm('Are you sure you want to delete this feedback?')) {
        await deleteDocument('feedback', id);
        loadFeedbacks();
      }
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
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Submit Feedback
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Share your thoughts, suggestions, or concerns..."
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.anonymous}
                  onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-700 flex items-center gap-2">
                  <EyeOff size={16} />
                  Submit anonymously (hide my identity)
                </label>
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
                    setFormData({ message: '', anonymous: false });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feedback List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            All Feedback ({feedbacks.length})
          </h2>
          
          {feedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => {
                const canDeleteItem = role === 'Admin' || canDeleteFeedback(role, memberPermissions) || (!feedback.anonymous && feedback.author === user.email);
                const canViewAuthor = canView || !feedback.anonymous || feedback.author === user.email;
                
                return (
                  <div key={feedback.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {feedback.anonymous ? (
                            <span className="flex items-center gap-1 text-gray-500 text-sm">
                              <EyeOff size={14} />
                              Anonymous
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-700 text-sm">
                              <User size={14} />
                              {feedback.authorName}
                            </span>
                          )}
                          {feedback.anonymous && canView && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              Hidden from members
                            </span>
                          )}
                          {!feedback.anonymous && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              Public
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{feedback.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(feedback.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {canDeleteItem && (
                        <button
                          onClick={() => handleDelete(feedback.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
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
              Only you and members with "Can View Feedback" permission can see anonymous feedback.
              Regular members can only see non-anonymous feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
