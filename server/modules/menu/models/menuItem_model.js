const mongoose = require('mongoose');

const modifierOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },   // e.g. "Large", "Extra Cheese"
    extraPrice: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true }
);

const modifierGroupSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true }, // e.g. "Choose Size"
    isRequired: { type: Boolean, default: false },
    minSelections: { type: Number, default: 0 },
    maxSelections: { type: Number, default: 1 },
    options: [modifierOptionSchema],
  },
  { _id: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },

    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0 }, // for profit margin calculation
    image: { type: String }, // URL

    isAvailable: { type: Boolean, default: true }, // quick out-of-stock toggle
    isFeatured: { type: Boolean, default: false },  // highlight on storefront

    // Dietary & allergen tags
    tags: [{ type: String }], // ['Vegan', 'Gluten-Free', 'Spicy', 'Contains Nuts']
    allergens: [{ type: String }], // ['Peanuts', 'Dairy', 'Gluten', 'Shellfish']

    modifierGroups: [modifierGroupSchema],

    // Nutritional info (optional, for health-conscious menus)
    nutrition: {
      calories: { type: Number },
      protein: { type: Number },  // grams
      carbs: { type: Number },
      fat: { type: Number },
    },

    preparationTime: { type: Number, default: 15 }, // minutes
    displayOrder: { type: Number, default: 0 },

    // For inventory auto-deduction — links to Recipe
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, categoryId: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
