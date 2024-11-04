import { Analytics, logEvent } from 'firebase/analytics';
import { analytics } from './firebase';

export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>) => {
  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};