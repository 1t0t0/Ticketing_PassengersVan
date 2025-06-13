// scripts/seed-phone-users.js
// Run this script to create demo users with phone numbers
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection (adjust your connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bus-ticket-system';

// User Schema (same as your model)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  email: { 
    type: String, 
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'staff', 'driver', 'station'], 
    required: true 
  },
  birthDate: Date,
  idCardNumber: String,
  idCardImage: String,
  userImage: String,
  employeeId: String,
  stationId: String,
  stationName: String,
  location: String,
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  checkInStatus: { 
    type: String, 
    enum: ['checked-in', 'checked-out'], 
    default: 'checked-out' 
  },
  lastCheckIn: Date,
  lastCheckOut: Date
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Demo users data
const demoUsers = [
  {
    name: 'ແອດມິນ ລະບົບ',
    phone: '0201111111', // 020-111-1111
    email: 'admin@busticketing.com',
    password: '123456',
    role: 'admin',
    employeeId: 'A-251213-111',
    status: 'active',
    checkInStatus: 'checked-out'
  },
  {
    name: 'ພະນັກງານ ຂາຍປີ້',
    phone: '0202222222', // 020-222-2222
    email: 'staff@busticketing.com',
    password: '123456',
    role: 'staff',
    employeeId: 'S-251213-222',
    status: 'active',
    checkInStatus: 'checked-out',
    birthDate: new Date('1995-05-15'),
    idCardNumber: 'ID123456789'
  },
  {
    name: 'ຄົນຂັບລົດ ຕົວຢ່າງ',
    phone: '0203333333', // 020-333-3333
    email: 'driver@busticketing.com',
    password: '123456',
    role: 'driver',
    employeeId: 'D-251213-333',
    status: 'active',
    checkInStatus: 'checked-out',
    birthDate: new Date('1990-03-20'),
    idCardNumber: 'ID987654321'
  },
  {
    name: 'ສະຖານີ ຫຼວງພະບາງ',
    phone: '0204444444', // 020-444-4444
    email: 'station@busticketing.com',
    password: '123456',
    role: 'station',
    stationId: 'ST-251213-444',
    stationName: 'ສະຖານີ ຫຼວງພະບາງ',
    location: 'ບ້ານ ນາໄຊ, ເມືອງ ຫຼວງພະບາງ, ແຂວງ ຫຼວງພະບາງ'
  }
];

async function seedUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    console.log('👥 Creating demo users...');
    
    for (const userData of demoUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with hashed password
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.name} (${userData.phone})`);
    }

    console.log('🎉 All demo users created successfully!');
    console.log('\n📱 Demo Login Credentials:');
    console.log('='.repeat(50));
    
    demoUsers.forEach(user => {
      const formattedPhone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      console.log(`${user.role.toUpperCase().padEnd(8)} | ${formattedPhone} | 123456`);
    });
    
    console.log('='.repeat(50));
    console.log('\n🚀 You can now login with any of these credentials!');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedUsers();