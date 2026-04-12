import React from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Briefcase, Calendar, Bell, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, role } = useAuth();

  const quickLinks = [
    { path: '/minutes', icon: FileText, label: 'Minutes', color: 'bg-blue-500', description: 'View meeting minutes' },
    { path: '/projects', icon: Briefcase, label: 'Projects', color: 'bg-green-500', description: 'Manage projects' },
    { path: '/attendance', icon: Calendar, label: 'Attendance', color: 'bg-purple-500', description: 'Mark attendance' },
    { path: '/company-profile', icon: Building2, label: 'Company Docs', color: 'bg-orange-500', description: 'View documents' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            You are logged in as <span className="font-semibold text-primary-600">{role}</span>
          </p>
        </div>

        {/* Weekly Meeting Reminder */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Bell size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Weekly Meeting Reminder</h3>
              <p className="text-primary-100 text-lg">
                Every Friday at 4:00 PM
              </p>
              <p className="text-primary-200 text-sm mt-2">
                Please ensure you mark your attendance and prepare any updates you'd like to share.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="card hover:shadow-lg transition-shadow group"
                >
                  <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{link.label}</h3>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">11</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Briefcase size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meeting Minutes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity to display.</p>
            <p className="text-sm mt-2">Activity will appear here as you use the portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
