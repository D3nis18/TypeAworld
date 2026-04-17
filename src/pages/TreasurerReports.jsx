import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Download, Trash2, Edit, Save, X, TrendingUp, TrendingDown } from 'lucide-react';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getMemberPermissions, canEditContent, canDeleteTreasurerReports } from '../utils/permissions';
import { jsPDF } from 'jspdf';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

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
    // Use real-time subscription instead of one-time load
    const unsubscribe = subscribeToReports();
    // Load permissions for all non-Admin users
    if (role && role !== 'Admin' && user) {
      loadMemberPermissions();
    }
    return () => unsubscribe();
  }, [role, user]);

  const loadMemberPermissions = async () => {
    const permissions = await getMemberPermissions(user.email);
    setMemberPermissions(permissions);
  };

  const calculateBalances = (reportsData) => {
    // Sort by date ascending (oldest first) for correct balance calculation
    const sorted = [...reportsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    // Calculate running balance from oldest to newest
    let runningBalance = 0;
    const withBalance = sorted.map(report => {
      runningBalance += (parseFloat(report.credited) || 0) - (parseFloat(report.debited) || 0);
      return { ...report, calculatedBalance: runningBalance };
    });
    return withBalance;
  };

  const loadReports = async () => {
    const result = await getCollection('treasurerReports');
    if (result.success) {
      const withBalance = calculateBalances(result.data);
      setReports(withBalance);
    }
    setLoading(false);
  };

  // Real-time subscription for live updates to all members
  const subscribeToReports = () => {
    const reportsQuery = query(collection(db, 'treasurerReports'), orderBy('date', 'asc'));
    return onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const withBalance = calculateBalances(reportsData);
      setReports(withBalance);
      setLoading(false);
    });
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
    // No need to call loadReports() - real-time subscription handles it
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

    // Header styling
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('TypeAworld', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Treasurer Report - Transaction Record', 105, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Transaction Details Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Transaction Details', 20, 55);

    doc.setFont(undefined, 'normal');
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 58, 190, 58);

    let yPos = 68;
    const lineHeight = 10;

    // Balance Sheet Format for single transaction
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos - 5, 170, lineHeight + 5, 'F');

    doc.setFont(undefined, 'bold');
    doc.text('Date:', 25, yPos);
    doc.text(report.date, 60, yPos);
    yPos += lineHeight + 5;

    doc.setFont(undefined, 'normal');
    doc.text('Description/Reason:', 25, yPos);
    doc.text(report.description || 'N/A', 70, yPos);
    yPos += lineHeight + 5;

    if (report.usedFor) {
      doc.text('Money Used For:', 25, yPos);
      doc.text(report.usedFor, 70, yPos);
      yPos += lineHeight + 5;
    }

    // Financial Summary Table-style
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Financial Summary', 20, yPos);
    doc.line(20, yPos + 3, 190, yPos + 3);
    yPos += 15;

    // Table header
    doc.setFillColor(37, 99, 235);
    doc.rect(20, yPos - 6, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Transaction Type', 25, yPos);
    doc.text('Amount (KES)', 160, yPos);

    doc.setTextColor(0, 0, 0);
    yPos += 12;

    // Credits row
    doc.setFillColor(220, 252, 231); // green-100
    doc.rect(20, yPos - 6, 170, 8, 'F');
    doc.text('Credits (Inflow)', 25, yPos);
    doc.text(parseFloat(report.credited || 0).toLocaleString(), 160, yPos);
    yPos += 12;

    // Debits row
    doc.setFillColor(254, 226, 226); // red-100
    doc.rect(20, yPos - 6, 170, 8, 'F');
    doc.text('Debits (Outflow)', 25, yPos);
    doc.text(parseFloat(report.debited || 0).toLocaleString(), 160, yPos);
    yPos += 12;

    // Running Balance row
    doc.setFillColor(219, 234, 254); // blue-100
    doc.rect(20, yPos - 6, 170, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Running Balance', 25, yPos);
    doc.text((report.calculatedBalance || report.balance || 0).toLocaleString(), 160, yPos);

    // Footer
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Recorded by: ${report.authorName || report.author || 'Unknown'}`, 20, 280);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 285);
    doc.text('TypeAworld Treasurer Reports System', 105, 290, { align: 'center' });

    doc.save(`treasurer-report-${report.date}.pdf`);
  };

  const downloadAllReports = () => {
    const doc = new jsPDF();

    // Header styling
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('TypeAworld', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Treasurer Reports - Balance Sheet Summary', 105, 25, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 32, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    let yPosition = 50;

    // Summary Section
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Financial Summary', 14, yPosition);
    doc.line(14, yPosition + 2, 196, yPosition + 2);
    yPosition += 12;

    const totalCredited = reports.reduce((sum, r) => sum + (parseFloat(r.credited) || 0), 0);
    const totalDebited = reports.reduce((sum, r) => sum + (parseFloat(r.debited) || 0), 0);
    const finalBalance = calculateTotalBalance();

    doc.setFont(undefined, 'normal');
    doc.setFillColor(220, 252, 231);
    doc.rect(14, yPosition - 6, 55, 10, 'F');
    doc.text(`Total Credits: KES ${totalCredited.toLocaleString()}`, 16, yPosition);

    doc.setFillColor(254, 226, 226);
    doc.rect(75, yPosition - 6, 55, 10, 'F');
    doc.text(`Total Debits: KES ${totalDebited.toLocaleString()}`, 77, yPosition);

    doc.setFillColor(219, 234, 254);
    doc.rect(136, yPosition - 6, 55, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.text(`Final Balance: KES ${finalBalance.toLocaleString()}`, 138, yPosition);

    yPosition += 20;

    // Balance Sheet Table Header
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Transaction Ledger', 14, yPosition);
    doc.line(14, yPosition + 2, 196, yPosition + 2);
    yPosition += 10;

    // Table column headers
    doc.setFillColor(37, 99, 235);
    doc.rect(14, yPosition - 6, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Date', 16, yPosition);
    doc.text('Description/Reason', 45, yPosition);
    doc.text('Credits', 125, yPosition);
    doc.text('Debits', 150, yPosition);
    doc.text('Balance', 175, yPosition);

    doc.setTextColor(0, 0, 0);
    yPosition += 10;

    // Table rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);

    reports.forEach((report, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;

        // Repeat header on new page
        doc.setFillColor(37, 99, 235);
        doc.rect(14, yPosition - 6, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('Date', 16, yPosition);
        doc.text('Description/Reason', 45, yPosition);
        doc.text('Credits', 125, yPosition);
        doc.text('Debits', 150, yPosition);
        doc.text('Balance', 175, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 10;
        doc.setFont(undefined, 'normal');
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(14, yPosition - 5, 182, 7, 'F');
      }

      const credited = parseFloat(report.credited) || 0;
      const debited = parseFloat(report.debited) || 0;
      const balance = report.calculatedBalance || report.balance || 0;

      // Truncate description if too long
      let description = report.description || '';
      if (description.length > 35) {
        description = description.substring(0, 32) + '...';
      }

      // Row data
      doc.text(report.date || '', 16, yPosition);
      doc.text(description, 45, yPosition);
      doc.text(credited > 0 ? credited.toLocaleString() : '-', 125, yPosition);
      doc.text(debited > 0 ? debited.toLocaleString() : '-', 150, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(balance.toLocaleString(), 175, yPosition);
      doc.setFont(undefined, 'normal');

      yPosition += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total Records: ${reports.length} | TypeAworld Treasurer Reports System`, 105, 290, { align: 'center' });

    doc.save(`all-treasurer-reports-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const calculateTotalBalance = () => {
    const lastReport = reports[reports.length - 1];
    return lastReport ? (lastReport.calculatedBalance || lastReport.balance || 0) : 0;
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
                        Balance: KES {(report.calculatedBalance || report.balance || 0).toLocaleString()}
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
