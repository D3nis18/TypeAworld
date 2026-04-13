// Permission checking utilities
import { getCollection } from '../firebase/firestore';

// Check if user has specific permission (async version for Firestore lookup)
export const hasPermissionAsync = async (userEmail, permissionKey) => {
  try {
    const result = await getCollection('members');
    if (result.success) {
      const member = result.data.find(m => m.email === userEmail);
      if (member && member.permissions && member.permissions[permissionKey]) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Get member permissions from Firestore
export const getMemberPermissions = async (email) => {
  try {
    const result = await getCollection('members');
    if (result.success) {
      const member = result.data.find(m => m.email === email);
      if (member) {
        return member.permissions || {};
      }
    }
    return {};
  } catch (error) {
    console.error('Error getting member permissions:', error);
    return {};
  }
};

// Check if user has a specific permission (sync version)
export const hasPermission = (permissions, permissionKey) => {
  return permissions && permissions[permissionKey] === true;
};

// Check if user can view minutes
export const canViewMinutes = (role, permissions) => {
  if (role === 'Admin') return true;
  if (role === 'Secretary') return true;
  return hasPermission(permissions, 'canViewMinutes');
};

// Check if user can download minutes
export const canDownloadMinutes = (role, permissions) => {
  if (role === 'Admin') return true;
  if (role === 'Secretary') return true;
  return hasPermission(permissions, 'canDownloadMinutes');
};

// Check if user can post minutes
export const canPostMinutes = (role, permissions) => {
  if (role === 'Admin') return true;
  if (role === 'Secretary') return true;
  return hasPermission(permissions, 'canPostMinutes');
};

// Check if user can edit minutes
export const canEditMinutes = (role, permissions) => {
  if (role === 'Admin') return true;
  if (role === 'Secretary') return true;
  return hasPermission(permissions, 'canEditMinutes');
};

// Check if user can edit specific content type
export const canEditContent = (role, permissionKey, permissions) => {
  if (role === 'Admin') return true;
  if (role === 'Secretary' && permissionKey === 'canEditMinutes') return true;
  return hasPermission(permissions, permissionKey);
};

// Check if user can delete specific content types
export const canDeleteMinutes = (role, permissions) => {
  if (role === 'Admin') return true;
  if (role === 'Secretary') return true;
  return hasPermission(permissions, 'canDeleteMinutes');
};

export const canDeleteProjects = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canDeleteProjects');
};

export const canDeleteAttendance = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canDeleteAttendance');
};

export const canDeleteCompanyProfile = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canDeleteCompanyProfile');
};

export const canDeleteTreasurerReports = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canDeleteTreasurerReports');
};

export const canDeleteFeedback = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canDeleteFeedback');
};

export const canDeleteSuggestions = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canDeleteSuggestions');
};

// Check if user can view feedback
export const canViewFeedback = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canViewFeedback');
};

// Check if user can manage accounts
export const canManageAccounts = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canManageAccounts');
};

// Check if user can view suggestions
export const canViewSuggestions = (role, permissions) => {
  if (role === 'Admin') return true;
  return hasPermission(permissions, 'canViewSuggestions');
};
