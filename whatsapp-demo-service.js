/**
 * 📱 WHATSAPP DEMO SERVICE - For Testing When Web.js Has Issues
 * Simulates WhatsApp connection for app testing
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.WHATSAPP_SERVICE_PORT || 3004;

// Demo state
let isConnected = false;
let demoMessages = [];
let demoContacts = new Map();

console.log('🚀 Starting WhatsApp Demo Service...');
console.log('⚠️  This is a DEMO service for testing the interface');
console.log('   For real WhatsApp functionality, use whatsapp-enhanced-service.js');

// Simulate connection after 3 seconds
setTimeout(() => {
    isConnected = true;
    console.log('✅ Demo WhatsApp "Connected" - Interface ready for testing');
}, 3000);

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        type: 'demo',
        message: isConnected ? 'Demo WhatsApp connected' : 'Connecting...',
        demoMode: true
    });
});

// QR code endpoint (demo)
app.get('/api/qr', (req, res) => {
    if (isConnected) {
        res.json({
            success: false,
            isReady: true,
            message: 'Demo mode - already "connected"'
        });
    } else {
        res.json({
            success: true,
            qrCode: 'DEMO_QR_CODE_FOR_TESTING_INTERFACE_ONLY',
            message: 'Demo QR code - scan simulation'
        });
    }
});

// Connect endpoint
app.post('/api/whatsapp/connect-regular', (req, res) => {
    const { phoneNumber } = req.body;
    
    setTimeout(() => {
        isConnected = true;
        demoContacts.set(phoneNumber, {
            name: 'Demo Contact',
            connected: true,
            type: 'demo'
        });
        
        res.json({
            success: true,
            message: 'Demo connection successful',
            phoneNumber: phoneNumber,
            demoMode: true
        });
    }, 2000);
});

// Send message endpoint (demo)
app.post('/api/send-message', (req, res) => {
    const { to, message } = req.body;
    
    if (!isConnected) {
        return res.json({
            success: false,
            error: 'Demo WhatsApp not connected'
        });
    }
    
    // Simulate message sending
    const messageId = 'demo_' + Date.now();
    demoMessages.push({
        id: messageId,
        to: to,
        message: message,
        timestamp: new Date(),
        type: 'sent',
        demo: true
    });
    
    console.log(`📤 Demo Message Sent to ${to}: ${message}`);
    
    res.json({
        success: true,
        messageId: messageId,
        message: 'Demo message sent',
        demoMode: true
    });
});

// Receive message simulation
app.post('/api/simulate-receive', (req, res) => {
    const { from, message } = req.body;
    
    if (!isConnected) {
        return res.json({
            success: false,
            error: 'Demo WhatsApp not connected'
        });
    }
    
    const messageId = 'demo_received_' + Date.now();
    demoMessages.push({
        id: messageId,
        from: from,
        message: message,
        timestamp: new Date(),
        type: 'received',
        demo: true
    });
    
    console.log(`📥 Demo Message Received from ${from}: ${message}`);
    
    // Simulate AI reply after 1 second
    setTimeout(() => {
        const aiReply = `Demo AI Reply: Thanks for your message "${message}". This is a simulated response for testing.`;
        
        demoMessages.push({
            id: 'demo_ai_' + Date.now(),
            to: from,
            message: aiReply,
            timestamp: new Date(),
            type: 'ai_reply',
            demo: true
        });
        
        console.log(`🤖 Demo AI Reply to ${from}: ${aiReply}`);
    }, 1000);
    
    res.json({
        success: true,
        messageId: messageId,
        message: 'Demo message received, AI reply simulated',
        demoMode: true
    });
});

// Get messages history
app.get('/api/messages', (req, res) => {
    res.json({
        success: true,
        messages: demoMessages,
        count: demoMessages.length,
        demoMode: true
    });
});

// Demo controls
app.get('/api/demo/controls', (req, res) => {
    res.json({
        success: true,
        controls: {
            connected: isConnected,
            totalMessages: demoMessages.length,
            contacts: Array.from(demoContacts.entries()),
            endpoints: {
                simulate_receive: 'POST /api/simulate-receive',
                send_message: 'POST /api/send-message',
                status: 'GET /api/status',
                messages: 'GET /api/messages'
            }
        },
        demoMode: true
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'whatsapp-demo',
        connected: isConnected,
        port: PORT,
        demoMode: true
    });
});

app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Demo Service running on port ${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log(`🎮 Demo Controls: http://localhost:${PORT}/api/demo/controls`);
    console.log('');
    console.log('🎯 Demo Endpoints:');
    console.log('• Status: GET /api/status');
    console.log('• QR Code: GET /api/qr');
    console.log('• Send Message: POST /api/send-message');
    console.log('• Simulate Receive: POST /api/simulate-receive');
    console.log('• Message History: GET /api/messages');
    console.log('');
    console.log('⚠️  This is a DEMO service for interface testing only');
    console.log('   No real WhatsApp messages will be sent or received');
    console.log('======================================================================');
});
