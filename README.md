# Brokspace example: NestJS Tasks API

[![CI](https://github.com/brokspace/example-nestjs/actions/workflows/ci.yml/badge.svg)](https://github.com/brokspace/example-nestjs/actions/workflows/ci.yml)

A small, realistic NestJS API to try [Brokspace](https://github.com/brokspace/brok)
on: search it by meaning, ask questions about it, review and commit changes
with a local LLM, and connect your coding agent.

The API itself: users log in, get a JWT access token plus a rotating refresh
token, and manage their tasks (members see their own, admins see everyone's).

```text
src/
  auth/     login, refresh token rotation + reuse detection, global JWT guard, roles
  tasks/    CRUD with ownership rules and status transitions
  users/    in-memory users (two demo accounts)
  config/   settings from the environment
docs/
  auth.md   how authentication works
```

## Run the API

Needs Node.js 20+ and pnpm.

```sh
git clone https://github.com/brokspace/example-nestjs && cd example-nestjs
pnpm install
pnpm start:dev          # http://localhost:3000
pnpm test && pnpm test:e2e
```

Demo accounts: `alice@example.com` (admin) and `bob@example.com` (member),
both with password `password123`.

```sh
curl -s -X POST localhost:3000/auth/login -H "content-type: application/json" \
  -d '{"email":"bob@example.com","password":"password123"}'
# -> { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }

curl -s localhost:3000/tasks -H "authorization: Bearer <accessToken>"
```

## Try Brokspace on it

Install `brok` and, optionally, a local LLM first: see the
[getting started guide](https://github.com/brokspace/brok/blob/main/docs/getting-started.md)
(steps 1 and 2). Then, in this folder:

```sh
brok init               # workspace, agent, search model, local LLM, index, coding agents
brok doctor             # everything should be ✓
```

### Find code

```sh
brok search "where is the access token checked"
brok search "what happens when a refresh token is used twice"
brok search "who can see which tasks"
brok search RefreshTokenStore           # names work too
```

Results are whole functions, classes and doc sections (`canAccess`,
`RefreshTokenStore`, `docs/auth.md` ...), found by meaning, not just by
words. (This README shows up too, since it contains these exact questions.)

### Ask, chat, review, commit

```sh
brok ask "how does refresh token rotation work here?"
brok chat                                   # follow-up questions; /skill grill-me, /exit
```

Make a change, then let your LLM review it and write the commit message:

```sh
# e.g. add a `priority` field to tasks in src/tasks/task.entity.ts and the DTOs
brok review                                 # review of the uncommitted diff
git add -A && brok commit                   # Conventional Commits message, then commit
```

While `brok` runs in the background (`brok start`, or started by the first
`ask`), the index follows every save and commit within seconds:
`brok status` shows it, `brok logs -f` shows what it is doing.

### Skills

```sh
brok skill list
brok skill run code-review "the refresh token rotation in src/auth"
brok skill run tdd "add a priority field to tasks"
```

`.brokspace/skills/nest-endpoint/` is a workspace skill for this project: it
teaches the LLM (and your coding agent) how endpoints are written here.
Try `brok skill run nest-endpoint "GET /tasks/overdue"`.

### Your coding agent

`brok init` (step 6) or `brok setup agents` connected Claude Code, Cursor,
VS Code or Codex: they get the `brok_search` tool and the skills. In your
agent, try `/ask-brok` or "use brok_search to find where roles are checked".

## What `brok init` added

| Path | What | Commit it? |
|---|---|---|
| `.brokspace/brok.yml` | Brokspace settings for this project | yes |
| `.brokspace/skills/` | Project skills | yes |
| `.brokspace/shards/shards.lock`, `*/shard.json` | Which shards the project uses | yes |
| `.brokspace/databases`, shard binaries, logs | Index and runtime state | no (`.brokspace/.gitignore` handles it) |
| `.mcp.json`, `.vscode/mcp.json`, `.cursor/mcp.json` | MCP search tool for coding agents | yes |
| `.claude/skills/`, `.agents/skills/` | Skills exported for coding agents | yes |

## License

MIT
