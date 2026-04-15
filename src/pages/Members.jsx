import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Download, Phone, Mail } from 'lucide-react';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { jsPDF } from 'jspdf';

const Members = () => {
  const { role } = useAuth();
  const canDownload = role === 'Admin' || role === 'Secretary';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    position: 'Member',
    tags: [],
    permissions: {
      canEditMinutes: false,
      canEditProjects: false,
      canEditAttendance: false,
      canDeleteMinutes: false,
      canDeleteProjects: false,
      canDeleteAttendance: false
    }
  });

  const availablePositions = ['Founder', 'Chairman', 'Secretary', 'Treasurer', 'Member', 'Custom'];
  const availableTags = ['#Founder', '#Secretary', '#Treasurer', '#Executive', '#Active'];
  const permissionOptions = [
    { key: 'canEditMinutes', label: 'Can Edit Minutes' },
    { key: 'canEditProjects', label: 'Can Edit Projects' },
    { key: 'canEditAttendance', label: 'Can Edit Attendance' },
    { key: 'canDeleteMinutes', label: 'Can Delete Minutes' },
    { key: 'canDeleteProjects', label: 'Can Delete Projects' },
    { key: 'canDeleteAttendance', label: 'Can Delete Attendance' }
  ];

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const result = await getCollection('members');
    if (result.success) {
      setMembers(result.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      position: formData.position === 'Custom' ? customPosition : formData.position || 'Member'
    };
    
    if (editingMember) {
      await updateDocument('members', editingMember.id, data);
    } else {
      await addDocument('members', data);
    }
    
    setShowModal(false);
    setEditingMember(null);
    setCustomPosition('');
    setFormData({ name: '', email: '', contact: '', position: 'Member', tags: [], permissions: { canEditMinutes: false, canEditProjects: false, canEditAttendance: false, canDeleteMinutes: false, canDeleteProjects: false, canDeleteAttendance: false } });
    loadMembers();
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData(member);
    setCustomTagInput('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      await deleteDocument('members', id);
      loadMembers();
    }
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addCustomTag = () => {
    if (customTagInput.trim()) {
      const newTag = customTagInput.trim().startsWith('#') ? customTagInput.trim() : `#${customTagInput.trim()}`;
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setCustomTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
  };

  const togglePermission = (permissionKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: !prev.permissions[permissionKey]
      }
    }));
  };

  const downloadMembersList = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Members List', 20, 20);
    doc.setFontSize(12);
    
    let yPosition = 40;
    members.forEach((member, index) => {
      doc.text(`${index + 1}. ${member.name}`, 20, yPosition);
      doc.text(`   Position: ${member.position}`, 20, yPosition + 7);
      doc.text(`   Contact: ${member.contact}`, 20, yPosition + 14);
      doc.text(`   Email: ${member.email}`, 20, yPosition + 21);
      doc.text(`   Tags: ${member.tags.join(', ')}`, 20, yPosition + 28);
      yPosition += 40;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    doc.save('members-list.pdf');
  };

  // Prepare chart data
  const positionData = availablePositions.map(pos => ({
    position: pos,
    count: members.filter(m => m.position === pos).length
  }));

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <div className="flex gap-3">
            {canDownload && (
              <button
                onClick={downloadMembersList}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} />
                Download List
              </button>
            )}
            {(role === 'Admin') && (
              <button
                onClick={() => {
                  setEditingMember(null);
                  setFormData({ name: '', email: '', contact: '', position: 'Member', tags: [], permissions: { canEditMinutes: false, canEditProjects: false, canEditAttendance: false, canDeleteMinutes: false, canDeleteProjects: false, canDeleteAttendance: false } });
                  setCustomTagInput('');
                  setCustomPosition('');
                  setShowModal(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Add Member
              </button>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Members by Position</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="position" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={positionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ position, count }) => `${position}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {positionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Members List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Members ({members.length})</h2>
          
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No members added yet.</p>
              {role === 'Admin' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary mt-4"
                >
                  Add First Member
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Position</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tags</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Permissions</th>
                    {role === 'Admin' && (
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail size={14} />
                          {member.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          {member.position}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone size={14} />
                          {member.contact}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {member.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {member.permissions && Object.entries(member.permissions).map(([key, value]) => {
                            if (value) {
                              const label = permissionOptions.find(p => p.key === key)?.label || key;
                              return (
                                <span key={key} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {label.replace('Can ', '')}
                                </span>
                              );
                            }
                            return null;
                          })}
                          {(!member.permissions || !Object.values(member.permissions).some(v => v)) && (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                      {role === 'Admin' && (
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position <span className="text-gray-400">(Optional)</span>
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Position</option>
                    {availablePositions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  {formData.position === 'Custom' && (
                    <input
                      type="text"
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      className="input-field mt-2"
                      placeholder="e.g., Head of Marketing, Department Head"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  
                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-primary-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Suggested Tags */}
                  <p className="text-xs text-gray-500 mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.tags.includes(tag)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Tag Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Type custom tag and press Enter..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addCustomTag}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Press Enter or click Add to add custom tag</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="space-y-2">
                    {permissionOptions.map(option => (
                      <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions[option.key] || false}
                          onChange={() => togglePermission(option.key)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingMember(null);
                      setCustomTagInput('');
                      setCustomPosition('');
                      setFormData({ name: '', email: '', contact: '', position: 'Member', tags: [], permissions: { canEditMinutes: false, canEditProjects: false, canEditAttendance: false, canDeleteMinutes: false, canDeleteProjects: false, canDeleteAttendance: false } });
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingMember ? 'Update' : 'Add'} Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
