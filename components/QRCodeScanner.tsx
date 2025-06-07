// components/QRCodeScanner.tsx - QR Code Scanner สำหรับ Driver Portal
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FiCamera, FiX, FiRotateCw } from 'react-icons/fi';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // เริ่มกล้อง
  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // เริ่มสแกน
      startScanning();
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
      onError?.('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
    }
  };

  // หยุดกล้อง
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setScanning(false);
  };

  // เริ่มสแกน QR Code
  const startScanning = () => {
    setScanning(true);
    
    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 100); // สแกนทุก 100ms
  };

  // สแกนเฟรมปัจจุบัน
  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // ตั้งค่าขนาด canvas ให้เท่ากับ video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // วาดเฟรมจาก video ลง canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ดึง ImageData สำหรับสแกน
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // ใช้ jsQR library สำหรับ decode QR Code
      const { default: jsQR } = await import('jsqr');
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // พบ QR Code
        console.log('QR Code detected:', code.data);
        
        // ตรวจสอบว่าเป็น QR Code ของตั๋วหรือไม่
        try {
          const qrData = JSON.parse(code.data);
          if (qrData.forDriverOnly && qrData.ticketNumber) {
            stopCamera();
            onScan(qrData.ticketNumber);
          } else {
            console.log('Not a valid ticket QR code');
          }
        } catch (parseError) {
          // ถ้า parse ไม่ได้ ลองใช้เป็น ticket number โดยตรง
          stopCamera();
          onScan(code.data);
        }
      }
    } catch (error) {
      console.error('QR scanning error:', error);
    }
  };

  // สลับกล้องหน้า/หลัง
  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isOpen) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  // เมื่อ modal เปิด/ปิด
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <FiCamera className="mr-2" />
            <h3 className="font-bold">ສະແກນ QR Code</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={switchCamera}
              className="p-2 hover:bg-blue-600 rounded transition-colors"
              title="สลับกล้อง"
            >
              <FiRotateCw />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-600 rounded transition-colors"
            >
              <FiX />
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          {hasPermission === false ? (
            <div className="aspect-video flex items-center justify-center text-white text-center p-4">
              <div>
                <FiCamera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">ບໍ່ສາມາດເຂົ້າເຖິງກ້ອງຖ່າຍຮູບໄດ້</p>
                <p className="text-xs mt-2 opacity-75">ກະລຸນາອະນຸຍາດການໃຊ້ງານກ້ອງ</p>
                <button
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  ລອງໃໝ່
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover"
              />
              
              {/* Overlay สำหรับจุดเป้า */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-400"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-400"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-400"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-400"></div>
                </div>
              </div>

              {/* Status */}
              {scanning && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                    <div className="animate-pulse w-2 h-2 bg-white rounded-full mr-2"></div>
                    ກຳລັງສະແກນ...
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            ວາງ QR Code ຢູ່ໃນກ່ອງສີ່ແຈ່ງ
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ລະບົບຈະອ່ານ QR Code ອັດຕະໂນມັດ
          </p>
        </div>

        {/* Hidden canvas for processing */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default QRCodeScanner;