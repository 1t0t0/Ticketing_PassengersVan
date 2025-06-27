// app/api/cars/route.ts - Debug version to check user population
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Car from '@/models/Car';
import CarType from '@/models/CarType';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get all cars with populated car type information - Enhanced with debugging
export async function GET(request: Request) {
  try {
    console.log('🚗 GET /api/cars called');
    
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Session found:', session.user?.email);
    await connectDB();
    console.log('✅ Database connected');
    
    // Get query parameters (optional)
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('user_id');
    
    // Build query
    const query: any = {};
    if (driverId) {
      query.user_id = driverId;
    }
    
    console.log('🔍 Cars API Query:', query);
    
    // Find cars and populate related data with detailed logging
    console.log('📋 Finding cars with population...');
    const cars = await Car.find(query)
      .populate({
        path: 'user_id',
        select: 'name email employeeId phone checkInStatus lastCheckIn lastCheckOut'
      })
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${cars.length} cars before CarType population`);
    
    // Log each car's driver info for debugging
    cars.forEach((car, index) => {
      console.log(`🚗 Car ${index + 1}:`, {
        registration: car.car_registration,
        name: car.car_name,
        driverInfo: car.user_id ? {
          name: car.user_id.name,
          employeeId: car.user_id.employeeId,
          checkInStatus: car.user_id.checkInStatus,
          lastCheckIn: car.user_id.lastCheckIn,
          lastCheckOut: car.user_id.lastCheckOut
        } : 'NO DRIVER ASSIGNED'
      });
    });
    
    // Manually populate car type information with better error handling
    const carsWithCarType = await Promise.all(
      cars.map(async (car, index) => {
        const carObj = car.toObject();
        
        try {
          if (carObj.car_type_id) {
            console.log(`🔧 Populating CarType for car ${index + 1}: ${carObj.car_registration}, CarType ID: ${carObj.car_type_id}`);
            
            const carType = await CarType.findById(carObj.car_type_id);
            
            if (carType) {
              carObj.carType = carType.toObject();
              console.log(`✅ CarType found for ${carObj.car_registration}: ${carType.carType_name}`);
            } else {
              console.warn(`❌ CarType not found for car ${carObj.car_registration} with CarType ID: ${carObj.car_type_id}`);
              carObj.carType = null;
            }
          } else {
            console.warn(`⚠️ Car ${carObj.car_registration} has no car_type_id`);
            carObj.carType = null;
          }
        } catch (error) {
          console.error(`🔥 Error populating CarType for car ${carObj.car_registration}:`, error);
          carObj.carType = null;
        }
        
        return carObj;
      })
    );
    
    // ✅ Additional debugging: Check all drivers' check-in status
    console.log('👥 Checking all drivers check-in status...');
    const allDrivers = await User.find({ role: 'driver' })
      .select('name employeeId checkInStatus lastCheckIn lastCheckOut')
      .sort({ name: 1 });
    
    console.log('📊 All drivers status:');
    allDrivers.forEach(driver => {
      console.log(`👤 ${driver.name} (${driver.employeeId}): ${driver.checkInStatus} - Last Check-in: ${driver.lastCheckIn}, Last Check-out: ${driver.lastCheckOut}`);
    });
    
    const checkedInDrivers = allDrivers.filter(d => d.checkInStatus === 'checked-in');
    console.log(`✅ Total checked-in drivers: ${checkedInDrivers.length}/${allDrivers.length}`);
    
    // Log final results
    const carsWithCheckedInDrivers = carsWithCarType.filter(car => 
      car.user_id && car.user_id.checkInStatus === 'checked-in'
    );
    const carsWithCheckedOutDrivers = carsWithCarType.filter(car => 
      car.user_id && car.user_id.checkInStatus === 'checked-out'
    );
    const carsWithoutDrivers = carsWithCarType.filter(car => !car.user_id);
    
    console.log(`📈 Final Results:`);
    console.log(`  🟢 Cars with checked-in drivers: ${carsWithCheckedInDrivers.length}`);
    console.log(`  🔴 Cars with checked-out drivers: ${carsWithCheckedOutDrivers.length}`);
    console.log(`  ⚪ Cars without drivers: ${carsWithoutDrivers.length}`);
    
    if (carsWithCheckedInDrivers.length > 0) {
      console.log('🟢 Checked-in cars:', carsWithCheckedInDrivers.map(car => ({
        registration: car.car_registration,
        driver: car.user_id?.name,
        status: car.user_id?.checkInStatus
      })));
    }
    
    return NextResponse.json(carsWithCarType);
  } catch (error) {
    console.error('💥 Get Cars Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars: ' + (error as Error).message },
      { status: 500 }
    );
  }
}