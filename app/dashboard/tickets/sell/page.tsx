// app/dashboard/tickets/sell/page.tsx - FIXED with Car Refresh Integration
'use client';

import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiDollarSign } from 'react-icons/fi';
import TicketSalesForm from '../components/TicketSalesForm';
import RecentTicketsList from '../components/RecentTicketsList';
import TicketConfirmationModal from '../components/TicketConfirmationModal';
import StatsCards from '../components/StatsCards';
import useTicketSales from '../hooks/useTicketSales';

export default function SellTicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // ✅ เพิ่ม ref สำหรับ Modal component
  const modalRef = useRef<any>(null);

  const {
    ticketPrice,
    priceLoading,
    paymentMethod,
    setPaymentMethod,
    loading,
    showConfirmation,
    cancelConfirmation,
    confirmSellTicket,
    showConfirmModal,
    quantity,
    updateQuantity,
    ticketType,
    updateTicketType,
    destination,
    updateDestination,
    selectedCarRegistration,
    updateSelectedCar,
    registerCarRefreshCallback
  } = useTicketSales();

  // ✅ Register car refresh callback กับ Modal
  useEffect(() => {
    if (modalRef.current && modalRef.current.refreshCarData) {
      registerCarRefreshCallback(modalRef.current.refreshCarData);
      console.log('✅ Car refresh callback registered with Modal');
    }
  }, [showConfirmModal, registerCarRefreshCallback]);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !['admin', 'staff'].includes(session?.user?.role || '')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <FiDollarSign className="mr-3 text-green-600" />
                  ຂາຍປີ້ລົດຕູ້ໂດຍສານ
                </h1>
                <p className="text-gray-600 mt-1">ລະບົບອອກປີ້ອັດຕະໂນມັດ</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">ສະບາຍດີ, {session?.user?.name}</p>
                <p className="text-xs text-gray-400">{session?.user?.role === 'admin' ? 'ຜູ້ຄຸ້ມຄອງ' : 'ພະນັກງານ'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Form - Take 1/3 of space */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FiDollarSign className="mr-2 text-green-600" />
                ອອກປີ້ໃໝ່
              </h2>
              
              {priceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-gray-600">ກຳລັງໂຫລດລາຄາ...</span>
                </div>
              ) : (
                <TicketSalesForm
                  ticketPrice={ticketPrice}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  onSellTicket={showConfirmation}
                  loading={loading}
                />
              )}
            </div>
          </div>

          {/* Recent Tickets List - Take 2/3 of space */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FiUsers className="mr-2 text-blue-600" />
                ປີ້ທີ່ອອກຫຼ້າສຸດ
              </h2>
              <RecentTicketsList />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Enhanced Confirmation Modal with ref */}
      <TicketConfirmationModal
        ref={modalRef}
        isOpen={showConfirmModal}
        ticketPrice={ticketPrice}
        paymentMethod={paymentMethod}
        quantity={quantity}
        onQuantityChange={updateQuantity}
        onConfirm={confirmSellTicket}
        onCancel={cancelConfirmation}
        loading={loading}
        ticketType={ticketType}
        onTicketTypeChange={updateTicketType}
        destination={destination}
        onDestinationChange={updateDestination}
        selectedCarRegistration={selectedCarRegistration}
        onCarChange={updateSelectedCar}
      />
    </div>
  );
}