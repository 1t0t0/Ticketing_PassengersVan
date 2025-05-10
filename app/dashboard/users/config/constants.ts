import { User, Car } from '../types';

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

// ค่าเริ่มต้นสำหรับรถใหม่
export const DEFAULT_CAR: Partial<Car> = {
  car_name: '',
  car_capacity: 10,
  car_registration: '',
  car_type: 'van'
};

// ประเภทรถ
export const CAR_TYPES = [
  { value: 'van', label: 'ລົດຕູ້ (Van)' },
  { value: 'minibus', label: 'ລົດມິນິບັສ (Minibus)' },
  { value: 'bus', label: 'ລົດບັສ (Bus)' },
  { value: 'sedan', label: 'ລົດເກັງ (Sedan)' }
];