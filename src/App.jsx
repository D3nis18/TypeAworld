import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CompanyProfile from './pages/CompanyProfile';
import Members from './pages/Members';
import Minutes from './pages/Minutes';
import Projects from './pages/Projects';
import Attendance from './pages/Attendance';
import TreasurerReports from './pages/TreasurerReports';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import Suggestions from './pages/Suggestions';
import Chat from './pages/Chat';
import AdminPortal from './pages/AdminPortal';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/company-profile" element={<CompanyProfile />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/minutes" element={<Minutes />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/treasurer-reports" element={<TreasurerReports />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/suggestions" element={<Suggestions />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminPortal />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
