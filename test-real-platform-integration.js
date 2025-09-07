/**
 * Test Real Platform Integration System
 * Tests the complete flow from credentials to connection
 */

const axios = require('axios');

// Test configuration
const testConfig = {
  baseUrl: 'http://localhost:3001',
  testUser: 'test-user-123',
  platforms: {
    whatsapp: {
      accessToken: 'test-whatsapp-token-123',
      phoneNumberId: '1234567890',
      webhookVerifyToken: 'whatsapp-verify-123'
    },
    instagram: {
      accessToken: 'test-instagram-token-456',
      pageId: 'test-page-987',
      webhookVerifyToken: 'instagram-verify-456'
    },
    email: {
      clientId: '123456789-abcdef.apps.googleusercontent.com',
      clientSecret: 'test-gmail-secret-789'
    }
  },
  training: {
    personalityType: 'friendly',
    responseStyle: 'helpful',
    customInstructions: 'Always end responses with a friendly emoji and be professional yet approachable'
  }
};

// Test functions
async function testHealthCheck() {
  console.log('\n🩺 Testing Health Check...');
  try {
    const response = await axios.get(`${testConfig.baseUrl}/health`);
    console.log('✅ Health Check Passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testPlatformSetup(platform) {
  console.log(`\n🔗 Testing ${platform.toUpperCase()} Platform Setup...`);
  try {
    const setupData = {
      platform,
      credentials: testConfig.platforms[platform],
      training: testConfig.training,
      userId: testConfig.testUser
    };
    
    const response = await axios.post(`${testConfig.baseUrl}/api/platform/setup-real`, setupData);
    console.log(`✅ ${platform.toUpperCase()} Setup Response:`, response.data);
    return response.data.success;
  } catch (error) {
    console.error(`❌ ${platform.toUpperCase()} Setup Failed:`, error.response?.data || error.message);
    return false;
  }
}

async function testPlatformStatus() {
  console.log('\n📊 Testing Platform Status...');
  try {
    const response = await axios.get(`${testConfig.baseUrl}/api/platform/status/${testConfig.testUser}`);
    console.log('✅ Platform Status:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Platform Status Failed:', error.message);
    return false;
  }
}

async function testWebhookEndpoints() {
  console.log('\n🪝 Testing Webhook Endpoints...');
  const results = [];
  
  for (let platform of Object.keys(testConfig.platforms)) {
    try {
      // Test webhook verification
      const verifyResponse = await axios.get(`${testConfig.baseUrl}/webhook/${platform}`, {
        params: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test-token',
          'hub.challenge': 'test-challenge-123'
        }
      });
      
      console.log(`✅ ${platform.toUpperCase()} webhook verification:`, verifyResponse.status);
      results.push(true);
    } catch (error) {
      console.error(`❌ ${platform.toUpperCase()} webhook failed:`, error.message);
      results.push(false);
    }
  }
  
  return results.every(result => result);
}

async function testMessageProcessing() {
  console.log('\n💬 Testing Message Processing...');
  
  // Test WhatsApp message
  const whatsappMessage = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: '1234567890',
            text: { body: 'Hello, this is a test message!' },
            timestamp: Date.now()
          }]
        }
      }]
    }]
  };
  
  try {
    const response = await axios.post(`${testConfig.baseUrl}/webhook/whatsapp`, whatsappMessage);
    console.log('✅ WhatsApp Message Processing:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Message Processing Failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Real Platform Integration Tests...\n');
  console.log('=' .repeat(60));
  
  const results = {
    healthCheck: await testHealthCheck(),
    whatsappSetup: await testPlatformSetup('whatsapp'),
    instagramSetup: await testPlatformSetup('instagram'),
    emailSetup: await testPlatformSetup('email'),
    platformStatus: await testPlatformStatus(),
    webhookEndpoints: await testWebhookEndpoints(),
    messageProcessing: await testMessageProcessing()
  };
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST RESULTS SUMMARY:');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('=' .repeat(60));
  console.log(`🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
  console.log(`📊 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The real platform integration system is working perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. Open the Expo app on your device/simulator');
  console.log('2. Navigate to Dashboard > Smart Platform Setup');
  console.log('3. Test the real credential collection flow');
  console.log('4. Verify AI training configuration');
  console.log('5. Check webhook message processing\n');
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testPlatformSetup,
  testPlatformStatus,
  testWebhookEndpoints,
  testMessageProcessing,
  runAllTests
};
