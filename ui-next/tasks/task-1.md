# Task 1: Audit use-gateway.ts

## Status: COMPLETE

## Objective
Identify which functions in `use-gateway.ts` are still used vs deprecated, creating a clear map for cleanup.

## Context
`use-gateway.ts` has grown to 1335 lines. Much of it may be deprecated after the session-store refactor. We need to know what's safe to remove.

## Requirements

1. List ALL exports from `use-gateway.ts`
2. For each export, search the codebase for usages:
   ```bash
   grep -rn "exportName" src/ --include="*.tsx" --include="*.ts"
   ```
3. Categorize each export:
   - **USED** — Has consumers, keep
   - **DEPRECATED** — No consumers, safe to remove
   - **INTERNAL** — Only used within the file

4. Create `AUDIT-use-gateway.md` with findings

## Expected Output

```markdown
# use-gateway.ts Audit

## USED (keep)
- `useGateway` — used in page.tsx
- `useSessionStats` — used in page.tsx
- ...

## DEPRECATED (remove)
- `useOpenClawChat` — no consumers
- ...

## INTERNAL (review)
- Helper functions only used within file
```

## Success Criteria
- [x] All exports catalogued
- [x] Usage search performed for each
- [x] Markdown report created
- [x] Clear recommendation for each export

## Files
- Input: `src/lib/use-gateway.ts`
- Output: `tasks/AUDIT-use-gateway.md`

## Handoff
Update HANDOFF.md and status when complete.
