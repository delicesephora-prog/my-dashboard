// ---------------------------------------------------------------------------
// The Cookbook: a standalone, premium recipe collection separate from the
// "one cook, two plates" August dinner calendar (lib/mealcalendar.ts). Every
// recipe follows the same full schema below, imported verbatim from what
// she pasted in - fields she didn't supply for a given recipe are left
// blank/empty rather than invented, and render as collapsed/hidden in the
// UI instead of showing fake data.

export type IngredientGroup = {
  // "" for a flat, unlabeled list; otherwise a subsection heading like
  // "Marinade", "Sauce", "Bowls".
  label: string;
  items: string[];
};

export type CookbookRecipe = {
  id: string;
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: string;
  difficulty: string;
  cuisine: string;
  // Haitian-section-only extras - pronunciation guide and the cultural
  // note on why épis matters, left blank for every non-Haitian recipe.
  pronunciation: string;
  culturalBackground: string;
  mealPrepFriendly: string;
  freezerFriendly: string;
  protein: string;
  calories: string;
  spiceLevel: string;
  equipment: string[];
  ingredients: IngredientGroup[];
  ingredientNotes: string;
  directions: string[];
  storage: string;
  freezerInstructions: string;
  mealPrepTips: string;
  leftoverIdeas: string[];
  nutrition: string;
  shoppingList: string[];
  suggestedPairings: string[];
  chefTips: string[];
  tags: string[];
};

export type CookbookData = {
  recipes: CookbookRecipe[];
  seedVersion: number;
};

export function emptyCookbookData(): CookbookData {
  return { recipes: [], seedVersion: 0 };
}

// Every field the schema promises, defaulted to blank/empty so a recipe()
// call only has to specify what the source text actually gave.
function recipe(partial: Partial<CookbookRecipe> & { id: string; name: string }): CookbookRecipe {
  return {
    description: "",
    prepTime: "",
    cookTime: "",
    totalTime: "",
    servings: "",
    difficulty: "",
    cuisine: "",
    pronunciation: "",
    culturalBackground: "",
    mealPrepFriendly: "",
    freezerFriendly: "",
    protein: "",
    calories: "",
    spiceLevel: "",
    equipment: [],
    ingredients: [],
    ingredientNotes: "",
    directions: [],
    storage: "",
    freezerInstructions: "",
    mealPrepTips: "",
    leftoverIdeas: [],
    nutrition: "",
    shoppingList: [],
    suggestedPairings: [],
    chefTips: [],
    tags: [],
    ...partial,
  };
}

function ing(label: string, items: string[]): IngredientGroup {
  return { label, items };
}

// ---------------------------------------------------------------------------
// The 40 imported recipes - transcribed as given, not rewritten. Fields the
// source didn't supply for a given recipe (nutrition, spice level, equipment,
// etc. for most of these) stay blank via recipe()'s defaults rather than
// being invented.

function seedCookbookRecipes(): CookbookRecipe[] {
  return [
    recipe({
      id: "beef-patties-arugula-date-salad",
      name: "Beef Patties + Arugula Date Salad",
      description:
        "Flaky Jamaican beef patties paired with a bright peppery arugula salad tossed with sweet Medjool dates, creamy goat cheese, crunchy candied pecans, and a homemade honey Dijon vinaigrette. The rich pastry balances perfectly with the fresh salad, making this an easy weeknight dinner that feels elevated enough for guests.",
      prepTime: "10 minutes",
      cookTime: "25 minutes",
      totalTime: "35 minutes",
      servings: "4",
      difficulty: "Easy",
      cuisine: "Jamaican Fusion",
      mealPrepFriendly: "Yes",
      freezerFriendly: "Patties only",
      ingredients: [
        ing("Beef Patties", ["4 frozen Jamaican beef patties"]),
        ing("Salad", [
          "5 oz arugula",
          "½ cup chopped Medjool dates",
          "¼ cup goat cheese",
          "¼ cup candied pecans",
          "¼ small red onion",
        ]),
        ing("Dressing", [
          "3 tbsp olive oil",
          "1 tbsp Dijon mustard",
          "1 tbsp honey",
          "1 tbsp balsamic vinegar",
          "salt",
          "pepper",
        ]),
      ],
      directions: [
        "Bake patties according to package directions.",
        "Whisk dressing ingredients until smooth.",
        "Combine salad ingredients.",
        "Toss with dressing immediately before serving.",
        "Serve warm patties beside salad.",
      ],
      storage: "Salad: 2 days. Patties: 4 days.",
      mealPrepTips: "Store dressing separately.",
      chefTips: ["Warm the patties for the last 2 minutes under the broiler for extra crispness."],
      tags: ["Weeknight", "Quick", "Jamaican", "High Protein"],
    }),
    recipe({
      id: "beef-tacos-black-beans",
      name: "Beef Tacos + Black Beans",
      description:
        "Classic taco night with seasoned ground beef, warm tortillas, flavorful black beans, and your favorite fresh toppings.",
      prepTime: "10 min",
      cookTime: "20 min",
      servings: "4",
      ingredients: [
        ing("", [
          "1 lb lean ground beef",
          "1 packet taco seasoning",
          "⅓ cup water",
          "8 tortillas",
          "shredded lettuce",
          "diced tomatoes",
          "cheddar cheese",
          "avocado",
          "sour cream",
        ]),
        ing("Black Beans", ["1 can black beans", "1 tsp cumin", "1 garlic clove", "½ tsp chili powder"]),
      ],
      directions: [
        "Brown beef.",
        "Drain grease.",
        "Add seasoning and water.",
        "Simmer 5 minutes.",
        "Heat black beans with garlic and spices.",
        "Warm tortillas.",
        "Assemble tacos.",
      ],
      storage: "4 days.",
      freezerInstructions: "Beef freezes up to 3 months.",
      chefTips: ["Toast tortillas over an open flame for extra flavor."],
    }),
    recipe({
      id: "garlic-butter-steak-bites-mashed-potatoes",
      name: "Garlic Butter Steak Bites + Mashed Potatoes",
      description:
        "Tender sirloin steak bites seared until caramelized and tossed in rich garlic herb butter. Served with creamy Yukon Gold mashed potatoes.",
      prepTime: "15 min",
      cookTime: "25 min",
      servings: "4",
      ingredients: [
        ing("Steak", [
          "1½ lb sirloin",
          "salt",
          "pepper",
          "paprika",
          "garlic powder",
          "4 tbsp butter",
          "4 garlic cloves",
          "parsley",
        ]),
        ing("Mashed Potatoes", ["2 lb Yukon Gold potatoes", "½ cup milk", "4 tbsp butter", "salt", "pepper"]),
      ],
      directions: [
        "Boil potatoes.",
        "Mash with butter and milk.",
        "Season steak.",
        "Sear in very hot skillet.",
        "Lower heat.",
        "Add butter and garlic.",
        "Toss until coated.",
        "Serve immediately.",
      ],
      chefTips: ["Never overcrowd the pan."],
    }),
    recipe({
      id: "crunchwrap-night",
      name: "Crunchwrap Night",
      description:
        "Everything you love about Taco Bell made fresh at home with crisp tortillas, seasoned beef, nacho cheese, crunchy tostadas, and fresh vegetables.",
      ingredients: [
        ing("", [
          "1 lb ground beef",
          "taco seasoning",
          "6 burrito tortillas",
          "6 tostadas",
          "nacho cheese",
          "lettuce",
          "tomatoes",
          "sour cream",
          "Mexican cheese blend",
        ]),
      ],
      directions: [
        "Cook beef.",
        "Layer: tortilla, nacho cheese, beef, tostada, sour cream, lettuce, tomatoes, cheese.",
        "Fold.",
        "Toast both sides until golden.",
      ],
      chefTips: ["Use medium heat so the tortilla crisps before burning."],
    }),
    recipe({
      id: "honey-garlic-salmon-bites",
      name: "Honey Garlic Salmon Bites",
      description: "Sweet, savory, buttery salmon bites tossed in a sticky honey garlic glaze served over jasmine rice.",
      prepTime: "10",
      cookTime: "15",
      ingredients: [
        ing("", ["1½ lb salmon"]),
        ing("Seasoning", ["paprika", "garlic powder", "onion powder", "salt", "pepper"]),
        ing("Sauce", ["3 tbsp honey", "2 tbsp soy sauce", "4 garlic cloves", "1 tbsp butter", "lemon juice"]),
      ],
      directions: [
        "Cube salmon.",
        "Season generously.",
        "Sear 2–3 minutes per side.",
        "Remove.",
        "Make sauce.",
        "Return salmon.",
        "Coat completely.",
        "Serve over rice.",
      ],
      storage: "3 days.",
      mealPrepTips: "Excellent for lunches.",
    }),
    recipe({
      id: "cajun-salmon-pasta",
      name: "Cajun Salmon Pasta",
      description: "Blackened salmon over creamy Parmesan linguine with spinach and fresh herbs.",
      ingredients: [
        ing("", [
          "2 salmon fillets",
          "Cajun seasoning",
          "12 oz linguine",
          "1 tbsp butter",
          "3 garlic cloves",
          "1 cup heavy cream",
          "½ cup Parmesan",
          "spinach",
          "parsley",
        ]),
      ],
      directions: [
        "Cook pasta.",
        "Blacken salmon.",
        "Remove.",
        "Make cream sauce.",
        "Add Parmesan.",
        "Add spinach.",
        "Slice salmon.",
        "Serve.",
      ],
      chefTips: ["Reserve pasta water before draining."],
    }),
    recipe({
      id: "buffalo-chicken-mac",
      name: "Buffalo Chicken Mac",
      description: "Creamy, spicy buffalo chicken macaroni packed with cheddar, Monterey Jack, and shredded chicken.",
      ingredients: [
        ing("", [
          "2 chicken breasts",
          "buffalo sauce",
          "12 oz cavatappi",
          "cheddar",
          "Monterey Jack",
          "cream cheese",
          "Greek yogurt",
        ]),
      ],
      directions: [
        "Cook chicken.",
        "Shred.",
        "Cook pasta.",
        "Prepare cheese sauce.",
        "Mix.",
        "Bake 15 minutes.",
        "Top with green onions.",
      ],
    }),
    recipe({
      id: "chicken-kebab-bowls",
      name: "Chicken Kebab Bowls",
      description: "Greek-marinated chicken served over fluffy rice with cucumbers, tomatoes, feta, and homemade tzatziki.",
      ingredients: [
        ing("Chicken Marinade", [
          "2 lb chicken thighs",
          "Greek yogurt",
          "lemon",
          "garlic",
          "paprika",
          "cumin",
          "oregano",
          "olive oil",
        ]),
        ing("Bowls", ["jasmine rice", "cucumber", "tomatoes", "red onion", "feta", "tzatziki"]),
      ],
      directions: ["Marinate overnight.", "Grill chicken.", "Cook rice.", "Assemble bowls.", "Top with tzatziki."],
      chefTips: ["Marinating overnight makes a huge difference in flavor and tenderness."],
    }),
    recipe({
      id: "chicken-tortilla-soup",
      name: "Chicken Tortilla Soup",
      description:
        "A comforting Mexican-inspired soup loaded with shredded chicken, black beans, corn, tomatoes, and warm spices. Finished with crunchy tortilla strips, avocado, cheddar cheese, fresh cilantro, and lime, this soup is ideal for meal prep because the flavors deepen overnight.",
      prepTime: "15 minutes",
      cookTime: "35 minutes",
      servings: "6",
      difficulty: "Easy",
      cuisine: "Mexican Inspired",
      mealPrepFriendly: "Yes",
      freezerFriendly: "Yes",
      ingredients: [
        ing("", [
          "2 tbsp olive oil",
          "1 onion, diced",
          "3 garlic cloves, minced",
          "1 jalapeño, diced",
          "1 tsp cumin",
          "1 tsp chili powder",
          "1 tsp smoked paprika",
          "1 can diced tomatoes",
          "1 can black beans",
          "1 can corn",
          "4 cups chicken broth",
          "2 cups shredded rotisserie chicken",
          "Juice of 1 lime",
        ]),
        ing("Toppings", ["Tortilla strips", "Avocado", "Sour cream", "Cheddar cheese", "Cilantro"]),
      ],
      directions: [
        "Sauté onion and jalapeño.",
        "Add garlic.",
        "Add spices.",
        "Pour in tomatoes, beans, corn and broth.",
        "Simmer 20 minutes.",
        "Add shredded chicken.",
        "Finish with lime juice.",
        "Serve with toppings.",
      ],
      storage: "5 days.",
      freezerInstructions: "Freeze without toppings.",
      mealPrepTips: "Keeps extremely well.",
      chefTips: ["Add avocado fresh each time."],
      tags: ["Soup", "Meal Prep", "High Protein", "Freezer Friendly"],
    }),
    recipe({
      id: "chicken-red-lentils-basmati-rice",
      name: "Chicken, Red Lentils & Basmati Rice",
      description:
        "A hearty one-pot chicken and lentil dinner served over fragrant basmati rice. Packed with protein, fiber, and warm spices, it's an excellent healthy meal-prep option.",
      prepTime: "10 minutes",
      cookTime: "35 minutes",
      servings: "4",
      ingredients: [
        ing("", [
          "2 chicken breasts",
          "1 cup red lentils",
          "1 cup basmati rice",
          "1 onion",
          "3 garlic cloves",
          "1 tsp cumin",
          "1 tsp turmeric",
          "½ tsp paprika",
          "3 cups chicken broth",
          "Baby spinach",
        ]),
      ],
      directions: [
        "Cook rice.",
        "Brown chicken.",
        "Remove chicken.",
        "Cook onion and garlic.",
        "Add spices.",
        "Add lentils.",
        "Pour broth.",
        "Simmer.",
        "Return chicken.",
        "Stir in spinach.",
        "Serve over rice.",
      ],
      chefTips: ["Red lentils become creamy naturally."],
    }),
    recipe({
      id: "chimichurri-steak-pitas",
      name: "Chimichurri Steak Pitas",
      description:
        "Juicy grilled flank steak tucked inside warm pita bread with homemade chimichurri, feta cheese, tomatoes, arugula, and pickled onions.",
      prepTime: "20 minutes",
      cookTime: "15 minutes",
      ingredients: [
        ing("Steak", ["1½ lb flank steak", "Salt", "Pepper", "Garlic powder"]),
        ing("Chimichurri", ["1 cup parsley", "¼ cup cilantro", "3 garlic cloves", "½ cup olive oil", "2 tbsp red wine vinegar", "Oregano"]),
        ing("Assembly", ["Pitas", "Tomatoes", "Arugula", "Pickled onions", "Feta"]),
      ],
      directions: ["Blend chimichurri.", "Grill steak.", "Rest steak.", "Slice thinly.", "Warm pitas.", "Assemble."],
      chefTips: ["Always slice steak against the grain."],
    }),
    recipe({
      id: "hot-honey-chicken-burrito-bowls",
      name: "Hot Honey Chicken Burrito Bowls",
      description:
        "Tender chicken tossed in homemade hot honey served over cilantro lime rice with black beans, roasted corn, avocado, pico de gallo, and chipotle ranch.",
      prepTime: "15 minutes",
      cookTime: "30 minutes",
      ingredients: [
        ing("Chicken", ["2 lbs chicken thighs", "Paprika", "Garlic powder", "Onion powder", "Cayenne", "Salt"]),
        ing("Hot Honey", ["¼ cup honey", "2 tbsp hot sauce", "1 tbsp butter", "Chili flakes"]),
        ing("Bowls", ["Cilantro lime rice", "Black beans", "Corn", "Avocado", "Pickled onions", "Pico de gallo", "Chipotle ranch"]),
      ],
      directions: ["Season chicken.", "Bake.", "Prepare hot honey.", "Toss chicken.", "Assemble bowls."],
      storage: "4 days.",
      mealPrepTips: "Perfect for lunch containers.",
    }),
    recipe({
      id: "legim-white-rice",
      name: "Legim + White Rice",
      description:
        "A classic Haitian vegetable stew featuring eggplant, cabbage, carrots, chayote, potatoes, and beef simmered with épis until rich and velvety. This comforting dish is traditionally served over steamed white rice.",
      prepTime: "30 minutes",
      cookTime: "1 hour",
      cuisine: "Haitian",
      ingredients: [
        ing("Vegetables", ["Eggplant", "Chayote", "Carrots", "Potatoes", "Cabbage", "Spinach"]),
        ing("Meat", ["1½ lbs beef stew meat"]),
        ing("Marinade", ["Épis", "Garlic", "Lime", "Thyme", "Parsley"]),
      ],
      directions: ["Marinate beef.", "Brown meat.", "Boil vegetables.", "Mash vegetables.", "Combine with beef.", "Simmer until thick.", "Serve with white rice."],
      chefTips: ["Legim tastes even better the following day."],
    }),
    recipe({
      id: "peri-peri-chicken-sweet-potatoes",
      name: "Peri Peri Chicken & Sweet Potatoes",
      description:
        "Tender chicken thighs marinated in a smoky, spicy homemade peri peri sauce paired with roasted sweet potatoes and broccolini.",
      prepTime: "20 minutes",
      cookTime: "35 minutes",
      ingredients: [
        ing("Chicken", ["Chicken thighs"]),
        ing("Marinade", ["Roasted peppers", "Garlic", "Lemon", "Olive oil", "Paprika", "Cayenne", "Oregano"]),
        ing("Sides", ["Sweet potatoes", "Broccolini"]),
      ],
      directions: ["Blend marinade.", "Marinate overnight.", "Roast potatoes.", "Bake chicken.", "Roast broccolini.", "Serve."],
      chefTips: ["Longer marinating equals deeper flavor."],
    }),
    recipe({
      id: "poul-an-sos-diri-kole",
      name: "Poul an Sòs + Diri Kole",
      description:
        "One of Haiti's most beloved comfort meals. Citrus-marinated chicken is browned, simmered in a rich tomato gravy, and served alongside fragrant black bean rice. Deeply flavorful and perfect for family dinners.",
      cuisine: "Haitian",
      prepTime: "Overnight marinade",
      cookTime: "90 minutes",
      ingredients: [
        ing("Chicken", ["3 lbs chicken"]),
        ing("Epis", ["Bell pepper", "Garlic", "Parsley", "Thyme", "Green onions", "Scotch bonnet", "Lime juice"]),
        ing("Sauce", ["Tomato paste", "Onion", "Garlic", "Chicken broth"]),
        ing("Rice", ["Black beans", "Rice", "Thyme", "Cloves"]),
      ],
      directions: [
        "Marinate overnight.",
        "Brown chicken.",
        "Cook tomato paste.",
        "Add broth.",
        "Return chicken.",
        "Simmer until tender.",
        "Cook diri kole.",
        "Serve together.",
      ],
      chefTips: ["Never skip the overnight epis marinade."],
    }),
    recipe({
      id: "shrimp-hibachi",
      name: "Shrimp Hibachi",
      description: "Restaurant-style hibachi shrimp with buttery fried rice, sautéed vegetables, and homemade Yum Yum sauce.",
      prepTime: "15 minutes",
      cookTime: "20 minutes",
      ingredients: [
        ing("Shrimp", ["1½ lbs shrimp", "Butter", "Garlic", "Soy sauce"]),
        ing("Vegetables", ["Mushrooms", "Zucchini", "Carrots", "Onion"]),
        ing("Fried Rice", ["Day-old jasmine rice", "Eggs", "Soy sauce", "Sesame oil"]),
        ing("Yum Yum Sauce", ["Mayo", "Ketchup", "Rice vinegar", "Paprika", "Garlic powder"]),
      ],
      directions: ["Cook fried rice.", "Cook vegetables.", "Cook shrimp.", "Prepare Yum Yum sauce.", "Plate together."],
      chefTips: ["Day-old rice makes the best fried rice."],
    }),
    recipe({
      id: "sos-pwa-nwa-diri-blan",
      name: "Sòs Pwa Nwa + Diri Blan",
      description:
        "A traditional Haitian black bean sauce served over fluffy white rice. Rich, earthy, and comforting, this dish is a staple in Haitian households and pairs beautifully with avocado, boiled eggs, fried plantains, or fried fish.",
      cuisine: "Haitian",
      prepTime: "15 minutes",
      cookTime: "75 minutes",
      servings: "6",
      mealPrepFriendly: "Excellent",
      freezerFriendly: "Yes",
      ingredients: [
        ing("Bean Sauce", [
          "1 lb dried black beans",
          "8 cups water",
          "1 green bell pepper",
          "1 onion",
          "4 garlic cloves",
          "2 tbsp épis",
          "2 sprigs thyme",
          "1 Maggi cube",
          "Salt",
          "Black pepper",
        ]),
        ing("White Rice", ["3 cups jasmine rice", "5½ cups water", "1 tbsp butter"]),
      ],
      directions: [
        "Cook beans until tender.",
        "Reserve cooking liquid.",
        "Blend half the beans until smooth.",
        "Cook onion, garlic and épis.",
        "Add blended beans.",
        "Season.",
        "Simmer until creamy.",
        "Cook rice separately.",
        "Serve together.",
      ],
      chefTips: ["Leave some whole beans for texture."],
      tags: ["Haitian", "Comfort Food", "Meal Prep"],
    }),
    recipe({
      id: "sos-pwa-round-two",
      name: "Sòs Pwa Round Two",
      description: "Transform leftover black bean sauce into a completely different meal.",
      ingredients: [ing("", ["Leftover sòs pwa", "White rice", "Boiled eggs", "Avocado", "Hot sauce"])],
      directions: ["Warm rice.", "Reheat bean sauce.", "Slice boiled eggs.", "Serve with avocado."],
      mealPrepTips: "Perfect weekday lunch.",
    }),
    recipe({
      id: "spicy-chicken-sandwich-night",
      name: "Spicy Chicken Sandwich Night",
      description: "Extra crispy fried chicken layered on toasted brioche buns with homemade spicy mayo and pickles.",
      prepTime: "20 minutes",
      cookTime: "20 minutes",
      ingredients: [
        ing("Chicken", ["4 chicken breasts", "1 cup buttermilk", "Hot sauce"]),
        ing("Flour Mixture", ["Flour", "Paprika", "Garlic powder", "Onion powder", "Cayenne", "Salt"]),
        ing("Assembly", ["Brioche buns", "Pickles", "Lettuce", "Homemade spicy mayo"]),
      ],
      directions: ["Marinate chicken.", "Bread thoroughly.", "Fry until golden.", "Toast buns.", "Spread mayo.", "Assemble.", "Serve immediately."],
      chefTips: ["Double dredge for maximum crunch."],
    }),
    recipe({
      id: "steak-shrimp-finale",
      name: "Steak & Shrimp Finale",
      description:
        "Restaurant-style surf and turf featuring buttery garlic shrimp, perfectly cooked steak, creamy mashed potatoes and roasted asparagus.",
      prepTime: "20 minutes",
      cookTime: "30 minutes",
      ingredients: [
        ing("Steak", ["2 ribeye steaks"]),
        ing("Shrimp", ["1 lb shrimp", "Butter", "Garlic"]),
        ing("Sides", ["Yukon mashed potatoes", "Asparagus"]),
      ],
      directions: ["Cook steak.", "Rest.", "Prepare shrimp.", "Roast asparagus.", "Plate together."],
      tags: ["Date Night", "Special Occasion", "High Protein"],
    }),
    recipe({
      id: "steak-frites-date-night",
      name: "Steak Frites Date Night",
      description: "French-inspired steak frites finished with garlic herb butter and crispy parmesan fries.",
      ingredients: [
        ing("Steak", ["NY Strip"]),
        ing("Garlic Butter", ["Butter", "Garlic", "Fresh herbs"]),
        ing("Fries", ["Yukon potatoes", "Olive oil", "Parmesan"]),
      ],
      directions: ["Bake fries.", "Cook steak.", "Top with butter.", "Serve with arugula salad."],
      chefTips: ["Rest steak at least ten minutes before slicing."],
    }),
    recipe({
      id: "street-corn-beef-bowls",
      name: "Street Corn Beef Bowls",
      description: "Seasoned taco beef layered over cilantro lime rice with creamy Mexican street corn, avocado and pico de gallo.",
      prepTime: "15 minutes",
      cookTime: "25 minutes",
      ingredients: [
        ing("", [
          "Ground beef",
          "Taco seasoning",
          "Cilantro lime rice",
          "Corn",
          "Cotija cheese",
          "Mayo",
          "Greek yogurt",
          "Chili powder",
          "Lime",
          "Avocado",
          "Pico de gallo",
        ]),
      ],
      directions: ["Cook beef.", "Prepare rice.", "Mix street corn.", "Assemble bowls.", "Finish with avocado."],
    }),
    recipe({
      id: "street-corn-beef-bowls-round-two",
      name: "Street Corn Beef Bowls Round Two",
      description: "Turn leftover beef bowls into burritos, nachos or quesadillas for an easy second dinner.",
      leftoverIdeas: ["Burritos", "Loaded Nachos", "Quesadillas", "Stuffed Peppers", "Taco Salad"],
      chefTips: ["Add fresh avocado and cilantro to brighten leftovers."],
    }),
    recipe({
      id: "beef-plantain-spinach",
      name: "Beef, Plantain & Spinach",
      description: "A hearty Caribbean-inspired dinner combining seasoned ground beef, sweet fried plantains and sautéed spinach.",
      prepTime: "15 minutes",
      cookTime: "35 minutes",
      ingredients: [
        ing("", ["1 lb lean ground beef", "2 ripe plantains", "Baby spinach", "Onion", "Garlic", "Paprika", "Cumin", "Oregano"]),
      ],
      directions: ["Fry plantains.", "Brown beef.", "Season.", "Wilt spinach.", "Serve together."],
      suggestedPairings: ["Avocado", "Pikliz", "Black beans"],
      tags: ["Caribbean", "High Protein", "Comfort Food"],
    }),
    recipe({
      id: "buffalo-chicken-quesadillas",
      name: "Buffalo Chicken Quesadillas",
      description:
        "A quick way to reinvent leftover buffalo chicken into crispy golden quesadillas loaded with melted Monterey Jack and cheddar cheese. Perfect for weeknight dinners, game day, or easy lunches.",
      prepTime: "10 minutes",
      cookTime: "10 minutes",
      servings: "4",
      ingredients: [
        ing("", ["2 cups leftover buffalo chicken", "4 flour tortillas", "2 cups Monterey Jack cheese", "1 cup cheddar cheese", "Ranch dressing", "Green onions", "Butter"]),
      ],
      directions: [
        "Butter one side of each tortilla.",
        "Layer cheese.",
        "Add buffalo chicken.",
        "Top with more cheese.",
        "Fold closed.",
        "Cook over medium heat until golden brown.",
        "Flip.",
        "Serve with ranch.",
      ],
      storage: "3 days.",
      mealPrepTips: "Excellent.",
      leftoverIdeas: ["Cut into wedges for lunchboxes."],
      chefTips: ["Cook over medium heat to melt cheese before the tortilla burns."],
      tags: ["Quick", "Lunch", "Meal Prep"],
    }),
    recipe({
      id: "loaded-buffalo-chicken-potatoes",
      name: "Loaded Buffalo Chicken Potatoes",
      description: "Crispy baked potatoes stuffed with creamy buffalo chicken, cheddar cheese, ranch, green onions, and crispy bacon.",
      prepTime: "15 minutes",
      cookTime: "60 minutes",
      servings: "4",
      ingredients: [
        ing("", ["4 russet potatoes", "2 cups buffalo chicken", "1½ cups cheddar cheese", "Ranch dressing", "Green onions", "Bacon bits", "Sour cream"]),
      ],
      directions: ["Bake potatoes until tender.", "Split open.", "Fill with buffalo chicken.", "Top with cheese.", "Broil until melted.", "Finish with toppings."],
      chefTips: ["Rub potatoes with olive oil and salt before baking."],
    }),
    recipe({
      id: "chicken-fried-rice",
      name: "Chicken Fried Rice",
      description: "Classic takeout-style fried rice with juicy chicken, vegetables, fluffy rice and scrambled eggs.",
      prepTime: "15 minutes",
      cookTime: "20 minutes",
      servings: "4",
      ingredients: [
        ing("", ["2 chicken breasts", "4 cups day-old jasmine rice", "2 eggs", "Frozen peas", "Carrots", "Soy sauce", "Sesame oil", "Garlic", "Ginger", "Green onions"]),
      ],
      directions: ["Cook eggs.", "Remove.", "Cook chicken.", "Cook vegetables.", "Add rice.", "Return eggs.", "Season.", "Finish with sesame oil."],
      chefTips: ["Always use cold rice."],
    }),
    recipe({
      id: "chicken-fried-rice-leftover-version",
      name: "Chicken Fried Rice (Leftover Version)",
      description: "A fast weeknight recipe using leftover cooked chicken and day-old rice for an easy homemade fried rice.",
      prepTime: "10 minutes",
      cookTime: "15 minutes",
      ingredients: [ing("", ["Leftover cooked chicken", "Day-old rice", "Eggs", "Mixed vegetables", "Soy sauce", "Sesame oil", "Garlic"])],
      directions: ["Cook eggs.", "Cook vegetables.", "Add rice.", "Add chicken.", "Season.", "Serve immediately."],
      mealPrepTips: "Excellent freezer lunch.",
    }),
    recipe({
      id: "bang-bang-shrimp-bowls",
      name: "Bang Bang Shrimp Bowls",
      description: "Crispy shrimp tossed in creamy sweet-and-spicy Bang Bang sauce served over jasmine rice with fresh vegetables.",
      prepTime: "20 minutes",
      cookTime: "15 minutes",
      servings: "4",
      ingredients: [
        ing("Shrimp", ["1 lb shrimp", "Cornstarch", "Garlic powder", "Paprika", "Salt"]),
        ing("Sauce", ["½ cup mayonnaise", "¼ cup sweet chili sauce", "1 tbsp Sriracha", "Honey"]),
        ing("Bowls", ["Jasmine rice", "Cucumbers", "Carrots", "Avocado", "Edamame"]),
      ],
      directions: ["Coat shrimp.", "Air fry until crispy.", "Mix sauce.", "Toss shrimp.", "Serve over rice."],
      chefTips: ["Serve sauce separately for meal prep."],
    }),
    recipe({
      id: "greek-lemon-chicken-orzo",
      name: "Greek Lemon Chicken Orzo",
      description: "Tender lemon garlic chicken served over creamy orzo with spinach, feta cheese and fresh herbs.",
      prepTime: "15 minutes",
      cookTime: "30 minutes",
      servings: "4",
      ingredients: [ing("", ["Chicken breasts", "Orzo", "Chicken broth", "Garlic", "Lemon", "Spinach", "Parmesan", "Feta", "Parsley"])],
      directions: ["Sear chicken.", "Cook garlic.", "Toast orzo.", "Add broth.", "Finish with spinach.", "Return chicken.", "Add cheeses.", "Serve."],
      chefTips: ["Fresh lemon juice makes a huge difference."],
    }),
    recipe({
      id: "marry-me-chicken",
      name: "Marry Me Chicken",
      description:
        "Pan-seared chicken breasts simmered in a creamy garlic Parmesan sauce with sun-dried tomatoes. Rich, comforting, and worthy of a special dinner.",
      prepTime: "10 minutes",
      cookTime: "35 minutes",
      servings: "4",
      ingredients: [
        ing("", ["4 chicken breasts", "Butter", "Garlic", "Chicken broth", "Heavy cream", "Parmesan", "Sun-dried tomatoes", "Italian seasoning", "Basil"]),
      ],
      directions: ["Sear chicken.", "Remove.", "Prepare sauce.", "Return chicken.", "Simmer until fully cooked.", "Finish with basil."],
      suggestedPairings: ["Mashed potatoes", "Pasta", "Rice", "Roasted broccoli"],
      tags: ["Comfort Food", "Date Night", "Family Favorite"],
    }),
    recipe({
      id: "steak-salad",
      name: "Steak Salad",
      description: "Thinly sliced steak served over peppery arugula with tomatoes, cucumbers, blue cheese, pickled onions and balsamic vinaigrette.",
      prepTime: "15 minutes",
      cookTime: "10 minutes",
      servings: "2",
      ingredients: [ing("", ["Leftover steak", "Arugula", "Cherry tomatoes", "Cucumbers", "Pickled onions", "Blue cheese", "Balsamic vinaigrette"])],
      directions: ["Slice steak.", "Assemble salad.", "Dress lightly.", "Serve immediately."],
      chefTips: ["Bring steak to room temperature before serving."],
    }),
    recipe({
      id: "steak-breakfast-burritos",
      name: "Steak Breakfast Burritos",
      description:
        "A hearty breakfast burrito stuffed with sliced steak, scrambled eggs, potatoes, cheddar cheese and salsa. Great for freezer meal prep.",
      prepTime: "20 minutes",
      cookTime: "20 minutes",
      servings: "6 burritos",
      ingredients: [ing("", ["Leftover steak", "Eggs", "Breakfast potatoes", "Cheddar cheese", "Salsa", "Large flour tortillas"])],
      directions: ["Cook eggs.", "Warm steak.", "Cook potatoes.", "Assemble burritos.", "Toast lightly.", "Wrap individually for freezing."],
      freezerInstructions: "Freeze up to 3 months.",
      mealPrepTips: "Excellent make-ahead breakfast.",
      chefTips: ["Wrap each burrito tightly in foil before freezing."],
    }),
    recipe({
      id: "bouyon-bouillon-haitien",
      name: "Bouyon (Bouillon Haitien)",
      pronunciation: "Boo-Yon",
      description:
        "Bouyon is one of Haiti's ultimate comfort foods. Traditionally prepared on weekends or rainy days, this hearty soup combines slow-cooked beef with root vegetables, cabbage, plantains, and fresh herbs to create a rich, deeply flavorful broth. Every Haitian family prepares Bouyon a little differently, making it one of the country's most beloved meals.",
      cuisine: "Haitian",
      prepTime: "30 minutes",
      cookTime: "2½ hours",
      servings: "8",
      difficulty: "Intermediate",
      mealPrepFriendly: "Excellent",
      freezerFriendly: "Yes",
      ingredients: [
        ing("Meat", ["2 lbs beef stew meat", "1 lb beef bones (optional)"]),
        ing("Epis Marinade", [
          "1 green bell pepper",
          "1 bunch parsley",
          "5 scallions",
          "6 garlic cloves",
          "2 sprigs thyme",
          "Juice of 2 limes",
          "1 Scotch bonnet pepper",
          "Salt",
          "Black pepper",
        ]),
        ing("Vegetables", ["2 green plantains", "2 yams", "2 malanga", "2 carrots", "2 potatoes", "1 chayote", "½ cabbage", "Handful spinach"]),
        ing("Broth", ["10 cups beef broth", "2 tbsp tomato paste", "2 Maggi cubes"]),
      ],
      directions: [
        "Wash beef with lime.",
        "Marinate using épis for at least four hours.",
        "Brown beef until deeply caramelized.",
        "Cook tomato paste.",
        "Add broth.",
        "Simmer until beef becomes tender.",
        "Add hardest vegetables first.",
        "Finish with cabbage and spinach.",
        "Season to taste.",
        "Serve hot.",
      ],
      chefTips: ["Never rush Bouyon.", "The broth develops flavor through slow simmering."],
    }),
    recipe({
      id: "griot-pikliz",
      name: "Griot + Pikliz",
      pronunciation: "Gree-oh",
      description:
        "Perhaps Haiti's most famous celebration meal. Crispy marinated pork paired with spicy pickled cabbage known as Pikliz. Traditionally served with diri kole and fried plantains.",
      cuisine: "Haitian",
      prepTime: "Overnight",
      cookTime: "90 minutes",
      servings: "6",
      ingredients: [
        ing("Pork", ["3 lbs pork shoulder", "Lime", "Garlic", "Épis", "Onion", "Thyme", "Scotch bonnet", "Maggi"]),
        ing("Pikliz", ["½ cabbage", "2 carrots", "Onion", "Scotch bonnet peppers", "White vinegar", "Salt"]),
      ],
      directions: [
        "Wash pork with lime.",
        "Marinate overnight.",
        "Simmer until tender.",
        "Allow liquid to evaporate.",
        "Deep fry or air fry until crispy.",
        "Prepare Pikliz at least one day ahead.",
        "Serve together.",
      ],
      chefTips: ["Pikliz actually tastes better after two days."],
    }),
    recipe({
      id: "banan-peze",
      name: "Banan Peze",
      pronunciation: "Bah-Nahn Peh-Zeh",
      description:
        "Twice-fried green plantains that are crispy on the outside and fluffy inside. A classic side dish served alongside griot, fried fish, tassot, or simply enjoyed with Pikliz.",
      cuisine: "Haitian",
      prepTime: "10 minutes",
      cookTime: "15 minutes",
      ingredients: [ing("", ["2 green plantains", "Neutral frying oil", "Salt"])],
      directions: [
        "Peel plantains.",
        "Cut into thick rounds.",
        "Fry until lightly golden.",
        "Flatten using a plantain press.",
        "Fry again until crispy.",
        "Season immediately.",
      ],
      chefTips: ["Don't overcook during the first fry.", "The second fry creates the crunch."],
    }),
    recipe({
      id: "leftover-poul-an-sos",
      name: "Leftover Poul an Sòs",
      description: "Give leftover Haitian stewed chicken a second life with quick meals that taste completely different from the original dinner.",
      cuisine: "Haitian",
      leftoverIdeas: ["Rice Bowl", "Chicken Wrap", "Stuffed Plantains", "Haitian Chicken Pasta", "Haitian Chicken Pizza", "Chicken Melt"],
      directions: ["Use leftover chicken and sauce to build entirely new meals.", "Always warm the sauce separately before serving."],
      mealPrepTips: "Perfect for weekday lunches.",
    }),
    recipe({
      id: "diri-djon-djon-ak-kribich",
      name: "Diri Djon Djon ak Kribich",
      pronunciation: "Dee-Ree Jon-Jon",
      description:
        "One of Haiti's most luxurious rice dishes made with dried black mushrooms that naturally color the rice and create an earthy, unforgettable flavor. Finished with garlic butter shrimp for a modern twist.",
      cuisine: "Haitian",
      prepTime: "20 minutes",
      cookTime: "45 minutes",
      ingredients: [ing("", ["Dried Djon Djon mushrooms", "Jasmine rice", "Garlic", "Butter", "Large shrimp", "Thyme", "Cloves", "Scotch bonnet"])],
      directions: ["Steep mushrooms.", "Strain liquid.", "Cook rice using mushroom broth.", "Prepare garlic butter shrimp.", "Serve together."],
      chefTips: ["Never throw away the mushroom liquid.", "It is the flavor of the dish."],
    }),
    recipe({
      id: "pwason-fri",
      name: "Pwason Fri",
      pronunciation: "Pwah-Son Free",
      description:
        "Whole fried snapper marinated in épis, citrus, and herbs until deeply flavorful, then fried until crisp. Traditionally served with Pikliz and fried plantains.",
      cuisine: "Haitian",
      ingredients: [ing("", ["Whole snapper", "Lime", "Épis", "Garlic", "Parsley", "Flour", "Oil"])],
      directions: ["Clean fish.", "Marinate overnight.", "Pat completely dry.", "Fry until golden.", "Serve immediately."],
    }),
    recipe({
      id: "makawoni-o-graten",
      name: "Makawoni O Graten",
      pronunciation: "Mah-Kah-Woh-Nee Oh Grah-Ten",
      description: "The Haitian version of baked macaroni is rich, cheesy, creamy, and often served during holidays and family gatherings.",
      cuisine: "Haitian",
      ingredients: [ing("", ["Elbow macaroni", "Evaporated milk", "Butter", "Cheddar", "Parmesan", "Bell peppers", "Smoked sausage (optional)"])],
      directions: ["Cook pasta.", "Prepare cheese sauce.", "Mix together.", "Bake until bubbling and golden."],
      chefTips: ["Do not overcook the pasta before baking."],
    }),
  ];
}

// Version-gated so her own edits always win after the first load, same
// convention as every other seeded feature in this app - a wholesale
// reseed only happens if stored seedVersion is behind current.
export const COOKBOOK_SEED_VERSION = 1;

export function defaultCookbookData(): CookbookData {
  return { recipes: seedCookbookRecipes(), seedVersion: COOKBOOK_SEED_VERSION };
}

function normalizeIngredientGroup(raw: unknown): IngredientGroup | null {
  const g = raw as Partial<IngredientGroup> | null | undefined;
  if (!g || !Array.isArray(g.items)) return null;
  return { label: g.label ?? "", items: g.items.filter((i): i is string => typeof i === "string") };
}

export function normalizeCookbookRecipe(raw: Partial<CookbookRecipe> | null | undefined): CookbookRecipe | null {
  if (!raw?.id || !raw?.name) return null;
  const base = recipe({ id: raw.id, name: raw.name });
  return {
    ...base,
    ...raw,
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map(normalizeIngredientGroup).filter((g): g is IngredientGroup => g !== null)
      : base.ingredients,
    equipment: Array.isArray(raw.equipment) ? raw.equipment : base.equipment,
    directions: Array.isArray(raw.directions) ? raw.directions : base.directions,
    leftoverIdeas: Array.isArray(raw.leftoverIdeas) ? raw.leftoverIdeas : base.leftoverIdeas,
    shoppingList: Array.isArray(raw.shoppingList) ? raw.shoppingList : base.shoppingList,
    suggestedPairings: Array.isArray(raw.suggestedPairings) ? raw.suggestedPairings : base.suggestedPairings,
    chefTips: Array.isArray(raw.chefTips) ? raw.chefTips : base.chefTips,
    tags: Array.isArray(raw.tags) ? raw.tags : base.tags,
  };
}

export function normalizeCookbookData(partial: Partial<CookbookData> | null | undefined): CookbookData {
  if (!partial || (partial.seedVersion ?? 0) < COOKBOOK_SEED_VERSION) {
    return defaultCookbookData();
  }
  const recipes = Array.isArray(partial.recipes)
    ? partial.recipes.map(normalizeCookbookRecipe).filter((r): r is CookbookRecipe => r !== null)
    : seedCookbookRecipes();
  return { recipes, seedVersion: COOKBOOK_SEED_VERSION };
}

export function recipeByName(data: CookbookData, name: string): CookbookRecipe | undefined {
  const needle = name.trim().toLowerCase();
  return data.recipes.find((r) => r.name.toLowerCase() === needle);
}

export function recipeById(data: CookbookData, id: string): CookbookRecipe | undefined {
  return data.recipes.find((r) => r.id === id);
}
