"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GatewayClient, GatewayEventFrame, GatewayHelloOk, SessionStats } from "./gateway";

/**
 * Model context window limits (in tokens).
 * Used as fallback when gateway doesn't provide contextTokens.
 */
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Claude models
  "claude-opus-4": 200_000,
  "claude-sonnet-4": 200_000,
  "claude-3-opus": 200_000,
  "claude-3-sonnet": 200_000,
  "claude-3-haiku": 200_000,
  "claude-3.5-sonnet": 200_000,
  "claude-3.5-haiku": 200_000,
  // OpenAI models
  "gpt-4": 128_000,
  "gpt-4-turbo": 128_000,
  "gpt-4o": 128_000,
  "gpt-4o-mini": 128_000,
  "o1": 128_000,
  "o1-mini": 128_000,
  "o1-preview": 128_000,
  "o3-mini": 200_000,
  // Default
  default: 128_000,
};

function getModelContextLimit(modelId?: string | null): number {
  if (!modelId) return MODEL_CONTEXT_LIMITS.default;

  // Normalize model ID (lowercase, remove provider prefix)
  const normalizedModel = modelId.toLowerCase().replace(/^(anthropic|openai|google|meta)\//, "");

  // Try exact match first
  if (MODEL_CONTEXT_LIMITS[normalizedModel]) {
    return MODEL_CONTEXT_LIMITS[normalizedModel];
  }

  // Try prefix match
  for (const [prefix, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
    if (normalizedModel.startsWith(prefix)) {
      return limit;
    }
  }

  return MODEL_CONTEXT_LIMITS.default;
}

export function useGateway(url: string, token?: string, password?: string) {
  const clientRef = useRef<GatewayClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [hello, setHello] = useState<GatewayHelloOk | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const eventHandlersRef = useRef<Map<string, Set<(evt: GatewayEventFrame) => void>>>(new Map());

  const subscribe = useCallback((event: string, handler: (evt: GatewayEventFrame) => void) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler);
    return () => {
      eventHandlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  useEffect(() => {
    // Don't connect if URL is empty
    if (!url) {
      setConnected(false);
      return;
    }

    // Clear previous error when attempting new connection
    setConnectionError(null);

    const client = new GatewayClient({
      url,
      token,
      password,
      onHello: (h) => {
        setConnected(true);
        setConnectionError(null);
        setHello(h);
      },
      onEvent: (evt) => {
        const handlers = eventHandlersRef.current.get(evt.event);
        if (handlers) {
          for (const handler of handlers) {
            handler(evt);
          }
        }
        // Also broadcast to "*" handlers
        const wildcardHandlers = eventHandlersRef.current.get("*");
        if (wildcardHandlers) {
          for (const handler of wildcardHandlers) {
            handler(evt);
          }
        }
      },
      onClose: () => {
        setConnected(false);
      },
      onReconnect: () => {},
      onConnectError: (err) => {
        setConnectionError(err);
      },
    });

    clientRef.current = client;
    client.start();

    return () => {
      client.stop();
      clientRef.current = null;
    };
  }, [url, token, password]);

  // Client ref is stable across renders, used by consumers for imperative calls
  // eslint-disable-next-line react-hooks/refs
  return {
    client: clientRef.current,
    connected,
    hello,
    subscribe,
    connectionError,
  };
}

/**
 * Hook to track session stats (token usage, model info).
 * Polls the gateway periodically and on chat events.
 */
export function useSessionStats(
  client: GatewayClient | null,
  sessionKey: string,
  subscribe: (event: string, handler: (evt: GatewayEventFrame) => void) => () => void
) {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const sessionKeyRef = useRef(sessionKey);

  useEffect(() => {
    sessionKeyRef.current = sessionKey;
  }, [sessionKey]);

  const fetchStats = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const result = await client.getSessionStats(sessionKeyRef.current);
      setStats(result);
    } catch (err) {
      console.error("Failed to fetch session stats:", err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Fetch stats on mount and when session changes
  useEffect(() => {
    setStats(null);
    fetchStats();
  }, [fetchStats, sessionKey]);

  // Refresh stats when chat events occur (final state)
  useEffect(() => {
    const unsub = subscribe("chat", (evt) => {
      const payload = evt.payload as {
        state?: string;
        sessionKey?: string;
      } | undefined;

      // Only refresh on final/aborted for our session
      if (
        payload?.sessionKey === sessionKeyRef.current &&
        (payload?.state === "final" || payload?.state === "aborted")
      ) {
        // Small delay to let gateway update stats
        setTimeout(() => fetchStats(), 200);
      }
    });

    return unsub;
  }, [subscribe, fetchStats]);

  const usedTokens = stats?.totalTokens ?? 0;
  const maxTokens = stats?.contextTokens ?? getModelContextLimit(stats?.model);

  return {
    stats,
    loading,
    refresh: fetchStats,
    usedTokens,
    maxTokens,
    modelId: stats?.model ?? null,
    usage: {
      inputTokens: stats?.inputTokens ?? 0,
      outputTokens: stats?.outputTokens ?? 0,
      totalTokens: (stats?.inputTokens ?? 0) + (stats?.outputTokens ?? 0),
      inputTokenDetails: {
        noCacheTokens: undefined,
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
      },
      outputTokenDetails: {
        textTokens: stats?.outputTokens ?? 0,
        reasoningTokens: undefined,
      },
    },
  };
}
