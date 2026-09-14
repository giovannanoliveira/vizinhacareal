---
name: Stripe connector credentials
description: How this project's managed Stripe connection must be accessed by runtime code.
---

Use the Replit Connectors SDK proxy for Stripe API operations. Do not assume the
connection settings expose a Stripe secret key, and do not make API startup
depend on reading one.

**Why:** The managed connection available to this project authorizes Stripe
requests through the connector proxy but intentionally withholds `secret_key`.
Trying to initialize the official Stripe client or stripe-replit-sync from a
connection secret prevented the API server from starting.

**How to apply:** Send server-side Stripe requests through the connector named
`stripe`. Keep price selection and payment verification on the backend. Never
put connector access or Stripe credentials in the Expo client.