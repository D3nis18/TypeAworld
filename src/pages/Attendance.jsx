import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, MessageSquare, Download, Trash2 } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, query, where } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getMemberPermissions, canEditContent, canDeleteAttendance } from '../utils/permissions';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

const Attendance = () => {
  const { role, user } = useAuth();
  const canDownload = role === 'Admin' || role === 'Secretary';
  const [attendance, setAttendance] = useState([]);
  const [memberPermissions, setMemberPermissions] = useState({
    canEditMinutes: false,
    canEditProjects: false,
    canEditAttendance: false,
    canDeleteAttendance: false
  });
  const [apologies, setApologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApologyForm, setShowApologyForm] = useState(false);
  const [apologyForm, setApologyForm] = useState({
    reason: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceEnabled, setAttendanceEnabled] = useState(true);

  useEffect(() => {
    loadData();
    if (role && role !== 'Admin' && user) {
      loadMemberPermissions();
    }
  }, [role, user]);

  const loadMemberPermissions = async () => {
    const permissions = await getMemberPermissions(user.email);
    setMemberPermissions(permissions);
  };

  const loadData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const attendanceResult = await getCollection('attendance');
    if (attendanceResult.success) {
      setAttendance(attendanceResult.data);
      
      // Check if user has marked attendance today
      const todayRecord = attendanceResult.data.find(
        a => a.email === user.email && a.date === today
      );
      setTodayAttendance(todayRecord);
    }

    const apologiesResult = await getCollection('apologies');
    if (apologiesResult.success) {
      setApologies(apologiesResult.data);
    }
    
    setLoading(false);
  };

  const markAttendance = async (status) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const data = {
      email: user.email,
      name: user.email.split('@')[0],
      date: today,
      status: status,
      timestamp: new Date().toISOString()
    };
    
    await addDocument('attendance', data);
    setTodayAttendance(data);
    loadData();
  };

  const submitApology = async (e) => {
    e.preventDefault();
    
    const data = {
      email: user.email,
      name: user.email.split('@')[0],
      reason: apologyForm.reason,
      date: apologyForm.date,
      timestamp: new Date().toISOString()
    };
    
    await addDocument('apologies', data);
    setShowApologyForm(false);
    setApologyForm({ reason: '', date: format(new Date(), 'yyyy-MM-dd') });
    loadData();
  };

  const deleteApology = async (id) => {
    if (canDeleteAttendance(role, memberPermissions)) {
      if (window.confirm('Are you sure you want to delete this apology?')) {
        await deleteDocument('apologies', id);
        loadData();
      }
    }
  };

  const deleteAttendance = async (id) => {
    if (canDeleteAttendance(role, memberPermissions)) {
      if (window.confirm('Are you sure you want to delete this attendance record?')) {
        await deleteDocument('attendance', id);
        loadData();
      }
    }
  };

  const downloadAttendanceReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Attendance Report', 20, 20);
    doc.setFontSize(12);
    
    let yPosition = 40;
    doc.text('Attendance Records:', 20, yPosition);
    yPosition += 10;
    
    attendance.forEach((record, index) => {
      doc.text(`${index + 1}. ${record.name} (${record.email})`, 20, yPosition);
      doc.text(`   Date: ${record.date}`, 20, yPosition + 7);
      doc.text(`   Status: ${record.status}`, 20, yPosition + 14);
      doc.text(`   Time: ${new Date(record.timestamp).toLocaleString()}`, 20, yPosition + 21);
      yPosition += 35;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    doc.addPage();
    yPosition = 20;
    doc.text('Apologies:', 20, yPosition);
    yPosition += 10;
    
    apologies.forEach((apology, index) => {
      doc.text(`${index + 1}. ${apology.name} (${apology.email})`, 20, yPosition);
      doc.text(`   Date: ${apology.date}`, 20, yPosition + 7);
      doc.text(`   Reason: ${apology.reason}`, 20, yPosition + 14);
      yPosition += 30;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    doc.save('attendance-report.pdf');
  };

  const canViewAll = role === 'Admin' || role === 'Secretary';
  const filteredAttendance = canViewAll ? attendance : attendance.filter(a => a.email === user.email);
  const filteredApologies = canViewAll ? apologies : apologies.filter(a => a.email === user.email);

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
          <h1 className="text-3xl font-bold text-gray-900">Attendance & Apologies</h1>
          <div className="flex gap-3">
            {role === 'Admin' && (
              <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <input
                  type="checkbox"
                  checked={attendanceEnabled}
                  onChange={(e) => setAttendanceEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {attendanceEnabled ? 'Attendance Enabled' : 'Attendance Disabled'}
                </span>
              </label>
            )}
            {canDownload && (
              <button
                onClick={downloadAttendanceReport}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} />
                Download Report
              </button>
            )}
          </div>
        </div>

        {/* Mark Attendance Section */}
        <div className={`card mb-8 ${!attendanceEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mark Today's Attendance</h2>
          <p className="text-gray-600 mb-4">
            Date: {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
          
          {!attendanceEnabled && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Attendance is disabled by Admin.</strong> Members cannot mark attendance at this time.
              </p>
            </div>
          )}
          
          {attendanceEnabled && todayAttendance ? (
            <div className={`p-4 rounded-lg ${
              todayAttendance.status === 'Present' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <p className="font-semibold">
                You have marked yourself as {todayAttendance.status} today at{' '}
                {new Date(todayAttendance.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ) : attendanceEnabled ? (
            <div className="flex gap-4">
              <button
                onClick={() => markAttendance('Present')}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Present
              </button>
              <button
                onClick={() => {
                  markAttendance('Absent');
                  setShowApologyForm(true);
                }}
                className="flex-1 btn-danger flex items-center justify-center gap-2"
              >
                <X size={20} />
                Absent
              </button>
            </div>
          ) : null}
        </div>

        {/* Apology Form */}
        {showApologyForm && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Apology</h2>
            <form onSubmit={submitApology} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={apologyForm.date}
                  onChange={(e) => setApologyForm({ ...apologyForm, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Absence</label>
                <textarea
                  value={apologyForm.reason}
                  onChange={(e) => setApologyForm({ ...apologyForm, reason: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="Please explain why you were absent..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApologyForm(false);
                    setApologyForm({ reason: '', date: format(new Date(), 'yyyy-MM-dd') });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Apology
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Apologies Section */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Apologies</h2>
          </div>
          
          {filteredApologies.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No apologies submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {filteredApologies.map((apology) => (
                <div key={apology.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{apology.name}</h4>
                      <p className="text-sm text-gray-500">{apology.email}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Date:</strong> {apology.date}
                      </p>
                      <p className="text-gray-700 mt-2">{apology.reason}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Submitted: {new Date(apology.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {canDeleteAttendance(role, memberPermissions) && (
                      <button
                        onClick={() => deleteApology(apology.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance History */}
        {canViewAll && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
            </div>
            
            {filteredAttendance.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No attendance records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                      {role === 'Admin' && (
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{record.name}</td>
                        <td className="py-3 px-4 text-gray-600">{record.email}</td>
                        <td className="py-3 px-4 text-gray-600">{record.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            record.status === 'Present' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </td>
                        {canDeleteAttendance(role, memberPermissions) && (
                          <td className="py-3 px-4">
                            <button
                              onClick={() => deleteAttendance(record.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
