import React, { useState, useEffect } from 'react';
import { Download, FileText, BookOpen } from 'lucide-react';
import { getCollection } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';

const CompanyProfile = () => {
  const { role } = useAuth();
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const canDownload = role === 'Admin' || role === 'Secretary';

  const companyHistory = `The company was started by Kenyatta University students in their first year, aiming to target upcoming business opportunities inside and outside the campus without limitation. The first idea was supplying products, but the company remains open to all other business ventures that meet its objectives.`;

  const companyObjects = [
    "To identify and pursue profitable business opportunities within and outside the campus",
    "To provide quality products and services to our target market",
    "To foster entrepreneurship and business skills among members",
    "To maintain financial stability and ensure sustainable growth",
    "To build strong partnerships with other businesses and organizations",
    "To create employment opportunities for members and the community"
  ];

  useEffect(() => {
    loadActs();
  }, []);

  const loadActs = async () => {
    const result = await getCollection('acts');
    if (result.success) {
      setActs(result.data);
    }
    setLoading(false);
  };

  const downloadHistory = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Company History', 20, 20);
    doc.setFontSize(12);
    doc.text(companyHistory, 20, 40, { maxWidth: 170 });
    doc.save('company-history.pdf');
  };

  const downloadObjects = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Company Objects', 20, 20);
    doc.setFontSize(12);
    let yPosition = 40;
    companyObjects.forEach((obj, index) => {
      doc.text(`${index + 1}. ${obj}`, 20, yPosition);
      yPosition += 10;
    });
    doc.save('company-objects.pdf');
  };

  const downloadAct = (act) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Company Acts & Articles', 20, 20);
    doc.setFontSize(14);
    doc.text(act.title, 20, 40);
    doc.setFontSize(12);
    doc.text(act.content, 20, 55, { maxWidth: 170 });
    doc.save(`${act.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Company Profile</h1>

        {/* Company History */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Company History</h2>
            </div>
            {canDownload && (
              <button
                onClick={downloadHistory}
                className="btn-primary flex items-center gap-2"
              >
                <Download size={18} />
                Download
              </button>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed">{companyHistory}</p>
        </div>

        {/* Company Objects */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Company Objects</h2>
            </div>
            {canDownload && (
              <button
                onClick={downloadObjects}
                className="btn-primary flex items-center gap-2"
              >
                <Download size={18} />
                Download
              </button>
            )}
          </div>
          <ul className="space-y-3">
            {companyObjects.map((obj, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700">{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Company Acts & Articles */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Company Acts & Articles</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : acts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No acts or articles uploaded yet.</p>
              <p className="text-sm mt-2">Contact an administrator to add documents.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {acts.map((act) => (
                <div key={act.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{act.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Added on {new Date(act.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {canDownload && (
                      <button
                        onClick={() => downloadAct(act)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 mt-3 line-clamp-3">{act.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
