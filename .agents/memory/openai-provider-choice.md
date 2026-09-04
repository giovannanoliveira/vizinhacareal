---
name: OpenAI provider choice
description: Records the approved OpenAI credential and execution boundary for AI features.
---

Use the user's own OpenAI API key stored as the `OPENAI_API_KEY` Replit Secret. Do not retry the managed Replit AI integration unless the user explicitly changes this decision. Keep all OpenAI calls in the backend.

**Why:** The managed integration required phone verification, and the user explicitly chose to provide their own key through the secure Secrets flow.

**How to apply:** Read `OPENAI_API_KEY` only in server code, never expose it through OpenAPI responses or Expo environment variables, and never ask the user to paste it into chat.