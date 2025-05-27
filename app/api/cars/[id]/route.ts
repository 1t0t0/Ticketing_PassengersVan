// app/api/cars/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Car from '@/models/Car';
import CarType from '@/models/CarType';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get a single car by ID with populated data
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    // Find car by ID and populate related data
    const car = await Car.findById(params.id)
      .populate('user_id', 'name email employeeId phone');
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Convert to plain object
    const carObj = car.toObject();
    
    // Manually populate car type information
    try {
      if (carObj.car_type_id) {
        const carType = await CarType.findById(carObj.car_type_id);
        carObj.carType = carType;
      }
    } catch (error) {
      console.warn('Failed to populate car type for car:', carObj._id);
      carObj.carType = null;
    }
    
    return NextResponse.json(carObj);
  } catch (error) {
    console.error('Get Car Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update a car with enhanced validation and type support
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization (only admin can update cars)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can update cars' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Parse request body
    const body = await request.json();
    console.log('Car update request body:', body);
    
    const { car_name, car_capacity, car_registration, car_type_id, user_id } = body;
    
    // Find existing car
    const existingCar = await Car.findById(params.id);
    
    if (!existingCar) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }
    
    // Build update object with validation
    const updateData: any = {};
    
    if (car_name !== undefined) {
      if (!car_name || !car_name.trim()) {
        return NextResponse.json(
          { error: 'Car name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.car_name = car_name.trim();
    }
    
    if (car_capacity !== undefined) {
      const capacity = parseInt(car_capacity);
      if (isNaN(capacity) || capacity < 1) {
        return NextResponse.json(
          { error: 'Car capacity must be a positive number' },
          { status: 400 }
        );
      }
      updateData.car_capacity = capacity;
    }
    
    if (car_registration !== undefined) {
      if (!car_registration || !car_registration.trim()) {
        return NextResponse.json(
          { error: 'Car registration cannot be empty' },
          { status: 400 }
        );
      }
      
      // Check if registration number is already used by another car
      const existingRegistration = await Car.findOne({ 
        car_registration: car_registration.trim().toUpperCase(),
        _id: { $ne: params.id } // Exclude current car
      });
      
      if (existingRegistration) {
        return NextResponse.json(
          { error: 'Car with this registration already exists' },
          { status: 409 }
        );
      }
      
      updateData.car_registration = car_registration.trim().toUpperCase();
    }
    
    if (car_type_id !== undefined) {
      if (!car_type_id) {
        return NextResponse.json(
          { error: 'Car type is required' },
          { status: 400 }
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
      
      updateData.car_type_id = car_type_id;
    }
    
    if (user_id !== undefined) {
      if (!user_id) {
        return NextResponse.json(
          { error: 'Driver is required' },
          { status: 400 }
        );
      }
      
      // Validate user exists and is a driver
      const user = await User.findById(user_id);
      if (!user) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }
      
      if (user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Assigned user must be a driver' },
          { status: 400 }
        );
      }
      
      updateData.user_id = user_id;
    }
    
    // Update the car
    const updatedCar = await Car.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    ).populate('user_id', 'name email employeeId phone');
    
    if (!updatedCar) {
      return NextResponse.json(
        { error: 'Failed to update car' },
        { status: 500 }
      );
    }
    
    // Add car type information
    const carObj = updatedCar.toObject();
    try {
      if (carObj.car_type_id) {
        const carType = await CarType.findById(carObj.car_type_id);
        carObj.carType = carType;
      }
    } catch (error) {
      console.warn('Failed to populate car type for updated car:', carObj._id);
      carObj.carType = null;
    }
    
    console.log('Car updated successfully:', updatedCar.car_id);
    
    return NextResponse.json(carObj);
  } catch (error) {
    console.error('Update Car Error:', error);
    return NextResponse.json(
      { error: 'Failed to update car: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a car with enhanced validation
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization (only admin can delete cars)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can delete cars' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Find car first to get information before deletion
    const car = await Car.findById(params.id)
      .populate('user_id', 'name email employeeId');
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }
    
    // Store car information for response
    const carInfo = {
      car_id: car.car_id,
      car_name: car.car_name,
      car_registration: car.car_registration,
      driver: car.user_id
    };
    
    // Delete the car
    await Car.findByIdAndDelete(params.id);
    
    console.log('Car deleted successfully:', carInfo.car_id);
    
    return NextResponse.json({ 
      success: true,
      deletedCar: carInfo,
      message: `Car ${carInfo.car_registration} has been deleted successfully`
    });
  } catch (error) {
    console.error('Delete Car Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete car: ' + (error as Error).message },
      { status: 500 }
    );
  }
}