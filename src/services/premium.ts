import { doc, getDoc, updateDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { logAnalyticsEvent } from './analytics';

export const addPremiumUser = async (email: string) => {
  if (!email) {
    throw new Error('Email is required');
  }

  try {
    const normalizedEmail = email.toLowerCase();
    
    if (!auth.currentUser) {
      throw new Error('No authenticated user found');
    }

    const userId = auth.currentUser.uid;
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const premiumUsersRef = collection(db, 'premiumUsers');
    const q = query(premiumUsersRef, where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    let premiumDocId;

    if (!querySnapshot.empty) {
      premiumDocId = querySnapshot.docs[0].id;
      await updateDoc(doc(premiumUsersRef, premiumDocId), {
        active: true,
        updatedAt: new Date().toISOString(),
        stripeSubscriptionActive: true,
        userId: userId
      });
    } else {
      const premiumUserData = {
        email: normalizedEmail,
        userId: userId,
        active: true,
        stripeSubscriptionActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(premiumUsersRef);
      await setDoc(docRef, premiumUserData);
      premiumDocId = docRef.id;
    }

    await updateDoc(userRef, {
      isPremium: true,
      premiumSince: new Date().toISOString(),
      email: normalizedEmail,
      premiumDocId,
      stripeSubscriptionActive: true,
      updatedAt: new Date().toISOString(),
      lastVerified: new Date().toISOString()
    });

    logAnalyticsEvent('premium_user_added', {
      userId,
      email: normalizedEmail,
      timestamp: new Date().toISOString()
    });

    const verificationResult = await verifyPremiumStatus(userId);
    if (!verificationResult.isPremium) {
      throw new Error('Premium status verification failed after update');
    }

    return true;
  } catch (error) {
    console.error('Error in addPremiumUser:', error);
    throw error;
  }
};

export const verifyPremiumStatus = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userData = await getDoc(userRef);
    
    if (!userData.exists()) {
      throw new Error('User not found');
    }
    
    const user = userData.data();
    
    const premiumUsersRef = collection(db, 'premiumUsers');
    const q = query(
      premiumUsersRef,
      where('email', '==', user.email.toLowerCase()),
      where('active', '==', true),
      where('stripeSubscriptionActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const isPremium = !querySnapshot.empty;
    
    await updateDoc(userRef, {
      isPremium,
      lastVerified: new Date().toISOString(),
      stripeSubscriptionActive: isPremium,
      updatedAt: new Date().toISOString()
    });

    logAnalyticsEvent('premium_status_verified', {
      userId,
      isPremium,
      timestamp: new Date().toISOString()
    });
    
    return {
      isPremium,
      lastVerified: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error verifying premium status:', error);
    return {
      isPremium: false,
      lastVerified: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};