# Automated Insights LLC - Project Rules

## ABSOLUTE STRICT RULE: Credential and IP Isolation

**This is non-negotiable and applies to ALL work in this directory.**

1. **NEVER use AWS credentials, git credentials, API keys, or any credentials associated with OpenMotion AI or CipherSkin.** This includes the `claude-s3` AWS profile and any other profiles configured for employer work.
2. **NEVER reference, derive from, or use any code, tools, datasets, products, or internal knowledge from OpenMotion AI or CipherSkin.**
3. **All work in this directory is 100% independent.** Ideas must come only from public knowledge, general engineering experience, and common internet search problems.
4. **If an idea overlaps with potential employer IP or proprietary research, discard it immediately.**
5. **If credentials are needed for this project, they must be created separately and specifically for Automated Insights LLC.** Never reuse employer credentials.

Violating any of these rules is a fireable offense and potential legal liability. When in doubt, stop and ask.

## Global Rule Overrides

The following global CLAUDE.md rules are **IGNORED** in this project -- they apply to OpenMotion/CipherSkin work only:

- Pre-push safety checks for `UserSignInView.cs`, `CoPlay`, `Packages/manifest.json`, `packages-lock.json`
- The `claude-s3` AWS profile and `openmotion-public-images` S3 bucket
- Git issue investigation comment format and attribution rules specific to employer repos
- Any restriction referencing OpenMotion, CipherSkin, or employer-specific workflows

This project has its own credentials, its own git repos, and its own rules.

## GitHub Account

Git push/pull is handled automatically via a PAT embedded in the remote URL. No `gh auth switch` needed for git operations -- the repo always authenticates as `nvogler90ps` regardless of global `gh auth` state.

**For `gh` CLI commands** (creating repos, PRs, issues), you MUST still:
1. Run `gh auth switch --user nvogler90ps`
2. Run `gh auth status` and confirm `nvogler90ps` is active
3. Only then run the `gh` command

- **This project uses:** `nvogler90ps` / `nvogler90@gmail.com`
- **NEVER push under:** `nvogler-90` (that is the employer account)
- **Incident:** on 2026-03-13, switching to `nvogler90ps` broke employer git pushes in another terminal. The PAT-in-remote-URL approach was adopted to avoid this.

## Autonomy: Claude Does 99% of the Work

Claude Code must be able to perform virtually all work autonomously in this project:

- **Build, deploy, and maintain** projects end-to-end without manual intervention
- **Create and manage git repos, branches, commits, PRs** freely
- **Set up hosting, domains, CI/CD** when needed (with user approval for paid services)
- **Make architectural decisions** and implement them -- ask only when genuinely ambiguous
- **Run builds, tests, and deployments** without waiting for permission on routine operations
- **Create and manage project infrastructure** (package.json, configs, directory structure, etc.)

The user's role is to set direction, approve spending, and make product decisions. Claude handles execution.
