---
name: Orval/zod codegen compatibility
description: Spec features that break `pnpm --filter @workspace/api-spec run codegen` typecheck
---

Orval emits zod-v4 API calls (`zod.int()`, `zod.email()`) but the workspace's `zod` root import types are v3, so codegen's chained `typecheck:libs` fails with TS2339.

**Why:** `type: integer` and `format: email` in `lib/api-spec/openapi.yaml` trigger those v4-only emissions.

**How to apply:** In the OpenAPI spec use `type: number` instead of `type: integer`, and skip `format: email` (validate email server-side if needed).
