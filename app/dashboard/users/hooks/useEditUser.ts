// app/dashboard/users/hooks/useEditUser.ts
import { useState, useCallback } from 'react';
import { User, Car, ApiError } from '../types';
import notificationService from '@/lib/notificationService';

export default function useEditUser(onSuccess: () => void) {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to update user
  const updateUser = useCallback(async (
    userId: string, 
    userData: Partial<User>, 
    carData?: Partial<Car>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare payload
      const payload: any = { ...userData };
      
      // Include car data if provided
      if (carData) {
        payload.car = carData;
      }
      
      // Call API
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      // Handle errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      // Parse response
      const data = await response.json();
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Show success notification
      notificationService.success('ອັບເດດຂໍ້ມູນສຳເລັດແລ້ວ');
      
      return data.user;
    } catch (error) {
      // Handle error
      const errorMessage = (error as ApiError).message || 'Failed to update user';
      setError(errorMessage);
      notificationService.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);
  
  return {
    loading,
    error,
    updateUser
  };
}