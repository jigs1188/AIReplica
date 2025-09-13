/**
 * 📱 WHATSAPP WEB SERVICE - ENHANCED USER CONTROL VERSION
 * Features: Ask before reply, whitelist numbers, manual control
 * Fixed: LocalWebCache error handling
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const AIReplyEngine = require('./ai-reply-engine');
require('dotenv').config();

// Fix for LocalWebCache.js error - override the problematic method
process.on('uncaughtException', (error) => {
    if (error.message.includes('Cannot read properties of null') && error.stack.includes('LocalWebCache.js')) {
        console.log('⚠️  LocalWebCache error detected - continuing anyway...');
        console.log('🔧 This is a known issue with whatsapp-web.js - service will work normally');
        return; // Don't crash the process
    }
    // Re-throw other uncaught exceptions
    throw error;
});

// Additional error handling for WebCache issues
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && reason.message.includes('LocalWebCache')) {
        console.log('⚠️  LocalWebCache rejection handled - continuing...');
        return;
    }
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
app.use(express.json());

const aiEngine = new AIReplyEngine();
let whatsappClient = null;
let clientReady = false;
let qrCodeData = null;
let qrExpireTime = 60000; // 1 minute instead of 20 seconds

// Enhanced user control settings with personalized AI
const userSettings = {
    autoReplyMode: 'ask', // 'auto', 'ask', 'off'
    whitelistOnly: false, // Only reply to whitelisted numbers
    globalAutoReply: false, // Global auto-reply toggle
    askBeforeReply: true, // Ask user before sending AI reply
    personalizedReplies: true, // Enable personalized AI responses
    pendingReplies: new Map(), // Messages waiting for user approval
    whitelist: new Set(), // Approved phone numbers
    blacklist: new Set(), // Blocked phone numbers
    replyHistory: new Map(), // Track what we've replied to
    contacts: new Map(), // Personalized contact profiles
    userResume: '' // User's resume/background for professional conversations
};

// Save user settings to file
function saveUserSettings() {
    try {
        const fs = require('fs');
        
        const settingsToSave = {
            autoReplyMode: userSettings.autoReplyMode,
            whitelistOnly: userSettings.whitelistOnly,
            globalAutoReply: userSettings.globalAutoReply,
            askBeforeReply: userSettings.askBeforeReply,
            personalizedReplies: userSettings.personalizedReplies,
            whitelist: Array.from(userSettings.whitelist),
            blacklist: Array.from(userSettings.blacklist),
            contacts: Array.from(userSettings.contacts.entries()),
            userResume: userSettings.userResume
        };
        
        const settingsPath = './whatsapp-settings.json';
        fs.writeFileSync(settingsPath, JSON.stringify(settingsToSave, null, 2));
        console.log('💾 Settings saved successfully');
    } catch (error) {
        console.error('❌ Error saving settings:', error);
    }
}

// Load user settings from file
function loadUserSettings() {
    try {
        const fs = require('fs');
        const settingsPath = './whatsapp-settings.json';
        
        if (fs.existsSync(settingsPath)) {
            const savedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            
            userSettings.autoReplyMode = savedSettings.autoReplyMode || 'ask';
            userSettings.whitelistOnly = savedSettings.whitelistOnly || false;
            userSettings.globalAutoReply = savedSettings.globalAutoReply || false;
            userSettings.askBeforeReply = savedSettings.askBeforeReply !== false;
            userSettings.personalizedReplies = savedSettings.personalizedReplies !== false;
            userSettings.whitelist = new Set(savedSettings.whitelist || []);
            userSettings.blacklist = new Set(savedSettings.blacklist || []);
            userSettings.contacts = new Map(savedSettings.contacts || []);
            userSettings.userResume = savedSettings.userResume || '';
            
            console.log('📁 Settings loaded successfully');
            console.log(`   Contacts: ${userSettings.contacts.size}`);
            console.log(`   Resume: ${userSettings.userResume ? 'Configured' : 'Not set'}`);
        }
    } catch (error) {
        console.error('❌ Error loading settings:', error);
    }
}

// Pending messages waiting for user approval
const pendingMessages = new Map();

// Load saved settings on startup
loadUserSettings();

console.log('� Initializing Enhanced WhatsApp Web client...');

// Enhanced WhatsApp Web client configuration with error handling
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "aireplica-enhanced-v3",
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
    // Use working webVersionCache configuration
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

client.on('qr', (qr) => {
    console.log('\n🔗 WhatsApp Web QR Code Generated! (Enhanced Version)');
    console.log('📱 CRITICAL: Follow these EXACT steps:');
    console.log('\n' + '='.repeat(70));
    console.log('🚨 IMPORTANT: This QR is for REGULAR WhatsApp (not Business)');
    console.log('');
    console.log('STEPS TO SCAN:');
    console.log('1. Open WhatsApp on your phone');
    console.log('2. Tap the 3-dots menu (⋮) in top right');
    console.log('3. Select "Linked Devices"');
    console.log('4. Tap "Link a Device"');
    console.log('5. Point camera at QR code below');
    console.log('');
    console.log('❌ DO NOT scan from WhatsApp Web browser');
    console.log('❌ DO NOT use WhatsApp Business app');
    console.log('✅ USE regular WhatsApp app → Settings → Linked Devices');
    console.log('='.repeat(70));
    
    // Display QR in terminal
    qrcode.generate(qr, { small: true });
    
    console.log('='.repeat(70));
    console.log('🌐 Alternative: View QR in browser:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)}`);
    console.log('='.repeat(70));
    console.log('⏰ QR Code expires in 60 seconds (1 minute) - scan now!'); // Updated to 1 minute
    console.log('🔄 If expired, service will generate new QR automatically');
    console.log('='.repeat(70) + '\n');
    
    qrCodeData = qr;
    
    // Auto-expire QR code after 1 minute
    setTimeout(() => {
        if (qrCodeData === qr) {
            console.log('⏰ QR Code expired after 1 minute. Generating new one...');
            qrCodeData = null;
            // The client will automatically generate a new QR code
        }
    }, qrExpireTime);
});

client.on('loading_screen', (percent, message) => {
    console.log(`📱 WhatsApp Loading: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated successfully!');
    console.log('🎉 Device linking completed!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp authentication failed:', msg);
    console.log('💡 Solutions:');
    console.log('   1. Restart service: curl -X POST http://localhost:3004/api/restart');
    console.log('   2. Clear session: curl -X POST http://localhost:3004/api/clear-session');
    console.log('   3. Use regular WhatsApp app (not Business)');
    console.log('   4. Make sure phone has good internet connection');
});

client.on('ready', () => {
    console.log('🎉 WhatsApp Web Client is READY with Enhanced Controls!');
    whatsappClient = client;
    clientReady = true;
    qrCodeData = null;
    
    // Get client info
    client.info.then(info => {
        console.log(`📱 Connected as: ${info.pushname} (${info.wid.user})`);
        console.log('🎛️ Enhanced Controls Active:');
        console.log(`   • Auto-Reply Mode: ${userSettings.autoReplyMode}`);
        console.log(`   • Ask Before Reply: ${userSettings.askBeforeReply}`);
        console.log(`   • Whitelist Only: ${userSettings.whitelistOnly}`);
        console.log('🔧 Configure via API endpoints or mobile app');
    });
});

client.on('message_create', async (message) => {
    // Only process incoming messages (not sent by us)
    if (!message.fromMe && message.hasMedia === false && message.body.trim()) {
        const senderNumber = message.from.split('@')[0];
        const contact = await message.getContact();
        const senderName = contact.pushname || contact.name || senderNumber;
        
        console.log(`📨 New WhatsApp message from ${senderName} (${senderNumber}): "${message.body}"`);
        
        // Check if this number is blacklisted
        if (userSettings.blacklist.has(senderNumber)) {
            console.log(`🚫 Message from ${senderNumber} ignored (blacklisted)`);
            return;
        }
        
        // Check whitelist mode
        if (userSettings.whitelistOnly && !userSettings.whitelist.has(senderNumber)) {
            console.log(`📝 Message from ${senderNumber} - not in whitelist, no auto-reply`);
            return;
        }
        
        // Check global auto-reply setting
        if (userSettings.autoReplyMode === 'off') {
            console.log(`📝 Message from ${senderNumber} - auto-reply is OFF`);
            return;
        }
        
        // Handle different auto-reply modes
        await handleIncomingMessage(message, senderNumber, senderName);
    }
});

async function handleIncomingMessage(message, senderNumber, senderName) {
    try {
        // Load personalized contact info if available
        const contactProfile = userSettings.contacts.get(senderNumber);
        
        if (userSettings.autoReplyMode === 'ask') {
            // ASK MODE: Store message and ask user for permission
            const messageId = Date.now().toString();
            
            // Pre-generate personalized response suggestion
            let suggestedResponse = null;
            if (userSettings.personalizedReplies && contactProfile) {
                suggestedResponse = await generatePersonalizedReply(message.body, senderNumber, senderName, contactProfile);
            }
            
            pendingMessages.set(messageId, {
                message: message,
                senderNumber: senderNumber,
                senderName: senderName,
                content: message.body,
                timestamp: new Date().toISOString(),
                contactProfile: contactProfile,
                suggestedResponse: suggestedResponse
            });
            
            console.log(`❓ Message from ${senderName} waiting for your approval:`);
            console.log(`   Message: "${message.body}"`);
            if (contactProfile) {
                console.log(`   👤 Known contact: ${contactProfile.role} - ${contactProfile.theirPosition || 'No position'}`);
                if (suggestedResponse) {
                    console.log(`   💡 Suggested personalized reply: "${suggestedResponse.substring(0, 100)}..."`);
                }
            }
            console.log(`   To approve: POST /api/approve-reply/${messageId}`);
            console.log(`   To reject: POST /api/reject-reply/${messageId}`);
            console.log(`   To add to whitelist: POST /api/add-whitelist/${senderNumber}`);
            
        } else if (userSettings.autoReplyMode === 'auto') {
            // AUTO MODE: Send AI reply immediately (personalized if contact exists)
            // Check if this contact has auto-conversation enabled
            const shouldAutoReply = !contactProfile || contactProfile.autoConversation !== false;
            
            if (shouldAutoReply) {
                await sendAIReply(message, senderNumber, senderName, contactProfile);
            } else {
                console.log(`⏳ Contact ${senderName} requires manual approval even in auto mode`);
                // Fall back to ask mode for this specific contact
                await handleIncomingMessage(message, senderNumber, senderName);
            }
        }
        
    } catch (error) {
        console.error('❌ Error handling incoming message:', error);
    }
}

// Generate personalized AI reply based on contact profile
async function generatePersonalizedReply(messageContent, senderNumber, senderName, contactProfile) {
    try {
        // Build personalized context
        let personalizedContext = '';
        
        if (contactProfile) {
            personalizedContext += `[CONTACT CONTEXT]\n`;
            personalizedContext += `Contact Name: ${contactProfile.name}\n`;
            personalizedContext += `Relationship: ${contactProfile.role}\n`;
            
            if (contactProfile.theirPosition) {
                personalizedContext += `Their Position: ${contactProfile.theirPosition}\n`;
            }
            
            if (contactProfile.company) {
                personalizedContext += `Company: ${contactProfile.company}\n`;
            }
            
            if (contactProfile.customInstructions) {
                personalizedContext += `\n[CUSTOM INSTRUCTIONS FOR THIS CONTACT]\n${contactProfile.customInstructions}\n`;
            }
            
            // Add role-specific context
            switch (contactProfile.role) {
                case 'hr':
                    personalizedContext += `\n[PROFESSIONAL CONTEXT - HR]\n`;
                    if (userSettings.userResume) {
                        personalizedContext += `My Background: ${userSettings.userResume.substring(0, 500)}...\n`;
                    }
                    personalizedContext += `Response Style: Professional, career-focused, highlight relevant experience\n`;
                    break;
                case 'client':
                    personalizedContext += `\n[BUSINESS CONTEXT - CLIENT]\n`;
                    personalizedContext += `Response Style: Professional, solution-oriented, business-focused\n`;
                    break;
                case 'manager':
                    personalizedContext += `\n[WORKPLACE CONTEXT - MANAGER]\n`;
                    personalizedContext += `Response Style: Professional, respectful, work-related\n`;
                    break;
                case 'colleague':
                    personalizedContext += `\n[WORKPLACE CONTEXT - COLLEAGUE]\n`;
                    personalizedContext += `Response Style: Professional but friendly, collaborative\n`;
                    break;
                case 'friend':
                    personalizedContext += `\n[PERSONAL CONTEXT - FRIEND]\n`;
                    personalizedContext += `Response Style: Casual, friendly, personal\n`;
                    break;
                case 'family':
                    personalizedContext += `\n[PERSONAL CONTEXT - FAMILY]\n`;
                    personalizedContext += `Response Style: Warm, caring, personal\n`;
                    break;
                case 'vendor':
                    personalizedContext += `\n[BUSINESS CONTEXT - VENDOR]\n`;
                    personalizedContext += `Response Style: Professional, business-focused, clear about requirements\n`;
                    break;
                default:
                    personalizedContext += `\n[GENERAL CONTEXT]\n`;
                    personalizedContext += `Response Style: Polite and appropriate to the relationship\n`;
            }
            
            personalizedContext += `\n[MESSAGE TO RESPOND TO]\n${messageContent}\n`;
            personalizedContext += `\n[INSTRUCTIONS]\nGenerate a personalized response that fits the context and relationship. Keep it natural and appropriate for the situation.`;
        }
        
        // Generate reply using existing AI service with personalized context
        const prompt = personalizedContext || messageContent;
        const aiResponse = await fetch('http://localhost:3002/generate-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: prompt,
                personalized: true,
                contactRole: contactProfile?.role,
                contactName: contactProfile?.name
            })
        });
        
        if (!aiResponse.ok) {
            throw new Error(`AI service error: ${aiResponse.status}`);
        }
        
        const reply = await aiResponse.json();
        return reply.response;
        
    } catch (error) {
        console.error('Error generating personalized reply:', error);
        // Fall back to regular AI reply using the existing AI engine
        const userContext = {
            userId: 'fallback',
            name: 'User',
            whatsappType: 'regular',
            personality: {
                style: 'friendly and helpful',
                tone: 'casual',
                responseLength: 'medium'
            }
        };
        return await aiEngine.generateAIReply(messageContent, 'whatsapp', userContext);
    }
}

async function sendAIReply(message, senderNumber, senderName, contactProfile = null) {
    try {
        console.log(`🤖 Generating ${contactProfile ? 'personalized' : 'auto'}-reply for ${senderName} (${senderNumber})...`);
        
        let aiReply;
        
        if (userSettings.personalizedReplies && contactProfile) {
            // Use personalized reply generation
            aiReply = await generatePersonalizedReply(message.body, senderNumber, senderName, contactProfile);
            console.log(`👤 Using personalized reply for ${contactProfile.role}: ${contactProfile.name}`);
        } else {
            // Use standard AI reply
            const userContext = {
                userId: senderNumber,
                name: senderName,
                whatsappType: 'regular',
                personality: {
                    style: 'friendly and helpful',
                    tone: 'casual',
                    responseLength: 'medium'
                }
            };
            
            aiReply = await aiEngine.generateAIReply(message.body, 'whatsapp', userContext);
        }
        
        // Send AI reply with natural delay
        const delay = 1500 + Math.random() * 2000; // 1.5-3.5 second delay
        setTimeout(async () => {
            try {
                await client.sendMessage(message.from, aiReply);
                console.log(`✅ ${contactProfile ? 'Personalized' : 'Auto'}-reply sent to ${senderName}: "${aiReply}"`);
                
                // Store in history with contact info
                userSettings.replyHistory.set(`${senderNumber}-${Date.now()}`, {
                    senderNumber,
                    senderName,
                    originalMessage: message.body,
                    aiReply,
                    timestamp: new Date().toISOString(),
                    contactProfile: contactProfile ? {
                        name: contactProfile.name,
                        role: contactProfile.role,
                        personalized: true
                    } : null
                });
                
            } catch (sendError) {
                console.error(`❌ Failed to send reply to ${senderName}:`, sendError);
            }
        }, delay);
        
    } catch (error) {
        console.error('❌ Auto-reply generation error:', error);
        
        // Send fallback message only if user has enabled fallbacks
        if (userSettings.autoReplyMode === 'auto') {
            const fallback = "Thanks for your message! I'll get back to you soon! 👋";
            setTimeout(async () => {
                try {
                    await client.sendMessage(message.from, fallback);
                    console.log(`🔄 Fallback reply sent to ${senderName}`);
                } catch (fallbackError) {
                    console.error(`❌ Failed to send fallback to ${senderName}:`, fallbackError);
                }
            }, 1000);
        }
    }
}

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp Web disconnected:', reason);
    console.log('🔄 Attempting to reconnect in 10 seconds...');
    clientReady = false;
    whatsappClient = null;
    qrCodeData = null;
    
    setTimeout(() => {
        console.log('🔄 Restarting WhatsApp Web client...');
        client.initialize();
    }, 10000);
});

// Initialize client with working approach (like the simple service)
console.log('🔧 Initializing Enhanced WhatsApp Web client...');
client.initialize();

// ENHANCED API ENDPOINTS

// Get QR code with 1-minute expiry
// === PERSONALIZED CONTACT MANAGEMENT ENDPOINTS ===
// Load contacts
app.get('/api/contacts', (req, res) => {
    try {
        const contactsArray = Array.from(userSettings.contacts.entries()).map(([number, profile]) => ({
            number,
            ...profile
        }));
        res.json({ contacts: contactsArray });
    } catch (error) {
        console.error('Error loading contacts:', error);
        res.status(500).json({ error: 'Failed to load contacts' });
    }
});

// Save contact
app.post('/api/contacts', (req, res) => {
    try {
        const { number, name, role, theirPosition, company, customInstructions, autoConversation } = req.body;
        
        if (!number || !name || !role) {
            return res.status(400).json({ error: 'Missing required fields: number, name, role' });
        }
        
        const contactProfile = {
            name,
            role,
            theirPosition: theirPosition || '',
            company: company || '',
            customInstructions: customInstructions || '',
            autoConversation: autoConversation !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        userSettings.contacts.set(number, contactProfile);
        saveUserSettings();
        
        console.log(`📝 Contact saved: ${name} (${role}) - ${number}`);
        res.json({ success: true, contact: { number, ...contactProfile } });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ error: 'Failed to save contact' });
    }
});

// Delete contact
app.delete('/api/contacts/:number', (req, res) => {
    try {
        const { number } = req.params;
        const deleted = userSettings.contacts.delete(number);
        
        if (deleted) {
            saveUserSettings();
            console.log(`🗑️ Contact deleted: ${number}`);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Contact not found' });
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

// Update user resume
app.post('/api/resume', (req, res) => {
    try {
        const { resume } = req.body;
        userSettings.userResume = resume;
        saveUserSettings();
        
        console.log('📄 User resume updated');
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating resume:', error);
        res.status(500).json({ error: 'Failed to update resume' });
    }
});

// Get user resume
app.get('/api/resume', (req, res) => {
    try {
        res.json({ resume: userSettings.userResume || '' });
    } catch (error) {
        console.error('Error loading resume:', error);
        res.status(500).json({ error: 'Failed to load resume' });
    }
});

// Test personalized response
app.post('/api/test-personalized-reply', async (req, res) => {
    try {
        const { message, contactNumber } = req.body;
        
        if (!message || !contactNumber) {
            return res.status(400).json({ error: 'Missing message or contactNumber' });
        }
        
        const contactProfile = userSettings.contacts.get(contactNumber);
        if (!contactProfile) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        
        const personalizedReply = await generatePersonalizedReply(message, contactNumber, contactProfile.name, contactProfile);
        
        res.json({
            success: true,
            testMessage: message,
            contactProfile: contactProfile,
            personalizedReply: personalizedReply
        });
        
        console.log(`🧪 Test personalized reply generated for ${contactProfile.name}`);
    } catch (error) {
        console.error('Error testing personalized reply:', error);
        res.status(500).json({ error: 'Failed to generate test reply' });
    }
});

// === EXISTING ENHANCED WHATSAPP ENDPOINTS ===
app.get('/api/qr-code', (req, res) => {
    if (clientReady) {
        res.json({ 
            success: true, 
            connected: true, 
            message: 'WhatsApp already connected',
            status: 'ready'
        });
    } else if (qrCodeData) {
        res.json({
            success: true,
            connected: false,
            qrCode: qrCodeData,
            qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrCodeData)}`,
            expiresIn: '60 seconds (1 minute)',
            instructions: [
                'Open WhatsApp on your phone',
                'Go to Settings → Linked Devices',
                'Tap "Link a Device"',
                'Scan the QR code within 1 minute'
            ]
        });
    } else {
        res.json({ 
            success: false, 
            message: 'QR code not ready yet. Please wait...',
            status: 'initializing'
        });
    }
});

// Enhanced status with user settings
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        connected: clientReady,
        ready: clientReady,
        authenticated: whatsappClient?.info ? true : false,
        timestamp: new Date().toISOString(),
        settings: {
            autoReplyMode: userSettings.autoReplyMode,
            askBeforeReply: userSettings.askBeforeReply,
            whitelistOnly: userSettings.whitelistOnly,
            globalAutoReply: userSettings.globalAutoReply,
            whitelistCount: userSettings.whitelist.size,
            blacklistCount: userSettings.blacklist.size,
            pendingMessages: pendingMessages.size
        }
    });
});

// Configure auto-reply settings
app.post('/api/configure', async (req, res) => {
    try {
        const { autoReplyMode, whitelistOnly, askBeforeReply, personalizedReplies } = req.body;
        
        if (autoReplyMode) {
            if (!['auto', 'ask', 'off'].includes(autoReplyMode)) {
                return res.status(400).json({ success: false, error: 'Invalid autoReplyMode. Use: auto, ask, or off' });
            }
            userSettings.autoReplyMode = autoReplyMode;
        }
        
        if (typeof whitelistOnly === 'boolean') {
            userSettings.whitelistOnly = whitelistOnly;
        }
        
        if (typeof askBeforeReply === 'boolean') {
            userSettings.askBeforeReply = askBeforeReply;
        }
        
        if (typeof personalizedReplies === 'boolean') {
            userSettings.personalizedReplies = personalizedReplies;
        }
        
        // Save settings after updates
        saveUserSettings();
        
        console.log('⚙️ Settings updated:', {
            autoReplyMode: userSettings.autoReplyMode,
            whitelistOnly: userSettings.whitelistOnly,
            askBeforeReply: userSettings.askBeforeReply,
            personalizedReplies: userSettings.personalizedReplies
        });
        
        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: {
                autoReplyMode: userSettings.autoReplyMode,
                whitelistOnly: userSettings.whitelistOnly,
                askBeforeReply: userSettings.askBeforeReply,
                personalizedReplies: userSettings.personalizedReplies
            }
        });
        
    } catch (error) {
        console.error('❌ Configure error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add number to whitelist
app.post('/api/add-whitelist/:number', (req, res) => {
    try {
        const number = req.params.number;
        userSettings.whitelist.add(number);
        console.log(`✅ Added ${number} to whitelist`);
        
        res.json({
            success: true,
            message: `Number ${number} added to whitelist`,
            whitelistCount: userSettings.whitelist.size
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove number from whitelist
app.delete('/api/remove-whitelist/:number', (req, res) => {
    try {
        const number = req.params.number;
        userSettings.whitelist.delete(number);
        console.log(`🗑️ Removed ${number} from whitelist`);
        
        res.json({
            success: true,
            message: `Number ${number} removed from whitelist`,
            whitelistCount: userSettings.whitelist.size
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add number to blacklist
app.post('/api/add-blacklist/:number', (req, res) => {
    try {
        const number = req.params.number;
        userSettings.blacklist.add(number);
        console.log(`🚫 Added ${number} to blacklist`);
        
        res.json({
            success: true,
            message: `Number ${number} added to blacklist`,
            blacklistCount: userSettings.blacklist.size
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove number from blacklist
app.delete('/api/remove-blacklist/:number', (req, res) => {
    try {
        const number = req.params.number;
        userSettings.blacklist.delete(number);
        console.log(`✅ Removed ${number} from blacklist`);
        
        res.json({
            success: true,
            message: `Number ${number} removed from blacklist`,
            blacklistCount: userSettings.blacklist.size
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get pending messages waiting for approval
app.get('/api/pending-messages', (req, res) => {
    const pending = Array.from(pendingMessages.entries()).map(([id, data]) => ({
        id,
        senderNumber: data.senderNumber,
        senderName: data.senderName,
        content: data.content,
        timestamp: data.timestamp
    }));
    
    res.json({
        success: true,
        pendingMessages: pending,
        count: pending.length
    });
});

// Approve and send AI reply to pending message
app.post('/api/approve-reply/:messageId', async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const pendingData = pendingMessages.get(messageId);
        
        if (!pendingData) {
            return res.status(404).json({ success: false, error: 'Message not found or already processed' });
        }
        
        // Send AI reply
        await sendAIReply(pendingData.message, pendingData.senderNumber, pendingData.senderName);
        
        // Remove from pending
        pendingMessages.delete(messageId);
        
        console.log(`✅ Approved and sent AI reply to ${pendingData.senderName}`);
        
        res.json({
            success: true,
            message: `AI reply sent to ${pendingData.senderName}`,
            senderNumber: pendingData.senderNumber
        });
        
    } catch (error) {
        console.error('❌ Approve reply error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reject pending message (don't send reply)
app.post('/api/reject-reply/:messageId', (req, res) => {
    try {
        const messageId = req.params.messageId;
        const pendingData = pendingMessages.get(messageId);
        
        if (!pendingData) {
            return res.status(404).json({ success: false, error: 'Message not found or already processed' });
        }
        
        pendingMessages.delete(messageId);
        console.log(`❌ Rejected reply to ${pendingData.senderName}`);
        
        res.json({
            success: true,
            message: `Reply to ${pendingData.senderName} rejected`,
            senderNumber: pendingData.senderNumber
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get whitelist
app.get('/api/whitelist', (req, res) => {
    res.json({
        success: true,
        whitelist: Array.from(userSettings.whitelist),
        count: userSettings.whitelist.size
    });
});

// Get blacklist
app.get('/api/blacklist', (req, res) => {
    res.json({
        success: true,
        blacklist: Array.from(userSettings.blacklist),
        count: userSettings.blacklist.size
    });
});

// Get reply history
app.get('/api/reply-history', (req, res) => {
    const history = Array.from(userSettings.replyHistory.values()).slice(-50); // Last 50 replies
    
    res.json({
        success: true,
        history,
        count: history.length
    });
});

// Send manual message
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
        
        if (!to.includes('@')) {
            formattedTo = to.replace(/[^\d]/g, '') + '@c.us';
        }
        
        const result = await whatsappClient.sendMessage(formattedTo, message);
        
        console.log(`📤 Manual message sent to ${to}: "${message}"`);
        
        res.json({
            success: true,
            messageId: result.id._serialized,
            to: formattedTo,
            message: message
        });
    } catch (error) {
        console.error('❌ Send message error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Enhanced WhatsApp Web Service',
        connected: clientReady,
        uptime: process.uptime(),
        version: '3.0.0-enhanced',
        features: [
            'Ask before reply',
            'Whitelist/Blacklist',
            '1-minute QR expiry',
            'Manual control',
            'Reply history'
        ]
    });
});

const PORT = process.env.WHATSAPP_WEB_PORT || 3004;

app.listen(PORT, () => {
    console.log(`🚀 Enhanced WhatsApp Web Service running on port ${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log(`📱 QR Code: http://localhost:${PORT}/api/qr-code`);
    console.log('\n🎛️ Enhanced Controls:');
    console.log('• Configure: POST /api/configure');
    console.log('• Whitelist: POST /api/add-whitelist/NUMBER');
    console.log('• Pending: GET /api/pending-messages');
    console.log('• Approve: POST /api/approve-reply/ID');
    console.log('\n🔧 Current Settings:');
    console.log(`• Auto-Reply Mode: ${userSettings.autoReplyMode}`);
    console.log(`• Ask Before Reply: ${userSettings.askBeforeReply}`);
    console.log(`• Whitelist Only: ${userSettings.whitelistOnly}`);
    console.log('='.repeat(70));
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Enhanced WhatsApp Web Service...');
    if (whatsappClient) {
        try {
            await whatsappClient.destroy();
            console.log('✅ WhatsApp client destroyed cleanly');
        } catch (error) {
            console.error('❌ Error destroying client:', error);
        }
    }
    process.exit(0);
});
