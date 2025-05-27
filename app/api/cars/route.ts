// app/api/cars/route.ts - Enhanced with better CarType population and debugging
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Car from '@/models/Car';
import CarType from '@/models/CarType';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get all cars with populated car type information - Enhanced
export async function GET(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Get query parameters (optional)
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('user_id');
    
    // Build query
    const query: any = {};
    if (driverId) {
      query.user_id = driverId;
    }
    
    console.log('Cars API Query:', query); // Debug log
    
    // Find cars and populate related data
    const cars = await Car.find(query)
      .populate('user_id', 'name email employeeId')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${cars.length} cars before CarType population`); // Debug log
    
    // Manually populate car type information with better error handling
    const carsWithCarType = await Promise.all(
      cars.map(async (car, index) => {
        const carObj = car.toObject();
        
        try {
          if (carObj.car_type_id) {
            console.log(`Populating CarType for car ${index + 1}: ${carObj.car_registration}, CarType ID: ${carObj.car_type_id}`);
            
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
    
    // Log final results
    const carsWithTypes = carsWithCarType.filter(car => car.carType !== null);
    const carsWithoutTypes = carsWithCarType.filter(car => car.carType === null);
    
    console.log(`📊 Final Results: ${carsWithTypes.length} cars with CarType, ${carsWithoutTypes.length} cars without CarType`);
    
    if (carsWithoutTypes.length > 0) {
      console.log('Cars without CarType:', carsWithoutTypes.map(car => ({
        registration: car.car_registration,
        carTypeId: car.car_type_id
      })));
    }
    
    return NextResponse.json(carsWithCarType);
  } catch (error) {
    console.error('Get Cars Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST method remains the same...
export async function POST(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Parse request body
    const body = await request.json();
    console.log('Car creation request body:', body);
    
    const { car_name, car_capacity, car_registration, car_type_id, user_id } = body;
    
    // Validate required fields
    if (!car_name || !car_registration || !user_id || !car_type_id) {
      console.error('Car validation failed:', { car_name, car_registration, user_id, car_type_id });
      return NextResponse.json(
        { error: 'Car name, registration, user ID, and car type are required' },
        { status: 400 }
      );
    }
    
    // Set default capacity if not provided
    const capacity = car_capacity || 10;
    
    // Auto-generate car ID (format: CAR-YYMMDD-XXX)
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last car to increment the counter
    const latestCar = await Car.findOne().sort({ car_id: -1 });
    let counter = 1;
    
    if (latestCar && latestCar.car_id) {
      const match = latestCar.car_id.match(/\d+$/);
      if (match) {
        counter = parseInt(match[0]) + 1;
      }
    }
    
    const counterStr = counter.toString().padStart(3, '0');
    const autoGeneratedCarId = `CAR-${year}${month}${day}-${counterStr}`;
    
    // Check if car with same registration already exists
    const existingCar = await Car.findOne({ car_registration });
    if (existingCar) {
      return NextResponse.json(
        { error: 'Car with this registration already exists' },
        { status: 409 }
      );
    }
    
    // Validate car type exists
    const carType = await CarType.findById(car_type_id);
    if (!carType) {
      return NextResponse.json(
        { error: 'Invalid car type ID' },
        { status: 400 }
      );
    }
    
    // Check if user exists and validate ObjectId
    try {
      const mongoose = require('mongoose');
      const validObjectId = mongoose.Types.ObjectId.isValid(user_id);
      
      if (!validObjectId) {
        return NextResponse.json(
          { error: 'Invalid user ID format' },
          { status: 400 }
        );
      }
      
      const user = await User.findById(user_id);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Create car data object with auto-generated ID and car type
      const carData = {
        car_id: autoGeneratedCarId,
        car_name,
        car_capacity: capacity,
        car_registration: car_registration.toUpperCase(),
        car_type_id,
        user_id
      };
      
      console.log('Creating car with data:', carData);
      
      // Create car
      const newCar = await Car.create(carData);
      console.log('Car created successfully with ID:', autoGeneratedCarId);
      
      // Populate the car type information before returning
      const populatedCar = await Car.findById(newCar._id)
        .populate('user_id', 'name email employeeId');
      
      const carObj = populatedCar.toObject();
      carObj.carType = carType.toObject(); // Add the CarType data
      
      return NextResponse.json(carObj);
    } catch (innerError) {
      console.error('Error during car creation process:', innerError);
      return NextResponse.json(
        { error: 'Error processing car data: ' + (innerError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create Car Error:', error);
    return NextResponse.json(
      { error: 'Failed to create car: ' + (error as Error).message },
      { status: 500 }
    );
  }
}