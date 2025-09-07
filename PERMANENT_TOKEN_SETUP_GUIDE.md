# WhatsApp Business API - Permanent Access Token Setup Guide

## 🎯 What is a Permanent Access Token?

The access token in your `.env` file is what allows your app to use WhatsApp Business API. By default, Meta gives you **temporary tokens** that expire in 24 hours. For production, you need a **permanent token**.

## 📋 Current Token Status

**Your current token:** `EAATPjPIZBZAxoBPZAWAet6BIgT6mlwXBIdn7u4IELIc5il6X9xZA0N3wF8SZAoPSlap1hZCKGBt7xsuRhDkjwHe82I0RuAmsfBcpdRj5zJW6kOc54kiVeydhXPpoxaqV9deXdoKnjnzVVuZBgkXOTZAqKhVVmIZB69NYYRZChXf7qG3fFD9Kna33Epa8p8ZBEZBH2YFo4UvtMwhGvZBRqbrAQfQK6U0EhJcsZD`

⚠️ **This is likely a temporary token that will expire!**

## 🚀 How to Get a Permanent Access Token

### Method 1: Facebook Developer Console (Easiest)

1. **Go to Meta Developer Console**
   ```
   https://developers.facebook.com/
   ```

2. **Select Your App**
   - Click on your WhatsApp Business app
   - Go to "WhatsApp" > "API Setup"

3. **Generate Permanent Token**
   - In the "Temporary access token" section
   - Click "Generate permanent token"
   - Copy the new permanent token

4. **Update Your .env File**
   ```env
   WHATSAPP_ACCESS_TOKEN="YOUR_NEW_PERMANENT_TOKEN_HERE"
   ```

### Method 2: Using Graph API (Advanced)

1. **Get Your App Details**
   - App ID: Found in your Facebook Developer Console
   - App Secret: Found in App Settings > Basic

2. **Make API Call to Exchange Token**
   ```bash
   curl -X GET "https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=1354104173389594&client_secret=677e9bbb696167dfe8035f492a860831&fb_exchange_token=EAATPjPIZBZAxoBPb3ill94PtM63zB99MGZBYMkZAllx9ZAiE4Vah8prU3MVWqxXQreIMBGpCi8m3Qxc4RVckQezkQajWkaoEWDIaCuCeBTjcjPNS8aofDbrG2nnHj7ZAnCZBUO7aYGMbG9xoaX4RB9ZC5Xjn0VAKI9YO9xo5VSBwEJ7JXFVwMBXSnsZAKihqDuceSSbcSQI45kp7suYDqQZCpv2zCVUiQZD"
> How to get YOUR_APP_SECRET (App Secret)

1. Open Meta Developer Console: https://developers.facebook.com/
2. Select your App (top-left App switcher).
3. Go to: Settings > Basic.
4. In the Basic settings page locate App Secret (obscured by dots).
5. Click Show (may require password re‑entry).
6. Copy the value and place it (server-side only) as:
    FACEBOOK_APP_ID=xxxxxxxxxxxx
    FACEBOOK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Security notes:
- Never commit the App Secret to git.
- Do not expose it in frontend code or logs.
- If it leaks, rotate it (Settings > Basic > Reset).
- For the debug_token call needing an App Token, you can use: APP_ID|APP_SECRET.

After setting env variables, restart your service before running the curl exchange command.

3. **Response Will Give Permanent Token**
   ```json
   {"access_token":"EAATPjPIZBZAxoBPZAOOGo4mF48uB9J0ntdwJA4kY9yDnNEjhXUZAGmS0ZBr2FO4nRZCIGmYQrfoYRuwTc481LvsOQsHlXlE0NzU1dbb6ros8ZCxoTKQYLnvrxHLZBaHitSUGMl2MUqeG8Yik0jMgjuGyaWbdEpOHeGvt4cbFFGbFqpHJZAOuuTmNF8KF5ym7ZA5JWHKgXTaUK1hOGNN7wE","token_type":"bearer","expires_in":5142916}
   ```
   

### Method 3: System User Token (Most Reliable)

1. **Go to Business Manager**
   ```
   https://business.facebook.com/
   ```

2. **Create System User**
   - Business Settings > Users > System Users
   - Click "Add" and create a system user
   - Give it "Admin" role

3. **Generate Token for System User**
   - Click on the system user
   - Click "Generate New Token"
   - Select your app
   - Choose these permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
     - `business_management`

4. **Set Token to Never Expire**
   - Select "Never" for expiration
   - Copy the generated token

## 🔧 Token Verification

### Check if Your Token is Valid
```bash
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
```

**Good Response:**
```json
{
  "name": "Your Business Name",
  "id": "your_business_id"
}
```

**Bad Response:**
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException"
  }
}
```

### Check Token Expiration
```bash
curl -X GET "https://graph.facebook.com/debug_token?input_token=YOUR_TOKEN&access_token=YOUR_APP_TOKEN"
```

## 📱 Required Permissions for WhatsApp

Make sure your token has these permissions:
- ✅ `whatsapp_business_messaging` - Send/receive messages
- ✅ `whatsapp_business_management` - Manage business account
- ✅ `business_management` - Access business info

## 🚨 Common Issues & Solutions

### Issue 1: Token Expires Every 24 Hours
**Solution:** You're using a temporary token. Follow Method 3 above.

### Issue 2: "Invalid OAuth Token" Error
**Solutions:**
- Regenerate token from Developer Console
- Check if app is approved for production
- Verify permissions are granted

### Issue 3: Can't Send Messages
**Solutions:**
- Make sure phone number is verified
- Check if business verification is complete
- Ensure webhook is properly configured

## 📊 Production Checklist

Before going live, ensure:

- [ ] **Permanent access token** (never expires)
- [ ] **Business verification** completed on Meta
- [ ] **Phone number verified** and approved
- [ ] **Webhook URL** is publicly accessible (not localhost)
- [ ] **SSL certificate** for webhook endpoint
- [ ] **Rate limits** understood (1000 messages/day for new accounts)

## 🔄 Token Refresh (If Needed)

If your token expires, you can refresh it:

```javascript
// Add this to your whatsapp-business-service.js
async function refreshAccessToken() {
  try {
    const response = await axios.get(`https://graph.facebook.com/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: WHATSAPP_CONFIG.accessToken
      }
    });
    
    console.log('🔄 New access token:', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    throw error;
  }
}
```

## 💡 Best Practices

1. **Store tokens securely** - Never commit to git
2. **Monitor token health** - Set up alerts for expiration
3. **Use system users** - More reliable than personal tokens
4. **Backup tokens** - Keep multiple valid tokens
5. **Test regularly** - Verify token works before users need it

## 🆘 Need Help?

If you're stuck:
1. Check Meta Developer Console > WhatsApp > API Setup
2. Look at Business Manager > System Users
3. Verify your business account status
4. Test with the Graph API Explorer: https://developers.facebook.com/tools/explorer/

---

**Next Steps:**
1. Get your permanent token using Method 3 (most reliable)
2. Update your `.env` file
3. Test the token with the verification commands above
4. Restart your WhatsApp service
