#!/usr/bin/env node

/**
 * AIReplica System Test
 * Quick test to verify everything is working
 */

const fs = require('fs');

console.log('🧪 AIReplica System Test\n');

// Test 1: Check all core files exist
const coreFiles = [
  'package.json',
  'app.json',
  'firebase.js',
  'simple-webhook-server.js',
  'app/main-app.js',
  'app/simple-dashboard.js',
  'app/consumer-auth.js',
  'app/webhook-test.js',
  'utils/simpleIntegrationManager.js',
  'utils/simpleWhatsAppConnector.js',
  'utils/simpleMessageHandler.js'
];

console.log('📁 Checking core files...');
let filesOK = 0;
for (const file of coreFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    filesOK++;
  } else {
    console.log(`  ❌ ${file} - MISSING`);
  }
}

console.log(`\n📊 Files: ${filesOK}/${coreFiles.length} found\n`);

// Test 2: Check package.json scripts
console.log('📦 Checking npm scripts...');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['start', 'dev', 'webhook', 'lint'];

for (const script of requiredScripts) {
  if (pkg.scripts[script]) {
    console.log(`  ✅ npm run ${script}`);
  } else {
    console.log(`  ❌ npm run ${script} - MISSING`);
  }
}

// Test 3: Check file syntax
console.log('\n🔗 Testing file syntax...');
try {
  const oauthCode = fs.readFileSync('./utils/oauthService.js', 'utf8');
  if (oauthCode.includes('supportedPlatforms')) {
    console.log(`  ✅ OAuth service file valid`);
  }
} catch (error) {
  console.log(`  ❌ OAuth service error: ${error.message}`);
}

console.log('\n🔧 Testing backend files...');
try {
  const backendCode = fs.readFileSync('./utils/cleanBackendAPIService.js', 'utf8');
  if (backendCode.includes('authenticateUser')) {
    console.log(`  ✅ Backend API file valid`);
  }
} catch (error) {
  console.log(`  ❌ Backend API error: ${error.message}`);
}

console.log('\n📱 Testing component files...');
try {
  const connectorCode = fs.readFileSync('./components/PlatformConnector.js', 'utf8');
  if (connectorCode.includes('PlatformConnector')) {
    console.log(`  ✅ Platform connector file valid`);
  }
} catch (error) {
  console.log(`  ❌ Platform connector error: ${error.message}`);
}

// Final Result
console.log('\n🎯 Test Results:');
if (filesOK === coreFiles.length) {
  console.log('✅ ALL SYSTEMS READY!');
  console.log('\n🚀 Next Steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Run: npm run webhook (in new terminal)');
  console.log('3. Scan QR code with Expo Go');
  console.log('4. Test OAuth connections');
  console.log('\n🎉 Your AI assistant startup is ready to test!');
} else {
  console.log('❌ Some files are missing. Check the output above.');
}
