import type { Category, Challenge, Creator, Ingredient, Nutrition, Post, Recipe, Review, Taste, Texture } from "./types";

// [name, category, emoji, taste "s=sweet,l=salty,o=sour,b=bitter,u=umami,f=fat,h=heat:0-5", textures, kcal,p,c,f,fiber,sugar,sodiumMg, allergens, tags]
type Row = [string, Category, string, string, Texture[], number, number, number, number, number, number, number, string[], string[]];
const V = ["vegan", "vegetarian", "gluten-free", "dairy-free"];
const VG = ["vegetarian", "gluten-free"];
const rows: Row[] = [
  ["Apple", "Fruits", "🍎", "s3,o2", ["crisp", "juicy"], 52, 0.3, 14, 0.2, 2.4, 10, 1, [], V],
  ["Banana", "Fruits", "🍌", "s4", ["soft", "creamy"], 89, 1.1, 23, 0.3, 2.6, 12, 1, [], V],
  ["Strawberry", "Fruits", "🍓", "s3,o2", ["juicy", "soft"], 32, 0.7, 8, 0.3, 2, 5, 1, [], V],
  ["Lemon", "Fruits", "🍋", "o5", ["juicy"], 29, 1.1, 9, 0.3, 2.8, 2.5, 2, [], V],
  ["Lime", "Fruits", "🍈", "o5", ["juicy"], 30, 0.7, 11, 0.2, 2.8, 1.7, 2, [], V],
  ["Orange", "Fruits", "🍊", "s3,o3", ["juicy"], 47, 0.9, 12, 0.1, 2.4, 9, 0, [], V],
  ["Mango", "Fruits", "🥭", "s5,o1", ["soft", "juicy"], 60, 0.8, 15, 0.4, 1.6, 14, 1, [], V],
  ["Pineapple", "Fruits", "🍍", "s4,o3", ["juicy"], 50, 0.5, 13, 0.1, 1.4, 10, 1, [], V],
  ["Blueberry", "Fruits", "🫐", "s3,o2", ["juicy", "soft"], 57, 0.7, 14, 0.3, 2.4, 10, 1, [], V],
  ["Avocado", "Fruits", "🥑", "f4", ["creamy", "soft"], 160, 2, 9, 15, 7, 0.7, 7, [], V],
  ["Peach", "Fruits", "🍑", "s4,o1", ["juicy", "soft"], 39, 0.9, 10, 0.3, 1.5, 8, 0, [], V],
  ["Tomato", "Vegetables", "🍅", "u2,o3,s1", ["juicy", "soft"], 18, 0.9, 3.9, 0.2, 1.2, 2.6, 5, [], V],
  ["Onion", "Vegetables", "🧅", "s2,h1", ["crisp"], 40, 1.1, 9, 0.1, 1.7, 4.2, 4, [], V],
  ["Garlic", "Vegetables", "🧄", "u2,h2", ["crisp"], 149, 6.4, 33, 0.5, 2.1, 1, 17, [], V],
  ["Potato", "Vegetables", "🥔", "s1", ["soft", "crisp"], 77, 2, 17, 0.1, 2.2, 0.8, 6, [], V],
  ["Sweet potato", "Vegetables", "🍠", "s4", ["soft", "creamy"], 86, 1.6, 20, 0.1, 3, 4.2, 55, [], V],
  ["Carrot", "Vegetables", "🥕", "s3", ["crisp"], 41, 0.9, 10, 0.2, 2.8, 4.7, 69, [], V],
  ["Broccoli", "Vegetables", "🥦", "b2", ["crisp", "soft"], 34, 2.8, 7, 0.4, 2.6, 1.7, 33, [], V],
  ["Spinach", "Vegetables", "🥬", "b2,u1", ["soft"], 23, 2.9, 3.6, 0.4, 2.2, 0.4, 79, [], V],
  ["Bell pepper", "Vegetables", "🫑", "s3", ["crisp", "juicy"], 31, 1, 6, 0.3, 2.1, 4.2, 4, [], V],
  ["Mushroom", "Vegetables", "🍄", "u4", ["chewy", "soft"], 22, 3.1, 3.3, 0.3, 1, 2, 5, [], V],
  ["Corn", "Vegetables", "🌽", "s3", ["crisp", "juicy"], 86, 3.3, 19, 1.4, 2, 6.3, 15, [], V],
  ["Cucumber", "Vegetables", "🥒", "o1", ["crisp", "juicy"], 15, 0.7, 3.6, 0.1, 0.5, 1.7, 2, [], V],
  ["Eggplant", "Vegetables", "🍆", "b2", ["soft", "creamy"], 25, 1, 6, 0.2, 3, 3.5, 2, [], V],
  ["Chili pepper", "Vegetables", "🌶️", "h5", ["crisp"], 40, 1.9, 9, 0.4, 1.5, 5, 9, [], V],
  ["Chicken breast", "Meats", "🍗", "u3", ["soft", "juicy"], 165, 31, 0, 3.6, 0, 0, 74, [], ["gluten-free", "dairy-free"]],
  ["Ground beef", "Meats", "🥩", "u4,f3", ["soft", "juicy"], 254, 17, 0, 20, 0, 0, 66, [], ["gluten-free", "dairy-free"]],
  ["Bacon", "Meats", "🥓", "l4,u3,f4", ["crisp", "chewy"], 541, 37, 1.4, 42, 0, 0, 1717, [], ["gluten-free", "dairy-free"]],
  ["Pork belly", "Meats", "🥩", "f5,u3", ["soft", "crisp"], 518, 9, 0, 53, 0, 0, 32, [], ["gluten-free", "dairy-free"]],
  ["Sausage", "Meats", "🌭", "l3,u3,f3", ["soft", "juicy"], 301, 12, 2, 27, 0, 1, 800, [], ["dairy-free"]],
  ["Lamb", "Meats", "🍖", "u4,f3", ["soft", "juicy"], 282, 17, 0, 23, 0, 0, 72, [], ["gluten-free", "dairy-free"]],
  ["Egg", "Dairy", "🥚", "u2,f2", ["soft", "creamy"], 143, 13, 0.7, 9.5, 0, 0.4, 142, ["egg"], VG],
  ["Salmon", "Seafood", "🐟", "u3,f3", ["soft", "juicy"], 208, 20, 0, 13, 0, 0, 59, ["fish"], ["gluten-free", "dairy-free"]],
  ["Shrimp", "Seafood", "🦐", "u3,s1", ["chewy", "juicy"], 99, 24, 0.2, 0.3, 0, 0, 111, ["shellfish"], ["gluten-free", "dairy-free"]],
  ["Tuna", "Seafood", "🐟", "u4,l1", ["soft"], 132, 28, 0, 1.3, 0, 0, 47, ["fish"], ["gluten-free", "dairy-free"]],
  ["Cod", "Seafood", "🐟", "u2", ["soft"], 82, 18, 0, 0.7, 0, 0, 54, ["fish"], ["gluten-free", "dairy-free"]],
  ["Scallop", "Seafood", "🦪", "s2,u3", ["soft", "creamy"], 88, 17, 2.4, 0.8, 0, 0, 392, ["shellfish"], ["gluten-free", "dairy-free"]],
  ["Milk", "Dairy", "🥛", "s1,f2", ["liquid", "creamy"], 61, 3.2, 4.8, 3.3, 0, 5, 43, ["milk"], VG],
  ["Butter", "Dairy", "🧈", "f5", ["creamy", "soft"], 717, 0.9, 0.1, 81, 0, 0.1, 11, ["milk"], VG],
  ["Heavy cream", "Dairy", "🥛", "f5", ["creamy", "liquid"], 340, 2.1, 2.8, 36, 0, 2.9, 38, ["milk"], VG],
  ["Greek yogurt", "Dairy", "🥛", "o3,f2", ["creamy"], 97, 9, 3.9, 5, 0, 3.6, 36, ["milk"], VG],
  ["Mozzarella", "Cheese", "🧀", "f3,l2", ["soft", "chewy"], 280, 28, 3, 17, 0, 1, 627, ["milk"], VG],
  ["Cheddar", "Cheese", "🧀", "l3,u3,f4", ["crumbly", "soft"], 403, 25, 1.3, 33, 0, 0.5, 621, ["milk"], VG],
  ["Parmesan", "Cheese", "🧀", "l4,u5", ["crumbly"], 431, 38, 4.1, 29, 0, 0.9, 1529, ["milk"], VG],
  ["Feta", "Cheese", "🧀", "l4,o2", ["crumbly", "creamy"], 264, 14, 4, 21, 0, 4, 917, ["milk"], VG],
  ["Goat cheese", "Cheese", "🧀", "o2,l2,f3", ["creamy", "crumbly"], 364, 22, 0.1, 30, 0, 0.1, 515, ["milk"], VG],
  ["Rice", "Grains", "🍚", "s1", ["soft", "chewy"], 130, 2.7, 28, 0.3, 0.4, 0, 1, [], V],
  ["Oats", "Grains", "🌾", "s1", ["chewy", "soft"], 389, 17, 66, 7, 11, 1, 2, ["gluten (cross-contact)"], ["vegan", "vegetarian"]],
  ["Quinoa", "Grains", "🌾", "b1", ["chewy"], 120, 4.4, 21, 1.9, 2.8, 0.9, 7, [], V],
  ["Bread", "Grains", "🍞", "s1,l1", ["soft", "crisp"], 265, 9, 49, 3.2, 2.7, 5, 491, ["wheat", "gluten"], ["vegetarian"]],
  ["Tortilla", "Grains", "🫓", "l1", ["soft", "chewy"], 218, 6, 36, 5, 2, 2, 600, ["wheat", "gluten"], ["vegetarian"]],
  ["Couscous", "Grains", "🌾", "s1", ["soft"], 112, 3.8, 23, 0.2, 1.4, 0.1, 5, ["wheat", "gluten"], ["vegan", "vegetarian"]],
  ["Spaghetti", "Pasta", "🍝", "s1", ["chewy", "soft"], 158, 5.8, 31, 0.9, 1.8, 0.6, 1, ["wheat", "gluten"], ["vegan", "vegetarian"]],
  ["Penne", "Pasta", "🍝", "s1", ["chewy"], 158, 5.8, 31, 0.9, 1.8, 0.6, 1, ["wheat", "gluten"], ["vegan", "vegetarian"]],
  ["Ramen noodles", "Pasta", "🍜", "l1", ["chewy", "soft"], 138, 4.5, 25, 2, 1.2, 0.5, 400, ["wheat", "gluten"], ["vegan", "vegetarian"]],
  ["Rice noodles", "Pasta", "🍜", "s1", ["soft", "chewy"], 109, 0.9, 25, 0.2, 1, 0, 5, [], V],
  ["Tomato sauce", "Sauces", "🥫", "o3,s2,u2", ["liquid"], 29, 1.3, 6, 0.2, 1.5, 4, 400, [], V],
  ["Soy sauce", "Sauces", "🍶", "l5,u5", ["liquid"], 53, 8, 5, 0.6, 0.8, 0.4, 5493, ["soy", "wheat", "gluten"], ["vegan", "vegetarian"]],
  ["Pesto", "Sauces", "🌿", "u3,f4,l2", ["creamy"], 387, 4, 5, 39, 1, 1, 700, ["tree nuts", "milk"], ["vegetarian"]],
  ["Hot sauce", "Sauces", "🌶️", "h5,o3,l2", ["liquid"], 11, 0.5, 2, 0.1, 0.5, 1, 1000, [], V],
  ["Honey", "Sauces", "🍯", "s5", ["liquid"], 304, 0.3, 82, 0, 0.2, 82, 4, [], ["vegetarian", "gluten-free", "dairy-free"]],
  ["Maple syrup", "Sauces", "🍁", "s5", ["liquid"], 260, 0, 67, 0, 0, 60, 12, [], V],
  ["Mayonnaise", "Sauces", "🥫", "f5,o1", ["creamy"], 680, 1, 0.6, 75, 0, 0.6, 635, ["egg"], VG],
  ["Peanut butter", "Sauces", "🥜", "f4,l1,s1", ["creamy"], 588, 25, 20, 50, 6, 9, 17, ["peanuts"], V],
  ["Olive oil", "Sauces", "🫒", "f5", ["liquid"], 884, 0, 0, 100, 0, 0, 2, [], V],
  ["Salt", "Spices", "🧂", "l5", ["crumbly"], 0, 0, 0, 0, 0, 0, 38758, [], V],
  ["Black pepper", "Spices", "🌶️", "h2,b1", ["crumbly"], 251, 10, 64, 3.3, 25, 0.6, 20, [], V],
  ["Cinnamon", "Spices", "🪵", "s2,h1,b1", ["crumbly"], 247, 4, 81, 1.2, 53, 2, 10, [], V],
  ["Cumin", "Spices", "🌿", "b2,h1,u1", ["crumbly"], 375, 18, 44, 22, 11, 2.3, 168, [], V],
  ["Paprika", "Spices", "🌶️", "s1,h2", ["crumbly"], 282, 14, 54, 13, 35, 10, 68, [], V],
  ["Basil", "Spices", "🌿", "s1,b1", ["soft"], 23, 3.2, 2.7, 0.6, 1.6, 0.3, 4, [], V],
  ["Cilantro", "Spices", "🌿", "o1,b1", ["soft"], 23, 2.1, 3.7, 0.5, 2.8, 0.9, 46, [], V],
  ["Ginger", "Spices", "🫚", "h3,s1", ["crisp"], 80, 1.8, 18, 0.8, 2, 1.7, 13, [], V],
  ["Vanilla", "Spices", "🌼", "s3", ["liquid"], 288, 0.1, 13, 0.1, 0, 12.7, 9, [], V],
  ["Potato chips", "Snacks", "🥔", "l4,f3", ["crisp"], 536, 7, 53, 35, 4.8, 0.3, 525, [], V],
  ["Popcorn", "Snacks", "🍿", "l2,s1", ["crisp"], 375, 11, 74, 4.5, 15, 0.9, 8, [], V],
  ["Peanuts", "Snacks", "🥜", "f3,l1", ["crisp", "crumbly"], 567, 26, 16, 49, 8.5, 4.7, 18, ["peanuts"], V],
  ["Almonds", "Snacks", "🌰", "f3,s1", ["crisp"], 579, 21, 22, 50, 12, 4.4, 1, ["tree nuts"], V],
  ["Pretzels", "Snacks", "🥨", "l4", ["crisp"], 380, 10, 80, 3, 3, 3, 1300, ["wheat", "gluten"], ["vegan", "vegetarian"]],
  ["Dark chocolate", "Desserts", "🍫", "s3,b4,f3", ["crumbly", "creamy"], 546, 5, 61, 31, 7, 48, 20, ["milk (trace)"], ["vegetarian", "gluten-free"]],
  ["Ice cream", "Desserts", "🍨", "s4,f3", ["creamy"], 207, 3.5, 24, 11, 0.7, 21, 80, ["milk"], VG],
  ["Marshmallow", "Desserts", "🍡", "s5", ["soft", "chewy"], 318, 1.8, 81, 0.2, 0.1, 58, 80, [], VG],
  ["Caramel", "Desserts", "🍮", "s5,f2", ["creamy", "chewy"], 382, 4, 77, 8, 0, 70, 250, ["milk"], VG],
  ["Cookie", "Desserts", "🍪", "s4,f3", ["crumbly", "crisp"], 502, 5.9, 64, 25, 2.4, 36, 400, ["wheat", "gluten", "egg", "milk"], ["vegetarian"]],
  ["Coffee", "Drinks", "☕", "b4", ["liquid"], 1, 0.1, 0, 0, 0, 0, 5, [], V],
  ["Green tea", "Drinks", "🍵", "b2", ["liquid"], 1, 0, 0.2, 0, 0, 0, 1, [], V],
  ["Coconut milk", "Drinks", "🥥", "f4,s2", ["liquid", "creamy"], 197, 2, 3, 21, 0, 3, 13, [], V],
  ["Sparkling water", "Drinks", "💧", "o1", ["liquid"], 0, 0, 0, 0, 0, 0, 5, [], V],
  ["Flour", "Baking", "🌾", "s1", ["crumbly"], 364, 10, 76, 1, 2.7, 0.3, 2, ["wheat", "gluten"], ["vegan", "vegetarian"]],
  ["Sugar", "Baking", "🍬", "s5", ["crumbly"], 387, 0, 100, 0, 0, 100, 1, [], V],
  ["Brown sugar", "Baking", "🍬", "s5", ["crumbly", "soft"], 380, 0, 98, 0, 0, 97, 28, [], V],
  ["Baking powder", "Baking", "🥄", "b1,l1", ["crumbly"], 53, 0, 28, 0, 0.2, 0, 10600, [], V],
  ["Cocoa powder", "Baking", "🍫", "b4", ["crumbly"], 228, 20, 58, 14, 33, 1.8, 21, [], V],
  ["Yeast", "Baking", "🥄", "u1", ["crumbly"], 325, 40, 41, 7, 27, 0, 51, [], V],
  ["Tofu", "Other", "🧈", "u1", ["soft", "creamy"], 76, 8, 1.9, 4.8, 0.3, 0.6, 7, ["soy"], V],
  ["Chickpeas", "Other", "🫘", "u1,f1", ["soft", "crumbly"], 164, 8.9, 27, 2.6, 7.6, 4.8, 7, [], V],
  ["Black beans", "Other", "🫘", "u2", ["soft"], 132, 8.9, 24, 0.5, 8.7, 0.3, 1, [], V],
  ["Lentils", "Other", "🫘", "u2,b1", ["soft"], 116, 9, 20, 0.4, 7.9, 1.8, 2, [], V],
  // ---- expanded database ----
  ["Grapes", "Fruits", "🍇", "s4,o1", ["juicy", "crisp"], 69, 0.7, 18, 0.2, 0.9, 16, 2, [], V],
  ["Watermelon", "Fruits", "🍉", "s3", ["juicy", "crisp"], 30, 0.6, 8, 0.2, 0.4, 6, 1, [], V],
  ["Pear", "Fruits", "🍐", "s3", ["juicy", "soft"], 57, 0.4, 15, 0.1, 3.1, 10, 1, [], V],
  ["Cherry", "Fruits", "🍒", "s3,o2", ["juicy"], 63, 1, 16, 0.2, 2.1, 13, 0, [], V],
  ["Raspberry", "Fruits", "🍓", "s2,o3", ["juicy", "soft"], 52, 1.2, 12, 0.7, 6.5, 4.4, 1, [], V],
  ["Kiwi", "Fruits", "🥝", "s3,o3", ["juicy", "soft"], 61, 1.1, 15, 0.5, 3, 9, 3, [], V],
  ["Coconut", "Fruits", "🥥", "s2,f3", ["crumbly", "chewy"], 354, 3.3, 15, 33, 9, 6, 20, [], V],
  ["Pomegranate", "Fruits", "🍎", "s3,o3", ["juicy", "crisp"], 83, 1.7, 19, 1.2, 4, 14, 3, [], V],
  ["Fig", "Fruits", "🍈", "s5", ["soft", "chewy"], 74, 0.8, 19, 0.3, 2.9, 16, 1, [], V],
  ["Dates", "Fruits", "🌴", "s5", ["chewy", "soft"], 282, 2.5, 75, 0.4, 8, 63, 2, [], V],
  ["Grapefruit", "Fruits", "🍊", "o4,b2,s2", ["juicy"], 42, 0.8, 11, 0.1, 1.6, 7, 0, [], V],
  ["Papaya", "Fruits", "🍈", "s4", ["soft", "juicy"], 43, 0.5, 11, 0.3, 1.7, 8, 8, [], V],
  ["Zucchini", "Vegetables", "🥒", "s1", ["soft", "juicy"], 17, 1.2, 3.1, 0.3, 1, 2.5, 8, [], V],
  ["Cauliflower", "Vegetables", "🥦", "b1", ["crisp", "soft"], 25, 1.9, 5, 0.3, 2, 1.9, 30, [], V],
  ["Cabbage", "Vegetables", "🥬", "b1,s1", ["crisp"], 25, 1.3, 6, 0.1, 2.5, 3.2, 18, [], V],
  ["Kale", "Vegetables", "🥬", "b3", ["crisp", "chewy"], 49, 4.3, 9, 0.9, 3.6, 2.3, 38, [], V],
  ["Pumpkin", "Vegetables", "🎃", "s3", ["soft"], 26, 1, 6.5, 0.1, 0.5, 2.8, 1, [], V],
  ["Beetroot", "Vegetables", "🥕", "s4", ["soft", "crisp"], 43, 1.6, 10, 0.2, 2.8, 6.8, 78, [], V],
  ["Asparagus", "Vegetables", "🥬", "b2", ["crisp"], 20, 2.2, 3.9, 0.1, 2.1, 1.9, 2, [], V],
  ["Green beans", "Vegetables", "🫛", "b1", ["crisp"], 31, 1.8, 7, 0.2, 2.7, 3.3, 6, [], V],
  ["Peas", "Vegetables", "🫛", "s3", ["soft"], 81, 5.4, 14, 0.4, 5.7, 5.7, 5, [], V],
  ["Celery", "Vegetables", "🥬", "b1", ["crisp", "juicy"], 14, 0.7, 3, 0.2, 1.6, 1.3, 80, [], V],
  ["Leek", "Vegetables", "🧅", "s2", ["soft"], 61, 1.5, 14, 0.3, 1.8, 3.9, 20, [], V],
  ["Green onion", "Vegetables", "🧅", "h1,s1", ["crisp"], 32, 1.8, 7, 0.2, 2.6, 2.3, 16, [], V],
  ["Jalapeno", "Vegetables", "🌶️", "h4", ["crisp"], 29, 0.9, 6.5, 0.4, 2.8, 4.1, 3, [], V],
  ["Kimchi", "Vegetables", "🥬", "o3,h2,u2,l2", ["crisp"], 15, 1.1, 2.4, 0.5, 1.6, 1, 498, ["fish"], ["gluten-free", "dairy-free"]],
  ["Turkey breast", "Meats", "🦃", "u2", ["soft"], 135, 30, 0, 0.7, 0, 0, 55, [], ["gluten-free", "dairy-free"]],
  ["Chicken thigh", "Meats", "🍗", "u3,f2", ["juicy", "soft"], 209, 26, 0, 11, 0, 0, 95, [], ["gluten-free", "dairy-free"]],
  ["Beef steak", "Meats", "🥩", "u4,f2", ["juicy", "chewy"], 217, 26, 0, 12, 0, 0, 55, [], ["gluten-free", "dairy-free"]],
  ["Pork chop", "Meats", "🥩", "u3,f2", ["juicy"], 231, 25, 0, 14, 0, 0, 62, [], ["gluten-free", "dairy-free"]],
  ["Ham", "Meats", "🍖", "l4,u3", ["soft"], 145, 21, 1.5, 6, 0, 1, 1200, [], ["gluten-free", "dairy-free"]],
  ["Tilapia", "Seafood", "🐟", "u1", ["soft"], 96, 20, 0, 1.7, 0, 0, 52, ["fish"], ["gluten-free", "dairy-free"]],
  ["Crab", "Seafood", "🦀", "s1,u3", ["soft"], 87, 18, 0, 1.1, 0, 0, 293, ["shellfish"], ["gluten-free", "dairy-free"]],
  ["Sardines", "Seafood", "🐟", "u4,l2,f2", ["soft"], 208, 25, 0, 11, 0, 0, 307, ["fish"], ["gluten-free", "dairy-free"]],
  ["Cream cheese", "Dairy", "🧀", "f3,o1", ["creamy"], 342, 6, 4, 34, 0, 3.2, 321, ["milk"], VG],
  ["Sour cream", "Dairy", "🥛", "o2,f3", ["creamy"], 198, 2.4, 4.6, 19, 0, 3.4, 80, ["milk"], VG],
  ["Ricotta", "Cheese", "🧀", "f2,s1", ["creamy", "crumbly"], 174, 11, 3, 13, 0, 0.3, 84, ["milk"], VG],
  ["Gouda", "Cheese", "🧀", "f3,l2,u2", ["creamy"], 356, 25, 2.2, 27, 0, 2.2, 819, ["milk"], VG],
  ["Swiss cheese", "Cheese", "🧀", "f3,s1", ["soft"], 380, 27, 5, 28, 0, 1.4, 192, ["milk"], VG],
  ["Brown rice", "Grains", "🍚", "s1", ["chewy"], 123, 2.7, 26, 1, 1.8, 0.4, 4, [], V],
  ["Barley", "Grains", "🌾", "s1", ["chewy"], 123, 2.3, 28, 0.4, 3.8, 0.3, 3, ["wheat"], ["vegan", "vegetarian", "dairy-free"]],
  ["Cornmeal", "Grains", "🌽", "s1", ["crumbly"], 362, 8.1, 77, 3.6, 7.3, 1.6, 35, [], V],
  ["Bulgur", "Grains", "🌾", "s1", ["chewy"], 83, 3.1, 19, 0.2, 4.5, 0.1, 5, ["wheat"], ["vegan", "vegetarian", "dairy-free"]],
  ["Naan", "Grains", "🫓", "s1,f1", ["soft", "chewy"], 290, 9, 50, 5.5, 2, 3, 520, ["wheat", "milk"], ["vegetarian"]],
  ["Lasagna sheets", "Pasta", "🍝", "s1", ["soft"], 131, 5, 25, 1.1, 1.8, 0.6, 6, ["wheat", "egg"], ["vegetarian", "dairy-free"]],
  ["Macaroni", "Pasta", "🍝", "s1", ["soft"], 131, 5, 25, 1.1, 1.8, 0.6, 6, ["wheat"], ["vegan", "vegetarian", "dairy-free"]],
  ["Udon noodles", "Pasta", "🍜", "s1", ["chewy", "soft"], 127, 4.3, 26, 0.5, 1, 0.6, 5, ["wheat"], ["vegan", "vegetarian", "dairy-free"]],
  ["Barbecue sauce", "Sauces", "🍖", "s4,o2,l2,h1", ["liquid"], 172, 0.8, 41, 0.6, 0.9, 33, 1027, [], V],
  ["Mustard", "Sauces", "🌭", "o3,h2", ["liquid"], 66, 4.4, 5.8, 4, 4, 0.9, 1135, ["mustard"], V],
  ["Ketchup", "Sauces", "🍅", "s4,o3,l2", ["liquid"], 101, 1, 27, 0.1, 0.3, 22, 907, [], V],
  ["Worcestershire sauce", "Sauces", "🍶", "u4,l3,o2", ["liquid"], 78, 0, 19.5, 0, 0, 10, 980, ["fish"], ["dairy-free"]],
  ["Fish sauce", "Sauces", "🍶", "u5,l5", ["liquid"], 35, 5, 3.6, 0, 0, 3.6, 7851, ["fish"], ["dairy-free", "gluten-free"]],
  ["Sriracha", "Sauces", "🌶️", "h4,s2,o2", ["liquid"], 93, 1.9, 19, 0.9, 2.2, 15, 2124, [], V],
  ["Balsamic vinegar", "Sauces", "🍶", "o4,s3", ["liquid"], 88, 0.5, 17, 0, 0, 15, 23, [], V],
  ["Tahini", "Sauces", "🥜", "f4,b2", ["creamy"], 595, 17, 21, 54, 9, 0.5, 115, ["sesame"], V],
  ["Hummus", "Sauces", "🫘", "f2,u1", ["creamy"], 166, 8, 14, 10, 6, 0.3, 379, ["sesame"], V],
  ["Salsa", "Sauces", "🍅", "o3,h2", ["juicy"], 36, 1.5, 7, 0.2, 1.9, 4, 430, [], V],
  ["Vegetable stock", "Sauces", "🍲", "u2,l2", ["liquid"], 5, 0.2, 1, 0, 0, 0.5, 300, [], V],
  ["Miso", "International", "🍲", "u5,l4", ["creamy"], 199, 12, 26, 6, 5.4, 6, 3728, ["soy"], V],
  ["Garlic powder", "Spices", "🧄", "h1,u2", ["crumbly"], 331, 17, 73, 0.7, 9, 2.4, 60, [], V],
  ["Oregano", "Spices", "🌿", "b1,h1", ["crumbly"], 265, 9, 69, 4.3, 43, 4.1, 25, [], V],
  ["Chili powder", "Spices", "🌶️", "h4", ["crumbly"], 282, 13, 50, 14, 35, 7, 1640, [], V],
  ["Turmeric", "Spices", "🧡", "b2", ["crumbly"], 312, 9.7, 67, 3.3, 22, 3.2, 38, [], V],
  ["Nutmeg", "Spices", "🌰", "s1,b1", ["crumbly"], 525, 5.8, 49, 36, 21, 3, 16, [], V],
  ["Rosemary", "Spices", "🌿", "b2", ["crisp"], 131, 3.3, 21, 5.9, 14, 0, 26, [], V],
  ["Thyme", "Spices", "🌿", "b1", ["crisp"], 101, 5.6, 24, 1.7, 14, 0, 9, [], V],
  ["Coriander seed", "Spices", "🌿", "s1,b1", ["crumbly"], 298, 12, 55, 18, 42, 0, 35, [], V],
  ["Cardamom", "Spices", "🌿", "s2,b1", ["crumbly"], 311, 11, 68, 6.7, 28, 0, 18, [], V],
  ["Garam masala", "Spices", "🌶️", "h2,b1", ["crumbly"], 379, 14, 55, 15, 33, 0, 60, [], V],
  ["Mint", "Spices", "🌿", "s1,o1", ["crisp"], 70, 3.8, 15, 0.9, 8, 0, 31, [], V],
  ["Parsley", "Spices", "🌿", "b1", ["crisp"], 36, 3, 6.3, 0.8, 3.3, 0.9, 56, [], V],
  ["Walnuts", "Nuts & Seeds", "🥜", "f3,b2", ["crisp", "crumbly"], 654, 15, 14, 65, 6.7, 2.6, 2, ["tree nuts"], V],
  ["Cashews", "Nuts & Seeds", "🥜", "f3,s2", ["crisp", "creamy"], 553, 18, 30, 44, 3.3, 5.9, 12, ["tree nuts"], V],
  ["Pistachios", "Nuts & Seeds", "🥜", "f3,s1", ["crisp"], 560, 20, 28, 45, 10, 7.7, 1, ["tree nuts"], V],
  ["Pecans", "Nuts & Seeds", "🥜", "f4,s1", ["crisp"], 691, 9, 14, 72, 9.6, 4, 0, ["tree nuts"], V],
  ["Pine nuts", "Nuts & Seeds", "🥜", "f4", ["soft", "crisp"], 673, 14, 13, 68, 3.7, 3.6, 2, ["tree nuts"], V],
  ["Sunflower seeds", "Nuts & Seeds", "🌻", "f3", ["crisp"], 584, 21, 20, 51, 8.6, 2.6, 9, [], V],
  ["Pumpkin seeds", "Nuts & Seeds", "🎃", "f3", ["crisp"], 559, 30, 11, 49, 6, 1.4, 7, [], V],
  ["Sesame seeds", "Nuts & Seeds", "🌱", "f3,b1", ["crisp"], 573, 18, 23, 50, 12, 0.3, 11, ["sesame"], V],
  ["Chia seeds", "Nuts & Seeds", "🌱", "f1", ["chewy"], 486, 17, 42, 31, 34, 0, 16, [], V],
  ["Flaxseed", "Nuts & Seeds", "🌱", "f2", ["crumbly"], 534, 18, 29, 42, 27, 1.6, 30, [], V],
  ["Cheesecake", "Desserts", "🍰", "s4,f4", ["creamy"], 321, 5.5, 26, 23, 0.4, 22, 438, ["milk", "egg", "wheat"], ["vegetarian"]],
  ["Brownie", "Desserts", "🍫", "s5,f3,b1", ["soft", "chewy"], 466, 5.7, 55, 26, 2.8, 36, 255, ["wheat", "egg", "milk"], ["vegetarian"]],
  ["Whipped cream", "Desserts", "🍦", "s2,f4", ["creamy"], 257, 2.1, 12, 22, 0, 12, 40, ["milk"], VG],
  ["Sprinkles", "Desserts", "🎉", "s5", ["crisp"], 400, 0, 95, 5, 0, 80, 40, [], V],
  ["Granola", "Snacks", "🥣", "s3,f2", ["crisp", "chewy"], 471, 10, 64, 20, 5.3, 25, 26, ["tree nuts"], ["vegetarian"]],
  ["Tortilla chips", "Snacks", "🌮", "l3,s1", ["crisp"], 489, 7, 63, 23, 5, 1, 400, [], V],
  ["Crackers", "Snacks", "🍘", "l2", ["crisp"], 421, 9, 71, 11, 3, 3, 790, ["wheat"], ["vegan", "vegetarian", "dairy-free"]],
  ["Rice cakes", "Snacks", "🍘", "s1", ["crisp"], 387, 8, 81, 2.8, 4, 0.8, 29, [], V],
  ["Orange juice", "Drinks", "🧃", "s4,o3", ["liquid"], 45, 0.7, 10, 0.2, 0.2, 8.4, 1, [], V],
  ["Almond milk", "Drinks", "🥛", "s1,f1", ["liquid"], 15, 0.6, 0.3, 1.2, 0.2, 0, 72, ["tree nuts"], V],
  ["Oat milk", "Drinks", "🥛", "s2", ["liquid"], 43, 1, 7, 1.5, 0.8, 4, 40, ["wheat"], ["vegan", "vegetarian", "dairy-free"]],
  ["Red wine", "Drinks", "🍷", "b2,o2", ["liquid"], 85, 0.1, 2.6, 0, 0, 0.6, 4, [], V],
  ["Vanilla extract", "Baking", "🌼", "s3", ["liquid"], 288, 0.1, 13, 0.1, 0, 13, 9, [], V],
  ["Baking soda", "Baking", "🥄", "b2,l2", ["crumbly"], 0, 0, 0, 0, 0, 0, 27360, [], V],
  ["Cornstarch", "Baking", "🥄", "", ["crumbly"], 381, 0.3, 91, 0.1, 0.9, 0, 9, [], V],
  ["Powdered sugar", "Baking", "🍬", "s5", ["crumbly"], 389, 0, 100, 0, 0, 97, 2, [], V],
  ["Chocolate chips", "Baking", "🍫", "s4,b2,f3", ["crumbly"], 479, 4.2, 63, 30, 5.9, 51, 24, ["milk", "soy"], ["vegetarian", "gluten-free"]],
  ["Gelatin", "Baking", "🥄", "", ["chewy"], 335, 86, 0, 0, 0, 0, 196, [], ["gluten-free", "dairy-free"]],
  ["Coconut oil", "Baking", "🥥", "f5", ["liquid"], 862, 0, 0, 100, 0, 0, 0, [], V],
  ["Kimchi paste (gochujang)", "International", "🌶️", "h3,s2,u3", ["creamy"], 190, 4, 40, 1.5, 3, 20, 2200, ["soy", "wheat"], ["vegan", "vegetarian", "dairy-free"]],
  ["Paneer", "International", "🧀", "f3,s1", ["crumbly", "soft"], 321, 18, 3.6, 25, 0, 2.6, 22, ["milk"], VG],
  ["Tamarind paste", "International", "🍯", "o5,s3", ["creamy"], 239, 2.8, 63, 0.6, 5.1, 57, 28, [], V],
  ["Coconut cream", "International", "🥥", "f5,s1", ["creamy"], 330, 3.6, 6.7, 34, 2.2, 3.3, 13, [], V],
  ["Harissa", "International", "🌶️", "h4,u1", ["creamy"], 82, 3.5, 11, 3.2, 5, 5, 1100, [], V],
  ["Plantain", "International", "🍌", "s2", ["soft", "chewy"], 122, 1.3, 32, 0.4, 2.3, 15, 4, [], V],
  ["Wonton wrappers", "International", "🥟", "s1", ["soft", "chewy"], 290, 9, 58, 1.5, 2, 1.5, 560, ["wheat", "egg"], ["vegetarian", "dairy-free"]],
  ["Nori", "International", "🌊", "u4,l2", ["crisp"], 35, 5.8, 5.1, 0.3, 0.3, 0.5, 48, [], V],
  ["Lemongrass", "International", "🌿", "o2,s1", ["crisp"], 99, 1.8, 25, 0.5, 0, 0, 6, [], V],
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const parseTaste = (s: string): Partial<Record<Taste, number>> => {
  const map: Record<string, Taste> = { s: "sweet", l: "salty", o: "sour", b: "bitter", u: "umami", f: "fat", h: "heat" };
  const out: Partial<Record<Taste, number>> = {};
  s.split(",").forEach((p) => { if (p) out[map[p[0]]] = Number(p.slice(1)); });
  return out;
};

export const INGREDIENTS: Ingredient[] = rows.map((r) => {
  const [name, category, emoji, taste, textures, calories, protein, carbs, fat, fiber, sugar, sodium, allergens, tags] = r;
  const t = parseTaste(taste);
  const dominant = Object.entries(t).sort((a, b) => b[1] - a[1]).map((e) => e[0]).slice(0, 2).join(" and ") || "mild";
  return {
    id: slug(name), name, category, emoji, taste: t, textures, allergens, tags,
    per100g: { calories, protein, carbs, fat, fiber, sugar, sodium },
    description: `${name} is a ${category.toLowerCase().replace(/s$/, "")} ingredient with a mostly ${dominant} character and ${textures.join(", ")} texture.`,
    uses: usesFor(category),
    storage: storageFor(category),
    substitutes: subsFor(name, category),
  };
});

function usesFor(c: Category): string[] {
  const m: Record<string, string[]> = {
    Fruits: ["Fresh eating", "Desserts", "Smoothies", "Salads"], Vegetables: ["Roasting", "Soups", "Stir-fries", "Salads"],
    Meats: ["Grilling", "Braising", "Pan-searing"], Seafood: ["Pan-searing", "Baking", "Chowders"],
    Dairy: ["Baking", "Sauces", "Breakfast"], Cheese: ["Melting", "Topping", "Cheese boards"],
    Grains: ["Bowls", "Sides", "Baking"], Pasta: ["Pasta dishes", "Soups", "Bakes"],
    Sauces: ["Finishing", "Marinades", "Dressings"], Spices: ["Seasoning", "Rubs", "Finishing"],
    Snacks: ["Toppings", "Crunch", "Snacking"], "Nuts & Seeds": ["Toppings", "Baking", "Snacking", "Sauces"], International: ["Authentic regional dishes", "Marinades", "Stews"], Desserts: ["Sweet toppings", "Baking", "Sundaes"],
    Drinks: ["Beverages", "Marinades", "Baking"], Baking: ["Cakes", "Cookies", "Bread"], Other: ["Bowls", "Curries", "Salads"],
  };
  return m[c] ?? ["Cooking"];
}
function storageFor(c: Category) {
  const m: Record<string, string> = {
    Fruits: "Ripen on the counter, then refrigerate. Use within a few days.", Vegetables: "Refrigerate in the crisper; keep alliums and potatoes cool and dark.",
    Meats: "Keep refrigerated at or below 4°C and cook within 1–2 days, or freeze.", Seafood: "Keep very cold and cook within a day of purchase, or freeze.",
    Dairy: "Refrigerate and follow the use-by date.", Cheese: "Wrap well and refrigerate; hard cheeses keep longest.",
    Grains: "Store dry in an airtight container.", Pasta: "Store dry in a cool pantry.", Sauces: "Refrigerate after opening unless the label says otherwise.",
    Spices: "Keep airtight, away from heat and light.", Snacks: "Keep sealed in a cool, dry place.", "Nuts & Seeds": "Keep airtight in a cool, dark place; refrigerate for longer life.", International: "Follow the label; most pastes and sauces need refrigeration once opened.", Desserts: "Follow package guidance; many need refrigeration or freezing.",
    Drinks: "Follow package guidance.", Baking: "Store sealed and dry.", Other: "Dry goods keep in the pantry; tofu needs refrigeration.",
  };
  return m[c];
}
function subsFor(name: string, c: Category): string[] {
  const special: Record<string, string[]> = {
    Butter: ["Olive oil", "Coconut milk"], Milk: ["Coconut milk"], "Heavy cream": ["Coconut milk", "Greek yogurt"], Egg: ["Tofu (scrambles)", "Mayonnaise (baking, limited)"],
    "Chicken breast": ["Tofu", "Chickpeas"], "Ground beef": ["Lentils", "Mushroom"], Honey: ["Maple syrup"], Sugar: ["Brown sugar", "Honey"],
    Lemon: ["Lime"], Lime: ["Lemon"], Spaghetti: ["Penne", "Rice noodles"], Parmesan: ["Feta (saltier, softer)"],
  };
  if (special[name]) return special[name];
  const same = rows.filter((r) => r[1] === c && r[0] !== name).slice(0, 2).map((r) => r[0]);
  return same;
}

export const CATEGORIES: Category[] = ["Fruits", "Vegetables", "Meats", "Seafood", "Dairy", "Cheese", "Grains", "Pasta", "Sauces", "Spices", "Snacks", "Desserts", "Drinks", "Baking", "Nuts & Seeds", "International", "Other"];
export const ING = (id: string) => INGREDIENTS.find((i) => i.id === id);

export const CREATORS: Creator[] = [
  { id: "c1", name: "Marguerite Lowell", handle: "@margueritebakes", emoji: "🧁", hue: 24, bio: "Pastry cook. Small-batch desserts that actually work on the first try.", followers: 18400, badges: ["Top Rated", "Best Seller"], rating: 4.9, verified: true },
  { id: "c2", name: "Kenji Arai", handle: "@kenjicooks", emoji: "🍜", hue: 8, bio: "Weeknight noodles, broths and bowls from a tiny apartment kitchen.", followers: 12100, badges: ["Community Favorite"], rating: 4.8, verified: true },
  { id: "c3", name: "Sofia Marchetti", handle: "@sofiainpasta", emoji: "🍝", hue: 40, bio: "Third-generation pasta maker. Rules are meant to be understood, then broken.", followers: 9800, badges: ["Recipe Expert", "Top Rated"], rating: 4.9, verified: true },
  { id: "c4", name: "Amara Okafor", handle: "@amaraeats", emoji: "🍲", hue: 18, bio: "West African flavours, simplified for home cooks.", followers: 6400, badges: ["Rising Creator"], rating: 4.7 },
  { id: "c5", name: "Theo Brandt", handle: "@greenplatetheo", emoji: "🥗", hue: 100, bio: "Plant-forward meals that don't feel like a compromise.", followers: 5200, badges: ["Rising Creator"], rating: 4.6 },
  { id: "c6", name: "Priya Nair", handle: "@priyaspice", emoji: "🍛", hue: 34, bio: "Regional Indian home cooking, step by step.", followers: 15300, badges: ["Best Seller", "Recipe Expert"], rating: 4.8, verified: true },
];
export const CREATOR = (id: string) => CREATORS.find((c) => c.id === id);

const N = (calories: number, protein: number, carbs: number, fat: number, fiber: number, sugar: number, sodium: number): Nutrition => ({ calories, protein, carbs, fat, fiber, sugar, sodium });
type R = Omit<Recipe, "id" | "status" | "createdAt" | "views" | "substitutions" | "storage" | "equipment" | "reviews" | "rating"> & Partial<Recipe>;
const mk = (i: number, r: R): Recipe => ({
  id: `r${i}`, status: "published", createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(), views: 800 + i * 317,
  substitutions: [], storage: "Refrigerate in an airtight container for up to 3 days.", equipment: ["Large pan", "Mixing bowl"],
  rating: 4.4 + ((i * 7) % 6) / 10, reviews: 12 + ((i * 37) % 180), ...r,
});

export const RECIPES: Recipe[] = [
  mk(1, { title: "Brown Butter Miso Cookies", description: "Chewy, caramelly cookies with a savoury miso edge. The dough rests overnight for deeper flavour.", emoji: "🍪", hue: 28, creatorId: "c1", ingredients: [{ name: "Butter", amount: "170 g" }, { name: "White miso", amount: "2 tbsp" }, { name: "Brown sugar", amount: "150 g" }, { name: "Flour", amount: "240 g" }, { name: "Egg", amount: "1" }, { name: "Dark chocolate", amount: "150 g, chopped" }], steps: [{ text: "Melt the butter over medium heat, swirling until golden and nutty, about 6 minutes.", timerMin: 6 }, { text: "Whisk in miso and brown sugar, cool 10 minutes, then beat in the egg.", timerMin: 10 }, { text: "Fold in flour and chocolate. Chill the dough at least 4 hours.", timerMin: 240 }, { text: "Scoop onto a lined tray and bake at 180°C until the edges set.", timerMin: 11 }], prepMin: 30, cookMin: 11, servings: 14, difficulty: "Medium", cuisine: "Fusion", meal: "Dessert", categories: ["Desserts", "Baking", "Special occasions"], diet: ["vegetarian"], price: 4.5, nutrition: N(240, 3, 30, 12, 1, 18, 180), allergens: ["milk", "egg", "wheat", "soy"], featured: true, sales: 1420 }),
  mk(2, { title: "Weeknight Garlic Chili Noodles", description: "Springy noodles in a glossy garlic-chili oil sauce. Ready in 15 minutes.", emoji: "🍜", hue: 8, creatorId: "c2", ingredients: [{ name: "Ramen noodles", amount: "200 g" }, { name: "Garlic", amount: "4 cloves" }, { name: "Chili pepper", amount: "1" }, { name: "Soy sauce", amount: "2 tbsp" }, { name: "Olive oil", amount: "3 tbsp" }, { name: "Lime", amount: "1/2" }], steps: [{ text: "Cook noodles in boiling water until just tender, about 3 minutes.", timerMin: 3 }, { text: "Warm the oil with garlic and chili until fragrant, 2 minutes.", timerMin: 2 }, { text: "Toss noodles with soy sauce, the oil and a squeeze of lime." }], prepMin: 5, cookMin: 10, servings: 2, difficulty: "Easy", cuisine: "Asian", meal: "Dinner", categories: ["Quick meals", "Dinner", "International cuisine", "Vegan"], diet: ["vegan", "vegetarian"], price: 0, nutrition: N(480, 13, 70, 17, 4, 4, 1500), allergens: ["wheat", "soy"], sales: 0 }),
  mk(3, { title: "Cacio e Pepe, Done Properly", description: "The three-ingredient Roman classic, with the technique that keeps the sauce silky.", emoji: "🍝", hue: 42, creatorId: "c3", ingredients: [{ name: "Spaghetti", amount: "320 g" }, { name: "Parmesan", amount: "100 g, finely grated" }, { name: "Black pepper", amount: "2 tsp, freshly cracked" }], steps: [{ text: "Toast pepper in a dry pan for 1 minute." , timerMin: 1 }, { text: "Boil pasta in less water than usual; reserve a cup of starchy water.", timerMin: 9 }, { text: "Off the heat, toss pasta with pepper and splashes of water, then add cheese gradually until creamy." }], prepMin: 5, cookMin: 12, servings: 3, difficulty: "Hard", cuisine: "Italian", meal: "Dinner", categories: ["Dinner", "International cuisine", "Quick meals"], diet: ["vegetarian"], price: 3, nutrition: N(560, 24, 78, 16, 4, 3, 780), allergens: ["wheat", "milk"], sales: 980, featured: true }),
  mk(4, { title: "Smoky Chickpea Shakshuka", description: "Eggs poached in a spiced tomato-pepper sauce. Brunch, lunch or dinner.", emoji: "🍳", hue: 14, creatorId: "c5", ingredients: [{ name: "Tomato sauce", amount: "400 g" }, { name: "Bell pepper", amount: "1" }, { name: "Chickpeas", amount: "1 can" }, { name: "Egg", amount: "4" }, { name: "Paprika", amount: "2 tsp" }, { name: "Cumin", amount: "1 tsp" }, { name: "Onion", amount: "1" }], steps: [{ text: "Soften onion and pepper in oil, 6 minutes.", timerMin: 6 }, { text: "Add spices, tomato sauce and chickpeas; simmer 10 minutes.", timerMin: 10 }, { text: "Make wells, crack in eggs, cover and cook until whites set.", timerMin: 7 }], prepMin: 10, cookMin: 25, servings: 4, difficulty: "Easy", cuisine: "Middle Eastern", meal: "Breakfast", categories: ["Breakfast", "Healthy meals", "Vegetarian"], diet: ["vegetarian", "gluten-free"], price: 0, nutrition: N(310, 17, 31, 13, 9, 9, 640), allergens: ["egg"], sales: 0 }),
  mk(5, { title: "Jollof Rice for a Crowd", description: "Smoky, deeply red party jollof with the proper bottom-pot crust.", emoji: "🍲", hue: 16, creatorId: "c4", ingredients: [{ name: "Rice", amount: "500 g" }, { name: "Tomato", amount: "6" }, { name: "Bell pepper", amount: "3" }, { name: "Onion", amount: "2" }, { name: "Chili pepper", amount: "1–2" }, { name: "Paprika", amount: "1 tbsp" }], steps: [{ text: "Blend tomato, pepper, onion and chili, then reduce until thick.", timerMin: 25 }, { text: "Fry the base with spices until the oil separates.", timerMin: 10 }, { text: "Add rinsed rice and stock, cover tightly and steam on low heat.", timerMin: 30 }], prepMin: 20, cookMin: 65, servings: 8, difficulty: "Medium", cuisine: "West African", meal: "Dinner", categories: ["Family meals", "Dinner", "International cuisine", "Special occasions"], diet: ["vegan", "vegetarian", "gluten-free"], price: 5.5, nutrition: N(360, 7, 76, 3, 4, 8, 420), allergens: [], sales: 640 }),
  mk(6, { title: "Mango Lime Sorbet (3 Ingredients)", description: "No machine, no custard. Just frozen mango blitzed until silky.", emoji: "🥭", hue: 44, creatorId: "c1", ingredients: [{ name: "Mango", amount: "600 g, frozen" }, { name: "Lime", amount: "2, juiced" }, { name: "Honey", amount: "2 tbsp" }], steps: [{ text: "Blend frozen mango, lime juice and honey, scraping down, until smooth.", timerMin: 4 }, { text: "Serve straight away, or freeze 1 hour for a firmer scoop.", timerMin: 60 }], prepMin: 10, cookMin: 0, servings: 4, difficulty: "Easy", cuisine: "Global", meal: "Dessert", categories: ["Desserts", "Healthy meals", "Quick meals"], diet: ["vegetarian", "gluten-free", "dairy-free"], price: 0, nutrition: N(140, 1, 36, 0.5, 3, 31, 5), allergens: [], equipment: ["High-speed blender"], sales: 0, seasonal: "Summer" }),
  mk(7, { title: "Creamy Tuscan Mushroom Gnocchi", description: "Pan-fried gnocchi in a garlicky cream sauce with spinach and mushrooms.", emoji: "🍄", hue: 30, creatorId: "c3", ingredients: [{ name: "Potato gnocchi", amount: "500 g" }, { name: "Mushroom", amount: "250 g" }, { name: "Spinach", amount: "100 g" }, { name: "Heavy cream", amount: "150 ml" }, { name: "Garlic", amount: "3 cloves" }, { name: "Parmesan", amount: "40 g" }], steps: [{ text: "Brown gnocchi in butter until golden, 5 minutes.", timerMin: 5 }, { text: "Sauté mushrooms and garlic, then add cream and simmer.", timerMin: 6 }, { text: "Fold in spinach and parmesan until wilted." }], prepMin: 10, cookMin: 15, servings: 3, difficulty: "Easy", cuisine: "Italian", meal: "Dinner", categories: ["Dinner", "Quick meals", "Vegetarian"], diet: ["vegetarian"], price: 2.5, nutrition: N(610, 18, 66, 31, 5, 4, 740), allergens: ["wheat", "milk", "egg"], sales: 410 }),
  mk(8, { title: "Overnight Oats, Five Ways", description: "A base formula and five flavour combinations to rotate through the week.", emoji: "🥣", hue: 70, creatorId: "c5", ingredients: [{ name: "Oats", amount: "50 g" }, { name: "Greek yogurt", amount: "100 g" }, { name: "Milk", amount: "100 ml" }, { name: "Honey", amount: "1 tbsp" }, { name: "Blueberry", amount: "a handful" }], steps: [{ text: "Stir oats, yogurt, milk and honey together in a jar." }, { text: "Refrigerate overnight, at least 6 hours.", timerMin: 360 }, { text: "Top with fruit and nuts before serving." }], prepMin: 5, cookMin: 0, servings: 1, difficulty: "Easy", cuisine: "Global", meal: "Breakfast", categories: ["Breakfast", "Healthy meals", "Meal preparation", "Quick meals"], diet: ["vegetarian"], price: 0, nutrition: N(320, 16, 48, 7, 6, 20, 70), allergens: ["milk", "gluten (cross-contact)"], sales: 0 }),
  mk(9, { title: "Butter Chicken Masterclass", description: "A restaurant-style makhani with a proper marinade, charred chicken and silky sauce.", emoji: "🍛", hue: 22, creatorId: "c6", ingredients: [{ name: "Chicken breast", amount: "700 g" }, { name: "Greek yogurt", amount: "120 g" }, { name: "Tomato sauce", amount: "400 g" }, { name: "Butter", amount: "60 g" }, { name: "Heavy cream", amount: "100 ml" }, { name: "Ginger", amount: "2 tbsp grated" }, { name: "Garlic", amount: "5 cloves" }], steps: [{ text: "Marinate chicken in yogurt and spices for 2 hours.", timerMin: 120 }, { text: "Char the chicken in a very hot pan.", timerMin: 8 }, { text: "Simmer tomato, butter and aromatics, blend smooth, add cream and chicken.", timerMin: 20 }], prepMin: 140, cookMin: 35, servings: 4, difficulty: "Medium", cuisine: "Indian", meal: "Dinner", categories: ["Dinner", "International cuisine", "Family meals"], diet: ["gluten-free"], price: 6, nutrition: N(560, 42, 14, 36, 3, 9, 780), allergens: ["milk"], sales: 2210, featured: true }),
  mk(10, { title: "Crispy Salmon Rice Bowl", description: "Crackling-skinned salmon over sticky rice with quick-pickled cucumber.", emoji: "🍣", hue: 12, creatorId: "c2", ingredients: [{ name: "Salmon", amount: "2 fillets" }, { name: "Rice", amount: "200 g" }, { name: "Cucumber", amount: "1" }, { name: "Soy sauce", amount: "1 tbsp" }, { name: "Honey", amount: "1 tsp" }, { name: "Lime", amount: "1" }], steps: [{ text: "Cook rice. Pickle sliced cucumber in lime and salt.", timerMin: 15 }, { text: "Sear salmon skin-side down until crisp, 5 minutes.", timerMin: 5 }, { text: "Glaze with soy and honey, serve over rice.", timerMin: 2 }], prepMin: 10, cookMin: 20, servings: 2, difficulty: "Easy", cuisine: "Asian", meal: "Dinner", categories: ["Dinner", "Healthy meals", "Quick meals"], diet: ["dairy-free"], price: 2, nutrition: N(620, 38, 66, 22, 2, 8, 820), allergens: ["fish", "soy", "wheat"], sales: 530 }),
  mk(11, { title: "Peach & Basil Galette", description: "A rustic free-form tart with flaky butter crust and summer peaches.", emoji: "🍑", hue: 20, creatorId: "c1", ingredients: [{ name: "Flour", amount: "200 g" }, { name: "Butter", amount: "125 g, cold" }, { name: "Peach", amount: "4" }, { name: "Basil", amount: "6 leaves" }, { name: "Sugar", amount: "3 tbsp" }], steps: [{ text: "Rub butter into flour, bind with ice water, chill 1 hour.", timerMin: 60 }, { text: "Roll out, pile on sugared peaches, fold the edges.", }, { text: "Bake at 200°C until deeply golden.", timerMin: 40 }], prepMin: 80, cookMin: 40, servings: 6, difficulty: "Medium", cuisine: "French", meal: "Dessert", categories: ["Desserts", "Baking", "Seasonal recipes", "Special occasions"], diet: ["vegetarian"], price: 3.5, nutrition: N(330, 4, 45, 15, 2, 17, 90), allergens: ["milk", "wheat"], seasonal: "Summer", sales: 360 }),
  mk(12, { title: "Fiery Black Bean Tacos", description: "Smoky beans, avocado crema and pickled onion. Vegan and loud.", emoji: "🌮", hue: 90, creatorId: "c5", ingredients: [{ name: "Black beans", amount: "2 cans" }, { name: "Tortilla", amount: "8" }, { name: "Avocado", amount: "2" }, { name: "Lime", amount: "2" }, { name: "Onion", amount: "1 red" }, { name: "Cumin", amount: "1 tsp" }, { name: "Hot sauce", amount: "to taste" }], steps: [{ text: "Simmer beans with cumin, garlic and a splash of water.", timerMin: 10 }, { text: "Mash avocado with lime and salt." }, { text: "Warm tortillas and assemble with pickled onion." }], prepMin: 15, cookMin: 10, servings: 4, difficulty: "Easy", cuisine: "Mexican", meal: "Lunch", categories: ["Lunch", "Vegan", "Vegetarian", "Quick meals", "Healthy meals"], diet: ["vegan", "vegetarian", "dairy-free"], price: 0, nutrition: N(420, 15, 62, 14, 15, 4, 520), allergens: ["wheat"], sales: 0 }),
  mk(13, { title: "Sunday Slow-Roast Lamb", description: "Garlic-and-herb lamb shoulder, roasted low until it falls apart.", emoji: "🍖", hue: 10, creatorId: "c6", ingredients: [{ name: "Lamb", amount: "2 kg shoulder" }, { name: "Garlic", amount: "1 head" }, { name: "Lemon", amount: "2" }, { name: "Potato", amount: "1 kg" }, { name: "Olive oil", amount: "4 tbsp" }], steps: [{ text: "Rub the lamb with garlic, lemon and oil. Rest 1 hour.", timerMin: 60 }, { text: "Roast covered at 150°C for 4 hours, adding potatoes for the last 90 minutes.", timerMin: 240 }, { text: "Rest 20 minutes before pulling apart.", timerMin: 20 }], prepMin: 70, cookMin: 240, servings: 6, difficulty: "Medium", cuisine: "Mediterranean", meal: "Dinner", categories: ["Dinner", "Family meals", "Special occasions"], diet: ["gluten-free", "dairy-free"], price: 4, nutrition: N(690, 48, 28, 40, 3, 2, 520), allergens: [], sales: 270 }),
  mk(14, { title: "Strawberry Banana Smoothie Bowl", description: "Thick, spoonable smoothie bowl with a crunchy topping.", emoji: "🍓", hue: 350, creatorId: "c5", ingredients: [{ name: "Strawberry", amount: "200 g frozen" }, { name: "Banana", amount: "1 frozen" }, { name: "Greek yogurt", amount: "100 g" }, { name: "Oats", amount: "2 tbsp" }], steps: [{ text: "Blend fruit and yogurt until thick, using as little liquid as you can.", timerMin: 2 }, { text: "Top with oats and extra fruit." }], prepMin: 5, cookMin: 0, servings: 1, difficulty: "Easy", cuisine: "Global", meal: "Breakfast", categories: ["Breakfast", "Healthy meals", "Quick meals", "Drinks"], diet: ["vegetarian", "gluten-free"], price: 0, nutrition: N(290, 13, 55, 3, 8, 32, 60), allergens: ["milk"], sales: 0 }),
  mk(15, { title: "Spicy Coconut Shrimp Curry", description: "A bright, fragrant curry in 20 minutes.", emoji: "🦐", hue: 26, creatorId: "c4", ingredients: [{ name: "Shrimp", amount: "400 g" }, { name: "Coconut milk", amount: "400 ml" }, { name: "Ginger", amount: "1 tbsp" }, { name: "Garlic", amount: "3 cloves" }, { name: "Chili pepper", amount: "2" }, { name: "Rice", amount: "to serve" }], steps: [{ text: "Fry ginger, garlic and chili until fragrant.", timerMin: 2 }, { text: "Add coconut milk, simmer 8 minutes.", timerMin: 8 }, { text: "Add shrimp and cook until pink.", timerMin: 4 }], prepMin: 10, cookMin: 15, servings: 3, difficulty: "Easy", cuisine: "Asian", meal: "Dinner", categories: ["Dinner", "Quick meals"], diet: ["gluten-free", "dairy-free"], price: 2.5, nutrition: N(420, 27, 12, 30, 2, 4, 620), allergens: ["shellfish"], sales: 300 }),
  mk(16, { title: "Rainy-Day Tomato Soup & Grilled Cheese", description: "The pairing that never goes out of style.", emoji: "🥪", hue: 6, creatorId: "c3", ingredients: [{ name: "Tomato", amount: "1 kg" }, { name: "Onion", amount: "1" }, { name: "Bread", amount: "4 slices" }, { name: "Cheddar", amount: "150 g" }, { name: "Butter", amount: "30 g" }], steps: [{ text: "Roast tomatoes and onion at 200°C.", timerMin: 35 }, { text: "Blend with stock until smooth." }, { text: "Butter bread, fill with cheese, griddle until golden.", timerMin: 6 }], prepMin: 10, cookMin: 40, servings: 4, difficulty: "Easy", cuisine: "American", meal: "Lunch", categories: ["Lunch", "Family meals", "Vegetarian"], diet: ["vegetarian"], price: 0, nutrition: N(480, 18, 44, 26, 5, 11, 910), allergens: ["milk", "wheat"], sales: 0 }),
];

export const BUNDLES: Recipe[] = [
  mk(101, { title: "The Ultimate Pasta Collection", description: "Eight foundational pasta recipes from Sofia, including cacio e pepe and the gnocchi.", emoji: "🍝", hue: 40, creatorId: "c3", ingredients: [], steps: [], prepMin: 0, cookMin: 0, servings: 0, difficulty: "Medium", cuisine: "Italian", meal: "Dinner", categories: ["Premium collections", "Dinner"], diet: [], price: 7, nutrition: N(0, 0, 0, 0, 0, 0, 0), allergens: [], bundleOf: ["r3", "r7"], sales: 320 }),
  mk(102, { title: "Easy Desserts Bundle", description: "Cookies, sorbet and a galette — three crowd-pleasers.", emoji: "🧁", hue: 28, creatorId: "c1", ingredients: [], steps: [], prepMin: 0, cookMin: 0, servings: 0, difficulty: "Easy", cuisine: "Global", meal: "Dessert", categories: ["Premium collections", "Desserts"], diet: [], price: 8, nutrition: N(0, 0, 0, 0, 0, 0, 0), allergens: [], bundleOf: ["r1", "r6", "r11"], sales: 510 }),
];

export const ALL_RECIPES = [...RECIPES, ...BUNDLES];

export const REVIEWS: Review[] = [
  { id: "v1", recipeId: "r1", userId: "u9", userName: "Dana R.", rating: 5, text: "The overnight rest is worth it. Best cookies I've made.", verified: true, createdAt: "2026-10-02" },
  { id: "v2", recipeId: "r1", userId: "u8", userName: "Chris P.", rating: 4, text: "Great flavour. I reduced the miso slightly for my taste.", verified: true, createdAt: "2026-09-18" },
  { id: "v3", recipeId: "r3", userId: "u7", userName: "Lena K.", rating: 5, text: "Finally understand why my sauce kept clumping.", verified: true, createdAt: "2026-10-20" },
  { id: "v4", recipeId: "r9", userId: "u6", userName: "Marcus T.", rating: 5, text: "Tastes like our favourite takeaway, but better.", verified: true, createdAt: "2026-11-01" },
  { id: "v5", recipeId: "r5", userId: "u5", userName: "Ife A.", rating: 5, text: "The crust at the bottom — perfect.", verified: true, createdAt: "2026-10-12" },
];

export const CHALLENGES: Challenge[] = [
  { id: "ch1", title: "Three-Ingredient Wonders", description: "Create something delicious with exactly three ingredients (salt, pepper and oil are free).", emoji: "3️⃣", endsIn: "5 days", rule: "Use real, food-safe ingredients. Posts promoting unsafe or inedible combinations are removed." },
  { id: "ch2", title: "Invent a New Dessert", description: "A dessert nobody has seen before, but someone would actually want to eat.", emoji: "🍰", endsIn: "12 days", rule: "One entry per person. Votes are one per account." },
  { id: "ch3", title: "Best Breakfast Bowl", description: "Show us your breakfast bowl formula.", emoji: "🥣", endsIn: "Starts in 3 days", rule: "Photos must be your own." },
];

export const SEED_POSTS: Post[] = [
  { id: "p1", userId: "c1", userName: "Marguerite Lowell", userEmoji: "🧁", text: "Tried peach + basil + brown butter this weekend. Did not expect the basil to work this well!", emoji: "🍑", hue: 22, ingredients: ["Peach", "Basil", "Butter"], recipeId: "r11", likes: 342, comments: [{ id: "k1", userName: "Kenji Arai", text: "Basil with stone fruit is underrated." }], saves: 88, reposts: 12, createdAt: "2h" },
  { id: "p2", userId: "c2", userName: "Kenji Arai", userEmoji: "🍜", text: "Challenge entry: noodles, garlic, chili. Zero fuss.", emoji: "🍜", hue: 8, ingredients: ["Ramen noodles", "Garlic", "Chili pepper"], recipeId: "r2", likes: 211, comments: [], saves: 64, reposts: 9, createdAt: "5h", challengeId: "ch1" },
  { id: "p3", userId: "c5", userName: "Theo Brandt", userEmoji: "🥗", text: "Tip: salt your avocado before the lime goes in. It tastes brighter.", emoji: "🥑", hue: 100, ingredients: ["Avocado", "Lime", "Salt"], likes: 156, comments: [{ id: "k2", userName: "Amara Okafor", text: "Trying this tonight." }], saves: 41, reposts: 5, createdAt: "1d" },
  { id: "p4", userId: "c6", userName: "Priya Nair", userEmoji: "🍛", text: "Butter chicken sauce base freezes beautifully. Batch it, portion it, thank yourself later.", emoji: "🍛", hue: 24, ingredients: ["Tomato sauce", "Butter", "Heavy cream"], recipeId: "r9", likes: 489, comments: [], saves: 201, reposts: 33, createdAt: "2d" },
  { id: "p5", userId: "c3", userName: "Sofia Marchetti", userEmoji: "🍝", text: "The trick: take the pan off the heat before the cheese goes in. Silky every time.", emoji: "🍝", hue: 42, ingredients: ["Spaghetti", "Parmesan", "Black pepper"], recipeId: "r3", likes: 612, comments: [{ id: "k5", userName: "Kenji Arai", text: "Pasta water is the real MVP." }], saves: 230, reposts: 41, createdAt: "3h" },
  { id: "p6", userId: "c5", userName: "Theo Brandt", userEmoji: "🥗", text: "Sunday shakshuka. Crack the eggs into little wells and lid it.", emoji: "🍳", hue: 14, ingredients: ["Egg", "Tomato", "Bell pepper", "Onion", "Paprika"], recipeId: "r4", likes: 274, comments: [], saves: 98, reposts: 12, createdAt: "6h" },
  { id: "p7", userId: "c2", userName: "Kenji Arai", userEmoji: "🍜", text: "Crispy-skin salmon bowl in 20 minutes. Dry the skin, hot pan, don't touch it.", emoji: "🍣", hue: 12, ingredients: ["Salmon", "Rice", "Cucumber", "Soy sauce"], recipeId: "r10", likes: 388, comments: [], saves: 151, reposts: 19, createdAt: "1d" },
  { id: "p8", userId: "c4", userName: "Amara Okafor", userEmoji: "🍲", text: "Party jollof: let the bottom catch a little. That smoky crust is the point.", emoji: "🍲", hue: 16, ingredients: ["Rice", "Tomato", "Bell pepper", "Onion"], recipeId: "r5", likes: 455, comments: [{ id: "k6", userName: "Priya Nair", text: "Bottom-pot is the best part, no debate." }], saves: 176, reposts: 33, createdAt: "1d" },
  { id: "p9", userId: "c5", userName: "Theo Brandt", userEmoji: "🥗", text: "Breakfast that looks like dessert. Freeze the banana first for a thick bowl.", emoji: "🍓", hue: 340, ingredients: ["Banana", "Strawberry", "Greek yogurt"], recipeId: "r14", likes: 203, comments: [], saves: 87, reposts: 6, createdAt: "2d" },
];

export const TRENDING_COMBOS: { name: string; ids: string[]; note: string }[] = [
  { name: "Salty-sweet crunch", ids: ["dark-chocolate", "pretzels", "caramel"], note: "A classic sweet/salty contrast" },
  { name: "Summer fresh", ids: ["mango", "lime", "chili-pepper"], note: "Bright, juicy and a little hot" },
  { name: "Roman comfort", ids: ["spaghetti", "parmesan", "black-pepper"], note: "Cacio e pepe territory" },
  { name: "Breakfast bowl", ids: ["oats", "greek-yogurt", "blueberry", "honey"], note: "Creamy, fruity, quick" },
  { name: "Tropical heat", ids: ["pineapple", "chili-pepper", "lime"], note: "Sweet, sour and spicy" },
];

export const FOOD_FACTS = [
  "Salt makes fruit taste sweeter — try a pinch on melon or peach.",
  "Acid (lemon, vinegar) brightens rich dishes that taste flat.",
  "Toast your spices in a dry pan for a minute to deepen their flavour.",
  "Rest cooked meat before cutting so the juices stay in.",
  "Starchy pasta water is the secret to silky sauces.",
];

export const COOKING_STYLES = ["Pan-fry", "Roast", "Grill", "Bake", "Slow-cook", "Steam", "No-cook", "Stir-fry"];
export const CUISINES = ["Any", "Italian", "Asian", "Mexican", "Indian", "Middle Eastern", "Mediterranean", "French", "American", "West African"];
export const MEALS = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Drink", "Experimental"];
export const MARKET_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Desserts", "Baking", "Healthy meals", "Quick meals", "International cuisine", "Vegetarian", "Vegan", "Snacks", "Drinks", "Meal preparation", "Family meals", "Special occasions"];
export const DIETS = ["vegan", "vegetarian", "gluten-free", "dairy-free"];
export const ALLERGENS = ["milk", "egg", "wheat", "soy", "peanuts", "tree nuts", "fish", "shellfish", "sesame"];
