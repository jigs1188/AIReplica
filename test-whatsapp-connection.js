// Quick test for WhatsApp service connectivity
const testWhatsAppService = async () => {
  try {
    const response = await fetch('http://localhost:3002/health');
    const data = await response.text();
    console.log('✅ WhatsApp service is running:', data);
  } catch (error) {
    console.error('❌ WhatsApp service test failed:', error.message);
  }
};

testWhatsAppService();
