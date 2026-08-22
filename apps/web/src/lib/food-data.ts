export type FoodItem = {
  id: string
  foodName: string
  category: string
  caloriePerG: number
  proteinMgPerG: number
  fatMgPerG: number
  carbMgPerG: number
  vitaminMgPerG: number
  mineralMgPerG: number
  waterMgPerG: number
}

export const DEFAULT_FOODS_DATABASE: FoodItem[] = [
  { id: 'f-avocado', foodName: 'Avocado', category: 'Fruit / Healthy Fat', caloriePerG: 1.6, proteinMgPerG: 20, fatMgPerG: 148, carbMgPerG: 90, vitaminMgPerG: 7, mineralMgPerG: 5, waterMgPerG: 730 },
  { id: 'f-banana', foodName: 'Banana', category: 'Fruit / Snack', caloriePerG: 0.89, proteinMgPerG: 11, fatMgPerG: 3, carbMgPerG: 229, vitaminMgPerG: 5, mineralMgPerG: 2, waterMgPerG: 748 },
  { id: 'f-apple', foodName: 'Apple', category: 'Fruit / Snack', caloriePerG: 0.52, proteinMgPerG: 3, fatMgPerG: 2, carbMgPerG: 140, vitaminMgPerG: 4, mineralMgPerG: 2, waterMgPerG: 855 },
  { id: 'f-egg', foodName: 'Egg', category: 'Breakfast / Protein', caloriePerG: 1.55, proteinMgPerG: 126, fatMgPerG: 110, carbMgPerG: 12, vitaminMgPerG: 2, mineralMgPerG: 3, waterMgPerG: 740 },
  { id: 'f-milk', foodName: 'Milk', category: 'Dairy / Beverage', caloriePerG: 0.42, proteinMgPerG: 33, fatMgPerG: 11, carbMgPerG: 50, vitaminMgPerG: 2, mineralMgPerG: 3, waterMgPerG: 870 },
  { id: 'f-rice', foodName: 'Rice', category: 'Grain / Staple', caloriePerG: 1.3, proteinMgPerG: 27, fatMgPerG: 3, carbMgPerG: 280, vitaminMgPerG: 1, mineralMgPerG: 1, waterMgPerG: 690 },
  { id: 'f-oatmeal', foodName: 'Oatmeal', category: 'Breakfast / Grain', caloriePerG: 0.68, proteinMgPerG: 24, fatMgPerG: 14, carbMgPerG: 120, vitaminMgPerG: 1, mineralMgPerG: 2, waterMgPerG: 840 },
  { id: 'f-boiled-eggs', foodName: 'Boiled Eggs', category: 'Breakfast / Protein', caloriePerG: 1.55, proteinMgPerG: 130, fatMgPerG: 110, carbMgPerG: 12, vitaminMgPerG: 2, mineralMgPerG: 3, waterMgPerG: 740 },
  { id: 'f-chicken-breast-rice', foodName: 'Chicken breast & White Rice', category: 'Lunch / Poultry', caloriePerG: 1.35, proteinMgPerG: 180, fatMgPerG: 25, carbMgPerG: 150, vitaminMgPerG: 1, mineralMgPerG: 2, waterMgPerG: 640 },
  { id: 'f-lentil-soup', foodName: 'Lentil Soup', category: 'Lunch / Vegetarian', caloriePerG: 1.15, proteinMgPerG: 65, fatMgPerG: 15, carbMgPerG: 210, vitaminMgPerG: 2, mineralMgPerG: 3, waterMgPerG: 700 },
  { id: 'f-grilled-fish', foodName: 'Grilled Fish', category: 'Dinner / Seafood', caloriePerG: 1.1, proteinMgPerG: 160, fatMgPerG: 35, carbMgPerG: 20, vitaminMgPerG: 3, mineralMgPerG: 3, waterMgPerG: 780 },
  { id: 'f-veggie-khichdi', foodName: 'Vegetable Khichdi', category: 'Dinner / Grain', caloriePerG: 1.2, proteinMgPerG: 45, fatMgPerG: 25, carbMgPerG: 220, vitaminMgPerG: 3, mineralMgPerG: 3, waterMgPerG: 700 },
]
