import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Briefcase, Calendar, Bell, Building2, Star, Newspaper, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCollection } from '../firebase/firestore';

const Dashboard = () => {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState([]);
  const [departmentPosts, setDepartmentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
    loadDepartmentPosts();
  }, []);

  const loadProjects = async () => {
    const result = await getCollection('projects');
    if (result.success) {
      // Filter for featured projects
      const featured = result.data.filter(p => p.featured).slice(0, 3);
      setProjects(featured);
    }
  };

  const loadDepartmentPosts = async () => {
    const result = await getCollection('departmentPosts');
    if (result.success) {
      const posts = result.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      setDepartmentPosts(posts);
    }
    setLoading(false);
  };

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

        {/* Featured Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Featured Projects</h2>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="card text-center py-8">
              <Star className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500">No featured projects yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <Star className="text-yellow-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{project.status || 'Active'}</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : departmentPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity to display.</p>
              <p className="text-sm mt-2">Activity will appear here as you use the portal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {departmentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Newspaper className="text-blue-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                        {post.departmentName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{post.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                    <p className="text-xs text-gray-400 mt-1">Posted by {post.authorName}</p>
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

export default Dashboard;
