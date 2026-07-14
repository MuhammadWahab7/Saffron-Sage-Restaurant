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
  /\b(code|coding|programming|javascript|python|software|debug|computer|laptop|phone|homework|assignment|essay|algebra|calculus|equation|calculate|physics|chemistry|history|geography|politics|president|election|government|weather|forecast|football|soccer|cricket|basketball|stock|shares|crypto|bitcoin|investment|movie|film|actor|celebrity|song|lyrics|video game|gaming|joke|riddle)\w*\b/;

const unrelatedTaskPattern =
  /\b(write|build|create|generate|debug|fix|develop)\b.{0,60}\b(code|program|software|website|application|app|calculator|essay|assignment|homework)\b/;

const promptInjectionPattern =
  /\b(ignore|forget|override|disregard|bypass)\b.{0,60}\b(rule|rules|instruction|instructions|prompt|policy|policies)\b|\b(reveal|show|print|repeat|expose)\b.{0,60}\b(system prompt|hidden instruction|secret|api key|credential)\b/;

const unrelatedPrimaryIntentPattern =
  /\b(who won|match score|final score|match result|weather forecast|stock price|crypto price|latest (news|politics|sports?|movie)|who.*president|election result)\b/;

const isClearlyOutOfScope = (text, rawMessage) => {
  const looksLikeArithmetic =
    /\b\d+(?:\.\d+)?\s*(?:[+*/-]\s*\d+(?:\.\d+)?|%\s*(?:of\s*)?\d+(?:\.\d+)?)\b/i.test(
      rawMessage,
    );
  return (
    promptInjectionPattern.test(text)
    ||
    unrelatedPrimaryIntentPattern.test(text)
    ||
    unrelatedTaskPattern.test(text)
    || ((clearlyUnrelatedPattern.test(text) || looksLikeArithmetic) && !foodOrRestaurantPattern.test(text))
  );
};

export const isClearlyOutOfScopeMessage = (rawMessage) => {
  const text = normalise(rawMessage);
  return Boolean(text) && isClearlyOutOfScope(text, rawMessage);
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

const restaurantDishAnchorPattern =
  /\b(your|you|menu|saffron|sage|restaurant|dish|serve|served|offer|available|have|price|cost|ingredient|allergen|calorie|pairing|pair with|chef|spice|prep|about)\b|\bwhat is in\b/;

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

  return `${dish.name} is priced at ${dish.price} and listed at ${dish.calories}. ${dish.longDescription}\n\nIngredients: ${ingredients}.\nAllergens: ${allergens}.\nDietary notes: ${dish.dietary.join(", ")}. Spice: ${dish.spice}. Recommended pairing: ${dish.pairing}. Chef's note: ${dish.chefNote}`;
};

const findDish = (text) => {
  const exact = menuItems.find((dish) => containsPhrase(text, normalise(dish.name)));
  if (exact) return exact;

  if (!restaurantDishAnchorPattern.test(text)) return null;

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

const numericMenuPrices = menuItems
  .map((dish) => Number(dish.price.replace(/[^0-9.]/g, "")))
  .filter(Number.isFinite);
const menuPriceRange = {
  minimum: Math.min(...numericMenuPrices),
  maximum: Math.max(...numericMenuPrices),
};

const tasteMatches = {
  creamy: new Set(["Woodland Mushroom Toast", "Fire-Roasted Burrata", "Garden Herb Pasta"]),
  light: new Set(["Fire-Roasted Burrata", "Seared Market Fish", "Summer Berry Pavlova", "Orchard Spritz"]),
  rich: new Set(["Woodland Mushroom Toast", "Rosemary-Grilled Ribeye", "Salted Caramel Tart"]),
  sweet: new Set(["Salted Caramel Tart", "Summer Berry Pavlova"]),
};

const getRequestedTaste = (text) => {
  if (/(creamy|creamier|silky|cheesy)/.test(text)) return "creamy";
  if (/(something light|light meal|lighter|fresh food|fresh dish|not too heavy)/.test(text)) return "light";
  if (/(something rich|rich food|hearty|comfort food|filling|indulgent)/.test(text)) return "rich";
  if (/(sweet tooth|something sweet|sweet dish|sweet option)/.test(text)) return "sweet";
  return null;
};

const getExcludedAllergens = (text) => {
  const allergens = [];
  if (/(nut[- ]?free|without nuts|no nuts|nut allerg)/.test(text)) allergens.push("Nuts");
  if (/(dairy[- ]?free|without dairy|no dairy|milk allerg)/.test(text)) allergens.push("Milk");
  if (/(egg[- ]?free|without eggs|no eggs|egg allerg)/.test(text)) allergens.push("Egg");
  if (/(fish[- ]?free|without fish|no fish|fish allerg)/.test(text)) allergens.push("Fish");
  if (/(gluten[- ]?free|without gluten|no gluten|coeliac|celiac)/.test(text)) allergens.push("Gluten");
  return allergens;
};

const getMaximumPrice = (text) => {
  const match = text.match(/(?:under|below|less than|up to|maximum of|max of)\s*£?\s*(\d{1,3})/);
  return match ? Number(match[1]) : null;
};

const getDishPrice = (dish) => Number(dish.price.replace(/[^0-9.]/g, ""));

const describeFilteredMenu = ({
  matches,
  category,
  dietaryPreference,
  excludedAllergens,
  maximumPrice,
  taste,
  recommendation,
}) => {
  const criteria = [
    dietaryPreference,
    taste,
    category ? `from ${category.toLowerCase()}` : null,
    maximumPrice !== null ? `priced at £${maximumPrice} or less` : null,
    excludedAllergens.length
      ? `without ${excludedAllergens.join(" or ")} in the published allergen list`
      : null,
  ].filter(Boolean);
  const criteriaText = criteria.join(", ");
  const allergyNote = excludedAllergens.length
    ? ` Based on the published allergen list, these choices do not list ${excludedAllergens.join(" or ")}. The kitchen handles multiple allergens, so this is not a guarantee against cross-contact; please confirm any serious allergy with staff before ordering.`
    : "";

  if (!matches.length) {
    return `No menu items currently match all of these filters: ${criteriaText}.${allergyNote || " Tell me which requirement matters most and I can suggest the closest alternative."}`;
  }

  const details = matches
    .slice(0, 5)
    .map((dish) => `${dish.name} (${dish.price}): ${dish.description}`)
    .join("\n");
  const introduction = recommendation
    ? `These are the closest menu recommendations for ${criteriaText}:`
    : `These menu items match ${criteriaText}:`;

  return `${introduction}\n${details}${allergyNote}`;
};

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

  if (isClearlyOutOfScopeMessage(rawMessage)) return CHATBOT_OUT_OF_SCOPE_REPLY;

  const needsConversationContext =
    /\b(it|that|this|they|them|those|one)\b.*\b(have|contain|ingredient|allerg|nut|dairy|gluten|calorie|price|cost|pair|spicy|vegan|vegetarian)\w*\b/.test(
      text,
    );
  if (needsConversationContext) return null;

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

  const mentionsCompetitor =
    /\b(mcdonald'?s?|mcdonalds|kfc|burger king|subway|fast food|quick service|chain restaurant|other restaurants?|another restaurant)\b/.test(
      text,
    );
  const asksForComparison =
    /\b(better|best|compare|comparison|versus|vs|difference|different|prefer|choose|cheaper|cheapest|price|prices|healthier|healthy|quality)\b/.test(
      text,
    );

  if (mentionsCompetitor && asksForComparison) {
    if (/(cheaper|cheapest|price|prices|cost)/.test(text)) {
      return `Saffron & Sage's current listed prices run from £${menuPriceRange.minimum} to £${menuPriceRange.maximum}. Sage does not have verified current prices for other restaurants, so I cannot make a fair price comparison; please check the other restaurant's official menu before deciding.`;
    }

    if (/(healthier|healthy|nutrition|calorie)/.test(text)) {
      return "I cannot honestly say one restaurant is healthier overall because nutrition depends on the exact dish, portion and dietary needs. Saffron & Sage publishes calories, ingredients and declared allergens for its listed dishes, so I can help you compare one of our items with verified nutrition information from another restaurant.";
    }

    return "It depends on the kind of meal you want. Quick-service chains are designed for speed and familiar fast food, while Saffron & Sage offers a relaxed garden setting, a small seasonal menu, homemade dishes, clear ingredient and allergen details, and alcohol-free pairings. I would not call either option universally better; choose Saffron & Sage when you want a calmer sit-down meal and more guidance about what is in each dish.";
  }

  if (/(why.*(choose|prefer|pick|visit|come|dine)|what makes.*(special|different|unique)|reasons?.*(choose|prefer|visit)|worth.*(visit|trying)|are you.*best|best restaurant)/.test(text)) {
    return "Saffron & Sage is a good choice if you value seasonal food, homemade dishes, a calm garden setting and friendly service. The menu shows ingredients, allergens and pairings, so it is easier to choose confidently, and the listed drinks are alcohol-free. No restaurant is the best fit for everyone, but we suit guests looking for a relaxed sit-down meal rather than a rushed experience.";
  }

  if (/(why.*visit|why.*dine|what makes.*special|about.*(restaurant|restaurent|resturant)|tell me.*(restaurant|restaurent|resturant)|your (restaurant|restaurent|resturant)|who are you)/.test(text)) {
    return "Saffron & Sage is a relaxed garden restaurant serving seasonal food, homemade dishes and alcohol-free drinks. People visit for the food, the calm setting and friendly service. You can also check ingredients and allergens before choosing a dish.";
  }

  if (
    /(expensive|affordable|cheap|price range|budget friendly|value for money|worth.*price|how much.*cost)/.test(text)
    && !/(recommend|suggest|starter|main|dessert|dish|item|meal|drink|option)/.test(text)
  ) {
    return `Current menu prices range from £${menuPriceRange.minimum} to £${menuPriceRange.maximum}. Drinks begin at £7, desserts at £8, starters at £9, and mains at £17. Whether that suits your budget is personal, so I can recommend options at a particular price if you tell me your limit.`;
  }

  if (/(halal|kosher|organic|wheelchair|accessible|accessibility|parking|delivery|takeaway|take out|wifi|dress code|pet friendly|dog friendly|children'?s menu|kids? menu|corkage)/.test(text)) {
    return "That detail is not confirmed in the restaurant information available to Sage. Please contact Saffron & Sage on +44 1234 567 890 or at hello@saffronandsage.co.uk before visiting, and the team will confirm it for you.";
  }

  if (/(alcohol|alcoholic|wine|beer|cocktail)/.test(text)) {
    return "The published menu currently lists the Orchard Spritz, an alcohol-free drink made with apple, elderflower, citrus and sparkling water. No alcoholic drinks are listed in the information available to Sage, so please contact the restaurant if you need confirmation about other drinks.";
  }

  if (/(cancel|remove|delete).*(booking|reservation)|(booking|reservation).*(cancel|remove|delete)/.test(text)) {
    return "Sign in, open your Guest Account and select My Reservations, then cancel the confirmed reservation you no longer need. Sage cannot cancel it inside the conversation. If the cancellation control is unavailable, contact the restaurant directly.";
  }

  if (/(change|edit|modify|move|reschedule).*(booking|reservation)|(booking|reservation).*(change|edit|modify|move|reschedule)/.test(text)) {
    return "Reservations cannot currently be edited inside chat. Open My Reservations in your Guest Account, cancel the existing booking, then make a new reservation with the correct date, time or guest count. You may also contact the restaurant for help.";
  }

  if (/(my reservations|my reservation|view.*(booking|reservation)|find.*(booking|reservation)|booking history)/.test(text)) {
    return "Sign in and open your Guest Account, then choose My Reservations to view your confirmed and cancelled bookings.";
  }

  if (/(availability|available table|table available|free table|space tonight|seats? available|table.*(tonight|today|now)|book.*(tonight|today))/.test(text)) {
    return "Live table availability is shown only in the Book a Table form after you choose a date, time and guest count. Sage cannot confirm availability in chat.";
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

  // General cooking questions and requests for restaurants elsewhere need a
  // broader answer from Gemini. Do not mistake words such as "pasta" or
  // "recommend" in those requests for a question about this menu.
  const asksForGeneralCookingHelp =
    /(how (do|can|should) i (cook|make|bake|prepare)|how to (cook|make|bake|prepare)|recipe (for|of)|cooking instructions)/.test(
      text,
    );
  const asksForAnotherRestaurant =
    /((recommend|suggest|find|best|good).*(restaurant|cafe|cafes|bar).*(in|near|around)|(restaurant|cafe|cafes|bar).*(in|near|around|near me))/.test(
      text,
    );

  if (asksForGeneralCookingHelp || asksForAnotherRestaurant) return null;

  const requestedCategory = findRequestedCategory(text);
  const recommendationIntent =
    /((recommend|suggest).*(dish|item|meal|menu|food|starter|main|dessert|drink|option|something|anything)|what (do|would) you recommend|your recommendation|what should i (eat|order|try)|best dish|must try|signature dish)/.test(
      text,
    );
  const dietaryPreference = containsPhrase(text, "vegan")
    ? "vegan"
    : hasAnyPhrase(text, ["vegetarian", "veggie"])
      ? "vegetarian"
      : null;
  const excludedAllergens = getExcludedAllergens(text);
  const explicitMaximumPrice = getMaximumPrice(text);
  const maximumPrice = explicitMaximumPrice ?? (
    /(cheap|budget|affordable)/.test(text) ? 10 : null
  );
  const requestedTaste = getRequestedTaste(text);
  const asksForMenuOptions =
    /(what|which|show|list|available|offer|have|serve|eat|want|looking for|option|choice|anything|safe)/.test(text);
  const needsFilteredMenu = Boolean(
    (dietaryPreference || excludedAllergens.length || maximumPrice !== null || requestedTaste)
    && (requestedCategory || recommendationIntent || asksForMenuOptions),
  );

  if (needsFilteredMenu) {
    let matches = [...menuItems];

    if (requestedCategory) {
      matches = matches.filter((dish) => dish.category === requestedCategory);
    }

    if (dietaryPreference === "vegan") {
      matches = matches.filter((dish) => dish.dietary.some((tag) => /vegan/i.test(tag)));
    } else if (dietaryPreference === "vegetarian") {
      matches = matches.filter((dish) =>
        dish.dietary.some((tag) => /vegetarian|vegan/i.test(tag)),
      );
    }

    if (excludedAllergens.length) {
      matches = matches.filter((dish) =>
        excludedAllergens.every((allergen) =>
          !dish.allergens.some((listed) => listed.toLowerCase() === allergen.toLowerCase()),
        ),
      );
    }

    if (maximumPrice !== null) {
      matches = matches.filter((dish) => getDishPrice(dish) <= maximumPrice);
    }

    if (requestedTaste) {
      matches = matches.filter((dish) => tasteMatches[requestedTaste].has(dish.name));
    }

    return describeFilteredMenu({
      matches,
      category: requestedCategory,
      dietaryPreference,
      excludedAllergens,
      maximumPrice,
      taste: requestedTaste,
      recommendation: recommendationIntent,
    });
  }

  const asksForCategory = /(what|which|show|list|available|offer|have|serve|tell|about|for the|on the)/.test(text);
  if (requestedCategory && (asksForCategory || recommendationIntent)) {
    return describeCategory(requestedCategory);
  }

  const dish = findDish(text);
  const asksAboutAllergens = /(allerg|nut|dairy|milk|egg|fish allerg|cross contact)/.test(text);

  if (dish && /(calorie|calories|kcal)/.test(text)) {
    return `${dish.name} is listed at ${dish.calories}. Calorie figures are guidance rather than medical advice.`;
  }

  if (dish && /(price|cost|how much)/.test(text)) {
    return `${dish.name} is currently listed at ${dish.price}.`;
  }

  if (dish && /(spicy|spice|heat|hot)/.test(text)) {
    return `${dish.name} is described as ${dish.spice.toLowerCase()}.`;
  }

  if (dish && /(pairing|pair with|what.*drink|drink.*with)/.test(text)) {
    return `The recommended pairing for ${dish.name} is ${dish.pairing}.`;
  }

  if (dish && /(prep|preparation|how long|ready)/.test(text)) {
    return `${dish.name} has a listed preparation time of about ${dish.prepTime}. Actual service time can vary when the restaurant is busy.`;
  }

  if (dish && /(chef.*note|what.*chef|origin|inspiration|why.*dish)/.test(text)) {
    return `${dish.chefNote} ${dish.origin}`;
  }

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

  if (/(cheapest|low budget|on a budget|under £?10|under 10 pounds|less than £?10)/.test(text)) {
    return "For food under £10, choose the Woodland Mushroom Toast (£9), Salted Caramel Tart (£8), or Summer Berry Pavlova (£8). The Orchard Spritz is £7 if you would also like an alcohol-free drink.";
  }

  if (/(high protein|more protein|protein rich|meat lover|steak lover)/.test(text)) {
    return "For a protein-focused main, the Rosemary-Grilled Ribeye (£28) is the strongest match and is listed as high protein. The Seared Market Fish (£22) is a lighter alternative and is listed as omega-rich.";
  }

  if (/(very spicy|spicy food|hot food|chilli|chili|lots of heat)/.test(text)) {
    return "The current menu does not list a genuinely hot or chilli-forward dish. The Rosemary-Grilled Ribeye (£28) is peppery, while the other dishes are described as mild or without heat.";
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

  if (recommendationIntent) {
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

  return null;
}

export const CHATBOT_FORMAL_FALLBACK =
  "I’m sorry, Sage could not answer just now. Please try again in a moment, or ask about our menu, ingredients, opening hours, events or reservations.";
