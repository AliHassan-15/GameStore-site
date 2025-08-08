# Stripe Webhook Setup Guide

## Environment Configuration

Make sure your `.env` file contains:
```
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

## Testing with Stripe CLI

### 1. Start your main server
```bash
cd backend
npm start
```

### 2. In a separate terminal, start Stripe CLI webhook forwarding
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

### 3. Test webhook events
In another terminal, trigger test events:
```bash
# Test payment success
stripe trigger payment_intent.succeeded

# Test payment failure
stripe trigger payment_intent.payment_failed

# Test refund
stripe trigger charge.refunded
```

## Testing with Test Script

### 1. Run the test webhook server
```bash
cd backend
node test-webhook.js
```

### 2. Forward webhooks to test server
```bash
stripe listen --forward-to localhost:5001/test-webhook
```

### 3. Check health status
Visit: http://localhost:5001/test-health

## Webhook Security Features

✅ **Signature Verification**: All webhooks are verified using the webhook secret
✅ **Raw Body Parsing**: Uses `express.raw()` to prevent body tampering
✅ **Error Handling**: Proper error responses for invalid signatures
✅ **Activity Logging**: All webhook events are logged for audit purposes

## Webhook Event Handling

### Payment Intent Succeeded
- Updates order status to 'confirmed'
- Sets payment status to 'paid'
- Stores Stripe payment intent and charge IDs
- Logs activity for audit trail

### Payment Intent Failed
- Updates order status to 'failed'
- Sets payment status to 'failed'
- Logs failure details for debugging

### Charge Refunded
- Updates order status to 'refunded'
- Sets payment status to 'refunded'
- Logs refund information

## Troubleshooting

### Common Issues

1. **Webhook signature verification failed**
   - Check that `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure you're using the right secret for test/live mode

2. **Webhook not receiving events**
   - Verify Stripe CLI is forwarding to correct URL
   - Check server is running on correct port
   - Ensure no firewall blocking requests

3. **Database errors**
   - Check database connection
   - Verify order exists in database
   - Check database permissions

### Debug Steps

1. Check server logs for webhook events
2. Use the test webhook script to isolate issues
3. Verify environment variables are loaded
4. Test with Stripe CLI trigger commands

## Production Deployment

When deploying to production:

1. Update webhook endpoint URL in Stripe Dashboard
2. Use production Stripe keys
3. Set up proper SSL/TLS certificates
4. Configure firewall rules appropriately
5. Monitor webhook delivery and retry failed events 