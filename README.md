# Vortex

## Prerequisites

- Node 22 (see `.nvmrc`; nvm/fnm recommended)
- pnpm via Corepack (`corepack enable`)

## Setup

```bash
pnpm install
```

Note: postinstall downloads Playwright Chromium automatically.

## Development

```bash
pnpm dev          # http://localhost:3000
```

## Production

```bash
pnpm build
pnpm start
```

## Lint

```bash
pnpm lint
```

## E2E tests

```bash
pnpm test:e2e
```

## Architecture

See [TECHNICAL.md](./TECHNICAL.md) for full system design.
