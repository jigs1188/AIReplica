# 📸 INSTAGRAM SETUP GUIDE

## 🎯 **QUICK START**

### **Step 1: Start Instagram Service**
```bash
cd aireplica
node instagram-personalized-service.js
```

### **Step 2: Complete OAuth Setup**
```bash
# Open in browser:
http://localhost:3002/auth/instagram
```

---

## 🔧 **PREREQUISITES**

### **Facebook Developer Account Setup:**
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create new app
3. Add Instagram Basic Display product
4. Configure OAuth redirect URI
5. Get App ID and App Secret

### **Required Environment Variables:**
```env
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3002/auth/instagram/callback
```

---

## 📸 **FEATURES**

### **Instagram DM Management:**
- ✅ Intelligent DM auto-replies
- ✅ Story mention responses
- ✅ Follower engagement automation
- ✅ Brand/influencer mode switching
- ✅ Business inquiry handling
- ✅ Collaboration request management
- ✅ Fan interaction automation

### **Role-Based Responses:**
- **Influencer:** Engaging and brand-conscious
- **Brand:** Professional brand representative
- **Fan:** Appreciative and friendly interaction
- **Business:** Strategic partnership focus
- **Collaborator:** Creative and collaborative

---

## 🚀 **SETUP STEPS**

### **1. Facebook Developer Configuration**

#### **Create Facebook App:**
1. Visit [Facebook Developers](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" or "Business"
4. App Name: "AIReplica Instagram Integration"
5. Click "Create App"

#### **Add Instagram Basic Display:**
1. In your app dashboard, click "+ Add Product"
2. Find "Instagram Basic Display" → Click "Set Up"
3. Go to Instagram Basic Display → Basic Display

#### **Configure OAuth:**
1. In Instagram Basic Display settings
2. Add OAuth Redirect URI: `http://localhost:3002/auth/instagram/callback`
3. Add Deauthorize Callback URL: `http://localhost:3002/auth/instagram/deauth`
4. Add Data Deletion Request URL: `http://localhost:3002/auth/instagram/deletion`

#### **Get Credentials:**
1. Note your App ID and App Secret
2. Generate Access Token for testing

### **2. Instagram Account Setup**

#### **Add Test Users:**
1. Go to Instagram Basic Display → Basic Display
2. Scroll to "User Token Generator"
3. Add Instagram test users
4. Generate tokens for testing

#### **App Review (For Production):**
For DM access, you need Instagram approval:
1. Submit app for review
2. Explain use case for AI auto-replies
3. Provide demo video
4. Wait for approval (can take weeks)

### **3. Environment Setup**
Create or update `.env` file:
```env
FACEBOOK_APP_ID=your_actual_app_id_here
FACEBOOK_APP_SECRET=your_actual_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:3002/auth/instagram/callback
```

### **4. Start Service**
```bash
cd aireplica
node instagram-personalized-service.js
```

You should see:
```
📸 Starting Instagram Personalized Service...
🚀 Instagram Service running on port 3002
🔗 Auth URL: http://localhost:3002/auth/instagram
```

### **5. Complete OAuth Flow**
1. Open browser: http://localhost:3002/auth/instagram
2. Login with Instagram account
3. Grant permissions for profile and media access
4. You'll be redirected back to success page

---

## 📱 **MOBILE APP INTEGRATION**

### **Connect from Mobile:**
1. Start mobile app: `npx expo start`
2. Open Integration Hub
3. Tap "Instagram"
4. Tap "Connect"
5. Complete OAuth in browser

### **Configure Settings:**
```javascript
// In mobile app - Instagram settings
{
  autoReplyMode: 'ask',          // 'auto', 'ask', 'off'
  businessHours: {
    start: '09:00',
    end: '21:00'                 // Later hours for social media
  },
  influencerMode: true,          // Enable influencer features
  autoStoryReply: false,         // Reply to story mentions
  followersOnly: false,          // Only reply to followers
  verifiedOnly: false            // Only reply to verified accounts
}
```

---

## 🎛️ **API ENDPOINTS**

### **Authentication:**
```bash
# Start OAuth flow
GET http://localhost:3002/auth/instagram

# OAuth callback (automatic)
GET http://localhost:3002/auth/instagram/callback

# Check connection status
GET http://localhost:3002/api/status
```

### **DM Management:**
```bash
# Get pending DMs
GET http://localhost:3002/api/pending-dms

# Send DM reply
POST http://localhost:3002/api/send-dm
{
  "userId": "instagram_user_id",
  "message": "Generated AI reply text"
}

# Manual DM processing
POST http://localhost:3002/api/process-dm
{
  "from": "username",
  "message": "DM content",
  "isFollower": true,
  "isVerified": false
}
```

### **Story Management:**
```bash
# Get story mentions
GET http://localhost:3002/api/story-mentions

# Reply to story mention
POST http://localhost:3002/api/reply-story
{
  "storyId": "story_id",
  "mentionId": "mention_id",
  "reply": "Thanks for the mention!"
}
```

### **Contact Management:**
```bash
# Add follower profile
POST http://localhost:3002/api/contacts
{
  "username": "follower_username",
  "name": "Display Name",
  "role": "fan",
  "notes": "Regular engagement, fashion content",
  "followerCount": 1500,
  "isVerified": false
}

# Get all contacts
GET http://localhost:3002/api/contacts

# Update contact relationship
PUT http://localhost:3002/api/contacts/username
{
  "role": "collaborator",
  "notes": "Potential brand partnership"
}
```

---

## 🛠️ **TROUBLESHOOTING**

### **❌ Issue: OAuth Redirect Mismatch**
```
Error: Redirect URI is not allowed
```

**✅ Solution:**
1. Check Facebook Developer app settings
2. Ensure redirect URI is exactly: `http://localhost:3002/auth/instagram/callback`
3. Save settings and try again

### **❌ Issue: Instagram Basic Display Not Configured**
```
Error: Instagram Basic Display product is not set up
```

**✅ Solution:**
1. Go to Facebook Developer Console
2. Select your app
3. Add "Instagram Basic Display" product
4. Complete configuration steps

### **❌ Issue: Can't Send DMs**
```
Error: Cannot send direct messages
```

**✅ Limitations:**
- Instagram API only allows replies to received DMs
- Cannot send unsolicited messages
- Need app review for full DM access
- Use test accounts during development

### **❌ Issue: App Review Rejected**
```
Error: App submission rejected
```

**✅ Solutions:**
1. Clearly explain AI auto-reply use case
2. Provide detailed demo video
3. Show user consent mechanisms
4. Highlight user control features
5. Resubmit with improvements

---

## 📊 **USAGE EXAMPLES**

### **Fan Interaction:**
```
Original DM: "Love your content! 😍"
AI Reply: "Thank you so much! Your support means the world to me 💕 I'm so glad you enjoy the content. What type of posts would you like to see more of? ✨"
```

### **Business Inquiry:**
```
Original DM: "Hi, I'd like to collaborate with you on a project"
AI Reply: "Hi! Thank you for reaching out about collaboration opportunities. I'd love to learn more about your project! Could you please send me some details about what you have in mind? You can also email me at [business email] for more detailed discussions. Looking forward to hearing from you! 🤝"
```

### **Brand Partnership:**
```
Original DM: "We'd like to partner with you for our new product launch"
AI Reply: "Hello! Thank you for considering me for your product launch partnership. I'm definitely interested in learning more about this opportunity. Could you please send me more details about the partnership, including the product, timeline, and collaboration terms? I'd be happy to discuss how we can work together! ✨"
```

---

## ⚠️ **IMPORTANT LIMITATIONS**

### **Instagram API Restrictions:**
1. **Cannot send unsolicited DMs** - only reply to received messages
2. **24-hour response window** - must reply within 24 hours
3. **App review required** for production DM access
4. **Rate limits** apply to all API calls
5. **Test users only** during development phase

### **Content Guidelines:**
1. **Follow Instagram Community Guidelines**
2. **No spam or automated bulk messaging**
3. **Respect user privacy and consent**
4. **Maintain authentic engagement**

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **App Review Requirements:**
1. **Detailed use case explanation**
2. **User consent mechanisms**
3. **Privacy policy compliance**
4. **Demo video showing functionality**
5. **User control and opt-out features**

### **Security Best Practices:**
1. **Secure token storage**
2. **Regular token refresh**
3. **Rate limit handling**
4. **User data protection**
5. **Audit logs for DM processing**

### **Performance Optimization:**
1. **Efficient webhook handling**
2. **Queue system for DM processing**
3. **Caching for frequent interactions**
4. **Batch operations where possible**

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Facebook Developer account created
- [ ] Instagram Basic Display app configured
- [ ] OAuth redirect URI set correctly
- [ ] Environment variables configured
- [ ] Service starts on port 3002
- [ ] OAuth flow completes successfully
- [ ] Test DM reply works (with test accounts)
- [ ] Mobile app shows "Connected" status
- [ ] Contact profiles working
- [ ] Role-based responses configured

**⚠️ Note:** Full DM functionality requires Instagram app review approval for production use.

**🎉 Your Instagram AI assistant is ready for follower engagement!**
