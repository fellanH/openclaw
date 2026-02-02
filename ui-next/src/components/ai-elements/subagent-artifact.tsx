"use client";

import { memo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ai-elements/loader";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Square,
  BotIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { SubagentState } from "@/lib/use-gateway";

export type SubagentArtifactProps = {
  subagent: SubagentState;
  onViewHistory?: () => void;
  onStop?: () => void;
  className?: string;
};

const statusConfig = {
  spawning: {
    icon: null,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    badgeVariant: "default" as const,
    label: "Spawning...",
    isLoading: true,
  },
  running: {
    icon: null,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    badgeVariant: "default" as const,
    label: "Running",
    isLoading: true,
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/5",
    borderColor: "border-green-500/30",
    badgeVariant: "outline" as const,
    label: "Completed",
    isLoading: false,
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/5",
    borderColor: "border-red-500/30",
    badgeVariant: "outline" as const,
    label: "Error",
    isLoading: false,
  },
  timeout: {
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-500/5",
    borderColor: "border-orange-500/30",
    badgeVariant: "outline" as const,
    label: "Timed out",
    isLoading: false,
  },
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export const SubagentArtifact = memo(function SubagentArtifact({
  subagent,
  onViewHistory,
  onStop,
  className,
}: SubagentArtifactProps) {
  const config = statusConfig[subagent.status];
  const Icon = config.icon;
  const isActive = config.isLoading;
  
  // Expanded by default when running, collapsed when completed
  const [expanded, setExpanded] = useState(isActive);
  const [elapsed, setElapsed] = useState(0);

  // Live duration counter for active subagents
  useEffect(() => {
    if (!isActive) {
      // Set final duration
      setElapsed(
        subagent.completedAt
          ? subagent.completedAt - subagent.startedAt
          : Date.now() - subagent.startedAt
      );
      return;
    }

    // Initial value
    setElapsed(Date.now() - subagent.startedAt);

    // Update every second while running
    const interval = setInterval(() => {
      setElapsed(Date.now() - subagent.startedAt);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, subagent.startedAt, subagent.completedAt]);

  // Auto-collapse when status changes from active to completed
  useEffect(() => {
    if (!isActive) {
      setExpanded(false);
    }
  }, [isActive]);

  return (
    <div
      className={cn(
        "not-prose flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-colors",
        config.borderColor,
        className
      )}
    >
      {/* Header - Agent style with Artifact container */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 cursor-pointer border-b",
          config.bgColor
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left side: Icon, Label, Model */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={cn("flex-shrink-0", config.color)}>
            <BotIcon className="size-4" />
          </div>
          <span className="font-medium text-sm truncate">
            {subagent.label || "Sub-agent"}
          </span>
          {subagent.model && (
            <Badge variant="secondary" className="font-mono text-xs flex-shrink-0">
              {subagent.model}
            </Badge>
          )}
        </div>

        {/* Right side: Status, Duration, Chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status indicator */}
          {isActive ? (
            <Loader size={16} className={config.color} />
          ) : (
            Icon && <Icon className={cn("size-4", config.color)} />
          )}
          
          {/* Status badge */}
          <Badge
            variant={config.badgeVariant}
            className={cn(
              "text-xs",
              config.badgeVariant === "outline" && config.color
            )}
          >
            {config.label}
          </Badge>
          
          {/* Duration */}
          <span className="text-xs text-muted-foreground font-mono w-16 text-right tabular-nums">
            {formatDuration(elapsed)}
          </span>
          
          {/* Expand/collapse chevron */}
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content (collapsible) */}
      {expanded && (
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {/* Task description */}
          <TaskDescription task={subagent.task} />

          {/* Error message */}
          {subagent.error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {subagent.error}
            </div>
          )}

          {/* Session info (debug) */}
          {subagent.childSessionKey && (
            <div className="text-xs text-muted-foreground/60 font-mono truncate">
              {subagent.childSessionKey}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {subagent.childSessionKey && onViewHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory();
                }}
                className="h-7 text-xs"
              >
                <Eye className="size-3 mr-1.5" />
                View History
              </Button>
            )}
            {isActive && onStop && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onStop();
                }}
                className="h-7 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Square className="size-3 mr-1.5" />
                Stop
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

SubagentArtifact.displayName = "SubagentArtifact";

/**
 * Collapsible task description component.
 * Long tasks (>100 chars) are truncated with "Show more" toggle.
 */
const TaskDescription = memo(function TaskDescription({
  task,
  maxLength = 100,
}: {
  task: string;
  maxLength?: number;
}) {
  const [showFull, setShowFull] = useState(false);
  const isLong = task.length > maxLength;
  const displayText = isLong && !showFull ? task.slice(0, maxLength) + "…" : task;

  return (
    <div className="rounded-md bg-muted/50 p-3">
      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
        {displayText}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowFull(!showFull);
          }}
          className="text-xs text-primary hover:underline mt-1"
        >
          {showFull ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
});

TaskDescription.displayName = "TaskDescription";
