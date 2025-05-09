// lib/notificationService.ts
import { toast, ToastOptions } from 'react-toastify';

// กำหนด options มาตรฐานสำหรับ toast
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// ฟังก์ชันแจ้งเตือนความสำเร็จ
export const notifySuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, { ...defaultOptions, ...options });
};

// ฟังก์ชันแจ้งเตือนข้อผิดพลาด
export const notifyError = (message: string, options?: ToastOptions) => {
  return toast.error(message, { ...defaultOptions, ...options });
};

// ฟังก์ชันแจ้งเตือนข้อมูล
export const notifyInfo = (message: string, options?: ToastOptions) => {
  return toast.info(message, { ...defaultOptions, ...options });
};

// ฟังก์ชันแจ้งเตือนคำเตือน
export const notifyWarning = (message: string, options?: ToastOptions) => {
  return toast.warning(message, { ...defaultOptions, ...options });
};

// ฟังก์ชันลบ toast ทั้งหมด
export const dismissAll = () => {
  toast.dismiss();
};

// ฟังก์ชัน promise toast สำหรับใช้กับ async operations
export const notifyPromise = (
  promise: Promise<any>,
  { pending, success, error }: { 
    pending: string, 
    success: string, 
    error: string 
  },
  options?: ToastOptions
) => {
  return toast.promise(
    promise,
    {
      pending,
      success,
      error,
    },
    { ...defaultOptions, ...options }
  );
};

export default {
  success: notifySuccess,
  error: notifyError,
  info: notifyInfo,
  warning: notifyWarning,
  promise: notifyPromise,
  dismissAll,
};