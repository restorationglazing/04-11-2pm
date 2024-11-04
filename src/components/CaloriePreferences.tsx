import React, { useState, useEffect } from 'react';
import { Activity, Save, X } from 'lucide-react';
import { auth } from '../services/firebase';
import { updateUserData, getUserData } from '../services/user';

interface Props {
  onClose: () => void;
  onSave: () => void;
}

const CaloriePreferences: React.FC<Props> = ({ onClose, onSave }) => {
  const [dailyTotal, setDailyTotal] = useState(2000);
  const [distribution, setDistribution] = useState({
    breakfast: 25,
    lunch: 35,
    dinner: 30,
    snacks: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userData = await getUserData(auth.currentUser.uid);
        if (userData.preferences.caloriePreferences) {
          const { dailyTotal, breakfast, lunch, dinner, snacks } = userData.preferences.caloriePreferences;
          setDailyTotal(dailyTotal);
          setDistribution({
            breakfast: (breakfast / dailyTotal) * 100,
            lunch: (lunch / dailyTotal) * 100,
            dinner: (dinner / dailyTotal) * 100,
            snacks: (snacks / dailyTotal) * 100
          });
        }
      } catch (error) {
        console.error('Error loading calorie preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const caloriePreferences = {
        dailyTotal,
        breakfast: Math.round((distribution.breakfast / 100) * dailyTotal),
        lunch: Math.round((distribution.lunch / 100) * dailyTotal),
        dinner: Math.round((distribution.dinner / 100) * dailyTotal),
        snacks: Math.round((distribution.snacks / 100) * dailyTotal)
      };

      await updateUserData(auth.currentUser.uid, {
        preferences: {
          caloriePreferences
        }
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving calorie preferences:', error);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributionChange = (meal: keyof typeof distribution, value: number) => {
    const newDistribution = { ...distribution, [meal]: value };
    const total = Object.values(newDistribution).reduce((sum, val) => sum + val, 0);
    
    if (total > 100) {
      const excess = total - 100;
      newDistribution[meal] = value - excess;
    }
    
    setDistribution(newDistribution);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Calorie Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Calorie Target
            </label>
            <input
              type="number"
              value={dailyTotal}
              onChange={(e) => setDailyTotal(Math.max(1000, Math.min(5000, parseInt(e.target.value) || 2000)))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
              min="1000"
              max="5000"
              step="50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended range: 1000-5000 calories
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Meal Distribution (%)
            </h3>
            <div className="space-y-4">
              {Object.entries(distribution).map(([meal, percentage]) => (
                <div key={meal}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-600 capitalize">
                      {meal}
                    </label>
                    <span className="text-sm text-gray-500">
                      {Math.round((percentage / 100) * dailyTotal)} cal
                    </span>
                  </div>
                  <input
                    type="range"
                    value={percentage}
                    onChange={(e) => handleDistributionChange(meal as keyof typeof distribution, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    min="0"
                    max="100"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>{percentage}%</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Saving...' : 'Save Preferences'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaloriePreferences;