# code-lift

Opt-in tool that gets your local code **and a language-agnostic pseudocode outline of it** online for indexing.
Nothing leaves your machine unless you run `code-lift init` in a folder (opt-in) and then `push --remote … --confirm`.

Zero dependencies. Node ≥ 18. Author: Joshua Almeida ([@fitzyracing1](https://github.com/fitzyracing1)). MIT license.

```
code-lift init  [dir]                    # write .code-lift.json allowlist (include/exclude globs)
code-lift scan  [dir] [--json]           # what would upload; blocked (secret scan) + skipped, with reasons
code-lift push  [dir]                    # dry-run (default)
code-lift push  [dir] --remote <git-url> --confirm [--branch main] [--author "Name <email>"]
code-lift index [dir] [--out site]       # .pseudo/**/*.md + site/index.json + site/index.html (client-side search)
```

## Safety
- Respects every `.gitignore` (nested, negation, dir-only, anchored) **and** the allowlist.
- Skips binaries (NUL byte) and files over `maxFileBytes`.
- Secret scan blocks: PEM private keys, AWS key ids/secret keys, GitHub tokens (`ghp_`, `github_pat_`…), OpenAI-style `sk-` keys, Slack tokens, `.env` / `.env.*` (except `.example/.sample/.template`), and high-entropy strings. Reports the reason + line number, **never the value**. `scan` exits 2 when anything is blocked.
- `push` without `--confirm` is always a dry run. It only commits to a remote you name (one you own).

## Pseudocode
`lib/pseudo.js` does simple line/brace/indent parsing for JS, TS, Python and Go: classes/structs, functions, methods,
params, return types, doc comments/docstrings, and short step summaries (If / For each / While / Try / On error / Return / Raise / Call / Note).
Output: `.pseudo/<path>.md`.

## Publishing the index
Copy `templates/index.yml` to `.github/workflows/` in the target repo; it rebuilds the index on push and deploys `site/` to GitHub Pages
(enable Pages → "GitHub Actions" in repo settings).

### Alternative: self-hosted runner
If you don't want code built on GitHub-hosted machines, register a runner on your own box
(Settings → Actions → Runners → New self-hosted runner), then change `runs-on: ubuntu-latest` to `runs-on: [self-hosted, linux]`
in the `build` job. Node 20 and git must be installed on the runner. Or skip Actions entirely: run `code-lift index` locally and serve `site/` with any static host.

CI status wording: a run is **lit** (passed) or **dark** (failed).

## Tests
`npm test` (node --test) — 26 tests: secret blocking, gitignore/allowlist, pseudocode for JS/TS/Python/Go, index build, dry-run + confirmed push to a local bare repo.

## Demo
`examples/sample-app` is a FAKE project with clearly-labeled fake planted secrets. See `examples/demo-output.txt`.

## Plans

This project is free, and its license stays as is. Support it through [GitHub Sponsors](https://github.com/sponsors/fitzyracing1):

- **Free**: use the code, community support.
- **Pro ($49/month)**: priority issues and support.
- **Team ($199/month)**: priority support for your team plus early access.
