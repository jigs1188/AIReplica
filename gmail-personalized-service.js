/**
 * 📧 GMAIL PERSONALIZED SERVICE
 * Advanced email management with professional AI responses
 */

const express = require('express');
const cors = require('cors');
const { generatePersonalizedReply, personalizedContacts } = require('./personalized-ai-service');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Gmail-specific settings
const gmailSettings = {
    autoReplyMode: 'ask',
    personalizedReplies: true,
    businessHours: { start: '09:00', end: '18:00' },
    outOfOfficeMode: false,
    priorityKeywords: ['urgent', 'asap', 'important', 'deadline'],
    signatures: {
        professional: 'Best regards,\n[Your Name]\n[Your Title]\n[Company]',
        casual: 'Thanks,\n[Your Name]',
        business: 'Sincerely,\n[Your Name]\n[Your Position]'
    },
    pendingEmails: new Map(),
    categories: {
        work: { enabled: true, autoReply: false },
        personal: { enabled: true, autoReply: true },
        promotion: { enabled: false, autoReply: false },
        social: { enabled: true, autoReply: true }
    }
};

console.log('📧 Starting Gmail Personalized Service...');

// Email role-specific templates
const emailRoles = {
    colleague: {
        style: 'professional and collaborative',
        instructions: 'Respond as a professional colleague. Be helpful, maintain work relationships, and focus on productivity.',
        signature: 'professional'
    },
    client: {
        style: 'professional and service-oriented',
        instructions: 'Respond to clients with utmost professionalism. Focus on their needs, provide solutions, and maintain excellent service.',
        signature: 'business'
    },
    manager: {
        style: 'respectful and efficient',
        instructions: 'Respond to managers with respect and professionalism. Be concise, provide clear updates, and ask for guidance when needed.',
        signature: 'professional'
    },
    vendor: {
        style: 'business-focused and direct',
        instructions: 'Handle vendor communications professionally. Focus on business terms, timelines, and deliverables.',
        signature: 'business'
    },
    recruiter: {
        style: 'professional and interested',
        instructions: 'Respond to recruiters professionally. Show interest in opportunities while maintaining your value proposition.',
        signature: 'professional'
    },
    family: {
        style: 'warm and personal',
        instructions: 'Respond to family with warmth and care. Maintain personal relationships and show genuine interest.',
        signature: 'casual'
    },
    friend: {
        style: 'friendly and casual',
        instructions: 'Respond to friends in a relaxed, friendly manner. Maintain relationships and show genuine interest in their lives.',
        signature: 'casual'
    }
};

// Simulate Gmail processing (in real implementation, use Gmail API)
async function handleGmailMessage(emailData) {
    const { 
        messageId, 
        from, 
        to, 
        subject, 
        body, 
        timestamp,
        category = 'primary',
        isImportant = false 
    } = emailData;
    
    console.log(`📧 Email from ${from}: ${subject}`);
    
    // Extract sender email for contact lookup
    const senderEmail = extractEmailAddress(from);
    
    // Detect email role based on content and sender
    const role = detectEmailRole(body, subject, senderEmail);
    
    // Check priority
    const isPriority = checkPriority(subject, body, isImportant);
    
    // Check if we should auto-reply
    const contact = personalizedContacts.get(senderEmail);
    const shouldAutoReply = (contact && contact.autoConversation) || 
                           (gmailSettings.categories[category]?.autoReply && !isPriority);
    
    if (gmailSettings.autoReplyMode === 'auto' && shouldAutoReply) {
        await sendGmailPersonalizedReply(emailData, role);
    } else {
        // Store for approval
        const pendingId = `email_${Date.now()}_${messageId}`;
        gmailSettings.pendingEmails.set(pendingId, {
            id: pendingId,
            platform: 'gmail',
            messageId,
            from,
            to,
            subject,
            body,
            timestamp: new Date(timestamp),
            role,
            category,
            isPriority,
            senderEmail
        });
        
        console.log(`⏳ Email pending approval from ${from} (${role}) - ${isPriority ? 'PRIORITY' : 'Normal'}`);
    }
}

function extractEmailAddress(fromField) {
    const match = fromField.match(/<(.+?)>/) || fromField.match(/([^\s<>]+@[^\s<>]+)/);
    return match ? match[1] : fromField;
}

function detectEmailRole(body, subject, senderEmail) {
    const content = (body + ' ' + subject).toLowerCase();
    const domain = senderEmail.split('@')[1];
    
    // Check domain patterns
    if (domain && (domain.includes('hr') || domain.includes('recruit'))) {
        return 'recruiter';
    }
    
    // Check content patterns
    if (content.includes('interview') || content.includes('position') || content.includes('job opportunity')) {
        return 'recruiter';
    }
    
    if (content.includes('project') || content.includes('client') || content.includes('proposal')) {
        return 'client';
    }
    
    if (content.includes('meeting') || content.includes('deadline') || content.includes('update')) {
        return 'colleague';
    }
    
    if (content.includes('invoice') || content.includes('payment') || content.includes('vendor')) {
        return 'vendor';
    }
    
    if (content.includes('family') || senderEmail.includes('gmail.com') || senderEmail.includes('yahoo.com')) {
        return 'personal';
    }
    
    return 'general';
}

function checkPriority(subject, body, isImportant) {
    if (isImportant) return true;
    
    const content = (subject + ' ' + body).toLowerCase();
    return gmailSettings.priorityKeywords.some(keyword => content.includes(keyword));
}

async function sendGmailPersonalizedReply(emailData, role) {
    try {
        const { from, subject, body, senderEmail } = emailData;
        
        // Create enhanced prompt for email context
        const emailPrompt = `
Original Email:
From: ${from}
Subject: ${subject}
Body: ${body}

Please compose a professional email response that addresses the sender's message appropriately.`;
        
        const result = await generatePersonalizedReply(emailPrompt, senderEmail, 'gmail');
        
        // Add appropriate signature
        const roleConfig = emailRoles[role] || emailRoles.general;
        const signature = gmailSettings.signatures[roleConfig.signature] || gmailSettings.signatures.professional;
        const fullReply = result.reply + '\n\n' + signature;
        
        // In real implementation, send via Gmail API
        console.log(`📧 Gmail Reply to ${from}:`);
        console.log(`Subject: Re: ${subject}`);
        console.log(fullReply);
        
        // Store interaction
        const interaction = {
            platform: 'gmail',
            senderEmail,
            from,
            subject: `Re: ${subject}`,
            originalMessage: body,
            aiReply: fullReply,
            timestamp: new Date(),
            role
        };
        
        return { success: true, reply: fullReply, interaction };
        
    } catch (error) {
        console.error('Error sending Gmail reply:', error);
        return { success: false, error: error.message };
    }
}

// API Endpoints

app.get('/api/gmail/status', (req, res) => {
    res.json({
        success: true,
        platform: 'Gmail',
        settings: gmailSettings,
        pendingEmails: gmailSettings.pendingEmails.size,
        personalizedContacts: personalizedContacts.size
    });
});

app.post('/api/gmail/configure', (req, res) => {
    const updates = req.body;
    Object.assign(gmailSettings, updates);
    
    res.json({
        success: true,
        message: 'Gmail settings updated',
        settings: gmailSettings
    });
});

app.get('/api/gmail/pending-emails', (req, res) => {
    const pendingEmails = Array.from(gmailSettings.pendingEmails.values());
    res.json({ success: true, pendingEmails });
});

app.post('/api/gmail/approve-email/:emailId', async (req, res) => {
    const { emailId } = req.params;
    const { customResponse } = req.body;
    
    const pendingEmail = gmailSettings.pendingEmails.get(emailId);
    if (!pendingEmail) {
        return res.status(404).json({ success: false, error: 'Email not found' });
    }
    
    let responseToSend = customResponse;
    if (!responseToSend) {
        const emailPrompt = `
Original Email:
From: ${pendingEmail.from}
Subject: ${pendingEmail.subject}
Body: ${pendingEmail.body}

Please compose a professional email response.`;
        
        const result = await generatePersonalizedReply(
            emailPrompt, 
            pendingEmail.senderEmail, 
            'gmail'
        );
        responseToSend = result.reply;
    }
    
    // Add signature
    const roleConfig = emailRoles[pendingEmail.role] || emailRoles.general;
    const signature = gmailSettings.signatures[roleConfig.signature] || gmailSettings.signatures.professional;
    const fullReply = responseToSend + '\n\n' + signature;
    
    // Send response (simulate Gmail API call)
    console.log(`📧 Approved Gmail Reply to ${pendingEmail.from}:`);
    console.log(`Subject: Re: ${pendingEmail.subject}`);
    console.log(fullReply);
    
    gmailSettings.pendingEmails.delete(emailId);
    
    res.json({
        success: true,
        message: `Email reply sent to ${pendingEmail.from}`,
        response: fullReply
    });
});

app.post('/api/gmail/simulate-email', async (req, res) => {
    const { from, subject, body, category = 'primary', isImportant = false } = req.body;
    
    const emailData = {
        messageId: `sim_${Date.now()}`,
        from,
        to: 'user@example.com',
        subject,
        body,
        timestamp: new Date().toISOString(),
        category,
        isImportant
    };
    
    await handleGmailMessage(emailData);
    
    res.json({
        success: true,
        message: 'Gmail message processed',
        data: emailData
    });
});

app.post('/api/gmail/set-out-of-office', (req, res) => {
    const { enabled, message, startDate, endDate } = req.body;
    
    gmailSettings.outOfOfficeMode = enabled;
    gmailSettings.outOfOfficeMessage = message;
    gmailSettings.outOfOfficeStart = startDate;
    gmailSettings.outOfOfficeEnd = endDate;
    
    res.json({
        success: true,
        message: `Out of office ${enabled ? 'enabled' : 'disabled'}`,
        settings: {
            outOfOfficeMode: gmailSettings.outOfOfficeMode,
            outOfOfficeMessage: gmailSettings.outOfOfficeMessage
        }
    });
});

const PORT = 3008;

app.listen(PORT, () => {
    console.log(`📧 Gmail Personalized Service running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api/gmail`);
    console.log('');
    console.log('Gmail Features:');
    console.log('• Professional email role detection');
    console.log('• Priority email handling');
    console.log('• Business hour responses');
    console.log('• Automatic signatures');
    console.log('• Out of office management');
    console.log('• Category-based auto-reply');
    console.log('');
});

module.exports = { handleGmailMessage, gmailSettings };
