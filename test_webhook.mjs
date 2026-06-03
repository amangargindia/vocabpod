import crypto from 'crypto';

const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'secret'; // I don't know the secret, I'll need to mock it or read from .env.local

import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/RAZORPAY_WEBHOOK_SECRET="?([^"\n\r]+)"?/);
const realSecret = match ? match[1].trim() : 'dummy_secret';

const payload = {
  "entity": "event",
  "account_id": "acc_dummy",
  "event": "subscription.charged",
  "contains": ["subscription", "payment"],
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_test123",
        "customer_id": "cust_test123",
        "notes": {
          "userId": "123e4567-e89b-12d3-a456-426614174000"
        },
        "current_end": Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        "status": "active"
      }
    },
    "payment": {
      "entity": {
        "id": "pay_test123",
        "order_id": "order_test123",
        "customer_id": "cust_test123"
      }
    }
  }
};

const rawBody = JSON.stringify(payload);
const signature = crypto.createHmac('sha256', realSecret).update(rawBody).digest('hex');

fetch('http://localhost:3000/api/webhooks/razorpay', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-razorpay-signature': signature
  },
  body: rawBody
})
.then(res => res.json())
.then(data => console.log('Webhook response:', data))
.catch(err => console.error('Error:', err));
