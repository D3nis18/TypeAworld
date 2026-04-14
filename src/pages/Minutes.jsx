import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Trash2, Calendar, User, Image, ListTodo, Users, X, Clock, MapPin, Edit, Bell } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, updateDocument, query, where, collection, getDocs } from '../firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getMemberPermissions, canViewMinutes, canDownloadMinutes, canPostMinutes, canEditMinutes, canDeleteMinutes } from '../utils/permissions';
import { jsPDF } from 'jspdf';

const Minutes = () => {
  const { role, user } = useAuth();
  const [minutes, setMinutes] = useState([]);
  const [memberPermissions, setMemberPermissions] = useState({
    canViewMinutes: false,
    canDownloadMinutes: false,
    canPostMinutes: false,
    canEditMinutes: false,
    canDeleteMinutes: false
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    venue: '',
    reminder: '1 day',
    content: '',
    images: [],
    agendaItems: []
  });
  const [agendaInput, setAgendaInput] = useState('');

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
      // Sort by date descending
      const sorted = result.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMinutes(sorted);
    }
    setLoading(false);
  };

  const addAgendaItem = () => {
    if (agendaInput.trim()) {
      setFormData(prev => ({
        ...prev,
        agendaItems: [...prev.agendaItems, agendaInput.trim()]
      }));
      setAgendaInput('');
    }
  };

  const removeAgendaItem = (index) => {
    setFormData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    
    if (editingId) {
      await updateDocument('minutes', editingId, data);
      setEditingId(null);
    } else {
      data.author = user.email;
      data.authorName = user.email.split('@')[0];
      data.createdAt = new Date().toISOString();
      await addDocument('minutes', data);
    }
    
    setShowForm(false);
    setFormData({ title: '', date: '', time: '', venue: '', reminder: '1 day', content: '', images: [], agendaItems: [] });
    setAgendaInput('');
    loadMinutes();
  };

  const handleDelete = async (id) => {
    if (canDeleteMinutes(role, memberPermissions)) {
      if (window.confirm('Are you sure you want to delete this minutes?')) {
        await deleteDocument('minutes', id);
        loadMinutes();
      }
    }
  };

  const handleEdit = (minute) => {
    setFormData({
      title: minute.title,
      date: minute.date,
      time: minute.time || '',
      venue: minute.venue || '',
      reminder: minute.reminder || '1 day',
      content: minute.content,
      images: minute.images || [],
      agendaItems: minute.agendaItems || []
    });
    setEditingId(minute.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      venue: '',
      reminder: '1 day',
      content: '',
      images: [],
      agendaItems: []
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getAttendanceForDate = async (date) => {
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999)).toISOString();
    
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('timestamp', '>=', startOfDay),
      where('timestamp', '<=', endOfDay)
    );
    
    const querySnapshot = await getDocs(attendanceQuery);
    const result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return result;
  };

  const getApologiesForDate = async (date) => {
    const result = await getCollection('apologies');
    if (result.success) {
      return result.data.filter(apology => apology.date === date);
    }
    return [];
  };

  const downloadCompiledMinutes = async (minute) => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.text('TypeAworld - Meeting Minutes', 20, yPosition);
    yPosition += 15;
    
    // Basic Info
    doc.setFontSize(14);
    doc.text(minute.title, 20, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(minute.date).toLocaleDateString()}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Author: ${minute.authorName} (${minute.author})`, 20, yPosition);
    yPosition += 15;
    
    // Agenda Items
    if (minute.agendaItems && minute.agendaItems.length > 0) {
      doc.setFontSize(12);
      doc.text('Agenda:', 20, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      minute.agendaItems.forEach((item, idx) => {
        doc.text(`${idx + 1}. ${item}`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }
    
    // Content
    doc.setFontSize(12);
    doc.text('Minutes:', 20, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    const contentLines = doc.splitTextToSize(minute.content, 170);
    doc.text(contentLines, 20, yPosition);
    yPosition += contentLines.length * 5 + 10;
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Attendance Section
    doc.setFontSize(14);
    doc.text('Attendance', 20, yPosition);
    yPosition += 10;
    
    const attendance = await getAttendanceForDate(minute.date);
    const apologies = await getApologiesForDate(minute.date);
    
    if (attendance.length > 0) {
      doc.setFontSize(10);
      doc.text(`Present (${attendance.filter(a => a.status === 'Present').length}):`, 20, yPosition);
      yPosition += 5;
      attendance.filter(a => a.status === 'Present').forEach(record => {
        doc.text(`  • ${record.name}`, 25, yPosition);
        yPosition += 4;
      });
      yPosition += 5;
    } else {
      doc.setFontSize(10);
      doc.text('No attendance records for this date.', 20, yPosition);
      yPosition += 10;
    }
    
    if (apologies.length > 0) {
      doc.text(`Apologies (${apologies.length}):`, 20, yPosition);
      yPosition += 5;
      apologies.forEach(apology => {
        doc.text(`  • ${apology.name} - ${apology.reason}`, 25, yPosition);
        yPosition += 4;
      });
    }
    
    doc.save(`meeting-minutes-${minute.date}.pdf`);
  };

  const canView = canViewMinutes(role, memberPermissions);
  const canDownload = canDownloadMinutes(role, memberPermissions);
  const canPost = canPostMinutes(role, memberPermissions);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view meeting minutes.</p>
        </div>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Meeting Details' : 'Post New Minutes'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              )}
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Meeting Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Main Boardroom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Bell size={16} className="inline mr-1" />
                  Send Reminder
                </label>
                <select
                  value={formData.reminder}
                  onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                  className="input-field"
                >
                  <option value="1 day">1 day before</option>
                  <option value="2 days">2 days before</option>
                  <option value="1 week">1 week before</option>
                  <option value="none">No reminder</option>
                </select>
              </div>

              {/* Agenda Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ListTodo size={16} className="inline mr-1" />
                  Agenda Items
                </label>
                {formData.agendaItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.agendaItems.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {idx + 1}. {item}
                        <button
                          type="button"
                          onClick={() => removeAgendaItem(idx)}
                          className="hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agendaInput}
                    onChange={(e) => setAgendaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAgendaItem())}
                    placeholder="Add agenda item..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={addAgendaItem}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minutes Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-field min-h-[200px]"
                  placeholder="Enter the minutes content here..."
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image size={16} className="inline mr-1" />
                  Attach Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update Details' : 'Post Minutes'}
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

                    {/* Meeting Details */}
                    {(minute.time || minute.venue || minute.reminder && minute.reminder !== 'none') && (
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg">
                        {minute.time && (
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{minute.time}</span>
                          </div>
                        )}
                        {minute.venue && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{minute.venue}</span>
                          </div>
                        )}
                        {minute.reminder && minute.reminder !== 'none' && (
                          <div className="flex items-center gap-1">
                            <Bell size={14} />
                            <span>Reminder: {minute.reminder} before</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{minute.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Posted: {new Date(minute.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Agenda */}
                    {minute.agendaItems && minute.agendaItems.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <ListTodo size={16} />
                          Agenda
                        </h4>
                        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                          {minute.agendaItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Content */}
                    <p className="text-gray-700 whitespace-pre-wrap">{minute.content}</p>

                    {/* Images */}
                    {minute.images && minute.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {minute.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`Minute ${idx + 1}`} className="w-32 h-32 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {canDownload && (
                      <button
                        onClick={() => downloadCompiledMinutes(minute)}
                        className="btn-primary flex items-center gap-2"
                        title="Download with Attendance & Agenda"
                      >
                        <Download size={18} />
                        Download Full Report
                      </button>
                    )}
                    {canEditMinutes(role, memberPermissions) && (
                      <button
                        onClick={() => handleEdit(minute)}
                        className="btn-secondary flex items-center gap-2"
                        title="Edit Meeting Details"
                      >
                        <Edit size={18} />
                        Edit Details
                      </button>
                    )}
                    {canDeleteMinutes(role, memberPermissions) && (
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
