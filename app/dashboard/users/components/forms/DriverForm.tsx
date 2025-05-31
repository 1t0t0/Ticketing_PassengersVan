// DriverForm.tsx - Optimized version with reduced lines
import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiCalendar, FiCreditCard, FiCamera, FiTruck, FiSettings, FiPlus } from 'react-icons/fi';
import { FormField, PasswordField, ImageUpload, usePasswordReset } from './shared';
import { User } from '../../types';
import notificationService from '@/lib/notificationService';

interface CarType { _id: string; carType_id: string; carType_name: string; }
interface CarData { car_name: string; car_capacity: number; car_registration: string; car_type_id: string; }

interface DriverFormProps {
  user: Partial<User>; updateUser: (field: string, value: string | number) => void;
  idCardImageFile: File | null; userImageFile: File | null;
  setIdCardImageFile: (file: File | null) => void; setUserImageFile: (file: File | null) => void;
  uploadProgress: number; idCardImagePreview?: string | null; userImagePreview?: string | null;
  isEditing?: boolean; handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => void;
  onCarDataChange?: (carData: CarData | null) => void; carData?: CarData | null;
}

// Combined hook for car types
const useCarTypes = () => {
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCarTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/car-types');
      if (response.ok) setCarTypes(await response.json());
      else notificationService.error('ບໍ່ສາມາດໂຫລດປະເພດລົດໄດ້');
    } catch (error) {
      notificationService.error('ບໍ່ສາມາດໂຫລດປະເພດລົດໄດ້');
    } finally { setLoading(false); }
  };

  const addCarType = async (name: string): Promise<CarType | null> => {
    try {
      const response = await fetch('/api/car-types', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carType_name: name.trim() })
      });
      if (response.ok) {
        const newCarType = await response.json();
        setCarTypes(prev => [...prev, newCarType]);
        notificationService.success('ເພີ່ມປະເພດລົດສຳເລັດ');
        return newCarType;
      } else throw new Error((await response.json()).error || 'Failed to add car type');
    } catch (error: any) {
      notificationService.error(`ບໍ່ສາມາດເພີ່ມປະເພດລົດໄດ້: ${error.message}`);
      return null;
    }
  };

  return { carTypes, loading, fetchCarTypes, addCarType };
};

// Compact car type selector
const CarTypeSelector: React.FC<{
  value: string; onChange: (value: string) => void; carTypes: CarType[];
  loading: boolean; onAddNew: (name: string) => Promise<CarType | null>;
}> = ({ value, onChange, carTypes, loading, onAddNew }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return notificationService.error('ກະລຸນາກຣອກຊື່ປະເພດລົດ');
    setAdding(true);
    const newCarType = await onAddNew(newName);
    setAdding(false);
    if (newCarType) { onChange(newCarType._id); setNewName(''); setShowAdd(false); }
  };

  return (
    <div>
      <label className="block text-sm font-bold mb-2">ປະເພດລົດ</label>
      <div className="flex gap-2">
        <select className="flex-1 border-2 border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
          value={value} onChange={(e) => onChange(e.target.value)} disabled={loading} required>
          <option value="">{loading ? 'ກຳລັງໂຫລດ...' : '-- ເລືອກປະເພດລົດ --'}</option>
          {carTypes.map((type) => <option key={type._id} value={type._id}>{type.carType_name}</option>)}
        </select>
        <button type="button" className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowAdd(true)}><FiPlus size={18} /></button>
      </div>
      
      {value && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          <span className="text-blue-700">ປະເພດທີ່ເລືອກ: <strong>{carTypes.find(t => t._id === value)?.carType_name}</strong></span>
        </div>
      )}

      {showAdd && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-semibold mb-2 text-blue-700">ເພີ່ມປະເພດລົດໃໝ່</h5>
          <div className="flex gap-2">
            <input type="text" className="flex-1 border-2 border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
              placeholder="ຊື່ປະເພດລົດ" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()} />
            <button type="button" className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
              onClick={handleAdd} disabled={adding || !newName.trim()}>{adding ? 'ກຳລັງເພີ່ມ...' : 'ເພີ່ມ'}</button>
            <button type="button" className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              onClick={() => { setShowAdd(false); setNewName(''); }}>ຍົກເລີກ</button>
          </div>
        </div>
      )}
    </div>
  );
};

const DriverForm: React.FC<DriverFormProps> = ({
  user, updateUser, idCardImageFile, userImageFile, setIdCardImageFile, setUserImageFile,
  uploadProgress, idCardImagePreview, userImagePreview, isEditing = false, 
  handleFileChange, onCarDataChange, carData: initialCarData
}) => {
  const { showTempPassword, tempPassword, loading: resetLoading, handleReset } = usePasswordReset(user._id, updateUser);
  const { carTypes, loading: carTypesLoading, fetchCarTypes, addCarType } = useCarTypes();
  const [carData, setCarData] = useState<CarData>(initialCarData || { car_name: '', car_capacity: 10, car_registration: '', car_type_id: '' });

  useEffect(() => { fetchCarTypes(); }, []);
  useEffect(() => { if (initialCarData) setCarData(initialCarData); }, [initialCarData]);

  const updateCarData = (field: keyof CarData, value: string | number) => {
    const updated = { ...carData, [field]: value };
    setCarData(updated);
    onCarDataChange?.(updated);
  };

  const formatDateForInput = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 10);
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    try { return new Date(dateStr).toISOString().substring(0, 10); } catch { return ''; }
  };

  const fileChangeHandler = handleFileChange || ((e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      type === 'idCard' ? setIdCardImageFile(file) : setUserImageFile(file);
    }
  });

  const personalFields = [
    { label: "ຊື່ ແລະ ນາມສະກຸນ", icon: <FiUser />, value: user.name || '', field: 'name', required: true },
    { label: "ວັນເດືອນປີເກີດ", type: "date", icon: <FiCalendar />, value: formatDateForInput(user.birthDate), field: 'birthDate', required: true },
    { label: "ອີເມວ", type: "email", icon: <FiMail />, value: user.email || '', field: 'email', required: true },
    { label: "ເບີໂທລະສັບ", type: "tel", icon: <FiPhone />, value: user.phone || '', field: 'phone', placeholder: "0812345678" },
    { label: "ເລກບັດປະຈຳຕົວ", icon: <FiCreditCard />, value: user.idCardNumber || '', field: 'idCardNumber', required: true }
  ];

  const carFields = [
    { label: "ຊື່ລົດ / ຮຸ່ນລົດ", icon: <FiTruck />, value: carData.car_name, field: 'car_name' as keyof CarData, placeholder: "Toyota Commuter", required: true },
    { label: "ຄວາມຈຸລົດ (ຈຳນວນທີ່ນັ່ງ)", type: "number", icon: <FiUser />, value: carData.car_capacity.toString(), field: 'car_capacity' as keyof CarData, min: "1", required: true },
    { label: "ໝາຍເລກທະບຽນລົດ", icon: <FiCreditCard />, value: carData.car_registration, field: 'car_registration' as keyof CarData, placeholder: "ABC-1234", required: true }
  ];

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          <FiUser className="inline mr-2" />ຂໍ້ມູນທົ່ວໄປ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalFields.map(({ field, ...props }) => (
            <FormField key={field} {...props} onChange={(e) => updateUser(field, e.target.value)} />
          ))}
          <PasswordField value={user.password || ''} onChange={(value) => updateUser('password', value)}
            isEditing={isEditing} onReset={handleReset} loading={resetLoading}
            showTempPassword={showTempPassword} tempPassword={tempPassword} />
        </div>
      </div>
      
      {/* Images */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          <FiCamera className="inline mr-2" />ຮູບພາບ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUpload label="ຮູບບັດປະຈຳຕົວ" file={idCardImageFile} preview={idCardImagePreview}
            onFileChange={(e) => fileChangeHandler(e, 'idCard')} onRemove={() => setIdCardImageFile(null)} id="idCardImage" />
          <ImageUpload label="ຮູບຖ່າຍ" file={userImageFile} preview={userImagePreview}
            onFileChange={(e) => fileChangeHandler(e, 'user')} onRemove={() => setUserImageFile(null)} id="userImage" />
        </div>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">ກຳລັງອັບໂຫລດ: {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Car Info */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-green-600 border-b border-green-200 pb-2">
          <FiTruck className="inline mr-2" />ຂໍ້ມູນລົດ
        </h4>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-700"><FiSettings className="inline mr-1" />ກະລຸນາກຣອກຂໍ້ມູນລົດທີ່ຄົນຂັບຄົນນີ້ຈະຮັບຜິດຊອບ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {carFields.map(({ field, ...props }) => (
            <FormField key={field} {...props} 
              onChange={(e) => updateCarData(field, field === 'car_capacity' ? parseInt(e.target.value) || 10 : 
                field === 'car_registration' ? e.target.value.toUpperCase() : e.target.value)} />
          ))}
          <CarTypeSelector value={carData.car_type_id} onChange={(value) => updateCarData('car_type_id', value)}
            carTypes={carTypes} loading={carTypesLoading} onAddNew={addCarType} />
        </div>

        {/* Car Summary */}
        {carData.car_name && carData.car_registration && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h5 className="font-semibold mb-2 text-gray-700">ສະຫຼຸບຂໍ້ມູນລົດ</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>ລົດ:</strong> {carData.car_name}</p>
              <p><strong>ທະບຽນ:</strong> {carData.car_registration}</p>
              <p><strong>ຄວາມຈຸ:</strong> {carData.car_capacity} ທີ່ນັ່ງ</p>
              {carData.car_type_id && <p><strong>ປະເພດ:</strong> {carTypes.find(t => t._id === carData.car_type_id)?.carType_name}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverForm;