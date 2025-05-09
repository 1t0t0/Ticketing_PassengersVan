// hooks/useConfirmation.ts
import { useState, useCallback } from 'react';

interface UseConfirmationResult {
  isConfirmDialogOpen: boolean;
  confirmMessage: string;
  showConfirmation: (message: string, onConfirm: () => void) => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

/**
 * Hook สำหรับจัดการ confirmation dialog
 */
export const useConfirmation = (): UseConfirmationResult => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  // ฟังก์ชันแสดง confirmation dialog
  const showConfirmation = useCallback((message: string, onConfirm: () => void) => {
    setConfirmMessage(message);
    setOnConfirmCallback(() => onConfirm);
    setIsConfirmDialogOpen(true);
  }, []);

  // ฟังก์ชันเมื่อกดปุ่มยืนยัน
  const handleConfirm = useCallback(() => {
    setIsConfirmDialogOpen(false);
    if (onConfirmCallback) {
      onConfirmCallback();
    }
  }, [onConfirmCallback]);

  // ฟังก์ชันเมื่อกดปุ่มยกเลิก
  const handleCancel = useCallback(() => {
    setIsConfirmDialogOpen(false);
  }, []);

  return {
    isConfirmDialogOpen,
    confirmMessage,
    showConfirmation,
    handleConfirm,
    handleCancel,
  };
};

export default useConfirmation;