/**
 * 💼 LINKEDIN PERSONALIZED SERVICE
 * Professional networking with AI-powered responses
 */

const express = require('express');
const cors = require('cors');
const { generatePersonalizedReply, personalizedContacts } = require('./personalized-ai-service');
require('dotenv').config();

// OAuth imports for quick connect
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// LinkedIn-specific settings
const linkedinSettings = {
    autoReplyMode: 'ask',
    personalizedReplies: true,
    businessHours: { start: '09:00', end: '18:00' },
    networkingMode: true,
    jobSearchMode: false,
    salesMode: false,
    connectionRequestAuto: false,
    pendingMessages: new Map(),
    pendingConnections: new Map(),
    industryFocus: [],
    skillsToHighlight: [],
    currentPosition: '',
    userResume: ''
};

console.log('💼 Starting LinkedIn Personalized Service...');

// LinkedIn role-specific templates
const linkedinRoles = {
    recruiter: {
        style: 'professional and interested',
        instructions: `You are responding to a recruiter on LinkedIn. Always:
        - Show enthusiasm for opportunities
        - Highlight relevant experience from your resume
        - Ask thoughtful questions about the role
        - Maintain professional tone
        - Be open to scheduling calls/meetings
        - Reference specific skills mentioned in job requirements`
    },
    hr: {
        style: 'professional and respectful',
        instructions: `You are communicating with HR on LinkedIn. Always:
        - Maintain formal professional tone
        - Reference your qualifications clearly
        - Show interest in the company culture
        - Be responsive and timely
        - Ask about next steps in the process
        - Demonstrate knowledge of the company`
    },
    networking: {
        style: 'professional and collaborative',
        instructions: `You are networking on LinkedIn. Always:
        - Express genuine interest in their work
        - Look for mutual connections or interests
        - Offer value or assistance
        - Suggest meeting for coffee or calls
        - Share relevant experiences
        - Build meaningful professional relationships`
    },
    sales: {
        style: 'professional but cautious',
        instructions: `You are responding to a sales message on LinkedIn. Always:
        - Be polite but direct
        - Ask specific questions about value proposition
        - Set clear boundaries if not interested
        - Request detailed information if interested
        - Maintain professional courtesy
        - Focus on business value`
    },
    peer: {
        style: 'collegial and collaborative',
        instructions: `You are communicating with a professional peer. Always:
        - Share industry insights
        - Offer collaboration opportunities
        - Discuss mutual interests
        - Exchange valuable resources
        - Build professional community
        - Maintain collegial tone`
    },
    client: {
        style: 'professional and service-oriented',
        instructions: `You are communicating with a potential client. Always:
        - Focus on their business needs
        - Highlight relevant expertise
        - Offer solutions and insights
        - Be responsive and professional
        - Demonstrate value proposition
        - Follow up appropriately`
    }
};

// Simulate LinkedIn message processing (in real implementation, use LinkedIn API)
async function handleLinkedInMessage(messageData) {
    const { 
        senderId, 
        senderName, 
        senderTitle, 
        senderCompany,
        message, 
        messageType = 'message', // 'message' or 'connection_request'
        connectionNote = ''
    } = messageData;
    
    console.log(`💼 LinkedIn ${messageType} from ${senderName} (${senderTitle} at ${senderCompany}): ${message || connectionNote}`);
    
    // Detect LinkedIn-specific contact role
    const role = detectLinkedInRole(message || connectionNote, senderTitle, senderCompany);
    
    // Check if we should auto-reply
    const contact = personalizedContacts.get(senderId);
    const shouldAutoReply = contact && contact.autoConversation;
    
    if (messageType === 'connection_request') {
        await handleConnectionRequest(messageData, role);
    } else if (linkedinSettings.autoReplyMode === 'auto' || shouldAutoReply) {
        await sendLinkedInPersonalizedReply(messageData, role);
    } else {
        // Store for approval
        const messageId = `li_${Date.now()}_${senderId}`;
        linkedinSettings.pendingMessages.set(messageId, {
            id: messageId,
            platform: 'linkedin',
            senderId,
            senderName,
            senderTitle,
            senderCompany,
            content: message,
            timestamp: new Date(),
            role,
            messageType
        });
        
        console.log(`⏳ LinkedIn message pending approval from ${senderName} (${role})`);
    }
}

function detectLinkedInRole(message, title, company) {
    const content = (message + ' ' + title).toLowerCase();
    
    if (content.includes('recruiter') || content.includes('talent') || content.includes('hiring')) {
        return 'recruiter';
    }
    
    if (content.includes('hr') || content.includes('human resources')) {
        return 'hr';
    }
    
    if (content.includes('sales') || content.includes('business development') || 
        content.includes('solution') || content.includes('demo')) {
        return 'sales';
    }
    
    if (content.includes('opportunity') || content.includes('collaboration') || 
        content.includes('partnership')) {
        return 'networking';
    }
    
    if (content.includes('ceo') || content.includes('founder') || content.includes('director')) {
        return 'client';
    }
    
    return 'peer';
}

async function handleConnectionRequest(messageData, role) {
    const { senderId, senderName, connectionNote } = messageData;
    
    if (linkedinSettings.connectionRequestAuto) {
        // Auto-accept certain types of connections
        const shouldAccept = shouldAutoAcceptConnection(role, connectionNote);
        
        if (shouldAccept) {
            console.log(`✅ Auto-accepted connection from ${senderName}`);
            // In real implementation, accept via LinkedIn API
            
            // Send welcome message
            const welcomeMessage = generateWelcomeMessage(senderName, role);
            console.log(`💼 Welcome message to ${senderName}: ${welcomeMessage}`);
        }
    } else {
        // Store for manual approval
        const requestId = `conn_${Date.now()}_${senderId}`;
        linkedinSettings.pendingConnections.set(requestId, {
            id: requestId,
            senderId,
            senderName,
            connectionNote,
            role,
            timestamp: new Date()
        });
        
        console.log(`⏳ Connection request pending approval from ${senderName} (${role})`);
    }
}

function shouldAutoAcceptConnection(role, note) {
    // Auto-accept recruiters and potential business contacts
    return ['recruiter', 'hr', 'client'].includes(role) || 
           (note && note.toLowerCase().includes('opportunity'));
}

function generateWelcomeMessage(senderName, role) {
    const roleMessages = {
        recruiter: `Hi ${senderName}, thank you for connecting! I'm always interested in hearing about new opportunities. Feel free to share any roles that might be a good fit.`,
        hr: `Hello ${senderName}, thank you for the connection! I'd be happy to learn more about your company and any opportunities you might have.`,
        networking: `Hi ${senderName}, great to connect! I look forward to staying in touch and potentially collaborating in the future.`,
        client: `Hello ${senderName}, thank you for connecting! I'd be interested in learning more about your business and how we might work together.`
    };
    
    return roleMessages[role] || `Hi ${senderName}, thank you for connecting! Looking forward to staying in touch.`;
}

async function sendLinkedInPersonalizedReply(messageData, role) {
    try {
        const { senderId, senderName, message, senderTitle, senderCompany } = messageData;
        
        // Create LinkedIn-specific context
        const linkedinPrompt = `
LinkedIn Message Context:
From: ${senderName}
Title: ${senderTitle}
Company: ${senderCompany}
Message: ${message}

User's Current Position: ${linkedinSettings.currentPosition}
User's Industry Focus: ${linkedinSettings.industryFocus.join(', ')}
Key Skills to Highlight: ${linkedinSettings.skillsToHighlight.join(', ')}
Job Search Mode: ${linkedinSettings.jobSearchMode ? 'Active' : 'Passive'}

Please compose a professional LinkedIn response that:
1. Addresses their message appropriately
2. Highlights relevant experience/skills if applicable
3. Maintains professional networking etiquette
4. Shows interest in building the professional relationship`;
        
        const result = await generatePersonalizedReply(linkedinPrompt, senderId, 'linkedin');
        
        // In real implementation, send via LinkedIn API
        console.log(`💼 LinkedIn Reply to ${senderName}:`);
        console.log(result.reply);
        
        // Store interaction
        const interaction = {
            platform: 'linkedin',
            senderId,
            senderName,
            senderTitle,
            senderCompany,
            originalMessage: message,
            aiReply: result.reply,
            timestamp: new Date(),
            role
        };
        
        return { success: true, reply: result.reply, interaction };
        
    } catch (error) {
        console.error('Error sending LinkedIn reply:', error);
        return { success: false, error: error.message };
    }
}

// API Endpoints

// OAuth Endpoints for Quick Connect
app.get('/api/linkedin/auth', (req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=r_liteprofile%20r_emailaddress%20w_member_social&` +
        `state=linkedin_quick_connect`;
    
    res.json({
        success: true,
        authUrl: authUrl,
        message: 'Click the URL to authorize LinkedIn access'
    });
});

app.get('/api/linkedin/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.status(400).json({
            success: false,
            error: 'Authorization code is required'
        });
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
            grant_type: 'authorization_code',
            code: code,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            redirect_uri: process.env.LINKEDIN_REDIRECT_URI
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const { access_token } = tokenResponse.data;
        
        // Store token securely (in production, use database)
        linkedinSettings.accessToken = access_token;
        linkedinSettings.connected = true;
        
        res.json({
            success: true,
            message: 'LinkedIn connected successfully!',
            platform: 'LinkedIn',
            status: 'connected'
        });
    } catch (error) {
        console.error('❌ LinkedIn OAuth Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect LinkedIn'
        });
    }
});

app.post('/api/linkedin/quick-connect', async (req, res) => {
    try {
        const { consumerEmail } = req.body;
        
        // Use stored credentials from .env for quick connect
        if (process.env.LINKEDIN_ACCESS_TOKEN) {
            linkedinSettings.accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
            linkedinSettings.connected = true;
            
            // Store consumer info if provided
            if (consumerEmail) {
                linkedinSettings.consumerEmail = consumerEmail;
                console.log(`💼 Consumer ${consumerEmail} connected to LinkedIn via backend credentials`);
            }
            
            res.json({
                success: true,
                message: 'LinkedIn connected using stored credentials',
                platform: 'LinkedIn',
                status: 'connected',
                consumerEmail: consumerEmail || null
            });
        } else {
            res.json({
                success: false,
                error: 'No stored credentials found. Please use manual setup.',
                requiresManualSetup: true
            });
        }
    } catch (error) {
        console.error('❌ LinkedIn Quick Connect Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect LinkedIn'
        });
    }
});

app.get('/api/linkedin/status', (req, res) => {
    res.json({
        success: true,
        platform: 'LinkedIn',
        connected: linkedinSettings.connected || false,
        settings: linkedinSettings,
        pendingMessages: linkedinSettings.pendingMessages.size,
        pendingConnections: linkedinSettings.pendingConnections.size,
        personalizedContacts: personalizedContacts.size
    });
});

app.post('/api/linkedin/configure', (req, res) => {
    const updates = req.body;
    Object.assign(linkedinSettings, updates);
    
    res.json({
        success: true,
        message: 'LinkedIn settings updated',
        settings: linkedinSettings
    });
});

app.get('/api/linkedin/pending-messages', (req, res) => {
    const pendingMessages = Array.from(linkedinSettings.pendingMessages.values());
    res.json({ success: true, pendingMessages });
});

app.get('/api/linkedin/pending-connections', (req, res) => {
    const pendingConnections = Array.from(linkedinSettings.pendingConnections.values());
    res.json({ success: true, pendingConnections });
});

app.post('/api/linkedin/approve-message/:messageId', async (req, res) => {
    const { messageId } = req.params;
    const { customResponse } = req.body;
    
    const pendingMessage = linkedinSettings.pendingMessages.get(messageId);
    if (!pendingMessage) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    let responseToSend = customResponse;
    if (!responseToSend) {
        const linkedinPrompt = `
LinkedIn Message from ${pendingMessage.senderName} (${pendingMessage.senderTitle}):
${pendingMessage.content}

Please compose a professional LinkedIn response.`;
        
        const result = await generatePersonalizedReply(
            linkedinPrompt, 
            pendingMessage.senderId, 
            'linkedin'
        );
        responseToSend = result.reply;
    }
    
    // Send response (simulate LinkedIn API call)
    console.log(`💼 Approved LinkedIn Reply to ${pendingMessage.senderName}: ${responseToSend}`);
    
    linkedinSettings.pendingMessages.delete(messageId);
    
    res.json({
        success: true,
        message: `LinkedIn reply sent to ${pendingMessage.senderName}`,
        response: responseToSend
    });
});

app.post('/api/linkedin/approve-connection/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { action, welcomeMessage } = req.body; // action: 'accept' or 'decline'
    
    const pendingConnection = linkedinSettings.pendingConnections.get(requestId);
    if (!pendingConnection) {
        return res.status(404).json({ success: false, error: 'Connection request not found' });
    }
    
    if (action === 'accept') {
        // Accept connection (simulate LinkedIn API call)
        console.log(`✅ Accepted connection from ${pendingConnection.senderName}`);
        
        // Send welcome message if provided
        if (welcomeMessage) {
            console.log(`💼 Welcome message to ${pendingConnection.senderName}: ${welcomeMessage}`);
        }
    } else {
        console.log(`❌ Declined connection from ${pendingConnection.senderName}`);
    }
    
    linkedinSettings.pendingConnections.delete(requestId);
    
    res.json({
        success: true,
        message: `Connection request ${action}ed for ${pendingConnection.senderName}`
    });
});

app.post('/api/linkedin/simulate-message', async (req, res) => {
    const { 
        senderName, 
        senderTitle, 
        senderCompany, 
        message, 
        messageType = 'message',
        connectionNote 
    } = req.body;
    
    const messageData = {
        senderId: `li_${senderName.replace(/\s+/g, '_')}`,
        senderName,
        senderTitle,
        senderCompany,
        message,
        messageType,
        connectionNote
    };
    
    await handleLinkedInMessage(messageData);
    
    res.json({
        success: true,
        message: 'LinkedIn message processed',
        data: messageData
    });
});

app.post('/api/linkedin/update-profile', (req, res) => {
    const { currentPosition, industryFocus, skillsToHighlight, userResume } = req.body;
    
    if (currentPosition) linkedinSettings.currentPosition = currentPosition;
    if (industryFocus) linkedinSettings.industryFocus = industryFocus;
    if (skillsToHighlight) linkedinSettings.skillsToHighlight = skillsToHighlight;
    if (userResume) linkedinSettings.userResume = userResume;
    
    res.json({
        success: true,
        message: 'LinkedIn profile information updated',
        profile: {
            currentPosition: linkedinSettings.currentPosition,
            industryFocus: linkedinSettings.industryFocus,
            skillsToHighlight: linkedinSettings.skillsToHighlight
        }
    });
});

const PORT = 3007;

app.listen(PORT, () => {
    console.log(`💼 LinkedIn Personalized Service running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api/linkedin`);
    console.log('');
    console.log('LinkedIn Features:');
    console.log('• Recruiter interaction optimization');
    console.log('• Professional networking responses');
    console.log('• Connection request management');
    console.log('• Industry-specific conversations');
    console.log('• Job search mode responses');
    console.log('• Skill highlighting in responses');
    console.log('');
});

module.exports = { handleLinkedInMessage, linkedinSettings };
