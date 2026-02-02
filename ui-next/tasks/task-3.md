# Task 3: Create Optimized Session Selector

## Status: COMPLETE

## Objective
Replace 8+ individual `useSessionField` calls with a single optimized `useSessionData` hook that reduces re-renders.

## Context
Currently, `page.tsx` calls `useSessionField` 8+ times:
```tsx
const messages = useSessionField(sessionKey, (s) => s.messages);
const status = useSessionField(sessionKey, (s) => s.status);
const streamingContent = useSessionField(sessionKey, (s) => s.streamingContent);
// ... 5 more
```

Each is a separate Zustand subscription causing potential re-render cascade.

## Requirements

1. Install `zustand` shallow comparison if not present:
   ```bash
   # zustand already includes useShallow, verify it's available
   ```

2. Create `useSessionData` hook in `src/lib/use-session.ts`:

```typescript
import { useShallow } from 'zustand/react/shallow';

interface SessionDataResult {
  messages: ChatMessage[];
  status: ChatStatus;
  streamingContent: string;
  error: string | null;
  historyLoading: boolean;
  historyLoaded: boolean;
  toolExecutions: Map<string, ToolExecutionState>;
  subagents: Map<string, SubagentState>;
  messageQueue: string[];
}

export function useSessionData(sessionKey: string): SessionDataResult {
  return useSessionStore(
    useShallow((state) => {
      const session = state.sessions.get(sessionKey);
      if (!session) {
        return {
          messages: [],
          status: 'idle' as ChatStatus,
          streamingContent: '',
          error: null,
          historyLoading: false,
          historyLoaded: false,
          toolExecutions: new Map(),
          subagents: new Map(),
          messageQueue: [],
        };
      }
      return {
        messages: session.messages,
        status: session.status,
        streamingContent: session.streamingContent,
        error: session.error,
        historyLoading: session.historyLoading,
        historyLoaded: session.historyLoaded,
        toolExecutions: session.toolExecutions,
        subagents: session.subagents,
        messageQueue: session.messageQueue,
      };
    })
  );
}
```

3. Update `useSessionChat` to use `useSessionData` internally (optional refactor)

4. Export the new hook

5. Build must pass

## Success Criteria
- [x] `useSessionData` hook created
- [x] Returns all session fields in single subscription
- [x] Uses shallow comparison
- [x] Build passes
- [x] Export available from `use-session.ts`

## Files
- `src/lib/use-session.ts`

## Notes
- Don't update consumers yet — that's a separate task
- Focus on creating the hook correctly
- The hook should be a drop-in improvement

## Handoff
Update HANDOFF.md with the new hook API.
