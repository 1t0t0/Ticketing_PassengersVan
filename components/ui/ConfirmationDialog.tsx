// components/ui/ConfirmationDialog.tsx
import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  // ใช้ portal เพื่อให้ modal อยู่นอก DOM hierarchy ของ component ที่เรียกใช้
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 z-10 overflow-hidden animate-fadeIn">
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-4">{message}</h3>
            
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                ຢືນຢັນ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationDialog;