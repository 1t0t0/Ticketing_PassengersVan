// scripts/seed-settings.js
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster0.45sly7m.mongodb.net/';

const settingsSchema = new mongoose.Schema({
  ticketPrice: { 
    type: Number, 
    required: true,
    default: 45000 
  },
  revenueSharing: {
    company: { type: Number, default: 10 },  // 10%
    station: { type: Number, default: 20 },  // 20%
    drivers: { type: Number, default: 70 }   // 70%
  },
  operatingHours: {
    start: { type: String, default: '06:00' },
    end: { type: String, default: '22:00' }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// Function to seed settings
async function seedSettings() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if settings exist
    const existingSettings = await Settings.findOne();
    
    if (!existingSettings) {
      await Settings.create({
        ticketPrice: 45000,
        revenueSharing: {
          company: 10,
          station: 20,
          drivers: 70
        },
        operatingHours: {
          start: '06:00',
          end: '22:00'
        }
      });
      console.log('Default settings created');
    } else {
      console.log('Settings already exist');
    }

    console.log('Settings seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Settings seed error:', error);
    process.exit(1);
  }
}

seedSettings();