'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Copy, 
  Camera,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { formatTimeRemaining, formatDateLao } from '@/lib/bookingUtils';

interface BookingData {
  id: string;
  booking_id: string;
  travel_date: string;
  total_tickets: number;
  total_price: number;
  booker_email: string;
  passenger_emails: string[];
  status: string;
  payment_slip?: string;
  expires_at: string;
  time_remaining: number;
  can_approve: boolean;
}

export default function BookingPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>({});

  // ข้อมูลธนาคาร (ในระบบจริงควรมาจาก API หรือ config)
  const bankInfo = {
    bank_name: 'ທະນາຄານ BCEL One',
    account_number: '1234-5678-9012-3456',
    account_name: 'ບໍລິສັດ ລົດເມ ລາວ ຈຳກັດ',
    branch: 'ສາຂາສະຖານີລົດໄຟ'
  };

  // โหลดข้อมูลการจอง
  useEffect(() => {
    fetchBookingData();
  }, [params.id]);

  // อัปเดตเวลาที่เหลือทุกนาที
  useEffect(() => {
    const interval = setInterval(() => {
      if (booking && booking.time_remaining > 0) {
        setBooking(prev => prev ? {
          ...prev,
          time_remaining: Math.max(0, prev.time_remaining - 60000) // ลบ 1 นาที
        } : null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [booking]);

  const fetchBookingData = async () => {
    try {
      const response = await fetch(`/api/bookings/${params.id}?public=true`);
      
      if (!response.ok) {
        throw new Error('ไม่พบข้อมูลการจอง');
      }
      
      const result = await response.json();
      setBooking(result.booking);
      
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      router.push('/booking');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)');
      return;
    }
    
    // ตรวจสอบขนาดไฟล์ (สูงสุด 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }
    
    setSelectedFile(file);
    
    // สร้าง preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !booking) {
      alert('กรุณาเลือกไฟล์ก่อน');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('payment_slip', selectedFile);
      formData.append('booker_email', booking.booker_email);

      const response = await fetch(`/api/bookings/${params.id}/upload-slip`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }

      console.log('Upload successful:', result.booking.booking_id);
      
      // อัปเดตข้อมูลการจอง
      setBooking(prev => prev ? {
        ...prev,
        payment_slip: result.booking.payment_slip,
        can_approve: result.booking.can_approve
      } : null);

      // ไปหน้าเช็คสถานะ
      router.push(`/booking/status/${params.id}`);

    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lo-LA').format(amount) + ' ₭';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลการจอง</h1>
          <button
            onClick={() => router.push('/booking')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            กลับหน้าจอง
          </button>
        </div>
      </div>
    );
  }

  const isExpired = booking.time_remaining <= 0;
  const hasPaymentSlip = !!booking.payment_slip;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/booking')}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ຊຳລະເງິນ</h1>
                <p className="text-gray-600">ເລກຈອງ: {booking.booking_id}</p>
              </div>
            </div>
            
            {/* เวลาที่เหลือ */}
            <div className={`text-center ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-semibold">
                {isExpired ? 'ໝົດເວລາແລ້ວ' : formatTimeRemaining(booking.time_remaining)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* แจ้งเตือนหมดอายุ */}
        {isExpired && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">ການຈອງໝົດເວລາແລ້ວ</h3>
                <p className="text-sm text-red-700 mt-1">
                  ການຈອງນີ້ໝົດເວລາຊຳລະເງິນແລ້ວ ກະລຸນາທຳການຈອງໃໝ່
                </p>
              </div>
            </div>
          </div>
        )}

        {/* แจ้งเตือนอัปโหลดสำเร็จ */}
        {hasPaymentSlip && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">ອັບໂຫຼດສຳເລັດ</h3>
                <p className="text-sm text-green-700 mt-1">
                  ສະລິບການໂອນເງິນຖືກອັບໂຫຼດແລ້ວ ລໍຖ້າການອະນຸມັດຈາກພະນັກງານ
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* ข้อมูลการโอนเงิน */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ข้อมูลธนาคาร */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                ຂໍ້ມູນການໂອນເງິນ
              </h3>
              
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ທະນາຄານ:</span>
                  <span className="font-semibold">{bankInfo.bank_name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ເລກບັນຊີ:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-semibold">{bankInfo.account_number}</span>
                    <button
                      onClick={() => copyToClipboard(bankInfo.account_number, 'account')}
                      className="p-1 hover:bg-blue-200 rounded"
                    >
                      {copySuccess.account ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ຊື່ບັນຊີ:</span>
                  <span className="font-semibold">{bankInfo.account_name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ສາຂາ:</span>
                  <span className="font-semibold">{bankInfo.branch}</span>
                </div>
                
                <hr className="border-blue-200" />
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ຈຳນວນເງິນ:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-blue-600">{formatPrice(booking.total_price)}</span>
                    <button
                      onClick={() => copyToClipboard(booking.total_price.toString(), 'amount')}
                      className="p-1 hover:bg-blue-200 rounded"
                    >
                      {copySuccess.amount ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ເລກອ້າງອີງ:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-semibold">{booking.booking_id}</span>
                    <button
                      onClick={() => copyToClipboard(booking.booking_id, 'reference')}
                      className="p-1 hover:bg-blue-200 rounded"
                    >
                      {copySuccess.reference ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold">ຂໍ້ກຳນົດການໂອນເງິນ:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• ໂອນເງິນຄັ້ງດຽວເຕັມຈຳນວນ</li>
                      <li>• ໃສ່ເລກອ້າງອີງໃນຊ່ອງໝາຍເຫດ</li>
                      <li>• ຖ່າຍຮູບສະລິບໃຫ້ຊັດເຈນ</li>
                      <li>• ອັບໂຫຼດພາຍໃນ 24 ຊົ່ວໂມງ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* อัปโหลดสลิป */}
            {!isExpired && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  ອັບໂຫຼດສະລິບການໂອນເງິນ
                </h3>
                
                {!hasPaymentSlip ? (
                  <div className="space-y-4">
                    {/* Drop zone */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        {previewUrl ? (
                          <div className="space-y-3">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-lg shadow-md"
                            />
                            <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                            <p className="text-xs text-gray-500">
                              ຄລິກເພື່ອເປລິ່ຍນຮູບ
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                            <div>
                              <p className="text-lg font-medium text-gray-900">
                                ຄລິກເພື່ອເລືອກຮູບສະລິບ
                              </p>
                              <p className="text-sm text-gray-500">
                                ຮອງຮັບ JPEG, PNG, WebP (ສູງສຸດ 5MB)
                              </p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                    
                    {/* ปุ่มอัปโหลด */}
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>ກຳລັງອັບໂຫຼດ...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>ອັບໂຫຼດສະລິບ</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      ອັບໂຫຼດສຳເລັດແລ້ວ
                    </h4>
                    <p className="text-gray-600 mb-4">
                      ສະລິບການໂອນເງິນຖືກອັບໂຫຼດແລ້ວ ລໍຖ້າການອະນຸມັດ
                    </p>
                    <button
                      onClick={() => router.push(`/booking/status/${params.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center space-x-2"
                    >
                      <span>ເຊັກສະຖານະ</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* สรุปการจอง */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 ສະຫຼຸບການຈອງ</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">ເລກຈອງ:</span>
                  <span className="font-mono font-semibold">{booking.booking_id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">ວັນທີ່ເດີນທາງ:</span>
                  <span className="font-semibold">{formatDateLao(booking.travel_date)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">ຈຳນວນຜູ້ໂດຍສານ:</span>
                  <span className="font-semibold">{booking.total_tickets} ຄົນ</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">ຜູ້ຈອງ:</span>
                  <span className="font-semibold text-sm">{booking.booker_email}</span>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">ຍອດຊຳລະ:</span>
                  <span className="font-bold text-blue-600">{formatPrice(booking.total_price)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">ສະຖານະ:</span>
                  <span className={`font-semibold ${
                    booking.status === 'pending' ? 'text-orange-600' :
                    booking.status === 'approved' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {booking.status === 'pending' ? 'ລໍຖ້າອະນຸມັດ' :
                     booking.status === 'approved' ? 'ອະນຸມັດແລ້ວ' :
                     'ຍົກເລີກ'}
                  </span>
                </div>
              </div>

              {/* รายละเอียดผู้โดยสาร */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">📧 Email ຜູ້ໂດຍສານ:</h4>
                <div className="space-y-1">
                  {booking.passenger_emails.map((email, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="w-6 text-xs">{index + 1}.</span>
                      <span className="truncate">{email}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ข้อมูลการหมดอายุ */}
              <div className={`mt-4 p-4 rounded-xl ${
                isExpired ? 'bg-red-50' : 'bg-orange-50'
              }`}>
                <div className="flex items-start space-x-2">
                  <Clock className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isExpired ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <div className={`text-sm ${
                    isExpired ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    <p className="font-semibold">
                      {isExpired ? 'ໝົດເວລາແລ້ວ' : 'ເວລາທີ່ເຫຼືອ:'}
                    </p>
                    {!isExpired && (
                      <p className="mt-1 font-mono text-lg">
                        {formatTimeRemaining(booking.time_remaining)}
                      </p>
                    )}
                    <p className="mt-1 text-xs">
                      {isExpired 
                        ? 'ກະລຸນາທຳການຈອງໃໝ່' 
                        : 'ຫຼັງຈາກນີ້ການຈອງຈະຖືກຍົກເລີກ'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* ขั้นตอนต่อไป */}
              {!isExpired && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">🔄 ຂັ້ນຕອນຕໍ່ໄປ:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    {!hasPaymentSlip ? (
                      <>
                        <p>1. ໂອນເງິນຕາມຂໍ້ມູນຂ້າງເທິງ</p>
                        <p>2. ຖ່າຍຮູບສະລິບການໂອນ</p>
                        <p>3. ອັບໂຫຼດສະລິບໃນໜ້ານີ້</p>
                        <p>4. ລໍຖ້າການອະນຸມັດຈາກພະນັກງານ</p>
                      </>
                    ) : (
                      <>
                        <p>✅ ສະລິບຖືກອັບໂຫຼດແລ້ວ</p>
                        <p>⏳ ລໍຖ້າການອະນຸມັດ (ພາຍໃນ 24 ຊົ່ວໂມງ)</p>
                        <p>📧 ຈະໄດ້ຮັບຕີ້ທາງ Email ເມື່ອອະນຸມັດ</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ปุ่มดำเนินการล่าง */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/booking')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <span>ຈອງໃໝ່</span>
          </button>
          
          <button
            onClick={() => router.push(`/booking/status/${params.id}`)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <span>ເຊັກສະຖານະການຈອງ</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}