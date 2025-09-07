# ✅ WHATSAPP SETUP CHECKLIST

## 📋 FOLLOW THESE STEPS IN ORDER

### **STEP 1: Start Backend Services**
Open 3 separate terminals and run these commands:

**Terminal 1:**
```bash
cd C:\Users\LENOVO\Desktop\startup\aireplica
node whatsapp-business-service.js
```
*This starts WhatsApp service on port 3002*

**Terminal 2:**
```bash
cd C:\Users\LENOVO\Desktop\startup\aireplica
node real-platform-service.js
```
*This starts platform service on port 3001*

**Terminal 3:**
```bash
cd C:\Users\LENOVO\Desktop\startup\aireplica
npx expo start
```
*This starts your mobile app*

### **STEP 2: Open Mobile App**
1. Open Expo Go on your phone
2. Scan the QR code from Terminal 3
3. Navigate to Dashboard
4. Tap "📱 Real WhatsApp Setup" (has NEW badge)

### **STEP 3: Phone Verification**
1. Enter your real WhatsApp phone number
2. Select correct country code
3. Tap "Send OTP"
4. **IMPORTANT**: Check Terminal 1 console for the OTP code (it will be displayed there)
5. Enter the OTP in your mobile app

### **STEP 4: Configure Auto-Reply**
1. Set your name/business name
2. Choose response style (Professional/Friendly/Casual/Helpful)
3. Write a custom greeting message
4. Review the auto-reply rules

### **STEP 5: Test It**
1. Ask a friend to send a WhatsApp message to your number
2. Try keywords like "hi", "how much", "thanks"
3. Watch the auto-replies work in real-time
4. Check Terminal 1 to see all message logs

## ✅ WHAT TO EXPECT

- ✅ **Country Picker**: Now has clear labels, search functionality, and centered modal for Android
- ✅ **OTP Display**: Will appear in Terminal 1 console (not in WhatsApp for now)
- ✅ **Auto-replies**: Will work immediately after setup
- ✅ **Real Testing**: Can test with real friends messaging your WhatsApp
- ✅ **Message Logs**: All messages and responses logged in Terminal 1
- ✅ **Mobile UI**: Optimized for Android with better touch areas and visual feedback
- ✅ **Email Backup**: Email authentication works as backup option

## 🔧 IF SOMETHING GOES WRONG

- **CORS Error**: Use mobile app, not web browser
- **Can't find OTP**: Look in Terminal 1 console output
- **Port in use**: Close other applications using ports 3001/3002
- **App won't start**: Run `npm install` first

**That's it! Follow these exact steps and your WhatsApp auto-reply will work perfectly.**
