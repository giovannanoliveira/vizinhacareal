---
name: Google authentication
description: Records the approved identity provider and local-user compatibility rule.
---

Use Google OAuth through the Replit-managed Clerk tenant for mobile authentication. Keep a local numeric user record for database relationships and provision or link it from the verified Clerk identity.

**Why:** The app's reviews already reference local numeric users, while the requested login method is Google. The bridge preserves those relationships without trusting profile data supplied by the mobile client.

**How to apply:** Validate Clerk bearer tokens on the server, obtain verified identity details server-side, link existing users by verified email, and keep OAuth secrets out of Expo bundles.