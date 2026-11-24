# Tailspin Toys

Tailspin Toys is a crowdfunding platform for games with a developer theme. The project is a website for a fictional game crowd-funding company, built as a single [Astro](https://astro.build/) site (fully prerendered/static output) styled with [Tailwind CSS](https://tailwindcss.com/). Its data lives in a local SQLite database accessed through [Drizzle ORM](https://orm.drizzle.team/) and Node.js's built-in SQLite driver; pages query the database directly in frontmatter at build time, so there is no separate backend service.

## Architecture

- **Astro 7** — pages, layouts, components, and routing. `output: 'static'`, so the whole site is prerendered to HTML at build time.
- **Drizzle ORM + Node SQLite** — the data layer. The schema lives in `db/schema.ts`; data is seeded from `db/games.csv`. Migrations are managed with `drizzle-kit`.
- **Tailwind CSS v4** — styling via utility classes (dark theme).
- **Vitest** — unit tests for the data layer and pure transforms.
- **Playwright** — end-to-end tests run against the built static site.

Development commands are defined in `package.json`: npm runs Astro for the dev server, static build, and preview. The `predev` and `prebuild` npm hooks run the TypeScript database migration and seed tasks in `db/`, writing to the gitignored `tailspin.db` file.

## Using this template

This repository is a GitHub template. When you create a new repository from it, a one-time **Bootstrap template issues** workflow (`.github/workflows/bootstrap-issues.yml`) runs automatically on the first push to `main` and opens a set of starter issues describing suggested first features. Each issue is defined by a Markdown file in `.github/bootstrap-issues/` — the first heading becomes the issue title and the remaining content becomes the body — so you can edit, add, or remove files there to control which issues are created.

The workflow only runs on repositories created from the template (the `if: ${{ !github.event.repository.is_template }}` guard skips the template itself), and after creating the issues it removes itself and the `.github/bootstrap-issues/` folder in a cleanup commit so it never runs again.

## Getting started

Install dependencies once with Node.js 22.13 or later:

```bash
npm ci
npx playwright install chromium   # only needed to run the E2E tests
```

## Launch the site

```bash
npm run dev
```

`predev` migrates and seeds the local database first. Then navigate to the [website](http://localhost:4321) to see the site!

To preview a production build instead:

```bash
npm run build      # prebuild migrates + seeds, then builds the static site
npm run preview
```

## Database

The SQLite database is built from `db/games.csv` — there is no live data to migrate.

```bash
npm run db:generate   # generate a migration after editing db/schema.ts
npm run db:migrate    # apply migrations
npm run db:seed       # seed from games.csv (idempotent)
npm run db:setup      # migrate + seed (run automatically by predev/prebuild)
npm run db:export     # write the seeded catalog to db/catalog.json
```

> [!NOTE]
> Seeding is idempotent — it skips games that already exist (matched by title) rather than reconciling changed rows. CI always starts from a clean database, so it reflects `games.csv` exactly. Locally, if you edit or remove rows in `games.csv`, delete `tailspin.db` and re-run `npm run db:setup` to fully regenerate.

The injectable `getAllPublishers(db)` helper in `src/lib/publishers.ts` returns
all publishers as `{ id, name }` objects ordered alphabetically by name, including
publishers without games. It returns an empty array when no publishers exist.

## Catalog filtering

On the home page, select one or more category checkboxes and/or a publisher.
Selected categories match **any** of those categories; the publisher narrows that
selection further. With no categories selected, all categories are included.
**Clear filters** restores the full catalog. Results update immediately with an
announced result count and a helpful empty state when nothing matches.

The site remains fully static: a small Astro script filters the prerendered cards
without network requests. Without JavaScript, the complete catalog remains available.
Build-time consumers can use `getAllGames(db, { categoryIds: [1, 2], publisherId: 3 })`
with the same matching rules. Omitting the filters preserves the original full listing.
`getAllCategories(db)` in `src/lib/categories.ts` provides alphabetically ordered
`{ id, name }` options, including categories without games, just like the existing
publisher helper.

## Running tests

```bash
npm run test:unit   # Vitest unit tests (transforms + data-access helpers)
npm run test:e2e    # Playwright E2E tests (builds + previews the static site first)
```

## Linting

The frontend uses ESLint to enforce code quality across TypeScript and Astro files. Run it with:

```bash
npm run lint
```

ESLint is also run automatically in CI on pull requests to `main`.

## Type checking

The project runs on **TypeScript 7** (the native Go compiler, `tsgo`) for type checking, adopted side-by-side via the [`@typescript/native-preview`](https://www.npmjs.com/package/@typescript/native-preview) package. The classic `typescript` package is intentionally kept at v6 so ESLint + `typescript-eslint` and `astro check` keep working unchanged — TypeScript 7's programmatic API isn't ready for those tools yet.

```bash
npm run typecheck        # tsgo (TS 7) type-checks the pure TypeScript (db/, src/lib/, src/types/, configs, tests)
npm run typecheck:astro  # astro sync + astro check type-check .astro files (on the classic TypeScript package)
npm run typecheck:all    # both of the above
```

`tsgo` runs against [`tsconfig.tsgo.json`](tsconfig.tsgo.json), a scoped config that excludes `.astro` files (which the native compiler doesn't understand). Type checking runs automatically in CI on pull requests to `main`.

> [!NOTE]
> The native compiler is used only for type checking (`--noEmit`); the site is still built by `astro build` (Vite/esbuild). The classic `typescript` package stays on v6 until `typescript-eslint` and `@astrojs/check` support the native API (~TS 7.1); a Dependabot `ignore` in `.github/dependabot.yml` holds the classic `typescript@7` bump until then.

## Copilot issue plans

`.github/workflows/issue-plan.md` uses GitHub Copilot to propose a solution
whenever an issue is opened, including issues from external contributors.
It reads the issue, relevant repository instructions, source, and tests, then
posts a Markdown comment headed **plan.md** with the recommended approach,
implementation steps, validation, and open questions. The plan stays beside
the issue rather than creating a file, branch, or pull request. Review it before
implementing; the workflow does not change code or run the proposed checks.

Enable GitHub Actions and Copilot inference for agentic workflows in the
repository's account/organization, then land both `issue-plan.md` and its
generated `issue-plan.lock.yml` on the default branch. Copilot authenticates
with `copilot-requests: write` on the Actions token; no Copilot PAT is needed.
The agent has read-only repository access, no checkout or shell access, and can
publish at most one comment on the triggering issue through a separate trusted
safe-output job. Rerunning the Actions run replaces the workflow's existing
plan comment instead of adding duplicates. Closed issues are skipped.
Failures and incomplete runs are reported in Actions diagnostics rather than
creating extra issues; failed threat detection blocks publication.

Each new issue can consume Actions minutes and Copilot usage, including issues
opened by users without write access. GitHub suppresses workflow triggers for
issues created using another workflow's `GITHUB_TOKEN`, so issues created by
the Jira sync do not automatically trigger this planner. Use an approved GitHub
App token for the creating workflow if chaining is required. Disable **Copilot
issue plan** in Actions to stop automatic planning.

After editing the Markdown source, regenerate and commit its lock file using
gh-aw v0.93.2:

```bash
gh aw compile issue-plan
```

## Jira to GitHub issue sync
`.github/workflows/jira-to-github.md` is a GitHub agentic workflow that reads
Jira through MCP and creates or updates issues in `hmedzk/tailspintoys-contoso`.
It targets **every five minutes** and supports **Run workflow** for manual runs.
GitHub Actions does not support a one-minute schedule; scheduled runs can be
delayed or dropped under load, and runs longer than five minutes are serialized.
A strict one-minute interval requires a separately hosted scheduler/worker.
### Required setup
1. Confirm that copying the selected project's Jira descriptions into this
   repository is permitted, especially if the repository is public. Grant a
   dedicated Atlassian service account read-only access to that project and
   enable your organization's remote MCP access. This workflow uses the official
   `https://mcp.atlassian.com/v1/mcp` endpoint with non-interactive service-account
   bearer authentication, not browser OAuth. Confirm endpoint and authentication
   compatibility before enabling it.
2. In **Settings > Secrets and variables > Actions**, add the repository secret
   `ATLASSIAN_SERVICE_ACCOUNT_API_KEY`. Never put credentials in workflow files,
   issue bodies, or command-line arguments.
3. Add repository variables `JIRA_PROJECT_KEY` (for example, `TOYS`) and
   `JIRA_CLOUD_ID` (the Jira site's cloud UUID, not its project ID or hostname).
   Find the UUID in your Atlassian site administration or the site's
   `https://YOUR-SITE.atlassian.net/_edge/tenant_info` response.
4. Enable GitHub Actions and Copilot inference for agentic workflows in the
   repository's account/organization. The workflow uses
   `copilot-requests: write` with the Actions token; no Copilot PAT is needed.
   The agent remains read-only; separate trusted jobs publish issue changes and
   workflow diagnostics.
5. Commit both the Markdown source and compiled `jira-to-github.lock.yml` to
   the default branch to activate the schedule. Run it manually first and inspect
   the Actions logs and resulting issues. Missing configuration fails explicitly;
   setup here does not establish or verify a live Jira connection.
The query selects the configured project and exact status name `To Do`, not all
statuses in the To Do category. Summaries become `[Jira] KEY: Summary` titles;
descriptions, source links, and Jira timestamps live in a managed body section.
Titles are capped at the safe-output tool's 128-character limit. Atlassian Cloud
links are allowed in published content; other external URLs may be redacted by
the workflow's sanitizer.
Jira comments and attachments are not copied. A cloud-ID/key marker links each
source item to its issue across runs, including closed issues. GitHub issue
states never change, and items leaving To Do are left untouched.
Add GitHub-only notes **outside** the managed section (under `### GitHub notes`).
Content inside that section and the issue title are Jira-owned. To link an
existing issue manually, prefix its title with `[Jira] ` and add the standalone
line `Jira sync identity: CLOUD_ID:ISSUE_KEY` to its body. The workflow inserts
its managed section without replacing existing notes. This identity stays
outside the `<!-- gh-aw-island-start:jira-to-github -->` /
`<!-- gh-aw-island-end:jira-to-github -->` pair inserted by the safe-output
handler. Do not put the identity in an HTML comment: the sanitizer removes
agent-authored comments. Duplicate identities or malformed/duplicated island
markers are reported and skipped. If both island markers are absent (including
an interrupted creation), the next run initializes the section without creating
another issue.
Each run permits at most 25 creations and 25 existing-issue updates, plus up to
25 initialization updates for new issues; deferred items are reported
and reconsidered on later runs. This is an AI-driven, best-effort reconciliation,
not a transactional mirror. Monitor conflicts, failures, backlog, Actions minutes,
and Copilot usage: a five-minute schedule can start **288 runs per day**.
Disable **Jira To Do sync** in Actions to stop polling.
After editing the workflow, regenerate its lock file with the matching compiler:
```bash
gh extension install github/gh-aw --pin v0.91.1
gh aw compile jira-to-github
```
For a different approved Atlassian MCP endpoint, edit `tools.jira.url` to its
literal HTTPS URL and recompile. For account API-token authentication instead,
use the compiler's `tools.jira.auth.type: api-token` configuration with separate
email/token repository secrets; recompile before running. Other MCP server
implementations may have different tools and require an adapted workflow.
If adapting this workflow to another repository, also change both safe-output
`target-repo` values and the repository named in its instructions before compiling.

## License 

This project is licensed under the terms of the MIT open source license. Please refer to the [LICENSE](./LICENSE) for the full terms.

## Maintainers 

You can find the list of maintainers in [CODEOWNERS](./.github/CODEOWNERS).

## Support

This project is provided as-is, and may be updated over time. If you have questions, please open an issue.

## Disclaimer

This app is not intended for use in a production environment, nor is it built as an example of what a production app should look like.

HEHE Vibes Only
