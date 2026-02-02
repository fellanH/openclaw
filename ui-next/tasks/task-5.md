# Task 5: Create ChatProvider Context

## Status: COMPLETE

## Objective
Extract session state management from `page.tsx` into a dedicated `ChatProvider` context.

## Prerequisites
- Task 3 (optimized selector) should be complete

## Context
`page.tsx` has too many responsibilities. The state management logic should be in a context provider.

## Requirements

### 1. Create ChatProvider
Create `src/components/chat-provider.tsx`:

```typescript
"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useSessionStore } from "@/lib/session-store";
import { useSessionData } from "@/lib/use-session";
import type { GatewayClient } from "@/lib/gateway";
import type {
  ChatMessage,
  ChatStatus,
  ToolExecutionState,
  SubagentState,
} from "@/lib/session-store";

interface ChatContextValue {
  // Session identity
  sessionKey: string;
  
  // Data
  messages: ChatMessage[];
  status: ChatStatus;
  streamingContent: string;
  error: string | null;
  historyLoading: boolean;
  historyLoaded: boolean;
  toolExecutions: Map<string, ToolExecutionState>;
  subagents: Map<string, SubagentState>;
  messageQueue: string[];
  
  // Derived
  isStreaming: boolean;
  isSubmitted: boolean;
  canAbort: boolean;
  queueLength: number;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  abort: () => Promise<void>;
  regenerate: () => Promise<void>;
  stopSubagent: (childSessionKey: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  client: GatewayClient | null;
  sessionKey: string;
  onMessageSent?: () => void;
}

export function ChatProvider({
  children,
  client,
  sessionKey,
  onMessageSent,
}: ChatProviderProps) {
  // Get session data using optimized selector
  const sessionData = useSessionData(sessionKey);
  
  // Get actions from store
  const sendMessageAction = useSessionStore((s) => s.sendMessage);
  const abortAction = useSessionStore((s) => s.abort);
  
  // Memoized actions
  const sendMessage = useCallback(
    async (content: string) => {
      if (!client) return;
      await sendMessageAction(sessionKey, content, client);
      onMessageSent?.();
    },
    [client, sessionKey, sendMessageAction, onMessageSent]
  );
  
  const abort = useCallback(async () => {
    if (!client) return;
    await abortAction(sessionKey, client);
  }, [client, sessionKey, abortAction]);
  
  const regenerate = useCallback(async () => {
    // ... implement regenerate logic (move from useSessionChat)
  }, [client, sessionKey, sessionData.messages]);
  
  const stopSubagent = useCallback(
    async (childSessionKey: string) => {
      // ... implement stop logic (move from useSessionChat)
    },
    [client, sessionKey]
  );
  
  // Memoized context value
  const value = useMemo<ChatContextValue>(
    () => ({
      sessionKey,
      ...sessionData,
      isStreaming: sessionData.status === "streaming",
      isSubmitted: sessionData.status === "submitted",
      canAbort: sessionData.status === "streaming" || sessionData.status === "submitted",
      queueLength: sessionData.messageQueue.length,
      sendMessage,
      abort,
      regenerate,
      stopSubagent,
    }),
    [sessionKey, sessionData, sendMessage, abort, regenerate, stopSubagent]
  );
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}

// Optional: non-throwing version for conditional usage
export function useChatContextOptional(): ChatContextValue | null {
  return useContext(ChatContext);
}
```

### 2. Move action logic from useSessionChat
Copy the `regenerate` and `stopSubagent` implementations from `use-session.ts` into the provider.

### 3. Export from components index (if exists)

### 4. Build must pass

## Success Criteria
- [x] ChatProvider created with all context values
- [x] useChatContext hook exported
- [x] All actions implemented (send, abort, regenerate, stopSubagent)
- [x] Build passes
- [x] No changes to page.tsx yet (separate task)

## Files
- Create: `src/components/chat-provider.tsx`
- Reference: `src/lib/use-session.ts` (for action logic)

## Handoff
Document the ChatProvider API in HANDOFF.md for next task.
