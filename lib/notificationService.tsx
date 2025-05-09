import { toast, ToastOptions } from 'react-toastify';

// กำหนด options มาตรฐานสำหรับ toast
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  pauseOnFocusLoss: false,
};

// ตรวจสอบว่า toast ถูกแสดงอยู่แล้วหรือไม่
const isToastActive = (id: string) => {
  return toast.isActive(id);
};

// ฟังก์ชันแจ้งเตือนความสำเร็จ
export const notifySuccess = (message: string, options?: ToastOptions) => {
  const toastId = 'success-toast-' + Date.now();
  return toast.success(message, { ...defaultOptions, toastId, ...options });
};

// ฟังก์ชันแจ้งเตือนข้อผิดพลาด
export const notifyError = (message: string, options?: ToastOptions) => {
  const toastId = 'error-toast-' + Date.now();
  return toast.error(message, { ...defaultOptions, toastId, ...options });
};

// ฟังก์ชันแจ้งเตือนข้อมูล
export const notifyInfo = (message: string, options?: ToastOptions) => {
  const toastId = 'info-toast-' + Date.now();
  return toast.info(message, { ...defaultOptions, toastId, ...options });
};

// ฟังก์ชันแจ้งเตือนคำเตือน
export const notifyWarning = (message: string, options?: ToastOptions) => {
  const toastId = 'warning-toast-' + Date.now();
  return toast.warning(message, { ...defaultOptions, toastId, ...options });
};

// ฟังก์ชันลบ toast ทั้งหมด
export const dismissAll = () => {
  toast.dismiss();
};

export default {
  success: notifySuccess,
  error: notifyError,
  info: notifyInfo,
  warning: notifyWarning,
  dismissAll,
  isActive: isToastActive
};