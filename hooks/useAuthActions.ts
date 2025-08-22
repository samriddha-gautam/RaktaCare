import { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const { clearAllData, setProfileData } = useAuth();

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase profile if displayName provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create initial profile data and persist it
      const initialProfileData = {
        id: user.uid,
        email: user.email || email,
        name: displayName || '',
        displayName: displayName || '',
      };

      await setProfileData(initialProfileData);

      console.log('User signed up successfully:', user.email);
      return { success: true, user };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create account' 
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create/update profile data from Firebase user
      const profileData = {
        id: user.uid,
        email: user.email || email,
        name: user.displayName || '',
        displayName: user.displayName || '',
      };

      await setProfileData(profileData);

      console.log('User logged in successfully:', user.email);
      return { success: true, user };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to log in' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear all persisted data
      await clearAllData();

      console.log('User logged out successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to log out' 
      };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        throw new Error('No user is currently logged in');
      }

      // Update Firebase profile
      await updateProfile(auth.currentUser, updates);

      // Update persisted profile data
      const currentProfileData = await getStoredProfileData();
      const updatedProfileData = {
        ...currentProfileData,
        name: updates.displayName || currentProfileData?.name || '',
        displayName: updates.displayName || currentProfileData?.displayName || '',
      };

      await setProfileData(updatedProfileData);

      console.log('Profile updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    login,
    logout,
    updateUserProfile,
    loading,
  };
};

// Helper function to get stored profile data
const getStoredProfileData = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const storedProfile = await AsyncStorage.getItem('@profile_data');
    return storedProfile ? JSON.parse(storedProfile) : null;
  } catch (error) {
    console.error('Error getting stored profile data:', error);
    return null;
  }
};