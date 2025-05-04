'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoButton from '@/components/ui/NeoButton';
import NeoCard from '@/components/ui/NeoCard';

export default function DriverCheckInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState('');
  
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    } else if (session.user.role !== 'driver') {
      router.push('/dashboard');
    } else {
      fetchDriverStatus();
    }
  }, [session, status, router]);

  const fetchDriverStatus = async () => {
    try {
      const response = await fetch('/api/drivers');
      const drivers = await response.json();
      const currentDriver = drivers.find(d => d.email === session?.user.email);
      if (currentDriver) {
        setCheckInStatus(currentDriver.checkInStatus);
      }
    } catch (error) {
      console.error('Error fetching driver status:', error);
    }
  };
  
  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/drivers/${session?.user.id}/check-in`, {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Check-in successful!');
        setCheckInStatus('checked-in');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to check in');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/drivers/${session?.user.id}/check-out`, {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Check-out successful!');
        setCheckInStatus('checked-out');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to check out');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Failed to check out');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neo-yellow p-6">
      <div className="max-w-md mx-auto">
        <NeoCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">Driver Check-In</h2>
          
          <div className="mb-4">
            <p className="font-bold">Driver: {session?.user?.name}</p>
            <p>Status: <span className={`font-bold ${checkInStatus === 'checked-in' ? 'text-green-600' : 'text-red-600'}`}>
              {checkInStatus?.toUpperCase()}
            </span></p>
          </div>

          {checkInStatus === 'checked-out' ? (
            <NeoButton 
              onClick={handleCheckIn} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Checking in...' : 'CHECK IN'}
            </NeoButton>
          ) : (
            <NeoButton 
              onClick={handleCheckOut} 
              disabled={isLoading}
              className="w-full"
              variant="danger"
            >
              {isLoading ? 'Checking out...' : 'CHECK OUT'}
            </NeoButton>
          )}
          
          <NeoButton 
            onClick={() => router.push('/driver-portal')} 
            variant="secondary"
            className="w-full mt-4"
          >
            BACK TO DASHBOARD
          </NeoButton>
        </NeoCard>
      </div>
    </div>
  );
}