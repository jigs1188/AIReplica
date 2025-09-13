/**
 * 🎯 PERSONALIZED AI SERVICE - ADVANCED CONTACT MANAGEMENT
 * Custom instructions, chat history analysis, and role-based conversations
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Enhanced contact management with personalized instructions
const personalizedContacts = new Map();
const conversationHistory = new Map();
const autoConversationSettings = new Map();

// Contact profile structure
class ContactProfile {
    constructor(number, name, role = 'general') {
        this.number = number;
        this.name = name;
        this.role = role; // hr, client, friend, family, business, etc.
        this.customInstructions = '';
        this.conversationStyle = 'professional';
        this.chatHistory = [];
        this.userResume = null;
        this.theirPosition = '';
        this.relationship = '';
        this.autoConversation = false;
        this.lastInteraction = new Date();
        this.interactionCount = 0;
        this.tags = [];
        this.preferences = {};
        this.contextNotes = '';
    }
}

// Role-based conversation templates
const roleTemplates = {
    hr: {
        style: 'professional and respectful',
        tone: 'formal but approachable',
        instructions: `You are speaking with an HR professional. Always:
        - Maintain professional tone
        - Reference relevant experience from user's resume
        - Be concise and to the point
        - Show enthusiasm for opportunities
        - Ask thoughtful questions about the role
        - Follow up appropriately on previous conversations`
    },
    client: {
        style: 'professional and solution-focused',
        tone: 'confident and helpful',
        instructions: `You are communicating with a client. Always:
        - Focus on their business needs
        - Provide value in every interaction
        - Be responsive and timely
        - Maintain professional boundaries
        - Offer solutions and insights
        - Follow up on commitments made`
    },
    manager: {
        style: 'respectful and collaborative',
        tone: 'professional with appropriate deference',
        instructions: `You are communicating with a manager/supervisor. Always:
        - Show respect for their time and position
        - Be clear and concise in communications
        - Provide status updates when requested
        - Ask for guidance when needed
        - Maintain professional rapport`
    },
    friend: {
        style: 'casual and friendly',
        tone: 'warm and conversational',
        instructions: `You are chatting with a friend. Always:
        - Use a relaxed, friendly tone
        - Reference shared experiences and inside jokes
        - Show genuine interest in their life
        - Be supportive and encouraging
        - Maintain the friendship dynamic`
    },
    family: {
        style: 'warm and personal',
        tone: 'loving and caring',
        instructions: `You are communicating with family. Always:
        - Use a warm, caring tone
        - Reference family history and relationships
        - Show genuine concern for their wellbeing
        - Be patient and understanding
        - Maintain family bonds`
    },
    business: {
        style: 'professional and strategic',
        tone: 'confident and knowledgeable',
        instructions: `You are in a business context. Always:
        - Focus on business objectives
        - Provide strategic insights
        - Be direct and results-oriented
        - Reference relevant business experience
        - Maintain professional credibility`
    }
};

// Load contact profiles from storage
async function loadContactProfiles() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'contact-profiles.json'), 'utf8');
        const profiles = JSON.parse(data);
        
        for (const [number, profileData] of Object.entries(profiles)) {
            const profile = new ContactProfile(profileData.number, profileData.name, profileData.role);
            Object.assign(profile, profileData);
            personalizedContacts.set(number, profile);
        }
        
        console.log(`📚 Loaded ${personalizedContacts.size} contact profiles`);
    } catch (error) {
        console.log('📝 No existing contact profiles found, starting fresh');
    }
}

// Save contact profiles to storage
async function saveContactProfiles() {
    try {
        const profiles = {};
        for (const [number, profile] of personalizedContacts) {
            profiles[number] = profile;
        }
        
        await fs.writeFile(
            path.join(__dirname, 'contact-profiles.json'), 
            JSON.stringify(profiles, null, 2)
        );
    } catch (error) {
        console.error('Error saving contact profiles:', error);
    }
}

// Generate personalized AI response with context
async function generatePersonalizedReply(message, senderNumber, platform = 'whatsapp') {
    const contact = personalizedContacts.get(senderNumber);
    
    if (!contact) {
        // Create basic profile for new contact
        const newContact = new ContactProfile(senderNumber, 'Unknown Contact');
        personalizedContacts.set(senderNumber, newContact);
        await saveContactProfiles();
    }
    
    const profile = personalizedContacts.get(senderNumber);
    const roleTemplate = roleTemplates[profile.role] || roleTemplates.general;
    
    // Get conversation history for context
    const recentHistory = profile.chatHistory.slice(-10); // Last 10 messages
    
    // Build enhanced system prompt with personalization
    const systemPrompt = `You are an AI assistant representing the user in ${platform} conversations.

CONTACT PROFILE:
- Name: ${profile.name}
- Role/Relationship: ${profile.role}
- Their Position: ${profile.theirPosition}
- Relationship Context: ${profile.relationship}

CONVERSATION STYLE:
${roleTemplate.instructions}

CUSTOM INSTRUCTIONS FOR THIS CONTACT:
${profile.customInstructions || 'No specific instructions provided.'}

USER'S RESUME/BACKGROUND:
${profile.userResume || 'Resume not provided for this contact.'}

CONVERSATION CONTEXT NOTES:
${profile.contextNotes || 'No additional context notes.'}

RECENT CONVERSATION HISTORY:
${recentHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

CURRENT MESSAGE TO RESPOND TO: "${message}"

Please respond in character, maintaining the appropriate style for this relationship and role. Reference relevant history and context when appropriate.`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://aireplica.com',
                'X-Title': 'AIReplica Personalized Service'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const data = await response.json();
        const aiReply = data.choices[0].message.content;

        // Store conversation in history
        profile.chatHistory.push(
            { sender: profile.name, content: message, timestamp: new Date() },
            { sender: 'AI (You)', content: aiReply, timestamp: new Date() }
        );
        
        // Update interaction stats
        profile.lastInteraction = new Date();
        profile.interactionCount++;
        
        // Keep only last 50 messages to manage memory
        if (profile.chatHistory.length > 50) {
            profile.chatHistory = profile.chatHistory.slice(-50);
        }
        
        await saveContactProfiles();
        
        return {
            reply: aiReply,
            contactName: profile.name,
            role: profile.role,
            autoMode: profile.autoConversation
        };

    } catch (error) {
        console.error('Error generating personalized reply:', error);
        return {
            reply: `Hi ${profile.name}, I received your message but I'm having technical difficulties right now. I'll get back to you shortly!`,
            contactName: profile.name,
            role: profile.role,
            autoMode: false
        };
    }
}

// API Endpoints

// Get all contact profiles
app.get('/api/contacts', (req, res) => {
    const contacts = Array.from(personalizedContacts.values()).map(contact => ({
        ...contact,
        chatHistory: contact.chatHistory.slice(-5) // Only recent messages for overview
    }));
    
    res.json({ success: true, contacts, count: contacts.length });
});

// Get specific contact profile
app.get('/api/contacts/:number', (req, res) => {
    const { number } = req.params;
    const contact = personalizedContacts.get(number);
    
    if (!contact) {
        return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    res.json({ success: true, contact });
});

// Create or update contact profile
app.post('/api/contacts/:number', async (req, res) => {
    const { number } = req.params;
    const {
        name,
        role,
        customInstructions,
        conversationStyle,
        userResume,
        theirPosition,
        relationship,
        autoConversation,
        tags,
        preferences,
        contextNotes
    } = req.body;
    
    let contact = personalizedContacts.get(number);
    
    if (!contact) {
        contact = new ContactProfile(number, name, role);
        personalizedContacts.set(number, contact);
    }
    
    // Update contact with provided data
    if (name) contact.name = name;
    if (role) contact.role = role;
    if (customInstructions) contact.customInstructions = customInstructions;
    if (conversationStyle) contact.conversationStyle = conversationStyle;
    if (userResume) contact.userResume = userResume;
    if (theirPosition) contact.theirPosition = theirPosition;
    if (relationship) contact.relationship = relationship;
    if (typeof autoConversation === 'boolean') contact.autoConversation = autoConversation;
    if (tags) contact.tags = tags;
    if (preferences) contact.preferences = preferences;
    if (contextNotes) contact.contextNotes = contextNotes;
    
    await saveContactProfiles();
    
    res.json({ 
        success: true, 
        message: `Contact profile ${contact ? 'updated' : 'created'} for ${name}`,
        contact 
    });
});

// Generate personalized reply for testing
app.post('/api/generate-reply/:number', async (req, res) => {
    const { number } = req.params;
    const { message, platform = 'whatsapp' } = req.body;
    
    if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    try {
        const result = await generatePersonalizedReply(message, number, platform);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get conversation history for a contact
app.get('/api/contacts/:number/history', (req, res) => {
    const { number } = req.params;
    const { limit = 50 } = req.query;
    
    const contact = personalizedContacts.get(number);
    
    if (!contact) {
        return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    const history = contact.chatHistory.slice(-parseInt(limit));
    
    res.json({ 
        success: true, 
        history,
        contactName: contact.name,
        totalMessages: contact.chatHistory.length
    });
});

// Enable/disable auto conversation for a contact
app.post('/api/contacts/:number/auto-conversation', async (req, res) => {
    const { number } = req.params;
    const { enabled } = req.body;
    
    const contact = personalizedContacts.get(number);
    
    if (!contact) {
        return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    contact.autoConversation = enabled;
    await saveContactProfiles();
    
    res.json({ 
        success: true, 
        message: `Auto conversation ${enabled ? 'enabled' : 'disabled'} for ${contact.name}`,
        autoConversation: contact.autoConversation
    });
});

// Delete contact profile
app.delete('/api/contacts/:number', async (req, res) => {
    const { number } = req.params;
    
    const contact = personalizedContacts.get(number);
    
    if (!contact) {
        return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    personalizedContacts.delete(number);
    await saveContactProfiles();
    
    res.json({ 
        success: true, 
        message: `Contact profile deleted for ${contact.name}`
    });
});

// Get role templates
app.get('/api/role-templates', (req, res) => {
    res.json({ success: true, templates: roleTemplates });
});

// Bulk import contacts from CSV or JSON
app.post('/api/contacts/import', async (req, res) => {
    const { contacts } = req.body;
    
    if (!Array.isArray(contacts)) {
        return res.status(400).json({ success: false, error: 'Contacts must be an array' });
    }
    
    let imported = 0;
    let errors = [];
    
    for (const contactData of contacts) {
        try {
            const { number, name, role = 'general' } = contactData;
            
            if (!number || !name) {
                errors.push(`Missing number or name for contact: ${JSON.stringify(contactData)}`);
                continue;
            }
            
            const contact = new ContactProfile(number, name, role);
            Object.assign(contact, contactData);
            personalizedContacts.set(number, contact);
            imported++;
            
        } catch (error) {
            errors.push(`Error importing contact ${contactData.number}: ${error.message}`);
        }
    }
    
    await saveContactProfiles();
    
    res.json({ 
        success: true, 
        message: `Imported ${imported} contacts`,
        imported,
        errors
    });
});

// Export contacts
app.get('/api/contacts/export', (req, res) => {
    const contacts = Array.from(personalizedContacts.values());
    
    res.json({ 
        success: true, 
        contacts,
        exportDate: new Date().toISOString(),
        count: contacts.length
    });
});

// Health check
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        service: 'Personalized AI Service',
        status: 'running',
        contactsLoaded: personalizedContacts.size,
        uptime: process.uptime()
    });
});

// Initialize service
const PORT = process.env.PERSONALIZED_AI_PORT || 3005;

async function startService() {
    await loadContactProfiles();
    
    app.listen(PORT, () => {
        console.log('🎯 Personalized AI Service Started!');
        console.log(`📡 Server running on port ${PORT}`);
        console.log(`🔗 API Base: http://localhost:${PORT}/api`);
        console.log(`📚 Loaded ${personalizedContacts.size} contact profiles`);
        console.log('');
        console.log('Available Endpoints:');
        console.log('• GET  /api/contacts - List all contacts');
        console.log('• POST /api/contacts/:number - Create/update contact');
        console.log('• GET  /api/contacts/:number/history - Get chat history');
        console.log('• POST /api/generate-reply/:number - Test personalized reply');
        console.log('• POST /api/contacts/:number/auto-conversation - Enable auto chat');
        console.log('');
    });
}

// Export for integration with other services
module.exports = { generatePersonalizedReply, personalizedContacts, ContactProfile };

// Start service if run directly
if (require.main === module) {
    startService();
}
