import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Trash2, Calendar, User } from 'lucide-react';
import { getCollection, addDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getMemberPermissions, canEditContent, canDelete } from '../utils/permissions';
import { jsPDF } from 'jspdf';

const Minutes = () => {
  const { role, user } = useAuth();
  const canDownload = role === 'Admin' || role === 'Secretary';
  const [minutes, setMinutes] = useState([]);
  const [memberPermissions, setMemberPermissions] = useState({
    canEditMinutes: false,
    canEditProjects: false,
    canEditAttendance: false,
    canDeleteContent: false
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    content: ''
  });

  useEffect(() => {
    loadMinutes();
    if (role === 'Member' && user) {
      loadMemberPermissions();
    }
  }, [role, user]);

  const loadMemberPermissions = async () => {
    const permissions = await getMemberPermissions(user.email);
    setMemberPermissions(permissions);
  };

  const loadMinutes = async () => {
    const result = await getCollection('minutes');
    if (result.success) {
      setMinutes(result.data);
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
    
    await addDocument('minutes', data);
    setShowForm(false);
    setFormData({ title: '', date: '', content: '' });
    loadMinutes();
  };

  const handleDelete = async (id) => {
    if (canDelete(role, memberPermissions)) {
      if (window.confirm('Are you sure you want to delete this minutes?')) {
        await deleteDocument('minutes', id);
        loadMinutes();
      }
    }
  };

  const downloadMinutes = (minute) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Meeting Minutes', 20, 20);
    doc.setFontSize(14);
    doc.text(minute.title, 20, 40);
    doc.setFontSize(10);
    doc.text(`Date: ${minute.date}`, 20, 50);
    doc.text(`Author: ${minute.authorName} (${minute.author})`, 20, 58);
    doc.setFontSize(12);
    doc.text('Content:', 20, 75);
    doc.text(minute.content, 20, 85, { maxWidth: 170 });
    doc.save(`minutes-${minute.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const canPost = role === 'Admin' || role === 'Secretary' || canEditContent(role, 'canEditMinutes', memberPermissions);

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
          <h1 className="text-3xl font-bold text-gray-900">Meeting Minutes</h1>
          {canPost && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              {showForm ? 'Cancel' : 'Post Minutes'}
            </button>
          )}
        </div>

        {/* Post Minutes Form */}
        {showForm && canPost && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Post New Minutes</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Weekly Meeting - Week 12"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-field min-h-[200px]"
                  placeholder="Enter the minutes content here..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', date: '', content: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Post Minutes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Minutes List */}
        <div className="space-y-4">
          {minutes.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No minutes posted yet.</p>
              {canPost && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary mt-4"
                >
                  Post First Minutes
                </button>
              )}
            </div>
          ) : (
            minutes.map((minute) => (
              <div key={minute.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{minute.title}</h3>
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        {new Date(minute.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{minute.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(minute.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap">{minute.content}</p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {canDownload && (
                      <button
                        onClick={() => downloadMinutes(minute)}
                        className="btn-secondary flex items-center gap-2"
                        title="Download"
                      >
                        <Download size={18} />
                        Download
                      </button>
                    )}
                    {canDelete(role, memberPermissions) && (
                      <button
                        onClick={() => handleDelete(minute.id)}
                        className="btn-danger flex items-center gap-2"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                        Delete
                      </button>
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

export default Minutes;
