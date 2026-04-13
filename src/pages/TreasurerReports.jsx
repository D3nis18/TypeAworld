import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Download, Trash2, Edit, Save, X, TrendingUp, TrendingDown } from 'lucide-react';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getMemberPermissions, canEditContent, canDeleteTreasurerReports } from '../utils/permissions';
import { jsPDF } from 'jspdf';

const TreasurerReports = () => {
  const { role, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberPermissions, setMemberPermissions] = useState({
    canPostTreasurerReports: false,
    canEditTreasurerReports: false,
    canDeleteTreasurerReports: false
  });
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    credited: 0,
    debited: 0,
    balance: 0,
    usedFor: ''
  });

  const canPost = role === 'Admin' || canEditContent(role, 'canPostTreasurerReports', memberPermissions);
  const canEdit = role === 'Admin' || canEditContent(role, 'canEditTreasurerReports', memberPermissions);
  const canDeleteReport = role === 'Admin' || canDeleteTreasurerReports(role, memberPermissions);

  useEffect(() => {
    loadReports();
    if (role === 'Member' && user) {
      loadMemberPermissions();
    }
  }, [role, user]);

  const loadMemberPermissions = async () => {
    const permissions = await getMemberPermissions(user.email);
    setMemberPermissions(permissions);
  };

  const loadReports = async () => {
    const result = await getCollection('treasurerReports');
    if (result.success) {
      // Sort by date descending
      const sorted = result.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      // Calculate running balance
      let runningBalance = 0;
      const withBalance = sorted.map(report => {
        runningBalance += (parseFloat(report.credited) || 0) - (parseFloat(report.debited) || 0);
        return { ...report, balance: runningBalance };
      }).reverse(); // Reverse to show oldest first
      setReports(withBalance);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      credited: parseFloat(formData.credited) || 0,
      debited: parseFloat(formData.debited) || 0,
      author: user.email,
      authorName: user.email.split('@')[0],
      createdAt: new Date().toISOString()
    };

    if (editingReport) {
      await updateDocument('treasurerReports', editingReport.id, data);
    } else {
      await addDocument('treasurerReports', data);
    }

    setShowForm(false);
    setEditingReport(null);
    setFormData({
      date: '',
      description: '',
      credited: 0,
      debited: 0,
      balance: 0,
      usedFor: ''
    });
    loadReports();
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData(report);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (canDeleteReport) {
      if (window.confirm('Are you sure you want to delete this report?')) {
        await deleteDocument('treasurerReports', id);
        loadReports();
      }
    }
  };

  const downloadReport = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Treasurer Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${report.date}`, 20, 40);
    doc.text(`Description: ${report.description}`, 20, 50);
    doc.text(`Credited: KES ${report.credited.toLocaleString()}`, 20, 60);
    doc.text(`Debited: KES ${report.debited.toLocaleString()}`, 20, 70);
    doc.text(`Balance: KES ${report.balance.toLocaleString()}`, 20, 80);
    doc.text(`Used For: ${report.usedFor || 'N/A'}`, 20, 90);
    doc.text(`Author: ${report.authorName} (${report.author})`, 20, 100);
    doc.save(`treasurer-report-${report.date}.pdf`);
  };

  const downloadAllReports = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - All Treasurer Reports', 20, 20);
    
    let yPosition = 40;
    reports.forEach((report, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(14);
      doc.text(`Report ${index + 1}`, 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Date: ${report.date}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Description: ${report.description}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Credited: KES ${report.credited.toLocaleString()}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Debited: KES ${report.debited.toLocaleString()}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Balance: KES ${report.balance.toLocaleString()}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Used For: ${report.usedFor || 'N/A'}`, 20, yPosition);
      yPosition += 15;
    });
    
    doc.save('all-treasurer-reports.pdf');
  };

  const calculateTotalBalance = () => {
    return reports.length > 0 ? reports[reports.length - 1].balance : 0;
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
          <h1 className="text-3xl font-bold text-gray-900">Treasurer Reports</h1>
          <div className="flex gap-3">
            {canPost && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Add Report
              </button>
            )}
            <button
              onClick={downloadAllReports}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} />
              Download All
            </button>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <DollarSign className="text-primary-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                KES {calculateTotalBalance().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingReport ? 'Edit Report' : 'Add Treasurer Report'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    placeholder="Transaction description"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credited (KES)</label>
                  <input
                    type="number"
                    value={formData.credited}
                    onChange={(e) => setFormData({ ...formData, credited: e.target.value })}
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Debited (KES)</label>
                  <input
                    type="number"
                    value={formData.debited}
                    onChange={(e) => setFormData({ ...formData, debited: e.target.value })}
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Used For</label>
                <input
                  type="text"
                  value={formData.usedFor}
                  onChange={(e) => setFormData({ ...formData, usedFor: e.target.value })}
                  className="input-field"
                  placeholder="What was the money used for?"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Save size={18} />
                  {editingReport ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReport(null);
                    setFormData({
                      date: '',
                      description: '',
                      credited: 0,
                      debited: 0,
                      balance: 0,
                      usedFor: ''
                    });
                  }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>
          {reports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No treasurer reports yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-500">{report.date}</span>
                        {parseFloat(report.credited) > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                            <TrendingUp size={12} />
                            +KES {parseFloat(report.credited).toLocaleString()}
                          </span>
                        )}
                        {parseFloat(report.debited) > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
                            <TrendingDown size={12} />
                            -KES {parseFloat(report.debited).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{report.description}</h3>
                      {report.usedFor && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Used for:</strong> {report.usedFor}
                        </p>
                      )}
                      <p className="text-lg font-bold text-primary-600 mt-2">
                        Balance: KES {report.balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Posted by {report.authorName} on {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => downloadReport(report)}
                        className="btn-secondary"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleEdit(report)}
                          className="btn-secondary"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDeleteReport && (
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="btn-danger"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreasurerReports;
