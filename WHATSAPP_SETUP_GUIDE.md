# 📱 WHATSAPP SETUP GUIDE

## 🎯 **QUICK START**

### **Step 1: Choose Your WhatsApp Option**
```bash
# Option A: Enhanced WhatsApp (Recommended)
node whatsapp-enhanced-service.js

# Option B: Simple WhatsApp  
node whatsapp-web-service.js

# Option C: Business API
node whatsapp-business-service.js

# Option D: Demo Mode (Testing)
node whatsapp-demo-service.js
```

---

## 🔧 **OPTION A: Enhanced WhatsApp Service (Recommended)**

### **Features:**
- ✅ Ask before sending replies
- ✅ Whitelist/blacklist numbers
- ✅ Personalized AI responses
- ✅ Contact management
- ✅ Professional/casual tone switching
- ✅ LocalWebCache error fixed

### **Setup Steps:**

#### **1. Start the Service:**
```bash
cd aireplica
node whatsapp-enhanced-service.js
```

#### **2. Scan QR Code:**
- Open WhatsApp on your phone
- Go to Settings → Linked Devices
- Tap "Link a Device"
- Scan the QR code from terminal

#### **3. Configure Settings (Optional):**
```bash
# Enable auto-reply
curl -X POST http://localhost:3004/api/configure \
  -H "Content-Type: application/json" \
  -d '{"autoReplyMode": "auto"}'

# Add to whitelist
curl -X POST http://localhost:3004/api/add-whitelist/1234567890
```

---

## 🔧 **OPTION B: Simple WhatsApp Service**

### **Features:**
- ✅ Basic auto-replies
- ✅ AI responses
- ✅ Simple configuration

### **Setup Steps:**
```bash
cd aireplica
node whatsapp-web-service.js
```

---

## 🔧 **OPTION C: Business API**

### **Prerequisites:**
- WhatsApp Business Account
- Access Token from Meta Business

### **Environment Variables:**
```env
WHATSAPP_ACCESS_TOKEN=your_business_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

### **Setup Steps:**
```bash
cd aireplica
node whatsapp-business-service.js
```

---

## 🔧 **OPTION D: Demo Mode (Testing)**

### **Features:**
- ✅ No real WhatsApp needed
- ✅ Simulated conversations
- ✅ Testing interface
- ✅ AI reply simulation

### **Setup Steps:**
```bash
cd aireplica
node whatsapp-demo-service.js
```

---

## 📱 **MOBILE APP INTEGRATION**

### **1. Start Mobile App:**
```bash
cd aireplica
npx expo start
```

### **2. Connect WhatsApp:**
- Open mobile app
- Go to Integration Hub
- Tap "WhatsApp"
- Choose your preferred option

### **3. QR Display:**
- In mobile app: Integration Hub → WhatsApp → QR Code
- Scan with WhatsApp app on phone

---

## 🛠️ **TROUBLESHOOTING**

### **❌ Issue: LocalWebCache Error**
```
Error: Cannot read properties of null (reading '1')
at LocalWebCache.persist
```

**✅ Solution:** Use Enhanced WhatsApp Service
```bash
node whatsapp-enhanced-service.js
```
This version has the LocalWebCache error fixed.

### **❌ Issue: QR Code Not Appearing**
**✅ Solutions:**
1. Wait 30-60 seconds for QR generation
2. Check terminal output for ASCII QR
3. Visit: http://localhost:3004/api/qr-code
4. Try demo mode: `node whatsapp-demo-service.js`

### **❌ Issue: Authentication Failed**
**✅ Solutions:**
1. Use regular WhatsApp (not Business) 
2. Clear session: DELETE http://localhost:3004/api/clear-session
3. Restart service
4. Check phone internet connection

### **❌ Issue: Can't Send Messages**
**✅ Check:**
1. Service status: http://localhost:3004/api/status
2. Auto-reply mode: Should be 'auto' or 'ask'
3. Whitelist settings (if enabled)
4. Contact is not blacklisted

---

## 🎛️ **API ENDPOINTS**

### **Service Control:**
```bash
# Check status
GET http://localhost:3004/api/status

# Get QR code
GET http://localhost:3004/api/qr-code

# Configure settings
POST http://localhost:3004/api/configure
{
  "autoReplyMode": "auto",
  "askBeforeReply": false,
  "whitelistOnly": false
}
```

### **Contact Management:**
```bash
# Add to whitelist
POST http://localhost:3004/api/add-whitelist/PHONE_NUMBER

# Add contact profile
POST http://localhost:3004/api/contacts
{
  "number": "1234567890",
  "name": "John Doe",
  "role": "colleague",
  "notes": "Work contact"
}
```

### **Message Control:**
```bash
# Get pending messages
GET http://localhost:3004/api/pending-messages

# Approve reply
POST http://localhost:3004/api/approve-reply/MESSAGE_ID
```

---

## 🚀 **PRODUCTION TIPS**

### **Best Practices:**
1. **Start with 'ask' mode** to review replies before sending
2. **Use whitelist** for important contacts only
3. **Set business hours** to avoid late-night replies
4. **Regular backups** of contact profiles
5. **Monitor pending messages** regularly

### **Security:**
- Keep access tokens secure
- Use HTTPS in production
- Implement rate limiting
- Regular security updates

### **Performance:**
- Clean up old sessions regularly
- Monitor memory usage
- Use PM2 for production deployment
- Set up logging and monitoring

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Service starts without LocalWebCache error
- [ ] QR code appears in terminal
- [ ] WhatsApp app successfully scans QR
- [ ] "WhatsApp is ready!" message appears
- [ ] Test message auto-reply works
- [ ] Mobile app shows "Connected" status
- [ ] API endpoints respond correctly

**🎉 Your WhatsApp AI assistant is ready!**
