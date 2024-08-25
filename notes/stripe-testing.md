# Stripe Testing

## Webhook
In command prompt, run:
```stripe listen --forward-to localhost:3000/api/payment/webhook```

Ensure your local env has the output of this command as the STRIPE_WEBHOOK_SECRET

Running payment will trigger webhook live and local, account for those differences.