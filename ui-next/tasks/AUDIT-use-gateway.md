# use-gateway.ts Audit

> Audit date: 2026-02-02
> File: `src/lib/use-gateway.ts` (1335 lines)

## Summary

`use-gateway.ts` contains duplicated types and a deprecated hook. The session-store refactor has created newer implementations in `session-store.ts` and `use-session.ts`, making much of this file redundant.

### Quick Stats
| Category | Count | Lines (approx) |
|----------|-------|----------------|
| USED | 2 exports | ~130 lines |
| DEPRECATED | 1 export | ~800 lines |
| INTERNAL | 5 functions | ~200 lines |
| DUPLICATED | 5 types | ~80 lines |

**Recommendation:** Remove `useOpenClawChat` and its internal helpers (~800 lines). Migrate type imports to `session-store.ts` or `use-session.ts`.

---

## USED (keep)

### `useGateway` (lines 102-181)
**Status:** USED - Core WebSocket connection hook

**Used by:**
- `src/app/page.tsx:160` — Main page uses for connection management

```tsx
const { client, connected, subscribe, connectionError } = useGateway(
  gatewayUrl,
  token,
  password
);
```

**Returns:**
- `client` — GatewayClient instance
- `connected` — Connection state
- `hello` — Server hello response
- `subscribe` — Event subscription function
- `connectionError` — Error message if connection failed

**Verdict:** ✅ Keep - This is the primary gateway connection hook.

---

### `useSessionStats` (lines 452-530)
**Status:** USED - Token usage and model info tracking

**Used by:**
- `src/app/page.tsx:199` — Main page uses for token meter display

```tsx
const { usedTokens, maxTokens, modelId, usage } = useSessionStats(
  client,
  sessionKey,
  subscribe
);
```

**Returns:**
- `stats` — Raw SessionStats from gateway
- `usedTokens`, `maxTokens` — Token counts
- `modelId` — Current model identifier
- `usage` — Detailed token breakdown

**Verdict:** ✅ Keep - Not duplicated in session-store.

---

## DEPRECATED (remove)

### `useOpenClawChat` (lines 532-1335)
**Status:** DEPRECATED - Replaced by `useSessionChat` from `use-session.ts`

**No external consumers** — Only mentioned in comment in `use-session.ts:75`

This hook was the original chat management implementation but has been superseded by:
- `useSessionChat` in `use-session.ts` — New hook using Zustand store
- `session-store.ts` — Centralized state management

**Includes internal state for:**
- Messages
- Streaming content
- Tool executions
- Subagent tracking
- Message queue
- History loading

**Verdict:** 🗑️ Remove - ~800 lines of dead code. `page.tsx` imports `useSessionChat` instead.

---

## DUPLICATED TYPES (migrate imports, then remove)

These types are defined in both `use-gateway.ts` AND `session-store.ts`. Components should import from `session-store.ts` (or `use-session.ts` which re-exports them).

### `MessagePart` (lines 21-47)
**Also defined in:** `session-store.ts:22`

**Current imports from use-gateway.ts:**
- `src/components/ai-elements/message-parts.tsx:4`

**Action:** Change import to `@/lib/use-session` or `@/lib/session-store`

---

### `ChatMessage` (lines 49-55)
**Also defined in:** `session-store.ts:39`

**Current imports from use-gateway.ts:** None direct (used internally)

**Action:** Remove after `useOpenClawChat` is removed

---

### `ToolExecutionState` (lines 61-70)
**Also defined in:** `session-store.ts:47`

**Current imports from use-gateway.ts:**
- `src/components/ai-elements/message-parts.tsx:4`

**Action:** Change import to `@/lib/use-session` or `@/lib/session-store`

---

### `SubagentState` (lines 76-98)
**Also defined in:** `session-store.ts:58`

**Current imports from use-gateway.ts:**
- `src/components/ai-elements/message-parts.tsx:4`
- `src/components/ai-elements/subagent-artifact.tsx:24`

**Action:** Change import to `@/lib/use-session` or `@/lib/session-store`

---

### `ChatStatus` (line 100)
**Also defined in:** `session-store.ts:76`

**Current imports from use-gateway.ts:**
- `src/components/activity-bar.tsx:4` (via destructured import)

**Action:** Change import to `@/lib/use-session` or `@/lib/session-store`

---

## INTERNAL (review after cleanup)

These are private helper functions used only within `useOpenClawChat`. They can be removed when `useOpenClawChat` is removed.

| Function | Lines | Purpose |
|----------|-------|---------|
| `normalizeRole` | 186-189 | Normalize role to user/assistant |
| `toStoredPart` | 195-231 | Convert MessagePart for persistence |
| `parseHistoryMessage` | 243-335 | Parse gateway history format |
| `extractParts` | 341-399 | Extract parts from message payload |
| `getModelContextLimit` | 427-446 | Get model context window size |

**Also internal:**
- `MODEL_CONTEXT_LIMITS` (lines 405-425) — Used by `getModelContextLimit`

**Note:** `session-store.ts` has its own copies of `toStoredPart`, `parseHistoryMessage`, and `extractParts`.

---

## Migration Plan

### Step 1: Update imports (low risk)
Change these files to import from `@/lib/use-session`:
- `src/components/ai-elements/message-parts.tsx`
- `src/components/ai-elements/subagent-artifact.tsx`
- `src/components/activity-bar.tsx`

### Step 2: Remove `useOpenClawChat` and helpers
Delete lines 186-335 and 532-1335 from `use-gateway.ts`.

### Step 3: Remove duplicated types
Delete lines 21-100 (type definitions) from `use-gateway.ts`.

### Step 4: Verify
Run `pnpm build` to ensure no broken imports.

---

## Final State

After cleanup, `use-gateway.ts` should contain only:
- `useGateway` (~80 lines)
- `useSessionStats` (~80 lines)
- Necessary imports

**Estimated final size:** ~200 lines (down from 1335)
