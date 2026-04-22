const mongoose = require('mongoose');

const modifierOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    extraPrice: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true }
);

const modifierGroupSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true },
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
    costPrice: { type: Number, min: 0 },
    image: { type: String },

    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    tags: [{ type: String }],
    allergens: [{ type: String }],

    modifierGroups: [modifierGroupSchema],

    nutrition: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
    },

    preparationTime: { type: Number, default: 15 },
    displayOrder: { type: Number, default: 0 },

    // -- NOT IN USE: recipes reference MenuItem via Recipe.menuItemId.
    // This reverse ref is never populated or queried in any service.
    // recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, categoryId: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
