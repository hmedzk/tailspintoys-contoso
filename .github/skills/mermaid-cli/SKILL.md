---
name: mermaid-cli
description: "Use when rendering, validating, or exporting Mermaid diagrams (.mmd) to SVG, PNG, or PDF with Mermaid CLI (mmdc), including repository architecture, data-flow, ER, and sequence diagrams."
---

# Mermaid CLI

Render Mermaid source locally using the `mmdc` executable supplied by
`@mermaid-js/mermaid-cli`. A skill is an instruction workflow: use the terminal
execution tool to run the commands below, rather than assuming an MCP tool named
`mmdc` exists.

## 1. Locate the CLI

Use absolute paths for input, output, and configuration files. Replace the
example repository path below with the actual workspace root.

Check for a repository-local CLI first:

```bash
test -x "/absolute/path/to/repo/node_modules/.bin/mmdc"
```

Otherwise look for an existing executable on PATH:

```bash
command -v mmdc
```

Use the resolved executable path for subsequent commands. Confirm it works with
`--version` and consult `--help` before using unfamiliar options.

If neither executable exists, stop and report that Mermaid CLI is missing.
Offer this installation command for the user to run, or request approval before
running it yourself:

```bash
npm install --global @mermaid-js/mermaid-cli
```

Do not silently install dependencies, invoke an auto-downloading `npx` fallback,
or modify the application's dependency manifests. Mermaid CLI also needs a
compatible headless browser; report browser setup failures separately from
diagram syntax errors.

## 2. Prepare the source

- Inspect relevant repository code and instructions before creating a diagram.
- Save editable Mermaid text as `.mmd`. Default to `docs/diagrams/` and SVG output,
  keeping source and rendered files together, unless the user specifies otherwise.
- Create the output directory if necessary. Inspect existing files before
  replacing them, and preserve unrelated user changes.
- Use a valid diagram declaration such as `flowchart TD`, `sequenceDiagram`, or
  `erDiagram`. Keep labels short and quote labels with punctuation.
- Do not include secrets, database dumps, remote images, or external stylesheets.
  Do not send source to an online renderer.

## 3. Execute Mermaid CLI

Run the resolved executable with explicit input/output paths. For example, when
the executable was found at `/absolute/path/to/mmdc`:

```bash
"/absolute/path/to/mmdc" \
  --input "/absolute/path/to/repo/docs/diagrams/architecture.mmd" \
  --output "/absolute/path/to/repo/docs/diagrams/architecture.svg" \
  --theme dark \
  --backgroundColor transparent
```

The output extension selects the format. Use `.png` for a raster image or `.pdf`
for a document when requested. Keep the Mermaid source as the editable original.
Rendering also validates Mermaid syntax; generating source alone does not.

For an existing compatible browser, prefer its documented executable path via
`PUPPETEER_EXECUTABLE_PATH`. If a Puppeteer configuration is needed, use an
inspected local JSON file with `--puppeteerConfigFile` and an absolute path.
Do not add `--no-sandbox`, disable browser security, or lower Mermaid's security
level as a workaround.

## 4. Verify and report

1. Require a zero exit status from `mmdc`. On failure, surface the actual error;
   fix source syntax and rerun, or report the missing CLI/browser prerequisite.
   Never treat an old output file as evidence of a successful render.
2. After a successful command, verify the requested output is non-empty:

   ```bash
   test -s "/absolute/path/to/repo/docs/diagrams/architecture.svg"
   ```

3. When an image viewer or browser is available, inspect the rendered file for
   clipped labels, overlaps, legibility, and correct relationships. If visual
   inspection is unavailable, say so.
4. Report the source and output paths, exact command, and validation result.
   If blocked, distinguish saved source from an unrendered/unvalidated diagram.
5. Remove only temporary files created by this workflow. Keep the requested
   source and final rendered outputs.
