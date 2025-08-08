const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();

// Middleware for webhook endpoint
app.post('/test-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified successfully!');
    console.log('📦 Event type:', event.type);
    console.log('📋 Event data:', JSON.stringify(event.data, null, 2));
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('💰 Payment succeeded!');
      break;
    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed!');
      break;
    case 'charge.refunded':
      console.log('💸 Refund processed!');
      break;
    default:
      console.log(`📝 Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Health check
app.get('/test-health', (req, res) => {
  res.json({ 
    status: 'OK', 
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Missing',
    stripe_key: process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Missing'
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 Test webhook server running on port ${PORT}`);
  console.log(`🔗 Test webhook URL: http://localhost:${PORT}/test-webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/test-health`);
  console.log(`\n📋 To test with Stripe CLI, run:`);
  console.log(`   stripe listen --forward-to localhost:${PORT}/test-webhook`);
}); 