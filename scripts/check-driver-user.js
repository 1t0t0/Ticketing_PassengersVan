import mongoose from 'mongoose';
import User from '../models/User.js';
import Driver from '../models/Driver.js';

const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster0.45sly7m.mongodb.net/';

async function checkDriverUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // หา user ที่มี role เป็น driver
    const driverUser = await User.findOne({ role: 'driver' });
    console.log('Driver User:', driverUser);

    // หา driver record ที่ควรเชื่อมโยงกับ user นี้
    const driver = await Driver.findOne({ email: driverUser.email });
    console.log('Driver Record:', driver);

    if (!driver) {
      console.log('No matching driver found. Creating one...');
      await Driver.create({
        name: driverUser.name,
        email: driverUser.email,
        employeeId: 'D001',
        phone: '555-0101',
        status: 'active',
        checkInStatus: 'checked-out'
      });
      console.log('Driver created');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDriverUser();