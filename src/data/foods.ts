import type { FoodItem } from "../types";

// category | name | ingredients | tutorial | kcal | protein | carbs | fat | benefits
const SOURCE = `
Snack|Greek Yogurt Berry Bowl|Greek yogurt, blueberries, strawberries, chia seeds, honey|Cottage cheese & berry bowl inspiration|250|22|30|5|High protein; antioxidants, fibre and omega-3s
Snack|Apple + Peanut Butter|Apple, natural peanut butter, cinnamon|High-protein apple & PB oat ideas|280|8|35|14|Fibre and healthy fats make it more filling than fruit alone
Snack|Cottage Cheese Berry Bowl|Cottage cheese, berries, vanilla, optional cereal|Cottage cheese snack recipes|220|25|22|4|Casein protein and calcium
Snack|Hummus + Vegetables|Chickpeas, tahini, lemon, garlic, carrots, cucumber, peppers|Budget Bytes homemade hummus recipe + video|250|8|30|12|Fibre, unsaturated fats, plant protein and vegetables
Snack|Egg Muffins|Eggs, egg whites, spinach, peppers, tomatoes, feta|Well Plated egg muffins recipe + video|150|14|5|8|High-protein, vegetable-rich and easy to meal prep
Snack|Banana + Peanut Butter|Banana, peanut butter|Quick assembly|295|8|34|16|Convenient pre-workout carbs with satisfying fats and protein
Snack|Hard-Boiled Eggs + Fruit|2 eggs, orange, apple or berries|Quick assembly|220|13|20|10|Complete protein, choline, vitamin C and fibre
Snack|Roasted Edamame|Edamame, seasoning|High-protein snack ideas|200|21|16|8|Plant protein, fibre and isoflavones
Snack|Chocolate PB Energy Balls|Oats, peanut butter, dates or honey, chia, dark chocolate|EatingWell energy ball recipes|200|7|24|10|Portable energy with fibre and healthy fats
Snack|Avocado Egg Toast|Whole-grain bread, avocado, egg, seasoning|Quick assembly|330|15|32|17|Fibre, monounsaturated fats, potassium and complete protein
Snack|Protein Smoothie|Milk, banana, Greek yogurt, berries, protein powder|Blend until smooth|350|40|40|5|Post-workout protein and carbohydrates
Snack|Greek Yogurt + Popcorn|Air-popped popcorn, Greek yogurt|Quick assembly|200|18|25|3|High-volume snack with protein and whole-grain fibre
Snack|Cottage Cheese Toast|Whole-grain bread, cottage cheese, tomato or berries|Cottage cheese snack recipes|260|22|30|6|Slow-digesting protein and whole-grain carbohydrates
Snack|Salmon + Whole-Grain Crackers|Canned salmon, crackers, cucumber, lemon|High-protein snack ideas|260|23|25|8|Omega-3s, vitamin D, selenium and protein
Snack|Turkey + Cucumber Roll-Ups|Turkey breast, cucumber, cheese or hummus|Roll and serve|200|25|8|8|Lean, convenient protein
Meal|Chicken Burrito Bowl|Chicken, brown rice, black beans, corn, tomato, lettuce, avocado|Skinnytaste chipotle chicken recipe + video|600|50|65|16|Protein, complex carbs and fibre; highly customizable
Meal|Salmon Rice Bowl|Salmon, brown rice, cucumber, avocado, edamame, soy sauce|EatingWell rice bowl recipes|650|42|65|24|Omega-3 fats, protein and micronutrients
Meal|Turkey Taco Lettuce Wraps|Lean ground turkey, lettuce, tomato, onion, spices, avocado|Skinnytaste turkey taco lettuce wraps|255|30|6|11|High protein-to-calorie ratio and naturally low-carb
Meal|Mediterranean Chicken Rice Bowl|Chicken breast, rice, cucumber, tomato, onion, feta, lemon|Skinnytaste feta-brined chicken bowl|411|30.5|40.5|14|Balanced macros with vegetables for volume
Meal|Egg & Avocado Breakfast Wrap|Eggs, whole-wheat tortilla, avocado, spinach, salsa|Quick assembly|450|25|40|22|Complete protein, monounsaturated fats and fibre
Meal|Protein Overnight Oats|Oats, Greek yogurt, milk, chia, berries, peanut butter|EatingWell overnight oat recipes|500|30|60|16|High-fibre breakfast with sustained energy
Meal|Beef & Vegetable Stir-Fry|Lean beef, broccoli, peppers, carrots, rice, soy-ginger sauce|Stir-fry until cooked through|600|45|65|18|Iron, zinc, B12, fibre and micronutrients
Meal|Chicken Protein Pasta|Chicken breast, high-protein pasta, tomato sauce, spinach, Parmesan|Boil pasta and combine|650|55|75|14|Very high protein with training carbohydrates
Meal|Chicken Quinoa Bowl|Chicken, quinoa, spinach, cucumber, tomato, feta, olive oil|Meal-prep bowl|600|48|55|20|Fibre, magnesium and additional plant protein
Meal|Turkey Meximelt|Ground turkey, tortilla, cheese, pico de gallo|Skinnytaste healthy Meximelt recipe|224|21.5|20|12|Protein-dense alternative to a fast-food wrap
Meal|Salmon + Sweet Potato + Broccoli|Salmon, sweet potato, broccoli, olive oil, lemon|Roast and plate|620|42|55|25|Omega-3s, beta-carotene, potassium and fibre
Meal|Chicken Fajita Bowl|Chicken, peppers, onions, rice, black beans, salsa|EatingWell 30-minute dinner ideas|550|45|65|12|High protein and fibre; easy to batch cook
Meal|Chickpea Quinoa Power Bowl|Chickpeas, quinoa, spinach, tomato, cucumber, tahini|EatingWell vegetarian bowl recipes|550|22|75|20|High-fibre plant-based meal with unsaturated fats
Meal|Chicken Curry + Rice|Chicken breast, rice, vegetables, light coconut milk, curry spices|Simmer and batch cook|600|45|70|16|Balanced and easy to batch cook
Meal|Turkey + Sweet Potato Skillet|Lean ground turkey, sweet potato, peppers, spinach, onion|EatingWell high-protein one-pot dinners|500|40|50|15|Protein, complex carbohydrates and fibre in one pan
Meal|Shrimp Rice Bowl|Shrimp, rice, edamame, cucumber, carrots, avocado|Meal-prep bowl|550|42|65|15|Lean protein, selenium, iodine and B12
Meal|Chicken Tacos|Chicken, corn tortillas, cabbage, pico de gallo, avocado, Greek yogurt|Assemble and serve|500|42|50|16|High-protein meal that is easy to portion
Meal|Egg Fried Rice|Eggs, rice, chicken or shrimp, peas, carrots, edamame, soy sauce|Stir-fry until hot|600|38|75|16|Protein, vegetables and carbs in one meal
Meal|Grilled Chicken Avocado Sandwich|Chicken breast, whole-grain bread, avocado, tomato, spinach|Grill and assemble|550|48|50|20|Protein, fibre and monounsaturated fats
Meal|Protein Pancakes|Oats, eggs, banana, cottage cheese or Greek yogurt, berries|Blend batter and pan cook|500|35|60|14|Higher-protein pancakes with oat fibre`;

export const FOOD_CATALOGUE: FoodItem[] = SOURCE.trim()
  .split("\n")
  .map((line, index) => {
    const [category, name, ingredients, tutorial, calories, protein, carbs, fat, benefits] =
      line.split("|");
    return {
      id: index + 1,
      category: category as FoodItem["category"],
      name,
      ingredients,
      tutorial,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      benefits,
    };
  });

const SNACK_COUNT = FOOD_CATALOGUE.filter((item) => item.category === "Snack").length;

/**
 * Both photo sprites are 5 columns wide; snacks use 3 rows and meals 4.
 * Returning the CSS values here keeps the cards declarative instead of the old
 * approach of reaching into the DOM after paint to patch background positions.
 */
export function foodSprite(item: FoodItem) {
  const isSnack = item.category === "Snack";
  const index = isSnack ? item.id - 1 : item.id - 1 - SNACK_COUNT;
  const rows = isSnack ? 3 : 4;
  const column = index % 5;
  const row = Math.floor(index / 5);
  return {
    className: isSnack ? "snack-photo" : "meal-photo",
    style: {
      backgroundPosition: `${column * 25}% ${(row * 100) / (rows - 1)}%`,
    } as const,
  };
}
