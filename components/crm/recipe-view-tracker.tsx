"use client";

import { useRecipeViewTracker } from "./event-tracker";

export function RecipeViewTracker({ recipeId, recipeTitle }: { recipeId: string; recipeTitle: string }) {
  useRecipeViewTracker(recipeId, recipeTitle);
  return null;
}
