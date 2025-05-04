import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster0.45sly7m.mongodb.net/';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
});

const driverSchema = new mongoose.Schema({
  name: String,
  employeeId: String,
  phone: String,
  email: String,
  status: String,
  checkInStatus: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema);

// scripts/seed.js
// เพิ่มการเชื่อมโยง userId กับ Driver
async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [
      { email: 'admin@busticketing.com', password: hashedPassword, name: 'Admin User', role: 'admin' },
      { email: 'staff@busticketing.com', password: hashedPassword, name: 'Staff User', role: 'staff' },
      { email: 'driver@busticketing.com', password: hashedPassword, name: 'Driver User', role: 'driver' },
    ];

    for (const user of users) {
      const exists = await User.findOne({ email: user.email });
      if (!exists) {
        const newUser = await User.create(user);
        console.log(`Created user: ${user.email}`);
        
        // ถ้าเป็น driver ให้สร้าง driver record ด้วย
        if (user.role === 'driver') {
          const driverExists = await Driver.findOne({ email: user.email });
          if (!driverExists) {
            await Driver.create({
              name: user.name,
              employeeId: 'D0001',
              phone: '555-0100',
              email: user.email,
              userId: newUser._id,
              status: 'active',
              checkInStatus: 'checked-out'
            });
            console.log(`Created driver record for: ${user.email}`);
          }
        }
      }
    }

    // Create other drivers...
    // (เหมือนเดิม)

    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();