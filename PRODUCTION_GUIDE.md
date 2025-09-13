# 🚀 AIReplica Production Setup Guide

**Real AI Auto-Replies for WhatsApp, Instagram, Gmail, LinkedIn**

## 📋 Quick Start (5 Minutes)

### 1. **Run Production System**
```bash
# Double-click or run:
START-PRODUCTION.bat
```
This starts all services automatically:
- ✅ WhatsApp Web Service (Port 3004)
- ✅ Production API Service (Port 3001)  
- ✅ Mobile App (Port 8082)

### 2. **Connect WhatsApp (Choose One)**

#### Option A: WhatsApp Web (Personal)
1. Open WhatsApp Web Service terminal
2. **Scan QR code** with your WhatsApp app
3. **Enable auto-reply**:
```bash
curl -X POST http://localhost:3004/api/enable-auto-reply \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","personality":{"style":"friendly","tone":"helpful"}}'
```

#### Option B: WhatsApp Business API
1. Get WhatsApp Business API credentials
2. Add to `.env` file:
```env
WHATSAPP_ACCESS_TOKEN=your_business_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```
3. Connect via mobile app

### 3. **Test Auto-Replies**
- Ask a friend to message your WhatsApp
- **AI will automatically reply** within 1-3 seconds
- All conversations stored and learned from

---

## 🤖 How AI Auto-Replies Work

### **Real-Time Processing**
1. **Message Received** → WhatsApp/Instagram/Gmail webhook
2. **AI Analysis** → OpenRouter/LLaMA generates contextual reply
3. **Auto-Send** → Platform API sends response immediately
4. **Learning** → Conversation stored for personality training

### **Smart Features**
- ✅ **Context Awareness**: Remembers conversation history
- ✅ **Platform Optimization**: Different tone for LinkedIn vs WhatsApp  
- ✅ **Personality Learning**: Adapts to your communication style
- ✅ **Fallback Handling**: Graceful error recovery
- ✅ **Multi-Platform**: WhatsApp, Instagram, Gmail, LinkedIn support

---

## 📱 Platform Setup Instructions

### **WhatsApp Business API**
1. **Get API Access**: https://developers.facebook.com/docs/whatsapp
2. **Configure Webhook**: `POST /api/webhook/whatsapp`
3. **Set Environment Variables**:
```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WEBHOOK_VERIFY_TOKEN=your_verify_token
```

### **Instagram Business**
1. **Connect Instagram Business Account**
2. **Configure Webhook**: `POST /api/webhook/instagram`
3. **Set Environment Variables**:
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
INSTAGRAM_ACCESS_TOKEN=your_token
```

### **Gmail API**
1. **Enable Gmail API**: https://console.cloud.google.com
2. **Setup OAuth 2.0**: Download credentials.json
3. **Configure Pub/Sub**: For real-time email notifications
4. **Set Environment Variables**:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GMAIL_REDIRECT_URI=http://localhost:3001/auth/gmail/callback
```

### **LinkedIn API**
1. **Create LinkedIn App**: https://developer.linkedin.com
2. **Get API Access**: Request messaging permissions
3. **Set Environment Variables**:
```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/auth/linkedin/callback
```

---

## 🔧 Environment Configuration

### **Required .env Variables**
```env
# AI Configuration
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-xxx

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321

# Instagram API
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Gmail API
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# LinkedIn API
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=your_verify_token
WEBHOOK_BASE_URL=https://your-domain.com
```

---

## 📊 API Endpoints

### **WhatsApp Web Service (Port 3004)**
- `GET /api/status` - Connection status
- `GET /api/qr-code` - Get QR code for setup
- `POST /api/enable-auto-reply` - Enable AI replies
- `POST /api/send-message` - Send manual message
- `GET /api/auto-reply-users` - List connected users

### **Production Service (Port 3001)**
- `POST /api/auth/send-otp` - Send verification code
- `POST /api/auth/verify-otp` - Verify and connect platform
- `POST /api/webhook/whatsapp` - WhatsApp Business webhook
- `POST /api/webhook/instagram` - Instagram DM webhook
- `POST /api/webhook/gmail` - Gmail email webhook
- `POST /api/enable-auto-reply` - Enable platform auto-replies

### **Mobile App (Port 8082)**
- Full React Native interface
- Platform connection management
- Conversation history
- AI response customization

---

## 🔍 Testing & Monitoring

### **Test Auto-Replies**
```bash
# Test WhatsApp Web
curl -X POST http://localhost:3004/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"to":"1234567890","message":"Test message"}'

# Check connection status
curl http://localhost:3004/api/status

# View auto-reply users
curl http://localhost:3004/api/auto-reply-users
```

### **Monitor Logs**
- **WhatsApp Service**: Check terminal for QR codes and message logs
- **Production Service**: Check API request/response logs  
- **AI Engine**: Check AI generation and fallback logs
- **Conversation Files**: `conversations-whatsapp.log`, `conversations-instagram.log`

### **Health Checks**
- **WhatsApp Web**: http://localhost:3004/health
- **Production API**: http://localhost:3001/health
- **Mobile App**: Check Expo terminal for errors

---

## 🚨 Troubleshooting

### **WhatsApp Not Connecting**
1. **Clear session data**: Delete `.wwebjs_auth` folder
2. **Restart service**: Run `START-PRODUCTION.bat` again
3. **Scan QR code** with phone (not WhatsApp Web)
4. **Check logs** in WhatsApp Web Service terminal

### **AI Replies Not Working**
1. **Check OpenRouter API Key**: Verify `EXPO_PUBLIC_OPENROUTER_API_KEY`
2. **Enable auto-reply**: POST to `/api/enable-auto-reply`
3. **Check user context**: Verify user is in auto-reply list
4. **Test AI endpoint**: Check OpenRouter quota/limits

### **Webhook Issues**
1. **Verify webhook URL**: Ensure HTTPS for production
2. **Check verify token**: Match `WEBHOOK_VERIFY_TOKEN`
3. **Test webhook locally**: Use ngrok for local testing
4. **Platform setup**: Verify app permissions and webhooks

### **Common Issues**
- **Port conflicts**: Change ports in services if needed
- **Dependencies**: Run `npm install` if packages missing  
- **Firewall**: Allow Node.js through Windows Firewall
- **Memory**: Close unused applications for better performance

---

## 🎯 Production Deployment

### **Local Development**
✅ Everything configured for `localhost` testing

### **Cloud Deployment** 
1. **Deploy to Heroku/Railway/DigitalOcean**
2. **Update webhook URLs** to your domain
3. **Configure HTTPS** (required for webhooks)
4. **Set environment variables** on hosting platform
5. **Update redirect URIs** for OAuth platforms

### **Scaling Considerations**
- Use **Redis** for session storage
- Implement **database** for user management
- Add **rate limiting** for API endpoints
- Set up **monitoring** and logging
- Configure **load balancing** for high traffic

---

## 🎉 Success Checklist

✅ **Services Running**: All 3 services started  
✅ **WhatsApp Connected**: QR code scanned successfully  
✅ **Auto-Reply Enabled**: POST request successful  
✅ **AI Working**: Test message receives AI response  
✅ **Logs Clean**: No errors in service terminals  
✅ **Mobile App**: Can access platform connections  

**🚀 Your AIReplica system is now LIVE with real AI auto-replies across all major platforms!**

---

## 📞 Support

- **Issues**: Check service logs first
- **Feature Requests**: Modify AI prompts in `ai-reply-engine.js`
- **Customization**: Edit personality settings in enable-auto-reply calls
- **Advanced Setup**: Check platform-specific API documentation

**Happy auto-replying! 🤖✨**
