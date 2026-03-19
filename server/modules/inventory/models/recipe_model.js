const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
  {
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    ingredientName: { type: String }, // denormalized snapshot
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String }, // snapshot of unit at time of recipe creation
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, unique: true },
    menuItemName: { type: String }, // denormalized for quick reads

    ingredients: [recipeIngredientSchema],

    // Yield: how many portions this recipe produces (default 1)
    yield: { type: Number, default: 1 },

    preparationNotes: { type: String }, // chef instructions
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recipeSchema.index({ restaurantId: 1 });
recipeSchema.index({ menuItemId: 1 });

module.exports = mongoose.model('Recipe', recipeSchema);
