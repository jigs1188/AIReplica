# 📧 GMAIL SETUP GUIDE

## 🎯 **QUICK START**

### **Step 1: Start Gmail Service**
```bash
cd aireplica
node gmail-personalized-service.js
```

### **Step 2: Complete OAuth Setup**
```bash
# Open in browser:
http://localhost:3001/auth/gmail
```

---

## 🔧 **PREREQUISITES**

### **Google Cloud Console Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3001/auth/gmail/callback`

### **Required Environment Variables:**
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:3008/auth/gmail/callback
```

---

## 📧 **FEATURES**

### **Professional Email Management:**
- ✅ Intelligent auto-replies
- ✅ Professional/casual tone switching
- ✅ Business hours awareness
- ✅ Priority email detection
- ✅ Contact-based personalization
- ✅ Out-of-office mode
- ✅ Email categorization

### **Role-Based Responses:**
- **Colleague:** Professional and collaborative
- **Client:** Service-oriented and helpful
- **Manager:** Respectful and prompt
- **HR:** Professional and informative
- **Friend:** Casual and friendly

---

## 🚀 **SETUP STEPS**

### **1. Google Cloud Configuration**

#### **Create Project:**
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Click "New Project"
3. Name: "AIReplica Gmail Integration"
4. Click "Create"

#### **Enable Gmail API:**
1. Go to "APIs & Services" → "Library"
2. Search "Gmail API"
3. Click "Enable"

#### **Create OAuth Credentials:**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "AIReplica Gmail Service"
5. Authorized redirect URIs: `http://localhost:3001/auth/gmail/callback`
6. Click "Create"
7. Copy Client ID and Client Secret

### **2. Environment Setup**
Create or update `.env` file:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3001/auth/gmail/callback
```

### **3. Start Service**
```bash
cd aireplica
node gmail-personalized-service.js
```

You should see:
```
📧 Starting Gmail Personalized Service...
🚀 Gmail Service running on port 3008
🔗 Auth URL: http://localhost:3008/auth/gmail
```

### **4. Complete OAuth Flow**
1. Open browser: http://localhost:3001/auth/gmail
2. Sign in with your Google account
3. Grant Gmail permissions
4. You'll be redirected back to success page

---

## 📱 **MOBILE APP INTEGRATION**

### **Connect from Mobile:**
1. Start mobile app: `npx expo start`
2. Open Integration Hub
3. Tap "Gmail"
4. Tap "Connect"
5. Complete OAuth in browser

### **Configure Settings:**
```javascript
// In mobile app - Gmail settings
{
  autoReplyMode: 'ask',          // 'auto', 'ask', 'off'
  businessHours: {
    start: '09:00',
    end: '18:00'
  },
  outOfOfficeMode: false,
  priorityKeywords: ['urgent', 'asap', 'important', 'deadline']
}
```

---

## 🎛️ **API ENDPOINTS**

### **Authentication:**
```bash
# Start OAuth flow
GET http://localhost:3001/auth/gmail

# OAuth callback (automatic)
GET http://localhost:3001/auth/gmail/callback

# Check connection status
GET http://localhost:3001/api/status
```

### **Email Management:**
```bash
# Get pending emails
GET http://localhost:3001/api/pending-emails

# Send auto-reply
POST http://localhost:3001/api/send-reply
{
  "messageId": "email_message_id",
  "reply": "Generated AI reply text"
}

# Manual email processing
POST http://localhost:3001/api/process-email
{
  "from": "sender@example.com",
  "subject": "Email Subject",
  "body": "Email content",
  "isImportant": false
}
```

### **Contact Management:**
```bash
# Add contact profile
POST http://localhost:3001/api/contacts
{
  "email": "colleague@company.com",
  "name": "John Doe",
  "role": "colleague",
  "company": "Tech Corp",
  "notes": "Project manager for XYZ"
}

# Get all contacts
GET http://localhost:3001/api/contacts

# Update contact
PUT http://localhost:3001/api/contacts/colleague@company.com
{
  "role": "manager",
  "notes": "Promoted to senior manager"
}
```

### **Settings Configuration:**
```bash
# Update Gmail settings
POST http://localhost:3001/api/configure
{
  "autoReplyMode": "auto",
  "businessHours": {
    "start": "08:00",
    "end": "19:00"
  },
  "outOfOfficeMode": true,
  "priorityKeywords": ["urgent", "critical", "asap"]
}
```

---

## 🛠️ **TROUBLESHOOTING**

### **❌ Issue: OAuth Redirect Mismatch**
```
Error: redirect_uri_mismatch
```

**✅ Solution:**
1. Check Google Cloud Console credentials
2. Ensure redirect URI is exactly: `http://localhost:3001/auth/gmail/callback`
3. No trailing slashes, exact URL match required

### **❌ Issue: Gmail API Not Enabled**
```
Error: Gmail API has not been used in project
```

**✅ Solution:**
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" → "Library"
3. Search "Gmail API"
4. Click "Enable"

### **❌ Issue: Insufficient Permissions**
```
Error: insufficient_permissions
```

**✅ Solution:**
1. During OAuth, ensure you grant all requested permissions
2. Check scopes include:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`

### **❌ Issue: Rate Limiting**
```
Error: User Rate Limit Exceeded
```

**✅ Solution:**
1. Implement exponential backoff
2. Request quota increase in Google Cloud Console
3. Use batch operations for multiple emails

---

## 📊 **USAGE EXAMPLES**

### **Professional Email Reply:**
```
Original: "Hi, can you send me the project report by Friday?"
AI Reply: "Hi [Name], absolutely! I'll have the project report ready and sent to you by Friday afternoon. Please let me know if you need any specific sections prioritized. Best regards, [Your Name]"
```

### **Client Service Email:**
```
Original: "I'm having issues with the product setup"
AI Reply: "Dear [Client Name], Thank you for reaching out. I understand you're experiencing difficulties with the product setup. I'd be happy to assist you with this right away. Could you please provide more details about the specific issues you're encountering? I'll make sure to resolve this promptly. Best regards, [Your Name]"
```

### **Out-of-Office Auto-Reply:**
```
AI Reply: "Thank you for your email. I'm currently out of the office and will respond to your message when I return on [Date]. For urgent matters, please contact [Alternative Contact]. Best regards, [Your Name]"
```

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **Security Best Practices:**
1. **Use HTTPS** in production
2. **Secure credentials** with proper environment management
3. **Implement rate limiting**
4. **Regular token refresh**
5. **Audit logs** for email processing

### **Performance Optimization:**
1. **Batch email processing**
2. **Caching for frequent contacts**
3. **Queue system for high volume**
4. **Database for contact storage**

### **Monitoring:**
```bash
# Health check endpoint
GET http://localhost:3001/health

# Metrics endpoint
GET http://localhost:3001/metrics
```

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Google Cloud project created
- [ ] Gmail API enabled
- [ ] OAuth credentials configured
- [ ] Environment variables set
- [ ] Service starts on port 3001
- [ ] OAuth flow completes successfully
- [ ] Test email auto-reply works
- [ ] Mobile app shows "Connected" status
- [ ] Contact profiles working
- [ ] Business hours respected

**🎉 Your Gmail AI assistant is ready to handle professional emails!**
