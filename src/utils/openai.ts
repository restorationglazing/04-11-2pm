import OpenAI from 'openai';
import { type Ingredient } from '../types';
import { auth } from './firebase';
import { getUserData } from './firebase';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});

async function getCaloriePreferences() {
  if (!auth.currentUser) return null;
  
  try {
    const userData = await getUserData(auth.currentUser.uid);
    return userData.preferences.caloriePreferences;
  } catch (error) {
    console.error('Error getting calorie preferences:', error);
    return null;
  }
}

export async function generateRecipe(ingredients: Ingredient[]) {
  const ingredientList = ingredients.map(ing => ing.name).join(', ');
  const timestamp = Date.now();
  const caloriePrefs = await getCaloriePreferences();
  
  try {
    const systemPrompt = `You are a helpful chef that suggests recipes based on available ingredients. Current timestamp: ${timestamp}. ${
      caloriePrefs 
        ? `Target calories per serving: ${Math.round(caloriePrefs.dailyTotal / 3)}. You must ensure the recipe meets this calorie target.` 
        : ''
    } Always provide unique suggestions. Respond in JSON format with the following structure: { 
      name: string, 
      cookTime: number, 
      servings: number, 
      calories: number, 
      macros: { protein: number, carbs: number, fat: number },
      ingredients: { name: string, amount: string, calories: number }[],
      instructions: string[],
      nutritionNotes: string
    }`;

    const completion = await openai.chat.completions.create({
      messages: [{
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: `Suggest a unique recipe I can make with some or all of these ingredients: ${ingredientList}. Include additional common ingredients if needed.${
          caloriePrefs ? ` The recipe should be approximately ${Math.round(caloriePrefs.dailyTotal / 3)} calories per serving.` : ''
        }`
      }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.6
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error generating recipe:', error);
    throw error;
  }
}

export async function generateCustomRecipe(prompt: string) {
  const timestamp = Date.now();
  const caloriePrefs = await getCaloriePreferences();
  
  try {
    const systemPrompt = `You are a professional chef providing detailed cooking instructions. Current timestamp: ${timestamp}. ${
      caloriePrefs 
        ? `Daily calorie targets: Total ${caloriePrefs.dailyTotal} calories
           - Breakfast: ${caloriePrefs.breakfast} calories
           - Lunch: ${caloriePrefs.lunch} calories
           - Dinner: ${caloriePrefs.dinner} calories
           - Snacks: ${caloriePrefs.snacks} calories
           
           You must provide detailed calorie breakdowns and ensure recipes meet these targets.`
        : ''
    } Always provide unique suggestions. Format your response in JSON with the following structure: {
      name: string,
      mealType: string,
      targetCalories: number,
      actualCalories: number,
      servings: number,
      prepTime: number,
      cookTime: number,
      macros: {
        protein: number,
        carbs: number,
        fat: number
      },
      ingredients: [
        {
          name: string,
          amount: string,
          calories: number
        }
      ],
      instructions: string[],
      nutritionNotes: string
    }`;

    const completion = await openai.chat.completions.create({
      messages: [{
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: prompt
      }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.6
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating custom recipe:', error);
    throw error;
  }
}

export async function generateMealPlan() {
  const timestamp = Date.now();
  const caloriePrefs = await getCaloriePreferences();
  
  try {
    const systemPrompt = `You are a nutritionist creating weekly meal plans. Current timestamp: ${timestamp}. ${
      caloriePrefs 
        ? `Daily calorie targets:
           - Total: ${caloriePrefs.dailyTotal} calories
           - Breakfast: ${caloriePrefs.breakfast} calories
           - Lunch: ${caloriePrefs.lunch} calories
           - Dinner: ${caloriePrefs.dinner} calories
           - Snacks: ${caloriePrefs.snacks} calories
           
           You must ensure all meals meet these calorie targets exactly.`
        : ''
    } Always provide unique suggestions. Respond in JSON format with the following structure:
    {
      "weeklyPlan": [
        {
          "day": string,
          "breakfast": {
            "name": string,
            "calories": number,
            "macros": { protein: number, carbs: number, fat: number },
            "ingredients": { name: string, amount: string, calories: number }[]
          },
          "lunch": {
            "name": string,
            "calories": number,
            "macros": { protein: number, carbs: number, fat: number },
            "ingredients": { name: string, amount: string, calories: number }[]
          },
          "dinner": {
            "name": string,
            "calories": number,
            "macros": { protein: number, carbs: number, fat: number },
            "ingredients": { name: string, amount: string, calories: number }[]
          },
          "snacks": {
            "name": string,
            "calories": number,
            "macros": { protein: number, carbs: number, fat: number },
            "ingredients": { name: string, amount: string, calories: number }[]
          }
        }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      messages: [{
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: "Generate a balanced weekly meal plan with variety and nutrition in mind."
      }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.6
    });

    const response = JSON.parse(completion.choices[0].message.content);
    if (!response.weeklyPlan || !Array.isArray(response.weeklyPlan)) {
      throw new Error('Invalid meal plan format received');
    }

    return response.weeklyPlan;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new Error('Failed to generate meal plan. Please try again.');
  }
}

export async function generateShoppingList(meals: string[]) {
  const timestamp = Date.now();
  const caloriePrefs = await getCaloriePreferences();
  
  try {
    const systemPrompt = `You are a helpful chef creating organized shopping lists. Current timestamp: ${timestamp}. ${
      caloriePrefs 
        ? `Daily calorie target: ${caloriePrefs.dailyTotal}. Include calorie information for all ingredients.` 
        : ''
    } Given a list of meals and servings, create a categorized shopping list with exact quantities. 
    Respond in JSON format with the following structure:
    {
      "shoppingList": [
        {
          "category": string,
          "items": [
            {
              "name": string,
              "amount": string,
              "calories": number,
              "caloriesPerUnit": string
            }
          ]
        }
      ]
    }
    Categories should include: Produce, Meat & Seafood, Dairy & Eggs, Pantry, Grains & Bread, Frozen, Condiments & Spices.
    Always specify quantities in common measurements (cups, ounces, pounds, etc.).`;

    const completion = await openai.chat.completions.create({
      messages: [{
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: `Create a detailed shopping list with exact quantities for these meals: ${meals.join(', ')}`
      }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.6
    });

    const response = JSON.parse(completion.choices[0].message.content);
    if (!response.shoppingList || !Array.isArray(response.shoppingList)) {
      throw new Error('Invalid shopping list format received');
    }

    return response.shoppingList;
  } catch (error) {
    console.error('Error generating shopping list:', error);
    throw new Error('Failed to generate shopping list. Please try again.');
  }
}