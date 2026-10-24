const SETTINGS = {
  phone: '+92 300 0000000',
  email: 'hello@own-plate.pk',
  address: 'Shop 12, Main Market, Your City',
  hours: 'Daily, 11 am to 1 am',
  currency: { locale: 'en-PK', code: 'PKR' },
  deliveryFee: 150,
  freeDeliveryOver: 2500,
  minOrder: 500,
  acceptingOrders: true,
};

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'burgers', label: 'Burgers', art: 'burger', tint: '#fbe3b0' },
  { id: 'chicken', label: 'Fried chicken', art: 'chicken', tint: '#f7d4bd' },
  { id: 'pizza', label: 'Pizza', art: 'pizza', tint: '#f9d2d4' },
  { id: 'desi', label: 'Desi bowls', art: 'bowl', tint: '#dfe3f0' },
  { id: 'wraps', label: 'Wraps & rolls', art: 'wrap', tint: '#e5e9c9' },
  { id: 'sides', label: 'Sides', art: 'fries', tint: '#fbe9b3' },
  { id: 'drinks', label: 'Cold drinks', art: 'cup', tint: '#d4ebe6' },
  { id: 'desserts', label: 'Desserts', art: 'sundae', tint: '#f6dbe6' },
];

const choice = (label, price = 0) => ({ label, price });
const extras = (...pairs) => pairs.map(([label, price]) => choice(label, price));

const OPTION_SETS = {
  burgers: [
    { key: 'meal', label: 'Make it a meal', type: 'single', choices: [choice('Burger only'), choice('Meal with fries and cola', 420)] },
    { key: 'extras', label: 'Extras', type: 'multi', choices: extras(['Cheese slice', 80], ['Extra patty', 350], ['Jalapeños', 50], ['Garlic mayo', 40]) },
  ],
  chicken: [{ key: 'dips', label: 'Dips', type: 'multi', choices: extras(['Garlic mayo', 40], ['Hot sauce', 40], ['Ranch', 40]) }],
  pizza: [
    { key: 'size', label: 'Size', type: 'single', default: 1, choices: [choice('Small 7"', -300), choice('Medium 10"'), choice('Large 13"', 450)] },
    { key: 'crust', label: 'Crust', type: 'single', choices: [choice('Classic'), choice('Thin'), choice('Cheese-stuffed', 250)] },
    { key: 'extras', label: 'Extra toppings', type: 'multi', choices: extras(['Extra cheese', 150], ['Mushrooms', 80], ['Olives', 80], ['Chicken tikka', 200]) },
  ],
  desi: [
    { key: 'spice', label: 'Spice level', type: 'single', default: 1, choices: [choice('Mild'), choice('Medium'), choice('Hot')] },
    { key: 'extras', label: 'Extras', type: 'multi', choices: extras(['Extra raita', 60], ['Extra tikka piece', 250]) },
  ],
  wraps: [{ key: 'combo', label: 'Make it a combo', type: 'single', choices: [choice('Wrap only'), choice('With fries and cola', 350)] }],
  sides: [{ key: 'size', label: 'Size', type: 'single', choices: [choice('Regular'), choice('Large', 150)] }],
  drinks: [
    { key: 'size', label: 'Size', type: 'single', choices: [choice('Regular'), choice('Large', 70)] },
    { key: 'ice', label: 'Ice', type: 'single', choices: [choice('Normal ice'), choice('Less ice'), choice('No ice')] },
  ],
};

const dish = (id, category, name, desc, price, kcal, tags, extra = {}) => ({
  id, category, name, desc, price, kcal, tags,
  urdu: '', img: '', featured: false, available: true, optionSet: category, ...extra,
});

const MENU = [
  dish('zinger-burger', 'burgers', 'Zinger Burger', 'Crispy spiced chicken fillet, cheese, lettuce and house mayo on a toasted bun.', 690, 540, ['Bestseller', 'Spicy'], { featured: true }),
  dish('double-zinger', 'burgers', 'Double Zinger Stack', 'Two crispy fillets, double cheese and our hot mayo. Built for big appetites.', 990, 820, ['Spicy']),
  dish('classic-beef', 'burgers', 'Classic Beef Burger', 'Flame-grilled beef patty, cheddar, pickles, onion and tomato.', 790, 610, [], { featured: true }),
  dish('smash-burger', 'burgers', 'Double Smash Burger', 'Two smashed beef patties, caramelised onion and melted cheese.', 1090, 780, ['Bestseller'], { featured: true }),
  dish('bbq-beef', 'burgers', 'BBQ Beef Burger', 'Smoky BBQ glaze, crispy onion rings and cheddar on a sesame bun.', 890, 690, []),
  dish('tikka-burger', 'burgers', 'Chicken Tikka Burger', 'Tikka-marinated chicken, mint chutney and kachumber. Desi to the bone.', 750, 560, ['Desi special']),
  dish('aloo-tikki', 'burgers', 'Aloo Tikki Burger', 'Spiced potato patty, tamarind sauce, onion and fresh lettuce.', 450, 430, ['Vegetarian']),
  dish('grilled-chicken', 'burgers', 'Grilled Chicken Burger', 'Herb-grilled chicken breast, lettuce, tomato and light yoghurt sauce.', 720, 470, ['Lighter']),

  dish('fried-2pc', 'chicken', 'Crispy Fried Chicken (2 pc)', 'Juicy chicken in our 11-spice crunch coating. Served with a bun.', 650, 520, ['Bestseller'], { featured: true }),
  dish('fried-6pc', 'chicken', 'Sharing Bucket (6 pc)', 'Six pieces of crispy fried chicken with two dips. Made for sharing.', 1690, 1560, ['Share']),
  dish('hot-wings', 'chicken', 'Hot Wings (6 pc)', 'Fiery glazed wings with a cooling ranch dip.', 590, 480, ['Spicy']),
  dish('tenders', 'chicken', 'Chicken Tenders (5 pc)', 'Hand-breaded tenders, crisp outside and tender inside.', 750, 560, []),
  dish('popcorn-chicken', 'chicken', 'Popcorn Chicken', 'Bite-sized crispy chicken, perfect for snacking.', 550, 430, []),

  dish('margherita', 'pizza', 'Margherita', 'Tomato sauce, mozzarella and fresh basil on a hand-stretched base.', 1090, 760, ['Vegetarian']),
  dish('pepperoni', 'pizza', 'Beef Pepperoni', 'Generous beef pepperoni slices over bubbling mozzarella.', 1390, 880, ['Bestseller'], { featured: true }),
  dish('tikka-pizza', 'pizza', 'Chicken Tikka Pizza', 'Tikka chicken, onion, green chilli and mint drizzle. A Pakistani classic.', 1390, 840, ['Desi special'], { featured: true }),
  dish('fajita-pizza', 'pizza', 'Chicken Fajita Pizza', 'Fajita-spiced chicken, capsicum, onion and a creamy swirl.', 1350, 820, []),
  dish('seekh-pizza', 'pizza', 'Seekh Kebab Pizza', 'Smoky seekh kebab crumbles, onion and green chutney.', 1450, 900, ['Desi special']),
  dish('veggie-pizza', 'pizza', 'Veggie Garden', 'Mushrooms, olives, capsicum, sweetcorn and mozzarella.', 1190, 720, ['Vegetarian']),

  dish('tikka-bowl', 'desi', 'Chicken Tikka Bowl', 'Charcoal-grilled tikka on brown rice with kachumber, mint raita and pickled onion.', 1190, 610, ['High protein'], { urdu: 'چکن تکہ باؤل', featured: true }),
  dish('seekh-bowl', 'desi', 'Seekh Kebab Bowl', 'Juicy seekh kebab, smoky rice, achari slaw and green chutney.', 1250, 640, ['High protein'], { urdu: 'سیخ کباب باؤل' }),
  dish('daal-chawal', 'desi', 'Daal Chawal Bowl', 'Lemony tarka daal over rice with crispy onions and a crunchy papad.', 790, 520, ['Vegetarian'], { urdu: 'دال چاول' }),
  dish('chana-chaat', 'desi', 'Chana Chaat Bowl', 'Spiced chickpeas, tamarind, pomegranate, sev and fresh coriander.', 690, 430, ['Vegetarian'], { urdu: 'چنا چاٹ' }),
  dish('haleem', 'desi', 'Daal Haleem Bowl', 'Slow-cooked wheat, lentils and chicken with ginger, lemon and fried onion.', 850, 560, ['Comfort food'], { urdu: 'حلیم' }),

  dish('zinger-wrap', 'wraps', 'Zinger Wrap', 'Crispy zinger strips, lettuce and garlic mayo in a toasted tortilla.', 590, 520, ['Spicy']),
  dish('chapli-wrap', 'wraps', 'Chapli Kebab Roti Wrap', 'Whole-wheat roti, Peshawari chapli kebab, onion salad and mint chutney.', 690, 580, ['Desi special']),
  dish('paratha-roll', 'wraps', 'Chicken Paratha Roll', 'Flaky paratha rolled with spicy chicken, onion and chutney.', 520, 540, ['Bestseller'], { featured: true }),

  dish('fries', 'sides', 'Crispy Fries', 'Golden, salted and made to order.', 250, 360, ['Vegetarian'], { featured: true }),
  dish('masala-fries', 'sides', 'Masala Loaded Fries', 'Fries tossed in chaat masala, topped with chutney and cheese sauce.', 450, 520, ['Vegetarian']),
  dish('nuggets', 'sides', 'Chicken Nuggets (6 pc)', 'Crispy golden nuggets with your choice of dip.', 450, 380, [], { art: 'chicken' }),
  dish('onion-rings', 'sides', 'Onion Rings', 'Thick-cut onion rings in a crunchy beer-style batter.', 350, 330, ['Vegetarian']),
  dish('garlic-bread', 'sides', 'Cheesy Garlic Bread', 'Toasted garlic bread loaded with melted mozzarella.', 390, 420, ['Vegetarian'], { art: 'pizza' }),

  dish('cola', 'drinks', 'Cola', 'Ice-cold classic cola.', 150, 140, []),
  dish('lemon-soda', 'drinks', 'Lemon-Lime Soda', 'Crisp, citrusy and fizzy.', 150, 130, []),
  dish('orange-fizz', 'drinks', 'Orange Fizz', 'Sparkling orange soda over ice.', 150, 140, []),
  dish('mint-margarita', 'drinks', 'Mint Margarita', 'Fresh mint, lemon and soda. Pakistan\'s favourite mocktail.', 320, 110, ['Bestseller'], { featured: true }),
  dish('mango-lassi', 'drinks', 'Mango Lassi', 'Ripe mango and thick dahi, lightly sweetened with honey.', 390, 180, ['Low sugar'], { urdu: 'آم لسی' }),
  dish('namkeen-lassi', 'drinks', 'Namkeen Lassi', 'Chilled salted yoghurt drink with roasted cumin and mint.', 350, 120, [], { urdu: 'نمکین لسی' }),
  dish('iced-tea', 'drinks', 'Peach Iced Tea', 'Brewed black tea, peach and lemon over ice.', 280, 90, []),
  dish('cold-coffee', 'drinks', 'Cold Coffee', 'Chilled espresso blended with milk and ice cream.', 420, 260, []),
  dish('noon-chai', 'drinks', 'Kashmiri Noon Chai', 'Rose-pink tea with milk, cardamom and crushed pistachio. Served hot.', 390, 150, ['Hot'], { art: 'chai', optionSet: 'none' }),

  dish('brownie-sundae', 'desserts', 'Brownie Sundae', 'Warm chocolate brownie, vanilla soft-serve and fudge sauce.', 490, 520, []),
  dish('kheer-jar', 'desserts', 'Low-Sugar Kheer Jar', 'Slow-simmered rice pudding sweetened with dates, topped with pistachio.', 450, 280, [], { urdu: 'کھیر' }),
  dish('soft-serve', 'desserts', 'Soft-Serve Cone', 'Creamy vanilla soft-serve in a crisp cone.', 190, 190, []),
  dish('jamun-cheesecake', 'desserts', 'Gulab Jamun Cheesecake', 'Creamy cheesecake layered with gulab jamun and rose syrup.', 520, 480, ['Desi special']),
];

const DEALS = [
  { id: 'student-meal', name: 'Student Meal', desc: 'Zinger burger, regular fries and a cold drink.', price: 799, was: 1090, art: 'burger', tint: '#fbe3b0', active: true },
  { id: 'family-feast', name: 'Family Feast', desc: '2 large pizzas, 12 hot wings and 4 cold drinks.', price: 4990, was: 6200, art: 'pizza', tint: '#f9d2d4', active: true },
  { id: 'desi-lunch', name: 'Desi Lunch Box', desc: 'Chicken tikka bowl, mango lassi and a kheer jar.', price: 1590, was: 2030, art: 'bowl', tint: '#dfe3f0', active: true },
  { id: 'midnight-munch', name: 'Midnight Munch', desc: 'Nuggets, masala fries and two cold drinks.', price: 950, was: 1250, art: 'fries', tint: '#fbe9b3', active: true },
  { id: 'bucket-night', name: 'Bucket Night', desc: '6 pc sharing bucket, large fries and 3 cola.', price: 2290, was: 2890, art: 'chicken', tint: '#f7d4bd', active: true },
  { id: 'pizza-party', name: 'Pizza Party', desc: '2 medium pizzas of your choice and cheesy garlic bread.', price: 2790, was: 3570, art: 'pizza', tint: '#f9d2d4', active: true },
];

const COUPONS = [
  { id: 'cp-welcome', code: 'WELCOME10', type: 'percent', value: 10, min: 800, desc: '10% off your order over Rs 800', active: true },
  { id: 'cp-freedel', code: 'FREEDEL', type: 'delivery', value: 0, min: 1000, desc: 'Free delivery on orders over Rs 1,000', active: true },
  { id: 'cp-family', code: 'FAMILY300', type: 'amount', value: 300, min: 3500, desc: 'Rs 300 off orders over Rs 3,500', active: true },
];
