import { events, menuItems } from "../data.js";

export const QUICK_CHAT_SUGGESTIONS = [
  "What are your opening hours?",
  "What starters are available?",
  "Recommend a light dinner",
  "How do I reserve a table?",
];

export const CHATBOT_OUT_OF_SCOPE_REPLY =
  "Thank you for your question. Sage can only assist with food, dining, and Saffron & Sage restaurant matters. Please ask about our menu, ingredients, allergens, recommendations, opening hours, events, or reservations.";

const normalise = (value = "") =>
  value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9£+\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsPhrase = (text, phrase) => {
  const pattern = escapeRegExp(normalise(phrase)).replace(/\\ /g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${pattern}($|[^a-z0-9])`, "i").test(text);
};

const hasAnyPhrase = (text, phrases) => phrases.some((phrase) => containsPhrase(text, phrase));

const foodOrRestaurantPattern =
  /\b(saffron|sage|restaurant|dining|food|eat|drink|menu|dish|meal|recipe|cook|bake|ingredient|allerg|calorie|nutrition|diet|vegan|vegetarian|gluten|cuisine|flavour|flavor|taste|chef|kitchen|table|book|booking|reservation|opening|hours|location|address|event|starter|appetizer|appetiser|main|dessert|breakfast|brunch|lunch|dinner|snack|beverage|coffee|tea|meat|chicken|fish|pasta|cake|fruit|vegetable)\w*\b/;

const clearlyUnrelatedPattern =
  /\b(code|coding|programming|javascript|python|software|debug|homework|assignment|essay|algebra|calculus|equation|calculate|politics|president|election|government|weather|forecast|football|soccer|cricket|basketball|stock|shares|crypto|bitcoin|investment|movie|film|actor|song|lyrics|video game|gaming|joke|riddle)\w*\b/;

const isClearlyOutOfScope = (text, rawMessage) => {
  const looksLikeArithmetic = /\b\d+\s*[+*/-]\s*\d+\b/.test(rawMessage);
  return (clearlyUnrelatedPattern.test(text) || looksLikeArithmetic) && !foodOrRestaurantPattern.test(text);
};

const dishAliases = new Map([
  ["mushroom", "Woodland Mushroom Toast"],
  ["mushroom toast", "Woodland Mushroom Toast"],
  ["burrata", "Fire-Roasted Burrata"],
  ["ribeye", "Rosemary-Grilled Ribeye"],
  ["steak", "Rosemary-Grilled Ribeye"],
  ["pasta", "Garden Herb Pasta"],
  ["fish", "Seared Market Fish"],
  ["caramel", "Salted Caramel Tart"],
  ["caramel tart", "Salted Caramel Tart"],
  ["pavlova", "Summer Berry Pavlova"],
  ["spritz", "Orchard Spritz"],
]);

const categoryAliases = [
  {
    category: "Starters",
    aliases: ["starter", "starters", "appetizer", "appetizers", "appetiser", "appetisers", "first course"],
  },
  {
    category: "Mains",
    aliases: ["main", "mains", "main course", "main courses", "entree", "entrees"],
  },
  {
    category: "Desserts",
    aliases: ["dessert", "desserts", "sweet", "sweets"],
  },
  {
    category: "Drinks",
    aliases: ["drink", "drinks", "beverage", "beverages", "mocktail", "mocktails"],
  },
];

const formatDish = (dish) => {
  const ingredients = dish.ingredients.join(", ");
  const allergens = dish.allergens.join(", ");

  return `${dish.name} is priced at ${dish.price}. ${dish.longDescription}\n\nIngredients: ${ingredients}.\nAllergens: ${allergens}.\nDietary notes: ${dish.dietary.join(", ")}. Recommended pairing: ${dish.pairing}.`;
};

const findDish = (text) => {
  const exact = menuItems.find((dish) => containsPhrase(text, normalise(dish.name)));
  if (exact) return exact;

  for (const [alias, name] of dishAliases.entries()) {
    if (containsPhrase(text, alias)) {
      return menuItems.find((dish) => dish.name === name) ?? null;
    }
  }

  return null;
};

const findRequestedCategory = (text) =>
  categoryAliases.find(({ aliases }) => hasAnyPhrase(text, aliases))?.category ?? null;

const listDishes = (dishes) =>
  dishes.length
    ? dishes.map((dish) => `${dish.name} (${dish.price})`).join(", ")
    : "No matching dish is currently listed on the menu.";

const describeCategory = (category) => {
  const dishes = menuItems.filter((item) => item.category === category);
  const details = dishes
    .map((dish) => `${dish.name} (${dish.price}): ${dish.description}`)
    .join("\n");

  return `Our ${category.toLowerCase()} are:\n${details}\n\nClick a menu card to see the ingredients, allergens and chef's note.`;
};

export function getLocalRestaurantAnswer(rawMessage) {
  const text = normalise(rawMessage);
  if (!text) return null;

  if (/^(hi|hello|hey|salam|assalam|good morning|good afternoon|good evening)( there| sage)?[!. ]*$/.test(text)) {
    return "Hello, I’m Sage. I can help with the menu, ingredients, allergens, opening hours, events and table bookings.";
  }

  if (/(opening hours|opening time|closing time|when.*(open|close)|what.*(hours|timing|timings|timimg|timimgs)|your.*(hours|timing)|restaurant.*(open|close|hours|timing)|kab.*(khul|band))/.test(text)) {
    return "Saffron & Sage is closed on Monday. We are open Tuesday to Thursday from 12:00 to 22:00, Friday and Saturday from 12:00 to 23:00, and Sunday from 12:00 to 20:00. The kitchen closes 30 minutes before the restaurant.";
  }

  if (/(where.*(you|restaurant|saffron|sage)|your.*(location|address)|restaurant.*(location|address)|find (you|the restaurant)|located at|kahan.*(restaurant|ho))/.test(text)) {
    return "Saffron & Sage is located at 14 Willow Lane, Brambleford, UK. You may contact the restaurant on +44 1234 567 890 or at hello@saffronandsage.co.uk.";
  }

  if (/(your.*(phone|email|contact)|restaurant.*(phone|email|contact)|contact (you|the restaurant)|call (you|the restaurant)|how.*contact|phone number|email address)/.test(text)) {
    return "You may contact Saffron & Sage by telephone on +44 1234 567 890 or by email at hello@saffronandsage.co.uk. A contact form is also available near the bottom of the website.";
  }

  if (/(why.*visit|why.*dine|what makes.*special|about.*(restaurant|restaurent|resturant)|tell me.*(restaurant|restaurent|resturant)|your (restaurant|restaurent|resturant)|who are you)/.test(text)) {
    return "Saffron & Sage is a relaxed garden restaurant serving seasonal food, homemade dishes and alcohol-free drinks. People visit for the food, the calm setting and friendly service. You can also check ingredients and allergens before choosing a dish.";
  }

  if (/(book( a)? table|booking|reserve|reservation|table reservation|reserve.*seat|book.*seat)/.test(text)) {
    return "Click any Book a table button, sign in, then choose the date, time and number of guests. The booking will be saved to your account. I can explain the steps, but the final booking must be completed in the booking form.";
  }

  if (/(your events|restaurant events|events.*restaurant|what events|upcoming events|music evening|harvest table|family feast)/.test(text)) {
    const eventList = events
      .map((event) => `${event.day} ${event.month}: ${event.title} at ${event.time}`)
      .join("; ");
    return `The currently listed events are: ${eventList}. Please use the Events section or contact the restaurant to confirm availability.`;
  }

  const requestedCategory = findRequestedCategory(text);
  const asksForCategory = /(what|which|show|list|available|offer|have|serve|tell|about|for the|on the)/.test(text);
  if (requestedCategory && asksForCategory) {
    return describeCategory(requestedCategory);
  }

  const dish = findDish(text);
  const asksAboutAllergens = /(allerg|nut|dairy|milk|egg|fish allerg|cross contact)/.test(text);

  if (dish && asksAboutAllergens) {
    return `${formatDish(dish)}\n\nPlease note that the kitchen handles multiple allergens. Any serious allergy must be confirmed directly with restaurant staff before ordering.`;
  }

  if (asksAboutAllergens) {
    return "Each menu card provides detailed ingredient and allergen information. As the kitchen handles multiple allergens, please inform the restaurant team about any serious allergy before ordering. The restaurant cannot guarantee the absence of cross-contact.";
  }

  if (dish) return formatDish(dish);

  if (containsPhrase(text, "vegan")) {
    const matches = menuItems.filter((item) => item.dietary.some((tag) => /vegan/i.test(tag)));
    return `The current vegan option is ${listDishes(matches)}. Please inform the team of any dietary requirements when making your reservation.`;
  }

  if (hasAnyPhrase(text, ["vegetarian", "veggie"])) {
    const matches = menuItems.filter((item) => item.dietary.some((tag) => /vegetarian/i.test(tag)));
    return `Vegetarian choices currently include ${listDishes(matches)}. Please inform the team of any dietary requirements when making your reservation.`;
  }

  if (/(gluten|gluten free|coeliac|celiac)/.test(text)) {
    const matches = menuItems.filter((item) => item.dietary.some((tag) => /gluten-aware/i.test(tag)));
    return `Gluten-aware choices currently include ${listDishes(matches)}. The kitchen handles gluten, so guests with coeliac disease or a serious allergy should confirm requirements directly with staff.`;
  }

  // Common taste-preference questions are answered locally so they remain
  // useful even when Gemini is unavailable and do not consume API tokens.
  if (/(creamy|creamier|creamy food|creamy dish|silky|cheesy)/.test(text)) {
    return "For something creamy, try the Fire-Roasted Burrata (£11). The Woodland Mushroom Toast (£9) also comes with garlic cream. For a main, the Garden Herb Pasta (£17) is smooth and cheesy, but it does not contain heavy cream.";
  }

  if (/(something light|light meal|lighter|fresh food|fresh dish|not too heavy)/.test(text)) {
    return "For a lighter meal, try the Seared Market Fish (£22). The Fire-Roasted Burrata (£11) works well as a starter, and the Orchard Spritz (£7) is a fresh alcohol-free drink. The Summer Berry Pavlova (£8) is the lightest dessert on the menu.";
  }

  if (/(something rich|rich food|hearty|comfort food|filling|indulgent)/.test(text)) {
    return "For a filling meal, choose the Rosemary-Grilled Ribeye (£28). You could start with the Woodland Mushroom Toast (£9) and finish with the Salted Caramel Tart (£8).";
  }

  if (/(sweet tooth|something sweet|sweet dish|sweet option)/.test(text)) {
    return "For dessert, choose the Salted Caramel Tart (£8) if you like chocolate and caramel. The Summer Berry Pavlova (£8) is lighter and fruitier.";
  }

  if (/(starter.*drink|drink.*starter|pairing|pair with)/.test(text)) {
    return "The Fire-Roasted Burrata (£11) goes well with the Orchard Spritz (£7). The starter is creamy, while the drink is fresh and citrusy.";
  }

  if (/(recommend|suggest|what should|best dish)/.test(text)) {
    const starter = menuItems.find((item) => item.name === "Fire-Roasted Burrata");
    const main = menuItems.find((item) => item.name === "Seared Market Fish");
    const dessert = menuItems.find((item) => item.name === "Salted Caramel Tart");
    const drink = menuItems.find((item) => item.name === "Orchard Spritz");

    return `For a balanced meal, I recommend ${starter.name} (${starter.price}) to start, followed by ${main.name} (${main.price}), then ${dessert.name} (${dessert.price}). The ${drink.name} (${drink.price}) is a fresh alcohol-free pairing. If you tell me what flavours or dietary options you prefer, I can narrow this down.`;
  }

  if (/(menu|price|prices)/.test(text)) {
    const categories = ["Starters", "Mains", "Desserts", "Drinks"]
      .map((category) => {
        const dishes = menuItems.filter((item) => item.category === category);
        return `${category}: ${listDishes(dishes)}`;
      })
      .join("\n");
    return `Here is our current menu:\n${categories}\n\nClick a menu card to see ingredients, allergens and more details.`;
  }

  if (isClearlyOutOfScope(text, rawMessage)) return CHATBOT_OUT_OF_SCOPE_REPLY;

  return null;
}

export const CHATBOT_FORMAL_FALLBACK =
  "I’m sorry, Sage could not answer just now. Please try again in a moment, or ask about our menu, ingredients, opening hours, events or reservations.";
