module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.jest.test.[jt]s?(x)'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/modules/despensa/components/IngredientCard.jsx',
    'src/modules/recipes/components/NutritionCard.jsx',
    'src/modules/recipes/screens/FavoritesScreen.jsx',
    'src/modules/recipes/screens/RecipeHomeScreen.jsx',
    'src/modules/recipes/screens/RecipeSuggestionScreen.jsx',
    'src/services/api.ts',
  ],
  coverageDirectory: 'docs/pruebas/evidencia/coverage',
};
