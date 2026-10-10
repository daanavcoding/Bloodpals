# BLOODPALS

A mobile-first reference website for custom **Blood on the Clocktower** scripts, with concise character guides in Spanish.

Choose a script, browse its characters, and open a guide during a game. BLOODPALS turns reviewed source material into readable pages with contextual strategy summaries, examples, and storyteller instructions.

## Features

- Dedicated HTML pages for each script, with direct links and reliable reloads.
- Character lists that preserve the supplied script's categories and order.
- Spanish ability text and guides organized into Summary, Tips, Examples, Bluffing, and Storyteller sections.
- Accessible dialogs with keyboard navigation, browser history, and scroll restoration.
- An HTML reading fallback for browsing without JavaScript.
- Responsive layouts, parchment panels, and locally hosted character artwork.
- A fixed parchment palette in light and dark browser themes. Generated pages version the stylesheet by its content so updates do not reuse an older cached theme.
- Source references and editorial records for translations and summaries.

The current library includes **Anonymous Cult Dishonesty**, a 25-character script by **Gamepals**, with its setup table and night instructions.

## Quick start

Use **Node.js 20 or later**. The project uses the Node.js standard library and has no production dependencies.

```sh
npm run build
npm run preview
```

To run the complete content checks:

```sh
npm test
npm run validate
npm run build
```

## Project structure

```text
content/
  scripts/          Script inventories, metadata, setup, and night instructions
  characters/       Character identities, abilities, artwork, and references
  curated/          Translated input and final guides for each script
  reviews/          Editorial reviews, corrections, and artwork provenance
  glossary.es.json  Shared terminology
templates/          HTML page templates
assets/             CSS, JavaScript, fonts, and images
tools/              Validation, generation, and preview
tests/              Content checks and regression tests
fixtures/           Development examples
inputs/             Source documents used during preparation
site/               Generated website
.github/workflows/  GitHub Pages deployment
```

## Adding or updating a script

1. Prepare the source image or PDF and confirm its title, author, version, character inventory, categories, order, and notes.
2. Add metadata to `content/scripts/<slug>.json`.
3. Create or update character records in `content/characters/<id>.json`.
4. Prepare contextual guides in `content/curated/<slug>/<id>.json`, using current official character pages as the primary reference.
5. Record source revisions, consultation dates, translation corrections, filtering decisions, and synthesis reviews in `content/reviews/`.
6. Run the checks, build the website, and inspect the generated pages.

The editorial workflow translates and reviews source material before summarizing it. Summary explanations, Tips, and Bluffing become shorter while retaining distinct ideas, conditions, and cautions. Opposing strategies appear together as alternatives. Ability text, applicable Examples, and Storyteller instructions remain unchanged during the synthesis pass.

The data format separates reviewed input (`reviewUnits`) from player-facing output (`displaySections`) and its section-level review (`synthesisReview`). Corrections and summaries are independently traceable.

See [AGENTS.md](AGENTS.md) for the complete contributor workflow. The existing Anonymous Cult Dishonesty content provides an editorial reference; `fixtures/development/content/` provides fictional examples of the data structure.

## Local development

| Command | Purpose |
| --- | --- |
| `npm test` | Run validation and content regression tests |
| `npm run validate` | Check reviewed content, references, assets, and synthesis structure |
| `npm run build` | Generate the website in `site/` |
| `npm run preview` | Serve the generated website on port 5173 |
| `node tools/build.mjs --demo` | Generate fictional development pages in `work/demo-site/` |

The browser receives generated HTML, CSS, JavaScript, and images. Content preparation happens before generation. Reading a character guide uses content already included in its script page.

Automated checks verify structure, references, selected regressions, and equality of protected text. Editorial review verifies the meaning and completeness of translations and summaries.

## GitHub Pages

The repository includes a deployment workflow at [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

1. Push the repository to GitHub with a `main` branch.
2. In **Settings → Pages**, select **GitHub Actions** as the deployment source.
3. Push a change to `main` or run the **GitHub Pages** workflow manually.

The workflow runs tests and validation, builds the website, and publishes the generated `site/` directory. It obtains the repository base path from the Pages configuration. Relative links and assets support both root hosting and project-site URLs.

For a local build with a repository prefix, set `PAGES_BASE_PATH` before generation. For example, in PowerShell:

```powershell
$env:PAGES_BASE_PATH = '/Bloodpals/'
npm run build
npm run preview
```

## Sources and attribution

BLOODPALS is an unofficial community project for Blood on the Clocktower.

- [Official character wiki](https://wiki.bloodontheclocktower.com/Main_Page)
- [Official Script Tool](https://script.bloodontheclocktower.com/)
- [Blood on the Clocktower](https://bloodontheclocktower.com/)

Character artwork is generated with AI and reviewed for use in the interface. Its provenance and official visual references are recorded in `content/reviews/character-ai-artwork-sources.json`; character records identify these assets with `iconKind` and retain their reference URL in `iconSource`.

The project's name, visual presentation, and editorial records distinguish the community website from the original game and its official resources.
