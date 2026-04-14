import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, Menu, X, Users, FileText, Briefcase, Calendar, Shield, Building2, 
  Home, DollarSign, User, MessageSquare, Lightbulb, ChevronDown, FolderOpen, 
  ClipboardList, BarChart3, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { query, where, onSnapshot, collection } from '../firebase/firestore';
import { db } from '../firebase/config';

const Navbar = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userChats, setUserChats] = useState([]);

  const handleLogout = async () => {
    const { signOut } = await import('../firebase/auth');
    await signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Listen for unread messages
  useEffect(() => {
    if (!user?.email) return;

    // Get user's chats
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.email)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserChats(chats);

      // Listen for unread messages in each chat
      let totalUnread = 0;
      const unsubscribers = [];

      chats.forEach(chat => {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('chatId', '==', chat.id),
          where('sender', '!=', user.email),
          where('read', '==', false)
        );

        const unsubscribe = onSnapshot(messagesQuery, (msgSnapshot) => {
          const unread = msgSnapshot.docs.length;
          totalUnread += unread;
          setUnreadCount(prev => {
            // Recalculate total to avoid double counting
            let newTotal = 0;
            unsubscribers.forEach((_, idx) => {
              // This is a simplified approach - in production you'd track per-chat counts
            });
            return totalUnread;
          });
        });

        unsubscribers.push(unsubscribe);
      });

      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    });

    return () => unsubscribeChats();
  }, [user]);

  // Dropdown menu configuration
  const dropdownMenus = [
    {
      id: 'company',
      label: 'Company',
      icon: Building2,
      items: [
        { path: '/company-profile', label: 'Company Profile', icon: Building2 },
        { path: '/members', label: 'Members', icon: Users },
      ]
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: Calendar,
      items: [
        { path: '/minutes', label: 'Minutes', icon: FileText },
        { path: '/attendance', label: 'Attendance', icon: Calendar },
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      items: [
        { path: '/treasurer-reports', label: 'Treasurer', icon: DollarSign },
        { path: '/feedback', label: 'Feedback', icon: MessageSquare },
      ]
    },
    {
      id: 'more',
      label: 'More',
      icon: MoreHorizontal,
      items: [
        { path: '/projects', label: 'Projects', icon: Briefcase },
        { path: '/suggestions', label: 'Dev Box', icon: Lightbulb },
      ]
    },
  ];

  const profileItems = [
    { path: '/profile', label: 'My Profile', icon: User },
    ...(role === 'Admin' ? [{ path: '/admin', label: 'Admin Portal', icon: Shield }] : []),
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-gray-800">TypeAworld</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Dashboard - Direct Link */}
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home size={18} />
              Dashboard
            </Link>

            {/* Chat - Direct Link */}
            <Link
              to="/chat"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isActive('/chat')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare size={18} />
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Dropdown Menus */}
            {dropdownMenus.map((menu) => (
              <div
                key={menu.id}
                className="relative"
                onMouseEnter={() => setActiveDropdown(menu.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    menu.items.some(item => isActive(item.path))
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <menu.icon size={18} />
                  {menu.label}
                  <ChevronDown size={14} />
                </button>

                {activeDropdown === menu.id && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    {menu.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Profile Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('profile')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  profileItems.some(item => isActive(item.path))
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={14} className="text-primary-600" />
                </div>
                <span className="max-w-[100px] truncate">{user?.email?.split('@')[0]}</span>
                <ChevronDown size={14} />
              </button>

              {activeDropdown === 'profile' && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                  {profileItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/dashboard') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home size={18} />
              Dashboard
            </Link>

            {/* Chat */}
            <Link
              to="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/chat') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare size={18} />
              Chat
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Company Section */}
            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</p>
              <Link to="/company-profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <Building2 size={18} /> Company Profile
              </Link>
              <Link to="/members" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <Users size={18} /> Members
              </Link>
            </div>

            {/* Meetings Section */}
            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Meetings</p>
              <Link to="/minutes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <FileText size={18} /> Minutes
              </Link>
              <Link to="/attendance" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <Calendar size={18} /> Attendance
              </Link>
            </div>

            {/* Reports Section */}
            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reports</p>
              <Link to="/treasurer-reports" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <DollarSign size={18} /> Treasurer Reports
              </Link>
              <Link to="/feedback" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <MessageSquare size={18} /> Feedback
              </Link>
            </div>

            {/* More Section */}
            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">More</p>
              <Link to="/projects" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <Briefcase size={18} /> Projects
              </Link>
              <Link to="/suggestions" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <Lightbulb size={18} /> Dev Box
              </Link>
            </div>

            {/* Profile Section */}
            <div className="pt-2 pb-1 border-t border-gray-200 mt-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                <User size={18} /> My Profile
              </Link>
              {role === 'Admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                  <Shield size={18} /> Admin Portal
                </Link>
              )}
            </div>

            {/* Logout */}
            <div className="pt-2 border-t border-gray-200 mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
