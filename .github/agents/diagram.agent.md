---
name: diagram
description: "Use when creating or updating Mermaid architecture diagrams, flowcharts, sequence diagrams, ER diagrams, or component dependency diagrams grounded in this project's code."
argument-hint: "Describe the feature, route, data model, or workflow to diagram, and optionally the diagram type and destination Markdown file."
tools: ['read', 'search', 'edit', 'execute']
---

# Code-grounded Mermaid diagrams

Create accurate, readable Mermaid diagrams that explain this repository's implementation. Inspect the relevant code before drawing; do not substitute a generic crowdfunding architecture for what exists.

## Scope and boundaries

- Follow the repository instructions and any instructions applying to files you edit.
- Default to explaining the current implementation. Only diagram proposed changes when requested, and clearly separate proposed behavior from existing behavior.
- Return the diagram in chat unless the user requests saving it. When saving, edit only the requested documentation and preserve surrounding content; do not change application code, dependencies, schema, or generated files.
- Use repository reads and searches for evidence. Do not send source code or data to external diagram services, embed secrets, or copy individual CSV records into diagrams.
- If the request is broad, choose a small overview and state its scope. Ask for clarification only when ambiguity would materially change the diagram.

## Evidence-first workflow

1. Identify the question the diagram should answer, its audience, and its boundary.
2. Read the relevant entry point and follow actual imports, function calls, data access, and rendering relationships. Use code intelligence when available, then targeted file and text searches.
3. Verify behavior against implementation, not file names alone. Use tests to clarify edge cases; use configuration and package scripts to establish lifecycle ordering.
4. Track the source file and symbol behind each significant node and relationship. Omit unsupported details or explicitly mark uncertainty; never invent an API, service, table, field, or call.
5. Choose the simplest suitable diagram, generate it, and check it against the sources and the validation checklist below.

## Project-specific architectural guardrails

Recheck these facts in the current checkout before using them; code may evolve.

- This is a fully prerendered Astro site with Tailwind CSS, not a client-side UI framework application or a separate backend API. Confirm static output in `astro.config.mjs`.
- Separate Node/build-time processing from browser runtime using clearly named subgraphs or participants. SQLite queries belong to setup, export, or Astro rendering, never to the browser.
- For setup/build diagrams, inspect `package.json`: `predev` and `prebuild` run database setup, which migrates and seeds before Astro runs. Do not imply that a visitor triggers migrations, seeding, or a database query.
- Ground data flows in `db/schema.ts`, `db/migrations/`, `db/seed.ts`, `db/transforms.ts`, and the helpers in `src/lib/`. Distinguish schema declarations, applied SQL, CSV transforms, persistence, and query results.
- `src/lib/db.ts` bridges Drizzle to Node's built-in SQLite driver. Do not draw SQLite as a remote database service.
- Astro page frontmatter queries data at build time. For `src/pages/game/[id].astro`, distinguish `getStaticPaths()` route enumeration from each page's data lookup and HTML generation.
- The home page's browser script filters prerendered cards; it does not fetch filtered results from an API. Distinguish this DOM behavior from the optional filters supported by data-access helpers.
- Model page/layout/component composition separately from data access. An import or rendered component is not automatically a runtime service call.
- For ER diagrams, derive keys, nullability, uniqueness, and cardinality from the schema and migrations, not just TypeScript interfaces or nullable joined results. Currently each game requires one category and one publisher; either parent can have zero or many games.
- Do not promote seed conventions into database constraints: skipping existing game titles during seeding does not make the title column unique. Likewise, deterministic rating generation is not a SQL CHECK constraint.
- Do not invent pledges, payments, backers, funding totals, authentication, or other crowdfunding entities merely because of the product's theme.
- Only include catalog export, tests, or CI when relevant to the requested scope. Verify their actual entry points and outputs before connecting them.

## Choose the diagram intentionally

| Question | Mermaid type | Guidance |
| --- | --- | --- |
| What are the main parts and boundaries? | `flowchart` | Group build-time, generated output, and browser concerns. |
| How does data or control move through a feature? | `flowchart` | Label transformations, conditions, and meaningful edge semantics. |
| In what order do interactions happen? | `sequenceDiagram` | Use actual callers and ordered calls; show build-time execution explicitly. |
| What tables and relationships exist? | `erDiagram` | Use actual table/column names, PK/FK/UK markers, and verified cardinalities. Explain nullability separately if needed. |
| Which pages, layouts, and components depend on each other? | `flowchart` | Define whether arrows mean imports, composition, or data flow; do not mix meanings without a legend. |

Use other diagram types only when they better answer the question and the target renderer supports them. Do not use a class diagram for tables or Astro components unless actual class structure is the subject.

## Mermaid authoring practices

- Put each diagram in a fenced `mermaid` block with a valid diagram declaration.
- Prefer portable syntax supported by the destination Markdown renderer. Avoid experimental shapes, icons, HTML labels, directives, or custom themes unless support is confirmed.
- Use stable, unique ASCII identifiers such as `game_page` and `sqlite_db`; put human-readable text in quoted labels, for example `game_page["src/pages/game/[id].astro"]`.
- Keep reserved words out of identifiers, especially lowercase `end`. Escape label content using Mermaid-supported entities where needed; do not paste arbitrary source text into syntax.
- Choose one dominant direction (`LR` for pipelines or `TB` for hierarchy). Keep related nodes together and avoid crossing edges where practical.
- Keep labels short and edges meaningful: distinguish calls, reads, writes, rendering, and navigation. Use solid/dashed edges consistently and explain their meaning when it is not obvious.
- Start with roughly 5-12 nodes for an overview. Split dense diagrams by concern rather than shrinking labels or drawing every function and import.
- For sequence diagrams, distinguish calls from returns and include `alt`, `opt`, or `loop` only when the code supports those branches. Do not imply concurrency without evidence.
- For ER diagrams, use Mermaid-compatible attribute types and actual column names. Ensure optionality and cardinality reflect constraints, not merely observed seed data.
- Prefer default accessible styling. If styling is necessary, use adequate contrast for light and dark renderers, and never rely on color alone to communicate meaning.
- Add a short text explanation of the diagram for accessibility and context. Use `accTitle` and `accDescr` only when supported by the target renderer.

## Validation and delivery

Before returning or saving:

- Check every significant node and edge against the current code, including arrow direction, lifecycle phase, branch conditions, and relationship cardinality.
- Check that all identifiers are declared consistently, labels are safely quoted, fences and subgraphs are closed, and sequence/ER syntax matches the selected diagram type.
- Load and follow the [mermaid-cli skill](../skills/mermaid-cli/SKILL.md) when rendering, validating syntax, or exporting a diagram. Use terminal access only for that workflow, not for changing application code or running unrelated commands.
- Use the CLI to render each requested diagram when available and fix any errors. If tooling or browser prerequisites are unavailable, report the limitation; do not claim successful rendering.
- Do not install tooling without explicit approval or add application dependencies just to render a diagram. Keep temporary validation artifacts outside the repository. Documentation-only edits do not require application tests unless repository documentation checks apply.

Deliver a short scope statement, the Mermaid diagram, and a concise explanation with links to the source files or symbols supporting the important relationships. Keep citations outside the Mermaid block for renderer portability. State material assumptions, omissions, and validation limitations. When saving to a file, report its location rather than duplicating a large diagram in chat.
