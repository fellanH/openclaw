# Cortana - The Assistant

A lightweight, **de-branded fork** of [OpenClaw](https://github.com/openclaw/openclaw) designed as a **neutral baseline template** for building your own AI assistant.

<p>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

## What is this?

This fork strips away branding and opinions to give you a clean starting point. It's optimized for non-technical users who want simpler setup and clearer copy without the upstream project's personality.

**Use this if you want:**
- A neutral template to customize for your own assistant
- Simpler, more accessible documentation
- A baseline to fork and make your own

**Use upstream [OpenClaw](https://github.com/openclaw/openclaw) if you want:**
- The full-featured, actively maintained project
- Community support and Discord
- All the bells and whistles

## Quick Start

**Requirements:** Node 22+

```bash
git clone https://github.com/FellanH/cortana.git
cd cortana
./scripts/quickstart.sh
```

This script will:
- Install dependencies (pnpm)
- Build the project
- Create a `cortana` shell alias
- Run the onboarding wizard

After setup, use `cortana <command>` to run your fork.

---

## Manual Setup

If you prefer to set things up manually:

### 1. Clone and build

```bash
git clone https://github.com/FellanH/cortana.git
cd cortana

pnpm install
pnpm build
```

### 2. Run commands from your fork

```bash
# Option 1: Use pnpm (runs TypeScript directly)
pnpm openclaw <command>

# Option 2: Use node with built output
node dist/entry-bootstrap.js <command>

# Option 3: Create a shell alias (add to ~/.bashrc or ~/.zshrc)
alias cortana='node /path/to/cortana/dist/entry-bootstrap.js'
```

> **Warning:** The global `openclaw` command (from `npm install -g openclaw`) runs the upstream npm package, **not your fork**.

### 3. Install the gateway service (optional)

To run your fork as a background service:

```bash
# Install the gateway daemon pointing to YOUR local build
node dist/entry-bootstrap.js gateway install
```

This creates a LaunchAgent (macOS) or systemd service (Linux) that runs your fork, not the global npm package.

### 4. Onboard

```bash
cortana onboard
```

The wizard walks you through gateway, workspace, channels, and skills.

## Avoiding Conflicts

| Scenario | Solution |
|----------|----------|
| Global `openclaw` runs upstream instead of your fork | Use `pnpm openclaw` or `node dist/entry-bootstrap.js` |
| Gateway service runs the wrong version | Reinstall with `node dist/entry-bootstrap.js gateway install` |
| Config conflicts | Your fork uses the same `~/.openclaw/` directory; this is usually fine |
| Want complete isolation | Set `OPENCLAW_HOME` to a different directory before running |

**To uninstall the global package** (if you only want your fork):

```bash
npm uninstall -g openclaw
```

## Configuration

Config lives at `~/.openclaw/openclaw.json`:

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-5"
  }
}
```

## Development

See **[DEVELOPMENT.md](DEVELOPMENT.md)** for:
- How to customize branding, channels, and tools
- Adding new channels or agent tools
- Project structure overview
- Configuration reference

**Dev helper script:**
```bash
./scripts/dev-helper.sh          # Show all commands
./scripts/dev-helper.sh gateway  # Start gateway (fast mode)
./scripts/dev-helper.sh test     # Run tests
```

## Documentation

This fork tracks upstream OpenClaw. For full documentation:

- [Getting Started](https://docs.openclaw.ai/start/getting-started)
- [Configuration](https://docs.openclaw.ai/gateway/configuration)
- [Channels](https://docs.openclaw.ai/channels) (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, etc.)
- [Security](https://docs.openclaw.ai/gateway/security)

## Upstream

This project is a fork of [OpenClaw](https://github.com/openclaw/openclaw), created by Peter Steinberger and the community.

## License

MIT
