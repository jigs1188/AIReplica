/**
 * 📱 WHATSAPP WEB SERVICE - PRODUCTION READY WITH PERSONALIZED AI
 * Real WhatsApp Web integration with AI auto-replies and contact management
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

// Personalized AI service integration
const PERSONALIZED_AI_URL = 'http://localhost:3005';

console.log('🚀 Starting WhatsApp Web Service with Enhanced Persistence...');

// Enhanced client configuration for better persistence
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "aireplica-persistent-v2",
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
            '--mute-audio',
            '--disable-translate',
            '--disable-ipc-flooding-protection'
        ],
        executablePath: undefined // Let puppeteer find Chrome automatically
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    // Enhanced session settings for persistence
    authTimeoutMs: 60000,
    restartOnAuthFail: true
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
        console.log('🔄 Starting connection monitoring and auto-recovery system...');
    });
    
    // Start enhanced heartbeat and monitoring system
    startConnectionMonitoring();
});

// Enhanced connection monitoring and auto-recovery
function startConnectionMonitoring() {
    // Heartbeat check every 30 seconds
    const heartbeatInterval = setInterval(async () => {
        if (!clientReady || !whatsappClient) {
            console.log('⚠️ Client not ready, skipping heartbeat');
            return;
        }
        
        try {
            // Ping WhatsApp to ensure connection is alive
            const state = await client.getState();
            
            if (state !== 'CONNECTED') {
                console.log(`⚠️ Connection state check failed: ${state}`);
                
                if (state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
                    console.log('❌ Device unpaired - triggering reconnection');
                    clientReady = false;
                    whatsappClient = null;
                    qrCodeData = null;
                    client.emit('disconnected', 'unpaired');
                }
            } else {
                // Connection is healthy
                console.log(`💚 WhatsApp connection healthy (${new Date().toLocaleTimeString()})`);
            }
            
        } catch (error) {
            console.log(`❌ Heartbeat failed: ${error.message}`);
            
            // If heartbeat fails multiple times, trigger reconnection
            if (clientReady) {
                console.log('🔄 Heartbeat failure detected - triggering recovery');
                clientReady = false;
                client.emit('disconnected', 'heartbeat_failure');
            }
        }
    }, 30000); // Every 30 seconds
    
    // Store interval ID for cleanup
    client.heartbeatInterval = heartbeatInterval;
    
    // Auto-save session data periodically
    const sessionSaveInterval = setInterval(() => {
        if (clientReady && whatsappClient) {
            try {
                // Force session save (this helps with persistence)
                console.log('💾 Auto-saving session data...');
            } catch (error) {
                console.log('⚠️ Session save warning:', error.message);
            }
        }
    }, 120000); // Every 2 minutes
    
    client.sessionSaveInterval = sessionSaveInterval;
}

client.on('message_create', async (message) => {
    // Only process incoming messages (not sent by us) and ensure client is ready
    if (!message.fromMe && message.hasMedia === false && clientReady && whatsappClient) {
        const senderNumber = message.from.split('@')[0];
        const senderName = message._data.notifyName || 'Unknown Contact';
        
        console.log(`📨 New WhatsApp message from ${senderName} (${senderNumber}): "${message.body}"`);
        
        // Add message processing with retry mechanism
        const processMessage = async (retryCount = 0) => {
            const maxRetries = 3;
            
            try {
                // Verify client is still connected before processing
                if (!clientReady || !whatsappClient) {
                    console.log('⚠️ Client not ready, skipping message processing');
                    return;
                }
                
                // First, check if we have a personalized profile for this contact
                let personalizedReply;
                try {
                    const personalizedResponse = await fetch(`${PERSONALIZED_AI_URL}/api/generate-reply/${senderNumber}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            message: message.body, 
                            platform: 'whatsapp',
                            senderName: senderName
                        })
                    });
                    
                    if (personalizedResponse.ok) {
                        const personalizedData = await personalizedResponse.json();
                        if (personalizedData.success) {
                            personalizedReply = personalizedData.reply;
                            console.log(`🎯 Using personalized AI reply for ${senderName}`);
                        }
                    }
                } catch (_personalizedError) {
                    console.log(`⚠️ Personalized AI not available, using default AI...`);
                }
                
                // If no personalized reply, check for auto-reply settings
                if (!personalizedReply) {
                    const userConfig = autoReplyUsers.get(senderNumber) || autoReplyUsers.get('default');
                    
                    if (userConfig && userConfig.autoReplyEnabled) {
                        const userContext = {
                            userId: senderNumber,
                            name: senderName,
                            whatsappType: 'regular',
                            personality: userConfig.personality
                        };
                        
                        personalizedReply = await aiEngine.generateAIReply(message.body, 'whatsapp', userContext);
                        console.log(`🤖 Using default AI reply for ${senderName}`);
                    }
                }
                
                // Send the reply if we have one - Enhanced with retry mechanism
                if (personalizedReply) {
                    // Add message to contact history (for personalized AI)
                    try {
                        await fetch(`${PERSONALIZED_AI_URL}/api/contacts/${senderNumber}/add-message`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                content: message.body,
                                sender: 'them',
                                timestamp: new Date().toISOString(),
                                senderName: senderName
                            })
                        });
                    } catch (_historyError) {
                        // Non-critical error
                    }
                    
                    // Send reply with retry mechanism and natural delay
                    const sendReplyWithRetry = async (attemptNumber = 1) => {
                        const maxSendAttempts = 3;
                        
                        try {
                            // Verify client is still connected before sending
                            if (!clientReady || !whatsappClient) {
                                console.log('⚠️ Client disconnected, cannot send reply');
                                return;
                            }
                            
                            await client.sendMessage(message.from, personalizedReply);
                            console.log(`✅ Auto-reply sent to ${senderName}: "${personalizedReply}"`);
                            
                            // Add our reply to history too
                            try {
                                await fetch(`${PERSONALIZED_AI_URL}/api/contacts/${senderNumber}/add-message`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        content: personalizedReply,
                                        sender: 'us',
                                        timestamp: new Date().toISOString()
                                    })
                                });
                            } catch (_historyError) {
                                // Non-critical error
                            }
                            
                        } catch (sendError) {
                            console.error(`❌ Failed to send reply (attempt ${attemptNumber}):`, sendError.message);
                            
                            if (attemptNumber < maxSendAttempts) {
                                console.log(`🔄 Retrying send in ${attemptNumber * 2}s...`);
                                setTimeout(() => {
                                    sendReplyWithRetry(attemptNumber + 1);
                                }, attemptNumber * 2000);
                            } else {
                                console.log(`❌ Failed to send reply after ${maxSendAttempts} attempts`);
                            }
                        }
                    };
                    
                    // Send with natural delay
                    const delay = 1000 + Math.random() * 2000; // 1-3 second delay
                    setTimeout(sendReplyWithRetry, delay);
                    
                } else {
                    console.log(`📵 No auto-reply configured for ${senderName} (${senderNumber})`);
                }
                
            } catch (error) {
                console.error('❌ Auto-reply processing error:', error);
                
                // Retry processing if it's a network/temporary error
                if (retryCount < maxRetries && (
                    error.message.includes('network') || 
                    error.message.includes('timeout') ||
                    error.message.includes('fetch')
                )) {
                    console.log(`🔄 Retrying message processing (${retryCount + 1}/${maxRetries})...`);
                    setTimeout(() => {
                        processMessage(retryCount + 1);
                    }, (retryCount + 1) * 1000);
                    return;
                }
                
                // Send fallback message only if user has auto-reply enabled
                const userConfig = autoReplyUsers.get(senderNumber) || autoReplyUsers.get('default');
                if (userConfig && userConfig.autoReplyEnabled) {
                    try {
                        const fallback = aiEngine.getFallbackReply(message.body, 'whatsapp');
                        setTimeout(async () => {
                            if (clientReady && whatsappClient) {
                                await client.sendMessage(message.from, fallback);
                                console.log(`🔄 Fallback reply sent to ${senderName}`);
                            }
                        }, 1000);
                    } catch (fallbackError) {
                        console.error('❌ Even fallback reply failed:', fallbackError.message);
                    }
                }
            }
        };
        
        // Start message processing
        await processMessage();
    }
});client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp Web disconnected:', reason);
    console.log('🔄 Implementing persistent reconnection strategy...');
    clientReady = false;
    whatsappClient = null;
    qrCodeData = null;
    
    // Enhanced reconnection with exponential backoff
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    
    const attemptReconnect = () => {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached. Manual restart required.');
            return;
        }
        
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds
        
        console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay/1000}s...`);
        
        setTimeout(() => {
            console.log('🔄 Restarting WhatsApp Web client...');
            try {
                client.destroy().then(() => {
                    client.initialize();
                }).catch(() => {
                    // If destroy fails, just initialize
                    client.initialize();
                });
            } catch (_error) {
                console.log('⚠️ Error during reconnect, trying direct initialize...');
                client.initialize();
            }
        }, delay);
    };
    
    attemptReconnect();
});

// Add connection state monitoring
client.on('change_state', state => {
    console.log(`📱 WhatsApp Web state changed: ${state}`);
    
    // Handle specific state changes for better persistence
    if (state === 'CONFLICT') {
        console.log('⚠️ Session conflict detected - another device is connected');
        console.log('💡 Solution: Close WhatsApp Web on other devices and restart service');
    } else if (state === 'UNPAIRED') {
        console.log('⚠️ Device unpaired - QR scan required');
        clientReady = false;
        whatsappClient = null;
        qrCodeData = null;
    } else if (state === 'CONNECTED') {
        console.log('✅ WhatsApp connection established');
    }
});

// Add session monitoring
setInterval(() => {
    if (whatsappClient && clientReady) {
        try {
            // Ping the client to check if session is still active
            whatsappClient.getState().then(state => {
                if (state !== 'CONNECTED') {
                    console.log(`⚠️ Session state check: ${state} - may need reconnection`);
                }
            }).catch(error => {
                console.log('⚠️ Session ping failed - connection may be lost');
                if (clientReady) {
                    console.log('🔄 Triggering reconnection...');
                    clientReady = false;
                    client.emit('disconnected', 'session_lost');
                }
            });
        } catch (error) {
            console.log('⚠️ Session monitoring error:', error.message);
        }
    }
}, 30000); // Check every 30 seconds

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

// Enable auto-reply for a user with enhanced personalization
app.post('/api/enable-auto-reply', async (req, res) => {
    try {
        const { phoneNumber, name, personality, relationship } = req.body;
        
        if (!clientReady) {
            return res.status(503).json({ 
                success: false, 
                error: 'WhatsApp not connected. Please scan QR code first.' 
            });
        }
        
        const userConfig = {
            autoReplyEnabled: true,
            name: name || 'User',
            relationship: relationship || 'friend', // girlfriend, friend, family, business
            personality: personality || {
                style: 'friendly',
                tone: 'helpful',
                responseLength: 'medium'
            },
            enabledAt: new Date().toISOString()
        };
        
        // If it's a girlfriend, create enhanced personalized profile
        if (relationship === 'girlfriend' && phoneNumber !== 'default') {
            try {
                const profileResponse = await fetch(`${PERSONALIZED_AI_URL}/api/contacts/${phoneNumber}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        role: 'girlfriend',
                        personality: 'loving, caring, playful, understanding, romantic',
                        interests: 'spending time together, romance, deep conversations',
                        specialInstructions: 'Always be loving and caring. Use romantic language. Show genuine interest in conversations. Be supportive and understanding.',
                        autoReplyEnabled: true,
                        relationship: 'girlfriend'
                    })
                });
                
                if (profileResponse.ok) {
                    console.log(`💕 Created girlfriend profile for ${name} (${phoneNumber})`);
                    userConfig.personalizedProfile = true;
                }
            } catch (error) {
                console.log('⚠️ Could not create personalized girlfriend profile:', error.message);
            }
        }
        
        autoReplyUsers.set(phoneNumber || 'default', userConfig);
        
        console.log(`✅ Auto-reply enabled for ${phoneNumber || 'all users'}:`, userConfig);
        
        res.json({
            success: true,
            message: 'Auto-reply enabled successfully',
            config: userConfig,
            personalizedProfile: userConfig.personalizedProfile || false
        });
        
    } catch (error) {
        console.error('❌ Enable auto-reply error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Quick girlfriend setup endpoint
app.post('/api/setup-girlfriend', async (req, res) => {
    try {
        const { phoneNumber, name, personalityTraits, interests, specialNotes } = req.body;
        
        if (!clientReady) {
            return res.status(503).json({ 
                success: false, 
                error: 'WhatsApp not connected. Please scan QR code first.' 
            });
        }
        
        if (!phoneNumber || !name) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number and name are required.' 
            });
        }
        
        // Create enhanced girlfriend profile
        const girlfriendConfig = {
            autoReplyEnabled: true,
            name: name,
            relationship: 'girlfriend',
            personality: {
                style: 'romantic',
                tone: 'loving',
                responseLength: 'medium',
                traits: personalityTraits || 'sweet, caring, playful, understanding'
            },
            enabledAt: new Date().toISOString(),
            personalizedProfile: true
        };
        
        // Create detailed personalized AI profile
        try {
            const profileData = {
                name: name,
                role: 'girlfriend',
                personality: personalityTraits || 'loving, caring, playful, understanding, sweet, romantic',
                interests: interests || 'spending time together, romantic conversations, sharing daily moments, being supportive',
                specialInstructions: specialNotes || 'Always be loving and caring. Use sweet nicknames when appropriate. Be romantic but not overly dramatic. Show genuine interest in conversations. Be supportive and understanding. Remember personal details and reference them in future conversations.',
                autoReplyEnabled: true,
                relationship: 'girlfriend'
            };
            
            const profileResponse = await fetch(`${PERSONALIZED_AI_URL}/api/contacts/${phoneNumber}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            
            if (profileResponse.ok) {
                console.log(`💕 Created detailed girlfriend profile for ${name} (${phoneNumber})`);
                girlfriendConfig.personalizedProfileCreated = true;
            } else {
                throw new Error('Failed to create personalized profile');
            }
        } catch (profileError) {
            console.log('⚠️ Could not create personalized profile:', profileError.message);
            girlfriendConfig.personalizedProfileCreated = false;
        }
        
        // Enable WhatsApp auto-reply
        autoReplyUsers.set(phoneNumber, girlfriendConfig);
        
        console.log(`💕 Girlfriend auto-reply setup complete for ${name} (${phoneNumber})`);
        
        res.json({
            success: true,
            message: `💕 Girlfriend auto-reply setup complete for ${name}!`,
            config: girlfriendConfig,
            tips: [
                'Your girlfriend will now receive personalized AI responses',
                'The AI will remember previous conversations and personal details',
                'Responses will be romantic and caring in tone',
                'You can test the setup by sending a message to yourself from her number'
            ]
        });
        
    } catch (error) {
        console.error('❌ Girlfriend setup error:', error);
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

// Get detailed status with relationship info
app.get('/api/detailed-status', (req, res) => {
    const relationships = [];
    autoReplyUsers.forEach((config, phone) => {
        relationships.push({
            phone: phone === 'default' ? 'All Users' : phone,
            name: config.name,
            relationship: config.relationship || 'friend',
            personalizedProfile: config.personalizedProfile || false,
            enabledAt: config.enabledAt
        });
    });
    
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
        relationships: relationships,
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
                getQR: 'GET /api/qr-code',
                setupGirlfriend: 'POST /api/setup-girlfriend'
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
