import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { verifyPremiumStatus } from './premium';
import { logAnalyticsEvent } from './analytics';
import { UserData } from '../types/user';

export const getUserData = async (userId: string, forceRefresh = false): Promise<UserData> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data() as UserData;
    
    if (forceRefresh) {
      const verificationResult = await verifyPremiumStatus(userId);
      if (verificationResult.isPremium !== userData.isPremium) {
        await updateDoc(userRef, {
          isPremium: verificationResult.isPremium,
          lastVerified: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return { ...userData, isPremium: verificationResult.isPremium };
      }
    }
    
    return userData;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

export const updateUserData = async (userId: string, data: Partial<UserData>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    logAnalyticsEvent('user_data_updated', {
      userId,
      updatedFields: Object.keys(data),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user data:', error);
    throw new Error('Failed to update user data. Please try again.');
  }
};