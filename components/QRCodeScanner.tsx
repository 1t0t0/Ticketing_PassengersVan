// components/QRCodeScanner.tsx - Fixed video play() error with original layout
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiCamera, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import jsQR from 'jsqr';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  onError: (error: string) => void;
}

export default function QRCodeScanner({ isOpen, onClose, onScan, onError }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // ✅ Fixed: Better video management with proper error handling
  const initializeCamera = async () => {
    if (!isOpen || isInitializedRef.current) return;
    
    try {
      setError(null);
      setScanning(true);
      
      // Stop any existing stream first
      if (stream) {
        await stopCamera();
      }

      // Request camera permission and stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera for QR scanning
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (!videoRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      setStream(mediaStream);
      setHasPermission(true);
      
      const video = videoRef.current;
      
      // ✅ Fixed: Proper video setup with error handling
      video.srcObject = mediaStream;
      
      // Wait for video metadata to load
      await new Promise<void>((resolve, reject) => {
        const handleLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (e: Event) => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('error', handleError);
          reject(new Error('Failed to load video metadata'));
        };
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', handleError);
      });

      // ✅ Fixed: Safe video play with proper error handling
      try {
        await video.play();
        isInitializedRef.current = true;
        startScanning();
      } catch (playError: any) {
        // Handle the specific play() error more gracefully
        if (playError.name === 'AbortError') {
          console.log('Video play was aborted, retrying...');
          // Try again after a short delay
          setTimeout(async () => {
            try {
              if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                await video.play();
                isInitializedRef.current = true;
                startScanning();
              }
            } catch (retryError) {
              console.error('Retry video play failed:', retryError);
              throw retryError;
            }
          }, 100);
        } else {
          throw playError;
        }
      }

    } catch (err: any) {
      console.error('Camera initialization error:', err);
      
      let errorMessage = 'ບໍ່ສາມາດເຂົ້າເຖິງກ້ອງຖ່າຍຮູບໄດ້';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'ກະລຸນາອະນຸຍາດການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບ';
        setHasPermission(false);
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'ບໍ່ພົບກ້ອງຖ່າຍຮູບ';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'ກ້ອງຖ່າຍຮູບກຳລັງຖືກໃຊ້ງານໂດຍແອບອື່ນ';
      }
      
      setError(errorMessage);
      setHasPermission(false);
      onError(errorMessage);
    } finally {
      setScanning(false);
    }
  };

  // ✅ Improved: Better camera cleanup
  const stopCamera = async () => {
    return new Promise<void>((resolve) => {
      // Stop scanning interval
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      // Stop video playback safely
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Pause the video first
        video.pause();
        
        // Clear the source
        video.srcObject = null;
        video.src = '';
        
        // Remove any event listeners
        video.onloadedmetadata = null;
        video.onerror = null;
      }

      // Stop all media tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
        setStream(null);
      }

      isInitializedRef.current = false;
      
      // Small delay to ensure cleanup is complete
      setTimeout(resolve, 50);
    });
  };

  // QR Code scanning logic
  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      scanForQRCode();
    }, 250); // Scan every 250ms for better performance
  };

  const scanForQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Detect QR code
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (qrCode && qrCode.data) {
      // Found QR code!
      onScan(qrCode.data);
      handleClose(); // Close scanner after successful scan
    }
  };

  // ✅ Enhanced: Better close handling
  const handleClose = async () => {
    await stopCamera();
    setError(null);
    setHasPermission(null);
    onClose();
  };

  // ✅ Enhanced: Retry function
  const handleRetry = async () => {
    await stopCamera();
    setError(null);
    setHasPermission(null);
    // Small delay before retry
    setTimeout(() => {
      initializeCamera();
    }, 100);
  };

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      stopCamera();
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // ✅ Enhanced: Handle visibility change to pause/resume camera
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && stream) {
        // Pause video when tab is not visible
        if (videoRef.current) {
          videoRef.current.pause();
        }
      } else if (!document.hidden && stream && isOpen) {
        // Resume video when tab becomes visible
        if (videoRef.current && videoRef.current.readyState >= 2) {
          videoRef.current.play().catch(console.error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stream, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-xl bg-opacity-90">
      <div className="relative w-full h-full max-w-2xl max-h-2xl mx-4">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="bg-black bg-opacity-60 rounded-lg px-4 py-2">
            <h3 className="text-white font-medium flex items-center">
              <FiCamera className="mr-2" />
              ສະແກນ QR Code
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="w-full h-full flex items-center justify-center">
          {error ? (
            /* Error State */
            <div className="bg-white rounded-lg p-8 mx-4 max-w-md text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ເກີດຂໍ້ຜິດພາດ</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  ລອງໃໝ່
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  ປິດ
                </button>
              </div>
            </div>
          ) : scanning ? (
            /* Loading State */
            <div className="bg-white rounded-lg p-8 mx-4 max-w-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCamera className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ກຳລັງເປີດກ້ອງ...</h3>
              <p className="text-gray-600">ກະລຸນາລໍຖ້າ</p>
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </div>
          ) : (
            /* Camera View */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                playsInline
                muted
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* QR Code Frame */}
                  <div className="w-64 h-64 border-4 border-white border-opacity-50 relative">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-center">
                    <p className="text-sm font-medium">ວາງ QR Code ໃນກອບ</p>
                  </div>
                </div>
              </div>
              
              {/* Hidden canvas for QR processing */}
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Footer Instructions */}
        {!error && !scanning && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black bg-opacity-60 rounded-lg px-4 py-3 text-center">
              <p className="text-white text-sm">
                📱 ຊີ້ກ້ອງໄປທີ່ QR Code ບົນປີ້ເພື່ອສະແກນອັດຕະໂນມັດ
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}