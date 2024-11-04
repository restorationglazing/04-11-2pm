import React from 'react';
import { X, Crown, ChefHat, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { handlePremiumCheckout } from '../utils/stripe';
import { auth } from '../utils/firebase';

interface Recipe {
  name: string;
  cookTime: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
}

interface Props {
  recipe: Recipe | null;
  onClose: () => void;
  isPremium?: boolean;
}

const RecipeModal: React.FC<Props> = ({ recipe, onClose, isPremium }) => {
  if (!recipe) return null;

  const handleUpgradeClick = async () => {
    if (!auth.currentUser) {
      // You might want to show the auth modal here
      return;
    }

    try {
      await handlePremiumCheckout();
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  // Helper function to safely convert potentially object values to strings
  const sanitizeText = (text: unknown): string => {
    if (typeof text === 'string') return text;
    if (typeof text === 'object' && text !== null) {
      // If it's an object, try to extract a meaningful string representation
      const obj = text as Record<string, unknown>;
      return Object.values(obj)[0]?.toString() || '';
    }
    return String(text || '');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`sticky top-0 bg-white p-4 border-b flex justify-between items-center ${
          isPremium ? 'bg-gradient-to-r from-amber-500 to-amber-600' : ''
        }`}>
          <h2 className={`text-2xl font-bold ${isPremium ? 'text-white' : 'text-gray-800'}`}>
            {sanitizeText(recipe.name)}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              isPremium 
                ? 'hover:bg-white/10 text-white' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex gap-4 text-gray-600 mb-4">
              <span>🕒 {recipe.cookTime} minutes</span>
              <span>👥 {recipe.servings} servings</span>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
            <ul className="list-disc list-inside space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="text-gray-700">
                  {sanitizeText(ingredient)}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Instructions</h3>
            <ol className="list-decimal list-inside space-y-3">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="text-gray-700">
                  {sanitizeText(step)}
                </li>
              ))}
            </ol>
          </div>

          {!isPremium && (
            <div className="mt-8 border-t pt-8">
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-6 h-6 text-amber-500" />
                  <h3 className="text-lg font-semibold text-gray-800">Unlock Premium Features</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Get more from your recipes with our premium features:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <ChefHat className="w-5 h-5 text-amber-500 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-800">AI Chef</h4>
                      <p className="text-sm text-gray-600">Get personalized cooking tips</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-amber-500 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-800">Meal Planner</h4>
                      <p className="text-sm text-gray-600">Plan your weekly meals</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-amber-500 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-800">Recipe Book</h4>
                      <p className="text-sm text-gray-600">Save favorite recipes</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUpgradeClick}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2 group"
                >
                  <Crown className="w-5 h-5" />
                  <span>Upgrade to Premium</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;