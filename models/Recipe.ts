// models/Recipe.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRecipe extends Document {
  recipe_id: string;
  ticket_id: string;
  amount_total: number;
  station_share: string;
  ticket_company_share: string;
  driver_share: string;
  date: Date;
}

const recipeSchema = new Schema({
  recipe_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  ticket_id: { 
    type: String, 
    required: true,
    ref: 'Ticket'
  },
  amount_total: { 
    type: Number, 
    required: true 
  },
  station_share: { 
    type: String,
    required: true 
  },
  ticket_company_share: { 
    type: String,
    required: true
  },
  driver_share: { 
    type: String,
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Define static methods for finding recipes
recipeSchema.statics.findByTicketId = function(ticketId: string) {
  return this.find({ ticket_id: ticketId });
};

recipeSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

const Recipe: Model<IRecipe> = mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', recipeSchema);

export default Recipe;