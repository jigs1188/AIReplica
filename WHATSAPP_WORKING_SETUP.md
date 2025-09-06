# WhatsApp Business API Working Setup Guide

This guide will help you set up WhatsApp Business API integration with AIReplica for auto-replies.

## Quick Start

1. **Run the Webhook Server**
   ```bash
   cd aireplica
   node working-webhook-server.js
   ```
   Server will start at http://localhost:3000

2. **Open AIReplica App**
   - Go to Dashboard
   - Find WhatsApp card
   - Click "Setup WhatsApp"
   - Follow the step-by-step setup

## Server Setup

### Install Dependencies
```bash
npm install express cors axios
```

### Start Webhook Server
```bash
node working-webhook-server.js
```

The server provides:
- **Webhook endpoint**: `http://localhost:3000/webhook`
- **Configuration API**: `http://localhost:3000/api/config`
- **Test connection**: `http://localhost:3000/api/test-connection`
- **Health check**: `http://localhost:3000/health`

## WhatsApp Business API Setup

### Step 1: Meta Developer Account
1. Go to https://developers.facebook.com/apps/
2. Create a new app or select existing
3. Add "WhatsApp Business" product

### Step 2: Get Credentials
From your Meta Developer Console:
- **Access Token**: Found in WhatsApp > Getting Started
- **Phone Number ID**: Listed under phone numbers
- **Business Account ID**: Optional, from Business Manager

### Step 3: Configure Webhook
1. In Meta Developer Console > WhatsApp > Configuration
2. Set webhook URL: `https://your-domain.com/webhook`
3. Use verify token: `aireplica_webhook_2024`
4. Subscribe to: `messages`

## App Configuration

### Using the Setup Screen
1. Open AIReplica app
2. Go to Dashboard
3. Click "Setup WhatsApp" on WhatsApp card
4. Follow 6-step setup process:
   - Step 1: Verify WhatsApp Business account
   - Step 2: Get API credentials from Meta
   - Step 3: Enter credentials
   - Step 4: Test connection
   - Step 5: Save configuration
   - Step 6: Send test message

### Manual Configuration
You can also configure via API:

```javascript
// POST to http://localhost:3000/api/config
{
  "accessToken": "YOUR_ACCESS_TOKEN",
  "phoneNumberId": "YOUR_PHONE_NUMBER_ID",
  "businessAccountId": "YOUR_BUSINESS_ID", // optional
  "webhookVerifyToken": "aireplica_webhook_2024"
}
```

## Testing

### Test Connection
```bash
curl -X POST http://localhost:3000/api/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_ACCESS_TOKEN",
    "phoneNumberId": "YOUR_PHONE_NUMBER_ID"
  }'
```

### Send Test Message
```bash
curl -X POST http://localhost:3000/api/send-test-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from AIReplica!"
  }'
```

### Check Health
```bash
curl http://localhost:3000/health
```

## Auto-Reply Features

The system automatically:
1. **Receives messages** via webhook
2. **Generates AI responses** based on message content
3. **Sends replies** using WhatsApp Business API
4. **Marks messages as read**
5. **Stores message history**

### AI Response Categories
- **Greetings**: "hello", "hi", "hey"
- **Thanks**: "thank", "thanks"
- **Questions**: Messages with "?", "how", "what", etc.
- **Business**: "business", "service", "price", "cost"
- **Default**: General friendly responses

## Production Deployment

### Using ngrok (for testing)
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL as your webhook URL
# Example: https://abc123.ngrok.io/webhook
```

### Using Heroku
1. Create Heroku app
2. Deploy webhook server
3. Set environment variables
4. Update webhook URL in Meta Developer Console

### Using Railway/Render/Vercel
Similar process - deploy the webhook server and update the webhook URL.

## Troubleshooting

### Common Issues

1. **Webhook Verification Failed**
   - Check verify token matches: `aireplica_webhook_2024`
   - Ensure webhook URL is accessible

2. **Invalid Access Token**
   - Regenerate token in Meta Developer Console
   - Check token permissions

3. **Phone Number Not Found**
   - Verify Phone Number ID is correct
   - Check phone number is added to your app

4. **Messages Not Received**
   - Check webhook subscription includes "messages"
   - Verify webhook URL is correct
   - Check server logs

### Debug Mode
Set environment variable for detailed logs:
```bash
DEBUG=true node working-webhook-server.js
```

### View Message History
```bash
curl http://localhost:3000/api/messages
```

## Security Notes

- Store access tokens securely
- Use HTTPS in production
- Implement rate limiting
- Add authentication for API endpoints
- Monitor webhook calls

## Support

For issues:
1. Check server logs
2. Test connection via API
3. Verify Meta Developer Console settings
4. Review webhook subscription

The working implementation includes:
- ✅ Complete WhatsApp Business API integration
- ✅ Step-by-step setup process
- ✅ Real connection testing
- ✅ Auto-reply with AI responses
- ✅ Message history tracking
- ✅ Webhook verification
- ✅ Error handling and validation
