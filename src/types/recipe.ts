export interface Ingredient {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
}

export interface Recipe {
  id: number;
  name: string;
  image: string;
  cookTime: number;
  servings: number;
  ingredients: string[];
  matchingIngredients: string[];
  totalIngredients: number;
}