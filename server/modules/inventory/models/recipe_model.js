const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
  {
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    ingredientName: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, unique: true },
    menuItemName: { type: String },

    ingredients: [recipeIngredientSchema],

    yield: { type: Number, default: 1 },

    preparationNotes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recipeSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('Recipe', recipeSchema);
