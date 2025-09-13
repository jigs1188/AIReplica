/**
 * 📱 WHATSAPP WEB SERVICE - PRODUCTION READY
 * Real WhatsApp Web integration with AI auto-replies
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const AIReplyEngine = require('./ai-reply-engine');
require('dotenv').config();

const app = express();
app.use(express.json());

const aiEngine = new AIReplyEngine();
let whatsappClient = null;
let clientReady = false;
let qrCodeData = null;

// Connected users with auto-reply enabled
const autoReplyUsers = new Map();

console.log('🚀 Starting WhatsApp Web Service...');

// Initialize WhatsApp Web client with better configuration
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "aireplica-production",
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-plugins',
            '--disable-images',
            '--mute-audio'
        ],
        executablePath: undefined // Let puppeteer find Chrome automatically
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

client.on('qr', (qr) => {
    console.log('\n🔗 WhatsApp Web QR Code Generated!');
    console.log('📱 IMPORTANT: Use these steps to scan correctly:');
    console.log('\n' + '='.repeat(60));
    console.log('1. Open WhatsApp on your phone');
    console.log('2. Go to Settings → Linked Devices');
    console.log('3. Tap "Link a Device"');
    console.log('4. Scan the QR code below (NOT from WhatsApp Web browser)');
    console.log('='.repeat(60));
    
    // Display QR in terminal
    qrcode.generate(qr, { small: true });
    
    console.log('='.repeat(60));
    console.log('🌐 Alternative: Open this URL in browser to see QR:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`);
    console.log('='.repeat(60));
    console.log('⚠️  If you get "couldn\'t link device" error:');
    console.log('   • Make sure you\'re using WhatsApp → Settings → Linked Devices');
    console.log('   • NOT scanning from WhatsApp Web in browser');
    console.log('   • Try restarting the service if QR expires');
    console.log('='.repeat(60) + '\n');
    
    qrCodeData = qr;
});

client.on('loading_screen', (percent, message) => {
    console.log(`📱 WhatsApp Loading: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated successfully!');
    console.log('🔗 Device linking completed!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp authentication failed:', msg);
    console.log('💡 Try these solutions:');
    console.log('   1. Delete .wwebjs_auth folder and restart');
    console.log('   2. Make sure you scan from WhatsApp app Settings → Linked Devices');
    console.log('   3. Check your internet connection');
    console.log('   4. Try using a different phone/WhatsApp account');
});

client.on('ready', () => {
    console.log('🎉 WhatsApp Web Client is ready for production auto-replies!');
    whatsappClient = client;
    clientReady = true;
    qrCodeData = null;
    
    // Get client info
    client.info.then(info => {
        console.log(`📱 Connected as: ${info.pushname} (${info.wid.user})`);
    });
});

client.on('message_create', async (message) => {
    // Only process incoming messages (not sent by us)
    if (!message.fromMe && message.hasMedia === false) {
        const senderNumber = message.from.split('@')[0];
        console.log(`📨 New WhatsApp message from ${senderNumber}: "${message.body}"`);
        
        // Check if auto-reply is enabled for this conversation
        const userConfig = autoReplyUsers.get(senderNumber) || autoReplyUsers.get('default');
        
        if (userConfig && userConfig.autoReplyEnabled) {
            try {
                console.log(`🤖 Generating auto-reply for ${senderNumber}...`);
                
                const userContext = {
                    userId: senderNumber,
                    name: userConfig.name || 'User',
                    whatsappType: 'regular',
                    personality: userConfig.personality
                };
                
                const aiReply = await aiEngine.generateAIReply(message.body, 'whatsapp', userContext);
                
                // Send AI reply with small delay to seem natural
                setTimeout(async () => {
                    await client.sendMessage(message.from, aiReply);
                    console.log(`✅ Auto-reply sent to ${senderNumber}: "${aiReply}"`);
                }, 1000 + Math.random() * 2000); // 1-3 second delay
                
            } catch (error) {
                console.error('❌ Auto-reply error:', error);
                
                // Send fallback message
                const fallback = aiEngine.getFallbackReply(message.body, 'whatsapp');
                setTimeout(async () => {
                    await client.sendMessage(message.from, fallback);
                    console.log(`🔄 Fallback reply sent to ${senderNumber}`);
                }, 1000);
            }
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp Web disconnected:', reason);
    console.log('🔄 Attempting to reconnect...');
    clientReady = false;
    whatsappClient = null;
    qrCodeData = null;
    
    // Try to reconnect after 5 seconds
    setTimeout(() => {
        console.log('🔄 Restarting WhatsApp Web client...');
        client.initialize();
    }, 5000);
});

// Add error handling
client.on('change_state', state => {
    console.log(`📱 WhatsApp Web state changed: ${state}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

// Initialize client
client.initialize();

// API ENDPOINTS

// Get QR code for connection
app.get('/api/qr-code', (req, res) => {
    if (clientReady) {
        res.json({ success: true, connected: true, message: 'WhatsApp already connected' });
    } else if (qrCodeData) {
        res.json({
            success: true,
            connected: false,
            qrCode: qrCodeData,
            qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`
        });
    } else {
        res.json({ success: false, message: 'QR code not ready yet' });
    }
});

// Check connection status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        connected: clientReady,
        ready: clientReady,
        authenticated: whatsappClient?.info ? true : false,
        autoReplyUsers: autoReplyUsers.size
    });
});

// Enable auto-reply for a user
app.post('/api/enable-auto-reply', async (req, res) => {
    try {
        const { phoneNumber, name, personality } = req.body;
        
        if (!clientReady) {
            return res.status(503).json({ 
                success: false, 
                error: 'WhatsApp not connected. Please scan QR code first.' 
            });
        }
        
        const userConfig = {
            autoReplyEnabled: true,
            name: name || 'User',
            personality: personality || {
                style: 'friendly',
                tone: 'helpful',
                responseLength: 'medium'
            },
            enabledAt: new Date().toISOString()
        };
        
        autoReplyUsers.set(phoneNumber || 'default', userConfig);
        
        console.log(`✅ Auto-reply enabled for ${phoneNumber || 'all users'}:`, userConfig);
        
        res.json({
            success: true,
            message: 'Auto-reply enabled successfully',
            config: userConfig
        });
        
    } catch (error) {
        console.error('❌ Enable auto-reply error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Disable auto-reply
app.post('/api/disable-auto-reply', (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (phoneNumber) {
            autoReplyUsers.delete(phoneNumber);
        } else {
            autoReplyUsers.clear();
        }
        
        res.json({
            success: true,
            message: 'Auto-reply disabled successfully'
        });
        
    } catch (error) {
        console.error('❌ Disable auto-reply error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send message manually (for testing)
app.post('/api/send-message', async (req, res) => {
    if (!clientReady) {
        return res.status(503).json({ 
            success: false, 
            error: 'WhatsApp not connected' 
        });
    }
    
    try {
        const { to, message } = req.body;
        let formattedTo = to;
        
        // Format phone number if needed
        if (!to.includes('@')) {
            formattedTo = to.replace(/[^\d]/g, '') + '@c.us';
        }
        
        const result = await whatsappClient.sendMessage(formattedTo, message);
        
        console.log(`📤 Manual message sent to ${to}: "${message}"`);
        
        res.json({
            success: true,
            messageId: result.id._serialized,
            to: formattedTo
        });
    } catch (error) {
        console.error('❌ Send message error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get connected user info
app.get('/api/user-info', async (req, res) => {
    if (!clientReady) {
        return res.status(503).json({ 
            success: false, 
            error: 'WhatsApp not connected' 
        });
    }
    
    try {
        const info = await whatsappClient.info;
        res.json({
            success: true,
            info: {
                name: info.pushname,
                number: info.wid.user,
                connected: true
            }
        });
    } catch (error) {
        console.error('❌ Get user info error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Restart WhatsApp Web client (for troubleshooting)
app.post('/api/restart', async (req, res) => {
    try {
        console.log('🔄 Manual restart requested...');
        
        if (whatsappClient) {
            await whatsappClient.destroy();
        }
        
        clientReady = false;
        whatsappClient = null;
        qrCodeData = null;
        
        // Clear auth session
        const fs = require('fs');
        const path = require('path');
        const authPath = path.join(process.cwd(), '.wwebjs_auth');
        
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log('🗑️ Cleared auth session');
        }
        
        // Restart client
        setTimeout(() => {
            client.initialize();
        }, 2000);
        
        res.json({
            success: true,
            message: 'WhatsApp Web client restarted. New QR code will be generated.'
        });
        
    } catch (error) {
        console.error('❌ Restart error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear auth session
app.post('/api/clear-session', async (req, res) => {
    try {
        console.log('🗑️ Clearing WhatsApp session...');
        
        if (whatsappClient) {
            await whatsappClient.destroy();
        }
        
        const fs = require('fs');
        const path = require('path');
        const authPath = path.join(process.cwd(), '.wwebjs_auth');
        
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log('✅ Auth session cleared');
        }
        
        clientReady = false;
        whatsappClient = null;
        qrCodeData = null;
        
        res.json({
            success: true,
            message: 'Session cleared. Restart the service to get a new QR code.'
        });
        
    } catch (error) {
        console.error('❌ Clear session error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get detailed status with troubleshooting info
app.get('/api/detailed-status', (req, res) => {
    res.json({
        success: true,
        status: {
            connected: clientReady,
            ready: clientReady,
            authenticated: whatsappClient?.info ? true : false,
            qrAvailable: qrCodeData ? true : false,
            autoReplyUsers: autoReplyUsers.size,
            timestamp: new Date().toISOString()
        },
        troubleshooting: {
            commonIssues: [
                'Scan QR from WhatsApp app Settings → Linked Devices',
                'NOT from WhatsApp Web in browser',
                'Make sure phone has good internet connection',
                'Try clearing session if QR keeps failing'
            ],
            endpoints: {
                restart: 'POST /api/restart',
                clearSession: 'POST /api/clear-session',
                getQR: 'GET /api/qr-code'
            }
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'WhatsApp Web Service',
        connected: clientReady,
        uptime: process.uptime()
    });
});

const PORT = process.env.WHATSAPP_WEB_PORT || 3004;

app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Web Service running on port ${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log(`📱 QR Code: http://localhost:${PORT}/api/qr-code`);
    console.log('\n📋 Setup Instructions:');
    console.log('1. Scan QR code with your WhatsApp app');
    console.log('2. Enable auto-reply: POST /api/enable-auto-reply');
    console.log('3. Start receiving auto-replies on your WhatsApp!');
    console.log('\n🤖 AI auto-replies will be generated for all incoming messages');
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down WhatsApp Web Service...');
    if (whatsappClient) {
        await whatsappClient.destroy();
    }
    process.exit(0);
});
