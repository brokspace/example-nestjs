# Agent guide

A NestJS 11 Tasks API used as the Brokspace example project.

- Find code with the `brok_search` tool (or `brok search "..."`) before
  grepping.
- New endpoints and fields: follow the `nest-endpoint` skill
  (`.brokspace/skills/nest-endpoint/SKILL.md`).
- How authentication works: `docs/auth.md`.
- Check every change with `pnpm lint`, `pnpm build`, `pnpm test` and
  `pnpm test:e2e`.
- Commits follow Conventional Commits (`brok commit` writes them).

## Git workflow

Every change reaches `main` through `staging`, the default branch:

```text
your branch --PR, squash--> staging --release PR, merge commit--> main --> tag
```

1. Branch from staging: `git fetch origin && git switch -c <type>/<topic> origin/staging` (for example `feat/kotlin-chunker`, `fix/empty-config`).
2. Commit in small steps with Conventional Commits. End every commit message with a `Co-Authored-By:` trailer naming the agent, for example `Co-Authored-By: Claude <noreply@anthropic.com>`: the PR gets the `ai-agent` label from it.
3. Before pushing, run what CI runs: `pnpm exec eslint "{src,apps,libs,test}/**/*.ts" && pnpm build && pnpm test && pnpm test:e2e`.
4. Push, open the PR against staging with the template filled in, and turn on auto-merge:

   ```sh
   git push -u origin HEAD
   gh pr create --base staging --fill
   gh pr merge --auto --squash
   ```

   The PR merges itself once `test` and `policy / title` pass and review conversations are resolved. No approval is needed.
5. A check failed? Read it (`gh pr checks --watch`, `gh run view --log-failed`), fix it on the same branch and push; auto-merge stays on. Cannot fix it? Say what you tried in a PR comment and stop. Never weaken or skip a check to get green.

Never push to `staging` or `main` (both reject it), force-push a branch someone else pushed to, open or merge PRs into `main`, or merge with `--admin`. The release PR into `main` is opened by the Promote workflow and merged by a maintainer.
