// components/ScanFeedbackModal.tsx - แสดงผลการสแกนพร้อม Assignment Info
'use client';

import React from 'react';
import { 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiX, 
  FiUsers, 
  FiTarget,
  FiTruck,
  FiClock
} from 'react-icons/fi';

interface ScanResult {
  success: boolean;
  message: string;
  status_message?: string;
  current_passengers: number;
  required_passengers: number;
  car_capacity: number;
  is_80_percent_reached: boolean;
  ticket_info: {
    ticket_number: string;
    ticket_type: 'individual' | 'group';
    passenger_count: number;
    price: number;
    was_assigned: boolean;
    assignment_verified: boolean;
  };
  assignment_info: {
    was_assigned: boolean;
    assigned_to_current_driver: boolean;
    verification_status: 'verified' | 'wrong_driver' | 'no_assignment';
  };
  group_ticket_info?: {
    is_group_ticket: boolean;
    total_passengers_in_group?: number;
    price_breakdown?: {
      price_per_person: number;
      total_group_price: number;
      calculation: string;
    };
  };
}

interface ScanFeedbackModalProps {
  isOpen: boolean;
  scanResult: ScanResult | null;
  onClose: () => void;
}

const ScanFeedbackModal: React.FC<ScanFeedbackModalProps> = ({
  isOpen,
  scanResult,
  onClose
}) => {
  if (!isOpen || !scanResult) return null;

  const getAssignmentIcon = () => {
    switch (scanResult.assignment_info.verification_status) {
      case 'verified':
        return '🎯';
      case 'wrong_driver':
        return '❌';
      case 'no_assignment':
        return '⚪';
      default:
        return '❓';
    }
  };

  const getAssignmentText = () => {
    switch (scanResult.assignment_info.verification_status) {
      case 'verified':
        return 'ປີ້ທີ່ໄດ້ຮັບມອບໝາຍໃຫ້ທ່ານ';
      case 'wrong_driver':
        return 'ປີ້ຖືກມອບໝາຍໃຫ້ຄົນຂັບຄົນອື່ນ';
      case 'no_assignment':
        return 'ປີ້ທົ່ວໄປ (ບໍ່ມີການມອບໝາຍ)';
      default:
        return 'ສະຖານະການມອບໝາຍບໍ່ຊັດເຈນ';
    }
  };

  const getAssignmentColor = () => {
    switch (scanResult.assignment_info.verification_status) {
      case 'verified':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'wrong_driver':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'no_assignment':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const progressPercentage = Math.min((scanResult.current_passengers / scanResult.required_passengers) * 100, 100);
  const occupancyPercentage = (scanResult.current_passengers / scanResult.car_capacity) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${scanResult.success ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {scanResult.success ? (
                <FiCheckCircle className="h-8 w-8 mr-3" />
              ) : (
                <FiAlertTriangle className="h-8 w-8 mr-3" />
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {scanResult.success ? 'ສະແກນສຳເລັດ!' : 'ເກີດຂໍ້ຜິດພາດ'}
                </h3>
                <p className="text-sm opacity-90">
                  ປີ້: {scanResult.ticket_info.ticket_number}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {scanResult.success ? (
            <>
              {/* Assignment Status */}
              <div className={`mb-4 p-3 rounded-lg border ${getAssignmentColor()}`}>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getAssignmentIcon()}</span>
                  <div>
                    <p className="font-semibold">{getAssignmentText()}</p>
                    {scanResult.ticket_info.ticket_type === 'group' && (
                      <p className="text-sm mt-1">
                        🎫 ປີ້ກຸ່ມ: {scanResult.ticket_info.passenger_count} ຄົນ
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trip Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">ຄວາມຄືບໜ້າ</span>
                  <span className="text-sm font-bold text-gray-900">
                    {scanResult.current_passengers}/{scanResult.car_capacity} ຄົນ
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      scanResult.is_80_percent_reached ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>ເປົ້າໝາຍ: {progressPercentage.toFixed(0)}%</span>
                  <span>ຄວາມຈຸ: {occupancyPercentage.toFixed(0)}%</span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <FiUsers className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-600">
                    {scanResult.current_passengers}
                  </div>
                  <div className="text-xs text-blue-600">ປັດຈຸບັນ</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <FiTarget className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-600">
                    {scanResult.required_passengers}
                  </div>
                  <div className="text-xs text-green-600">ເປົ້າໝາຍ</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FiTruck className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-600">
                    {scanResult.car_capacity}
                  </div>
                  <div className="text-xs text-gray-600">ຄວາມຈຸ</div>
                </div>
              </div>

              {/* Status Message */}
              {scanResult.status_message && (
                <div className={`p-3 rounded-lg border ${
                  scanResult.is_80_percent_reached 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  <p className="text-sm font-medium">{scanResult.status_message}</p>
                </div>
              )}

              {/* Group Ticket Details */}
              {scanResult.group_ticket_info?.is_group_ticket && scanResult.group_ticket_info.price_breakdown && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">🎫 ລາຍລະອຽດປີ້ກຸ່ມ</h4>
                  <div className="text-sm text-purple-700">
                    <p>ຈຳນວນຄົນ: {scanResult.group_ticket_info.total_passengers_in_group} ຄົນ</p>
                    <p>ການຄິດໄລ່: {scanResult.group_ticket_info.price_breakdown.calculation}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Error State
            <div className="text-center">
              <p className="text-red-600 font-medium mb-4">{scanResult.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              scanResult.success 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {scanResult.success ? 'ສືບຕໍ່ສະແກນ' : 'ລອງໃໝ່'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanFeedbackModal;