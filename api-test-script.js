// api-test-script.js
// Run this script with Node.js to test the dashboard stats API directly

const fetch = require('node-fetch');

async function testDashboardStats() {
  try {
    console.log('Testing dashboard stats API...');
    
    const baseUrl = 'http://localhost:3000'; // เปลี่ยนเป็น URL เซิร์ฟเวอร์จริงของคุณ
    const url = `${baseUrl}/api/dashboard/stats`;
    
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    
    console.log(`Response status: ${response.status}`);
    console.log(`Content type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('API Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Non-JSON Response:');
      console.log(text.substring(0, 200) + '...'); // แสดง 200 อักขระแรก
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testDashboardStats();