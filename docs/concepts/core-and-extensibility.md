# Core aspects and reducing project size

Summary of what is core, what is optional, and how to shrink or extend the repo for custom personal use.

## Core aspects of this repo

1. **CLI + entry**
   - `openclaw.mjs` → `entry-bootstrap.ts` → `entry.ts`; profile/env, then commander-based CLI dispatch.

2. **Gateway (single daemon)**
   - One long-lived process: WebSocket server, owns all channels, health, pairing, cron, model catalog, plugin registry.
   - Lives in `src/gateway/`; startup in `server.impl.ts` / `server-startup.ts`. Channels are **plugins** (see below).

3. **Channel model = plugins**
   - All channels (Telegram, Discord, Slack, Signal, WhatsApp, etc.) are **channel plugins**. The list comes from `listChannelPlugins()` → `requireActivePluginRegistry().channels`.
   - Plugins are discovered from: workspace `.openclaw/extensions`, global `~/.openclaw/extensions`, and **bundled** `extensions/` at package root (or `OPENCLAW_BUNDLED_PLUGINS_DIR`).
   - Each bundled extension (e.g. `extensions/telegram`) is a thin wrapper: it registers a `ChannelPlugin` and holds `api.runtime`. The **real implementation** for Telegram/Discord/Slack/etc. lives in **core** (`src/telegram/`, `src/discord/`, `src/slack/`, …). So: core = implementation, extension = registration + config + optional enable/disable.

4. **Agent runtime (Pi)**
   - `src/agents/`: Pi embedded runner, tools, sandbox, skills, model selection, auth profiles. Used by gateway for `agent` requests and by auto-reply.

5. **Auto-reply**
   - `src/auto-reply/`: Reply pipeline (triggers, routing, session, directives, model selection). Consumes agent runtime and channel dock.

6. **Shared channel infra**
   - `src/channels/`: Dock, registry, routing, allowlists, directory config, message actions. No channel-specific logic; channel-specific code is in `src/telegram/`, `src/discord/`, etc., and invoked via plugin runtime.

7. **Config, plugins loader, plugin SDK**
   - `src/config/`, `src/plugins/` (loader, discovery, registry, install), `src/plugin-sdk/` (types and helpers for plugins). Plugins are enabled by config (`plugins.allow` + per-plugin `enabled`); bundled plugins are **disabled by default** unless in `BUNDLED_ENABLED_BY_DEFAULT` (currently empty).

8. **Clients and UIs**
   - **Web**: control UI + dashboard (`src/control-ui/`, `ui/`), gateway HTTP.
   - **TUI**: `src/tui/` (optional).
   - **Apps**: `apps/macos/`, `apps/ios/`, `apps/android/` (separate native codebases).

9. **Optional / feature-heavy areas**
   - **Browser automation**: `src/browser/` (Playwright).
   - **Canvas host**: `src/canvas-host/`, A2UI.
   - **Cron**: `src/cron/` (scheduled jobs, isolated agent).
   - **Hooks**: `src/hooks/` (internal, Gmail, etc.).
   - **Memory**: `src/memory/` (embeddings, manager); memory **plugins** (e.g. memory-lancedb) in extensions.
   - **Media / media-understanding**: `src/media/`, `src/media-understanding/`.
   - **Skills**: `src/agents/skills/`, `skills/` on disk.

10. **Dev/build**
    - `OPENCLAW_SKIP_CHANNELS=1` (or `OPENCLAW_SKIP_PROVIDERS=1`) skips starting channel monitors in gateway (used by `gateway:dev` and tests).

---

## Reducing project size

### 1. Trim bundled extensions (easiest)

- **Bundled** plugins live in `extensions/`. Discovery loads every package under that dir; loader then respects `plugins.allow` and per-plugin `enabled`.
- To ship a smaller footprint: remove or don’t ship directories under `extensions/` you don’t need (e.g. remove `extensions/msteams`, `extensions/matrix`, `extensions/voice-call`, etc.). Keep only the channel extensions you actually use (e.g. `telegram`, `slack`).
- Core still contains the **implementations** for Telegram, Discord, Slack, Signal, iMessage, Line, WhatsApp (`src/telegram/`, …). So removing an extension only removes the **registration** of that channel; to fully drop a channel you must also remove or stub the corresponding core implementation (see below).

### 2. Move channel implementations into extensions (large refactor)

- Today: core has big channel impls (`src/telegram/`, `src/discord/`, `src/slack/`, …) and extensions only register them.
- To truly shrink core: move each channel’s **implementation** into its extension (e.g. all Telegram logic into `extensions/telegram/`). Core would keep only:
  - `src/channels/` (dock, routing, types, no channel-specific code),
  - `src/plugin-sdk/` (types/helpers),
  - optionally one minimal channel (e.g. web) for development.
- Then you can delete unused extension dirs and get a smaller core with no code for those channels. This requires each extension to own its deps (e.g. grammY, Bolt) and the plugin SDK to expose only what extensions need.

### 3. Lazy-load or optional features

- **Agents**: The Pi/agent stack is central to `agent` and auto-reply; making it lazy would mean conditional imports or a “minimal gateway” build that doesn’t load agent code (bigger change).
- **Browser / Canvas / Cron / Hooks**: These can be gated by config or feature flags and their code paths loaded only when enabled, to reduce startup and bundle surface.
- **TUI**: Already a separate command (`openclaw tui`); could be a separate package that depends on core.

### 4. Apps and platforms

- `apps/android/`, `apps/ios/`, `apps/macos/`, `apps/shared/` are a large share of the repo. For “single platform” personal use you could:
  - Keep only one app (e.g. macos) and drop the others from the tree, or
  - Move them to separate repos and depend on a published gateway/API.

### 5. Dependencies

- Root `package.json` pulls in deps for **all** core channels (grammY, Bolt, Baileys, etc.). If you move channel impls into extensions, those deps can move to each extension’s `package.json` and core’s dependency set shrinks.

---

## Distilling “core” for personal use

A minimal “core” that stays in this repo could be:

- **Essential**: CLI entry, config, gateway server (WS, health, pairing, plugin loader), channel **dock** and routing (no concrete channels), plugin SDK, one minimal channel (e.g. Web or a stub) so the gateway can run and be tested.
- **Agent + reply**: Pi embedded runner, basic tools, auto-reply pipeline (so the gateway can run `agent` and reply on at least one channel).
- **Single channel**: Implement only the channel(s) you use (e.g. Telegram or Slack) either in core or in one extension that you keep.

Everything else (extra channels, browser, canvas, cron, hooks, memory backends, TUI, mobile/desktop apps) can be:

- Omitted from the default build or install, or
- Loaded via plugins/extensions that you add when needed.

---

## Making the project easier to extend (custom personal use)

1. **Add a new channel**
   - Implement it as a **channel plugin** in `extensions/your-channel/`: `openclaw.plugin.json` + `register(api)` with `api.registerChannel({ plugin })`. Use `openclaw/plugin-sdk` types and helpers. Either:
     - Call into core-style runtime (if you keep core impls and inject runtime), or
     - Implement send/monitor/pairing entirely in the extension (cleaner if you’re moving toward “all channels in extensions”).
   - Document the channel contract (see `src/channels/plugins/types.ts` and existing extensions).

2. **Add a new skill**
   - Add a `skills/<name>/SKILL.md` (and optional scripts). Skills are loaded from the skills dir; no change to core required.

3. **Add a new plugin (non-channel)**
   - Same plugin API: `extensions/your-plugin/` with `register(api)`. You can register gateway methods, HTTP routes, hooks, or tools. See existing extensions (e.g. `llm-task`, `memory-lancedb`).

4. **Config-driven enable/disable**
   - `plugins.allow` and per-plugin `enabled` already control which plugins load. For a personal setup, set `plugins.allow` to the list you use and leave others disabled or uninstalled.

5. **Clear extension contract**
   - To make “custom personal use” easier, document in one place:
     - How to add a channel plugin (steps + types from plugin-sdk).
     - How to add a non-channel plugin (gateway methods, routes, tools).
     - Where config and credentials live (`~/.openclaw/`, workspace `.openclaw/`).

6. **Optional: “slim” preset**
   - A build or install preset (e.g. `OPENCLAW_PRESET=slim`) that:
     - Skips bundling optional extensions,
     - Sets `OPENCLAW_SKIP_CHANNELS=0` but only enables one or two channels by config,
     - Or uses a minimal set of dependencies (e.g. only one LLM provider). This would require some build-time or env-based trimming.

---

## Quick reference

| Area              | Location           | Optional? | How to reduce / extend                    |
|------------------|--------------------|-----------|-------------------------------------------|
| CLI + entry       | `openclaw.mjs`, `src/entry*.ts`, `src/cli/` | No        | —                                          |
| Gateway           | `src/gateway/`     | No        | —                                          |
| Channel impls     | `src/telegram/`, `src/discord/`, … | Yes (per channel) | Remove dirs or move impl into extension |
| Channel plugins   | `extensions/*`     | Yes       | Remove unused extension dirs; add new ones |
| Plugin loader     | `src/plugins/`     | No        | —                                          |
| Plugin SDK        | `src/plugin-sdk/`  | No        | Add types/helpers for new plugins          |
| Agents (Pi)       | `src/agents/`      | Only if you drop “agent” | Lazy load or separate package          |
| Auto-reply        | `src/auto-reply/`  | Only if you drop reply  | —                                     |
| Channels dock     | `src/channels/`    | No        | Keep; add extension points if needed       |
| Browser / Canvas  | `src/browser/`, `src/canvas-host/` | Yes | Config flag or separate bundle            |
| Cron / Hooks      | `src/cron/`, `src/hooks/` | Yes  | Config flag; lazy load                    |
| Apps              | `apps/`            | Yes       | Keep one platform; move others out         |
