# 🚀 AIReplica - Testing Guide

## Quick Start (2 Commands Only!)

### 1. Install & Start Frontend
```bash
npm install
npm run dev
```

### 2. Start Backend (New Terminal)
```bash
npm run webhook
```

**That's it!** Your AI assistant startup is running! 🎉

## 📱 Test the Mobile App

### Download Expo Go
- **iOS**: Download from App Store
- **Android**: Download from Google Play
- **Web**: Opens automatically in browser

### Test Core Features
1. **Scan QR Code** → Opens AIReplica app
2. **Go through onboarding** → See startup intro
3. **Try connecting WhatsApp** → See OAuth simulation  
4. **Toggle auto-reply** → Enable AI responses
5. **View subscription plans** → See pricing

## 🧪 Backend API Testing

### Test Webhook Processing
```bash
# Test WhatsApp webhook
curl -X POST http://localhost:3000/webhook/whatsapp -H "Content-Type: application/json" -d "{\"message\": \"Hello AI!\", \"from\": \"test_user\"}"

# Test Instagram webhook  
curl -X POST http://localhost:3000/webhook/instagram -H "Content-Type: application/json" -d "{\"message\": \"Can you help?\", \"from\": \"test_user\"}"
```

### Test OAuth Callbacks
```bash
# Test OAuth completion
curl -X GET "http://localhost:3000/auth/whatsapp/callback?code=test_code&state=test_state"
```

## 🎯 Complete User Flow Test

### Simulate Real User Journey
1. **Open app** → See onboarding screens
2. **Sign up** → Create account (simulated)
3. **Connect WhatsApp** → Goes through OAuth flow
4. **Send test message** → See AI auto-reply
5. **Check dashboard** → View statistics
6. **Try upgrading** → See subscription plans

### Expected Results
- ✅ Smooth onboarding experience
- ✅ One-tap platform connections
- ✅ Instant AI responses
- ✅ Clean dashboard interface
- ✅ Clear subscription options

## � Debug & Troubleshoot

### Check Console Logs
```bash
# Frontend logs in Expo
# Backend logs in terminal running webhook-infrastructure.js
```

### Common Issues
- **Port 3000 busy**: Change port in webhook-infrastructure.js
- **Expo not starting**: Run `npx expo install --fix`
- **Dependencies missing**: Run `npm install`

## 📊 Monitor Performance

### Watch for:
- **Response time**: Should be <2 seconds
- **OAuth completion**: Should be smooth flow
- **Memory usage**: Backend should stay under 100MB
- **Error rate**: Should be <1% failures

## 🚀 Production Deployment

### When Ready for Real Users:
```bash
# Deploy backend
npm install -g @railway/cli
railway login
railway init
railway up

# Build mobile app
npx expo build
```

### Set Real OAuth Credentials:
1. Create real OAuth apps on each platform
2. Replace mock credentials in utils/oauthService.js
3. Update webhook URLs to production domain

## ✅ Success Criteria

Your startup is working if:
- ✅ App loads without errors
- ✅ OAuth flows complete successfully  
- ✅ Backend processes webhooks
- ✅ AI generates responses
- ✅ Dashboard shows platform status
- ✅ Subscription plans display

**Ready to launch your AI assistant startup!** 🎉

---
*For issues: Check console logs and verify all dependencies are installed*
