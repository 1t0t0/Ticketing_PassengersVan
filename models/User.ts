import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'driver'], required: true },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);