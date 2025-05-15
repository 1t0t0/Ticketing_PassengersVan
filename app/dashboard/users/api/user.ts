// app/dashboard/users/api/user.ts
// API functions สำหรับการจัดการผู้ใช้
import { User, NewUser } from '../types';

// ดึงข้อมูลผู้ใช้ทั้งหมด
// app/dashboard/users/api/user.ts
// app/dashboard/users/api/user.ts
export async function fetchAllUsers(): Promise<User[]> {
  try {
    console.log('Calling API to fetch all users');
    const response = await fetch('/api/users');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching users:', errorText);
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API returned users count:', data.length);
    
    // ตรวจสอบข้อมูล userImage
    if (data.length > 0) {
      console.log('First user from API:', {
        id: data[0]._id,
        name: data[0].name,
        hasUserImage: !!data[0].userImage
      });
      
      // ตรวจสอบว่าข้อมูล userImage ถูกส่งกลับมาหรือไม่
      const usersWithImages = data.filter(user => !!user.userImage);
      console.log(`Users with userImage: ${usersWithImages.length} out of ${data.length}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchAllUsers:', error);
    throw error;
  }
}

// ดึงข้อมูลผู้ใช้ตามบทบาท
export async function fetchUsersByRole(role: string): Promise<User[]> {
  const response = await fetch(`/api/users?role=${role}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${role}s`);
  }
  
  return response.json();
}

// เปลี่ยนสถานะการเช็คอิน/เช็คเอาท์
export async function checkInOutUser(userId: string, status: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkInStatus: status }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update check in status');
  }
}

// สร้างผู้ใช้ใหม่
export async function createUser(userData: NewUser): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create user');
  }
  
  return response.json();
}

// ลบผู้ใช้
export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      // Get response text for debugging
      const responseText = await response.text();
      
      let errorMessage = `Failed to delete user: ${response.status} ${response.statusText}`;
      
      try {
        // Try to parse as JSON if possible
        if (responseText) {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        }
      } catch (jsonError) {
        console.error('Response is not JSON:', responseText);
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

