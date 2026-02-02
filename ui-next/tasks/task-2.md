# Task 2: Remove Deprecated use-gateway Exports

## Status: COMPLETE

## Objective
Remove unused/deprecated exports from `use-gateway.ts` based on the audit from Task 1.

## Prerequisites
- Task 1 must be COMPLETE ✓
- Read `tasks/AUDIT-use-gateway.md` for the list ✓

## Requirements

1. Read the audit report to identify DEPRECATED exports ✓
2. For each deprecated export:
   - Remove the function/hook ✓
   - Remove any supporting code only used by that export ✓
3. Verify no remaining usages: `grep -rn "removedExport" src/` ✓
4. Run `pnpm build` — must pass ✓
5. Run `pnpm dev` — verify UI still works ✓

## Guidelines
- Remove one export at a time, verify build passes
- If build fails, that export is still used — re-categorize
- Don't remove INTERNAL helpers that USED exports depend on

## Success Criteria
- [x] All DEPRECATED exports removed
- [x] `pnpm build` passes
- [x] UI still functional
- [x] File size reduced (track before/after line count)

## Files
- `src/lib/use-gateway.ts`

## Completed Work

### Removed Exports
1. **`useOpenClawChat`** (~800 lines) — Deprecated hook replaced by `useSessionChat` in `use-session.ts`

### Removed Types (duplicated in `session-store.ts`)
1. `MessagePart` — Lines 21-47
2. `ChatMessage` — Lines 49-55
3. `ToolExecutionState` — Lines 61-70
4. `SubagentState` — Lines 76-98
5. `ChatStatus` — Line 100

### Removed Internal Helpers (only used by `useOpenClawChat`)
1. `normalizeRole` — Lines 186-189
2. `toStoredPart` — Lines 195-231
3. `parseHistoryMessage` — Lines 243-335
4. `extractParts` — Lines 341-399

### Updated Imports
Changed these files to import types from `@/lib/use-session`:
- `src/components/ai-elements/message-parts.tsx`
- `src/components/ai-elements/subagent-artifact.tsx`
- `src/components/activity-bar.tsx`

Also added `MessagePart` to the re-exports in `use-session.ts`.

### Line Count
- **Before:** 1335 lines
- **After:** 217 lines
- **Reduction:** 1118 lines (84%)

### Kept Exports
- `useGateway` — Core WebSocket connection hook (used by `page.tsx`)
- `useSessionStats` — Token usage tracking hook (used by `page.tsx`)
- `MODEL_CONTEXT_LIMITS` — Kept as internal constant (used by `useSessionStats`)
- `getModelContextLimit` — Kept as internal helper (used by `useSessionStats`)

### No Unexpected Dependencies
All removed code was confirmed unused. The only reference to `useOpenClawChat` is a comment in `use-session.ts` documenting API compatibility.
