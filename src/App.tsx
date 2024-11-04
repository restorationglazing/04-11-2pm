import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, PlusCircle, Search, Wand2, UtensilsCrossed, Crown, User, Calendar, BookOpen } from 'lucide-react';
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { auth, getUserData, type UserData } from './utils/firebase';
import IngredientList from './components/IngredientList';
import RecipeSuggestions from './components/RecipeSuggestions';
import RecipeModal from './components/RecipeModal';
import PremiumBanner from './components/PremiumBanner';
import PremiumUserBanner from './components/PremiumUserBanner';
import PremiumDashboard from './components/PremiumDashboard';
import AccountPage from './components/AccountPage';
import AuthModal from './components/AuthModal';
import AiChef from './components/AiChef';
import MealPlanner from './components/MealPlanner';
import RecipeBook from './components/RecipeBook';
import AiLogo from './components/AiLogo';
import PremiumStatus from './components/PremiumStatus';
import { type Ingredient } from './types';
import { generateRecipe } from './utils/openai';
import { commonIngredients } from './utils/ingredients';

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoadingUser(true);
      setUser(user);
      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
          if (data.isPremium && location.pathname === '/') {
            navigate('/success');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      setIsLoadingUser(false);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  useEffect(() => {
    const refreshUserData = async () => {
      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
          if (data.isPremium && location.pathname === '/') {
            navigate('/success');
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };

    refreshUserData();
  }, [user, location.pathname, navigate]);

  const addIngredient = (ingredient: string = newIngredient) => {
    if (ingredient.trim()) {
      setIngredients(prev => [...prev, { id: Date.now().toString(), name: ingredient.trim() }]);
      setNewIngredient('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addIngredient();
    }
  };

  const handleDiscoverRecipe = async () => {
    if (ingredients.length === 0) return;
    
    setIsGenerating(true);
    try {
      const recipe = await generateRecipe(ingredients);
      setGeneratedRecipe(recipe);
    } catch (error) {
      console.error('Failed to generate recipe:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePremiumFeatureClick = () => {
    const element = document.querySelector('.premium-banner');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const HomePage = () => (
    <>
      {!isLoadingUser && userData?.isPremium && <PremiumUserBanner />}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <AiLogo isPremium={userData?.isPremium} />
          <div className="flex items-center gap-4">
            <PremiumStatus />
            {userData?.isPremium && (
              <Link
                to="/success"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all"
              >
                <Crown className="w-5 h-5" />
                Premium Dashboard
              </Link>
            )}
            {user ? (
              <Link
                to="/account"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <User className="w-5 h-5" />
                My Account
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <User className="w-5 h-5" />
                Sign In
              </button>
            )}
          </div>
        </div>

        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ChefHat className={`w-12 h-12 ${userData?.isPremium ? 'text-amber-500' : 'text-green-600'}`} />
            <h1 className="text-4xl font-bold text-gray-800">What Can I Cook?</h1>
          </div>
          <p className="text-gray-600">Discover delicious recipes with ingredients you already have</p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                ref={inputRef}
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Add an ingredient..."
                className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 outline-none transition-all pl-10 ${
                  userData?.isPremium 
                    ? 'focus:border-amber-500 focus:ring-amber-200'
                    : 'focus:border-green-500 focus:ring-green-200'
                }`}
                autoComplete="off"
              />
              <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>
            <button
              onClick={() => addIngredient()}
              className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center gap-2 ${
                userData?.isPremium
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              Add
            </button>
          </div>

          <IngredientList ingredients={ingredients} onRemove={removeIngredient} />

          {ingredients.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleDiscoverRecipe}
                disabled={isGenerating}
                className={`px-6 py-3 text-white rounded-lg transition-all flex items-center gap-2 ${
                  isGenerating ? 'opacity-75 cursor-not-allowed' : ''
                } ${
                  userData?.isPremium
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                }`}
              >
                <Wand2 className="w-5 h-5" />
                {isGenerating ? 'Discovering Recipe...' : 'Discover New Recipe'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={handlePremiumFeatureClick}
            className="relative group overflow-hidden rounded-xl transform hover:scale-105 transition-all duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600"></div>
            <div className="relative p-6 text-center">
              <div className="absolute -top-6 right-0 transform rotate-12">
                <Crown className="w-12 h-12 text-amber-300/20" />
              </div>
              <div className="backdrop-blur-[2px]">
                <ChefHat className="w-8 h-8 text-amber-300/60 mx-auto mb-3 blur-[1px]" />
                <h3 className="text-lg font-semibold mb-2 text-amber-100/90 blur-[1px]">AI Chef</h3>
                <p className="text-sm text-amber-100/70 blur-[1px]">Get personalized cooking tips</p>
              </div>
            </div>
          </button>

          <button
            onClick={handlePremiumFeatureClick}
            className="relative group overflow-hidden rounded-xl transform hover:scale-105 transition-all duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600"></div>
            <div className="relative p-6 text-center">
              <div className="absolute -top-6 right-0 transform rotate-12">
                <Crown className="w-12 h-12 text-amber-300/20" />
              </div>
              <div className="backdrop-blur-[2px]">
                <Calendar className="w-8 h-8 text-amber-300/60 mx-auto mb-3 blur-[1px]" />
                <h3 className="text-lg font-semibold mb-2 text-amber-100/90 blur-[1px]">Meal Planner</h3>
                <p className="text-sm text-amber-100/70 blur-[1px]">Plan your weekly meals</p>
              </div>
            </div>
          </button>

          <button
            onClick={handlePremiumFeatureClick}
            className="relative group overflow-hidden rounded-xl transform hover:scale-105 transition-all duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600"></div>
            <div className="relative p-6 text-center">
              <div className="absolute -top-6 right-0 transform rotate-12">
                <Crown className="w-12 h-12 text-amber-300/20" />
              </div>
              <div className="backdrop-blur-[2px]">
                <BookOpen className="w-8 h-8 text-amber-300/60 mx-auto mb-3 blur-[1px]" />
                <h3 className="text-lg font-semibold mb-2 text-amber-100/90 blur-[1px]">Recipe Book</h3>
                <p className="text-sm text-amber-100/70 blur-[1px]">Save your favorite recipes</p>
              </div>
            </div>
          </button>
        </div>

        {!isLoadingUser && !userData?.isPremium && <div className="premium-banner"><PremiumBanner /></div>}

        {ingredients.length > 0 ? (
          <RecipeSuggestions ingredients={ingredients} isPremium={userData?.isPremium} />
        ) : (
          <div className="text-center py-12">
            <UtensilsCrossed className={`w-16 h-16 mx-auto mb-4 ${
              userData?.isPremium ? 'text-amber-300' : 'text-gray-300'
            }`} />
            <p className="text-gray-500">Add some ingredients to get recipe suggestions!</p>
          </div>
        )}

        {generatedRecipe && (
          <RecipeModal
            recipe={generatedRecipe}
            onClose={() => setGeneratedRecipe(null)}
            isPremium={userData?.isPremium}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/success" element={<PremiumDashboard />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/ai-chef" element={<AiChef />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/recipe-book" element={<RecipeBook />} />
      </Routes>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
};

export default App;