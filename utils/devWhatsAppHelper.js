/**
 * 🧪 DEVELOPMENT HELPER - WhatsApp OTP Testing
 * This file helps with testing WhatsApp integration when OTP delivery is problematic
 */

// Development mode OTP bypass (REMOVE IN PRODUCTION)
export const DEV_MODE = __DEV__ || process.env.NODE_ENV === 'development';

// Test OTP code for development
export const TEST_OTP = '123456';

// Development OTP verification
export const devVerifyOTP = (inputOTP, phoneNumber) => {
  if (!DEV_MODE) return false;
  
  console.log('🧪 DEV MODE: OTP Verification');
  console.log('- Input OTP:', inputOTP);
  console.log('- Expected:', TEST_OTP);
  console.log('- Phone:', phoneNumber);
  
  return inputOTP === TEST_OTP;
};

// Development OTP sender (shows OTP in console)
export const devSendOTP = (phoneNumber) => {
  if (!DEV_MODE) return null;
  
  console.log('🧪 DEV MODE: OTP Generated');
  console.log('- Phone:', phoneNumber);
  console.log('- OTP Code:', TEST_OTP);
  console.log('- Use this OTP in the app for testing');
  
  return {
    success: true,
    verificationId: 'dev_' + Date.now(),
    otpCode: TEST_OTP,
    isDevMode: true
  };
};

// WhatsApp Business API troubleshooting info
export const getWhatsAppTroubleshooting = () => ({
  commonIssues: [
    {
      issue: 'OTP not received',
      causes: [
        'Phone number not added to WhatsApp Business test numbers',
        'Account in sandbox mode',
        'Message template not approved',
        'Rate limiting'
      ],
      solutions: [
        'Add phone to test numbers in Facebook Developer Console',
        'Upgrade to production WhatsApp Business API',
        'Create approved message templates',
        'Wait and retry after 5-10 minutes'
      ]
    }
  ],
  devModeInstructions: [
    `1. In development, use OTP: ${TEST_OTP}`,
    '2. This bypasses WhatsApp API for testing',
    '3. Real API integration works (backend logs show success)',
    '4. Issue is with WhatsApp Business API configuration'
  ]
});
