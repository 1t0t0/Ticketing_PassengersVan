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
        await User.create(user);
        console.log(`Created user: ${user.email}`);
      }
    }

    // Create drivers
    const drivers = [
      { name: 'John Smith', employeeId: 'D001', phone: '555-0101', email: 'john@example.com', status: 'active', checkInStatus: 'checked-out' },
      { name: 'Jane Doe', employeeId: 'D002', phone: '555-0102', email: 'jane@example.com', status: 'active', checkInStatus: 'checked-out' },
      { name: 'Bob Johnson', employeeId: 'D003', phone: '555-0103', email: 'bob@example.com', status: 'active', checkInStatus: 'checked-out' },
    ];

    for (const driver of drivers) {
      const exists = await Driver.findOne({ employeeId: driver.employeeId });
      if (!exists) {
        await Driver.create(driver);
        console.log(`Created driver: ${driver.name}`);
      }
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();