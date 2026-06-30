import { User } from '../types';

// Storage key for user session
const AUTH_USER_KEY = 'myday_auth_user';

// Default mock user - utilizing the user's specific info provided in metadata
export const DEFAULT_MOCK_USER: User = {
  uid: 'user-melody',
  email: 'akinwandemelody49@gmail.com',
  displayName: 'Melody Akinwande',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  emailVerified: true,
  createdAt: new Date().toISOString()
};

export const getStoredUser = (): User | null => {
  try {
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    if (userJson) {
      return JSON.parse(userJson);
    }
  } catch (e) {
    console.error('Error reading auth state', e);
  }
  return null;
};

export const saveStoredUser = (user: User | null) => {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (e) {
    console.error('Error saving auth state', e);
  }
};
