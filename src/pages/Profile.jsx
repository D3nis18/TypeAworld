import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Camera, Lock, Save, X } from 'lucide-react';
import { updatePassword, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { updateDocument, getCollection } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [memberData, setMemberData] = useState({
    name: '',
    phone: '',
    photoURL: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    photoURL: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadMemberData();
  }, [user]);

  const loadMemberData = async () => {
    if (!user) return;
    
    const result = await getCollection('members');
    if (result.success) {
      const member = result.data.find(m => m.email === user.email);
      if (member) {
        const data = {
          name: member.name || user.email.split('@')[0],
          phone: member.phone || '',
          photoURL: member.photoURL || user.photoURL || ''
        };
        setMemberData(data);
        setFormData(data);
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Update Firestore member data
      const result = await getCollection('members');
      if (result.success) {
        const member = result.data.find(m => m.email === user.email);
        if (member) {
          await updateDocument('members', member.id, {
            name: formData.name,
            phone: formData.phone,
            photoURL: formData.photoURL
          });
        }
      }

      // Update Firebase profile if photo URL changed
      if (formData.photoURL !== memberData.photoURL) {
        await updateFirebaseProfile(auth.currentUser, {
          photoURL: formData.photoURL
        });
      }

      setMemberData(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      await updatePassword(auth.currentUser, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error changing password: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, we'll use a placeholder. In production, you'd upload to Firebase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoURL: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Picture Card */}
          <div className="card">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {formData.photoURL ? (
                  <img
                    src={formData.photoURL}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-200">
                    <User size={64} className="text-primary-600" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                  <Camera size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className="mt-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {role}
              </span>
            </div>
          </div>

          {/* Profile Details Card */}
          <div className="card md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={18} className="inline mr-2" />
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={18} className="inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={18} className="inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Password Change Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Lock size={18} />
                Change Password
              </button>

              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="input-field"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="input-field"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
