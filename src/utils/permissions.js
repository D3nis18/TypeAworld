// Permission checking utilities
import { getCollection } from '../firebase/firestore';

// Check if user has specific permission
export const hasPermission = async (userEmail, permissionKey) => {
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

// Get member permissions object
export const getMemberPermissions = async (userEmail) => {
  try {
    const result = await getCollection('members');
    if (result.success) {
      const member = result.data.find(m => m.email === userEmail);
      if (member && member.permissions) {
        return member.permissions;
      }
    }
    return {
      canEditMinutes: false,
      canEditProjects: false,
      canEditAttendance: false,
      canDeleteContent: false
    };
  } catch (error) {
    console.error('Error getting member permissions:', error);
    return {
      canEditMinutes: false,
      canEditProjects: false,
      canEditAttendance: false,
      canDeleteContent: false
    };
  }
};

// Check if user can edit (Admin always can, or if member has specific permission)
export const canEditContent = (role, permission, memberPermissions) => {
  if (role === 'Admin') return true;
  if (role === 'Secretary') {
    // Secretary can edit minutes by default
    if (permission === 'canEditMinutes') return true;
  }
  return memberPermissions && memberPermissions[permission];
};

// Check if user can delete content
export const canDelete = (role, memberPermissions) => {
  if (role === 'Admin') return true;
  if (role === 'Secretary') return true; // Secretary can delete minutes
  return memberPermissions && memberPermissions.canDeleteContent;
};
