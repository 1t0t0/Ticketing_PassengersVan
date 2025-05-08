'use client';

import  { useEffect } from 'react';

// คอมโพเนนต์นี้จะโหลด Phetsarath font และตั้งค่าให้กับทั้งเว็บไซต์
export default function PhetsarathFont() {
  useEffect(() => {
    // สร้าง link element เพื่อโหลด Google Font
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://fonts.googleapis.com/css2?family=Phetsarath:wght@400;700&display=swap';
    document.head.appendChild(linkElement);
    
    // สร้าง style element
    const style = document.createElement('style');
    
    // กำหนด CSS เพื่อใช้ Phetsarath font สำหรับทุก element
    style.textContent = `
      body, * {
        font-family: "Phetsarath", serif !important;
      }
      
      .phetsarath-regular {
        font-family: "Phetsarath", serif !important;
        font-weight: 400;
        font-style: normal;
      }
      
      .phetsarath-bold {
        font-family: "Phetsarath", serif !important;
        font-weight: 700;
        font-style: normal;
      }
    `;
    
    // เพิ่ม style tag เข้าไปใน head
    document.head.appendChild(style);
    
    // clean up เมื่อคอมโพเนนต์ถูก unmount
    return () => {
      document.head.removeChild(style);
      document.head.removeChild(linkElement);
    };
  }, []);
  
  // คอมโพเนนต์นี้ไม่มีการ render อะไร
  return null;
}