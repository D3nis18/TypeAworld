import React, { useState, useEffect } from 'react';
import { Shield, Users, Mail, FileText, Briefcase, Trash2, Plus, X, Edit, Lock, Unlock, Save, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { fetchAllowedEmails, getAllowedEmails } from '../firebase/config';
import { auth } from '../firebase/config';
import { updatePassword, deleteUser as deleteFirebaseUser } from 'firebase/auth';

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [treasurerReports, setTreasurerReports] = useState([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberPermissions, setMemberPermissions] = useState({
    isAdmin: false,
    canViewMinutes: false,
    canDownloadMinutes: false,
    canPostMinutes: false,
    canEditMinutes: false,
    canDeleteMinutes: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canEditAttendance: false,
    canDeleteAttendance: false,
    canEditCompanyProfile: false,
    canDeleteCompanyProfile: false,
    canPostTreasurerReports: false,
    canEditTreasurerReports: false,
    canDeleteTreasurerReports: false,
    canViewFeedback: false,
    canDeleteFeedback: false,
    canManageAccounts: false,
    canViewSuggestions: false,
    canDeleteSuggestions: false
  });

  const permissionOptions = [
    { key: 'canViewMinutes', label: 'Can View Minutes', category: 'Minutes' },
    { key: 'canDownloadMinutes', label: 'Can Download Minutes', category: 'Minutes' },
    { key: 'canPostMinutes', label: 'Can Post Minutes', category: 'Minutes' },
    { key: 'canEditMinutes', label: 'Can Edit Minutes', category: 'Minutes' },
    { key: 'canDeleteMinutes', label: 'Can Delete Minutes', category: 'Minutes' },
    { key: 'canEditProjects', label: 'Can Edit Projects', category: 'Projects' },
    { key: 'canDeleteProjects', label: 'Can Delete Projects', category: 'Projects' },
    { key: 'canEditAttendance', label: 'Can Edit Attendance', category: 'Attendance' },
    { key: 'canDeleteAttendance', label: 'Can Delete Attendance', category: 'Attendance' },
    { key: 'canEditCompanyProfile', label: 'Can Edit Company Profile', category: 'Company Profile' },
    { key: 'canDeleteCompanyProfile', label: 'Can Delete Company Profile', category: 'Company Profile' },
    { key: 'canPostTreasurerReports', label: 'Can Post Treasurer Reports', category: 'Treasurer Reports' },
    { key: 'canEditTreasurerReports', label: 'Can Edit Treasurer Reports', category: 'Treasurer Reports' },
    { key: 'canDeleteTreasurerReports', label: 'Can Delete Treasurer Reports', category: 'Treasurer Reports' },
    { key: 'canViewFeedback', label: 'Can View Feedback', category: 'Feedback' },
    { key: 'canDeleteFeedback', label: 'Can Delete Feedback', category: 'Feedback' },
    { key: 'canManageAccounts', label: 'Can Manage Accounts', category: 'Admin' },
    { key: 'canViewSuggestions', label: 'Can View Suggestions', category: 'Dev Box' },
    { key: 'canDeleteSuggestions', label: 'Can Delete Suggestions', category: 'Dev Box' },
    { key: 'isAdmin', label: 'Grant Admin Access (Full Power)', category: 'Admin' },
    { key: 'canManageCategories', label: 'Can Manage Issue Categories', category: 'Issues' },
    { key: 'canManageDepartments', label: 'Can Manage Departments', category: 'Company Profile' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const result = await getCollection('members');
    if (result.success) {
      setMembers(result.data);
    }
    // Load treasurer reports
    const reportsResult = await getCollection('treasurerReports');
    if (reportsResult.success) {
      setTreasurerReports(reportsResult.data);
    }
    // Load allowed emails from Firestore
    const emails = await fetchAllowedEmails();
    setAllowedEmails(emails);
    setLoading(false);
  };

  const addAllowedEmail = async () => {
    if (newEmail && !allowedEmails.includes(newEmail.toLowerCase())) {
      const email = newEmail.toLowerCase();
      // Add to Firestore
      await addDocument('allowedEmails', { email, createdAt: new Date().toISOString() });
      setAllowedEmails([...allowedEmails, email]);
      setNewEmail('');
    }
  };

  const removeAllowedEmail = async (email) => {
    // Find and delete from Firestore
    const result = await getCollection('allowedEmails');
    if (result.success) {
      const emailDoc = result.data.find(doc => doc.email === email);
      if (emailDoc) {
        await deleteDocument('allowedEmails', emailDoc.id);
      }
    }
    setAllowedEmails(allowedEmails.filter(e => e !== email));
  };

  const deleteMember = async (id, email) => {
    if (isMainAdmin(email) || isAssistantAdmin(email)) {
      alert('Admin accounts cannot be deleted.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this member?')) {
      await deleteDocument('members', id);
      loadData();
    }
  };

  const isMainAdmin = (email) => email === 'denismwg4@gmail.com';
  const isAssistantAdmin = (email) => email === 'bykiptoo@gmail.com';

  const openPermissionModal = (member) => {
    // Prevent editing admin permissions
    if (isMainAdmin(member.email) || isAssistantAdmin(member.email)) {
      alert('Admin permissions cannot be edited.');
      return;
    }
    setSelectedMember(member);
    setMemberPermissions(member.permissions || {
      isAdmin: false,
      canEditMinutes: false,
      canEditProjects: false,
      canEditAttendance: false,
      canDeleteMinutes: false,
      canDeleteProjects: false,
      canDeleteAttendance: false,
      canDeleteSuggestions: false
    });
    setShowPermissionModal(true);
  };

  const savePermissions = async () => {
    if (selectedMember) {
      await updateDocument('members', selectedMember.id, { permissions: memberPermissions });
      setShowPermissionModal(false);
      setSelectedMember(null);
      loadData();
    }
  };

  const togglePermission = (key) => {
    setMemberPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const deleteAllMinutes = async () => {
    if (window.confirm('Are you sure you want to delete ALL minutes? This cannot be undone.')) {
      const result = await getCollection('minutes');
      if (result.success) {
        for (const minute of result.data) {
          await deleteDocument('minutes', minute.id);
        }
      }
    }
  };

  const deleteAllProjects = async () => {
    if (window.confirm('Are you sure you want to delete ALL projects? This cannot be undone.')) {
      const result = await getCollection('projects');
      if (result.success) {
        for (const project of result.data) {
          await deleteDocument('projects', project.id);
        }
      }
    }
  };

  const deleteAllApologies = async () => {
    if (window.confirm('Are you sure you want to delete ALL apologies? This cannot be undone.')) {
      const result = await getCollection('apologies');
      if (result.success) {
        for (const apology of result.data) {
          await deleteDocument('apologies', apology.id);
        }
      }
    }
  };

  const suspendAccount = async (member) => {
    if (isMainAdmin(member.email) || isAssistantAdmin(member.email)) {
      alert('Admin accounts cannot be suspended.');
      return;
    }
    if (window.confirm(`Are you sure you want to suspend ${member.name} ${member.surname || ''}?`)) {
      await updateDocument('members', member.id, { suspended: true });
      loadData();
    }
  };

  const unsuspendAccount = async (member) => {
    await updateDocument('members', member.id, { suspended: false });
    loadData();
  };

  const resetPassword = async (member) => {
    const newPassword = prompt(`Enter new initial password for ${member.name} ${member.surname || ''}:`);
    if (newPassword && newPassword.length >= 6) {
      // Set initial password in Firestore - member will use it on next login
      await updateDocument('members', member.id, {
        initialPassword: newPassword,
        passwordSet: false
      });
      alert(`Initial password set successfully! ${member.name} ${member.surname || ''} will use this password on their next login.`);
    } else if (newPassword) {
      alert('Password must be at least 6 characters');
    }
  };

  const deleteAccount = async (member) => {
    if (isMainAdmin(member.email) || isAssistantAdmin(member.email)) {
      alert('Admin accounts cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${member.name} ${member.surname || ''}'s account? This cannot be undone.`)) {
      await deleteDocument('members', member.id);
      // Remove from allowed emails
      setAllowedEmails(allowedEmails.filter(e => e !== member.email));
      loadData();
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="text-primary-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Members
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'emails'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Allowed Emails
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'content'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Content
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Members Management Tab */}
        {activeTab === 'members' && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Members</h2>
            <p className="text-gray-600 mb-4">
              Total Members: {members.length}
            </p>
            
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No members found.</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name} {member.surname}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-sm text-gray-500">
                        {member.position} • {member.tags.join(', ')}
                      </p>
                      {member.permissions && Object.values(member.permissions).some(v => v) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(member.permissions).map(([key, value]) => {
                            if (value) {
                              const label = permissionOptions.find(p => p.key === key)?.label.replace('Can ', '') || key;
                              return (
                                <span key={key} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  {label}
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                      {member.suspended && (
                        <span className="mt-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          Suspended
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!(isMainAdmin(member.email) || isAssistantAdmin(member.email)) && (
                        <>
                          {member.suspended ? (
                            <button
                              onClick={() => unsuspendAccount(member)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Unsuspend Account"
                            >
                              <Unlock size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => suspendAccount(member)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Suspend Account"
                            >
                              <Lock size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => resetPassword(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <Lock size={18} />
                          </button>
                          <button
                            onClick={() => openPermissionModal(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Permissions"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteAccount(member)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                      {(isMainAdmin(member.email) || isAssistantAdmin(member.email)) && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          {isMainAdmin(member.email) ? 'Main Admin' : 'Admin'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Permission Modal */}
        {showPermissionModal && selectedMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Edit Permissions for {selectedMember.name} {selectedMember.surname}
              </h3>
              
              <div className="max-h-[60vh] overflow-y-auto space-y-4">
                {/* Group permissions by category */}
                {['Minutes', 'Projects', 'Attendance', 'Company Profile', 'Treasurer Reports', 'Feedback', 'Dev Box', 'Admin'].map(category => {
                  const categoryPermissions = permissionOptions.filter(p => p.category === category);
                  if (categoryPermissions.length === 0) return null;
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{category}</h4>
                      <div className="space-y-2">
                        {categoryPermissions.map(option => (
                          <label key={option.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={memberPermissions[option.key] || false}
                              onChange={() => togglePermission(option.key)}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setSelectedMember(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={savePermissions}
                  className="btn-primary flex-1"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Allowed Emails Tab */}
        {activeTab === 'emails' && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Allowed Email Addresses</h2>
            <p className="text-gray-600 mb-4">
              These emails are authorized to log in to the system. Total: {allowedEmails.length}
            </p>
            
            <div className="flex gap-3 mb-6">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="input-field flex-1"
                placeholder="Add new email address"
              />
              <button
                onClick={addAllowedEmail}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Add Email
              </button>
            </div>

            <div className="space-y-2">
              {allowedEmails.map((email) => (
                <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-gray-500" />
                    <span className="text-gray-900">{email}</span>
                  </div>
                  <button
                    onClick={() => removeAllowedEmail(email)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Email"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Auto-Sync Enabled:</strong> Emails are now stored in Firestore and automatically synced across the app. 
                No code changes needed - just add/remove emails here and they take effect immediately.
              </p>
            </div>
          </div>
        )}

        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-primary-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Manage Minutes</h2>
              </div>
              <button
                onClick={deleteAllMinutes}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete All Minutes
              </button>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete all meeting minutes.
              </p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="text-primary-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Manage Projects</h2>
              </div>
              <button
                onClick={deleteAllProjects}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete All Projects
              </button>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete all projects and ideas.
              </p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-primary-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Manage Apologies</h2>
              </div>
              <button
                onClick={deleteAllApologies}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete All Apologies
              </button>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete all apology submissions.
              </p>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="text-primary-600" size={32} />
              <h2 className="text-2xl font-bold text-gray-900">Admin Analytics</h2>
            </div>
            <AnalyticsCharts members={members} treasurerReports={treasurerReports} />
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics Charts Component
const AnalyticsCharts = ({ members, treasurerReports }) => {
  const availablePositions = ['Founder', 'Chairman', 'Secretary', 'Treasurer', 'Member', 'Custom'];
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

  const positionData = availablePositions.map(pos => ({
    position: pos,
    count: members.filter(m => m.position === pos).length
  }));

  // Calculate treasurer stats
  const totalIncome = treasurerReports
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalExpenses = treasurerReports
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const currentBalance = totalIncome - totalExpenses;
  const totalTransactions = treasurerReports.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Treasurer Stats */}
      <div className="card lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Treasurer Financial Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">KES {totalIncome.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Income</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">KES {totalExpenses.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Expenses</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              KES {currentBalance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Current Balance</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">{totalTransactions}</p>
            <p className="text-sm text-gray-600">Total Transactions</p>
          </div>
        </div>
      </div>

      {/* Member Summary */}
      <div className="card lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-600">{members.length}</p>
            <p className="text-sm text-gray-600">Total Members</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-indigo-600">
              {members.filter(m => m.position === 'Treasurer').length}
            </p>
            <p className="text-sm text-gray-600">Treasurers</p>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-teal-600">
              {members.filter(m => m.position === 'Secretary').length}
            </p>
            <p className="text-sm text-gray-600">Secretaries</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-orange-600">
              {members.filter(m => m.position === 'Chairman' || m.position === 'Founder').length}
            </p>
            <p className="text-sm text-gray-600">Leadership</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
