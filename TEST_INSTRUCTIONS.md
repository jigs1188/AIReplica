# 🎯 Final Testing Instructions

## Start Testing in 30 Seconds

### Step 1: Start Frontend
```bash
npm run dev
```
*Wait for QR code to appear*

### Step 2: Start Backend (New Terminal)
```bash
npm run webhook  
```
*Backend starts on localhost:3000*

### Step 3: Test on Mobile
1. **Download Expo Go** (iOS/Android app store)
2. **Scan QR code** from terminal
3. **App opens** → AIReplica loads

## 🧪 Test Everything

### User Journey Test
1. **Onboarding** → Swipe through intro screens
2. **Connect WhatsApp** → Tap to see OAuth simulation
3. **Enable Auto-Reply** → Toggle switch on dashboard  
4. **View Plans** → See subscription options
5. **Test Backend** → Send webhook to localhost:3000

### Backend API Test
```bash
# Test message processing
curl -X POST http://localhost:3000/webhook/whatsapp -H "Content-Type: application/json" -d "{\"message\": \"Hello AI\", \"from\": \"testuser\"}"

# Should return AI response
```

## ✅ Success Checklist

- [ ] App loads without errors
- [ ] OAuth flows work (simulated)
- [ ] Backend processes webhooks
- [ ] AI generates responses  
- [ ] Dashboard shows platforms
- [ ] Subscription plans display

## 🚀 Ready for Production

When tested and working:
1. **Deploy backend** → Railway (5 minutes)
2. **Build mobile app** → Expo build
3. **Set real OAuth** → Platform developer accounts
4. **Launch MVP** → Start with WhatsApp only

**Your simplified OAuth startup is complete!** 🎉

---
*Run `node test-system.js` to verify all systems*
