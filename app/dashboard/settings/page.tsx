'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchSettings();
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        alert('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-black mb-6">SYSTEM SETTINGS</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          {/* ตั้งค่าราคาตั๋ว */}
          <NeoCard className="p-6">
            <h2 className="text-xl font-bold mb-4">TICKET PRICING</h2>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">
                Ticket Price (THB)
              </label>
              <input
                type="number"
                value={settings?.ticketPrice || 0}
                onChange={(e) => setSettings({
                  ...settings,
                  ticketPrice: parseInt(e.target.value)
                })}
                className="neo-input"
                min="0"
              />
            </div>
          </NeoCard>

          {/* ตั้งค่าสัดส่วนรายได้ */}
          <NeoCard className="p-6">
            <h2 className="text-xl font-bold mb-4">REVENUE SHARING</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Company (%)
                </label>
                <input
                  type="number"
                  value={settings?.revenueSharing?.company || 0}
                  onChange={(e) => setSettings({
                    ...settings,
                    revenueSharing: {
                      ...settings.revenueSharing,
                      company: parseInt(e.target.value)
                    }
                  })}
                  className="neo-input"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  Station (%)
                </label>
                <input
                  type="number"
                  value={settings?.revenueSharing?.station || 0}
                  onChange={(e) => setSettings({
                    ...settings,
                    revenueSharing: {
                      ...settings.revenueSharing,
                      station: parseInt(e.target.value)
                    }
                  })}
                  className="neo-input"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  Drivers (%)
                </label>
                <input
                  type="number"
                  value={settings?.revenueSharing?.drivers || 0}
                  onChange={(e) => setSettings({
                    ...settings,
                    revenueSharing: {
                      ...settings.revenueSharing,
                      drivers: parseInt(e.target.value)
                    }
                  })}
                  className="neo-input"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total: {(settings?.revenueSharing?.company || 0) + 
                      (settings?.revenueSharing?.station || 0) + 
                      (settings?.revenueSharing?.drivers || 0)}%
            </p>
          </NeoCard>

          {/* ตั้งค่าเวลาทำการ */}
          <NeoCard className="p-6">
            <h2 className="text-xl font-bold mb-4">OPERATING HOURS</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings?.operatingHours?.start || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    operatingHours: {
                      ...settings.operatingHours,
                      start: e.target.value
                    }
                  })}
                  className="neo-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings?.operatingHours?.end || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    operatingHours: {
                      ...settings.operatingHours,
                      end: e.target.value
                    }
                  })}
                  className="neo-input"
                />
              </div>
            </div>
          </NeoCard>

          <NeoButton type="submit" className="w-full">
            SAVE SETTINGS
          </NeoButton>
        </div>
      </form>
    </div>
  );
}