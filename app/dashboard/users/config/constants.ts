// app/dashboard/users/config/constants.ts
import { User } from '../types';

// ค่าคงที่สำหรับแท็บประเภทผู้ใช้
export const TABS = {
  drivers: 'ຄົນຂັບລົດ', 
  staff: 'ພະນັກງານຂາຍປີ້', 
  admin: 'ຜູ້ບໍລິຫານລະບົບ', 
  station: 'ສະຖານີ'
};

// ค่าเริ่มต้นสำหรับผู้ใช้ใหม่
export const DEFAULT_USER: Partial<User> = {
  name: '',
  email: '',
  password: '',
  role: 'driver',
  phone: '',
  birthDate: '',
  idCardNumber: '',
  idCardImage: '',
  userImage: ''
};