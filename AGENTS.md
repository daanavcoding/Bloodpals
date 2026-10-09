# Contributor Guide for Coding Agents

## Project overview

BLOODPALS is a mobile-first reference website for custom Blood on the Clocktower scripts. Players browse scripts and open concise Spanish character guides during a game.

The current implementation uses semantic HTML, CSS, browser JavaScript, and a small Node.js generator. Reviewed JSON content produces complete pages in `site/`, with direct navigation and reliable reloads on static hosting.

Build on the existing implementation. Architecture, tooling, features, and integrations can evolve to meet project needs.

## Repository layout

| Path | Purpose |
| --- | --- |
| `content/scripts/` | Script metadata, ordered inventories, notes, setup tables, and night instructions |
| `content/characters/` | Character identities, Spanish abilities, artwork, and source references |
| `content/curated/` | Translated input, contextual filtering decisions, and final guides |
| `content/reviews/` | Extraction, editorial review, correction history, and artwork provenance |
| `content/glossary.es.json` | Shared terminology |
| `templates/` | Page templates |
| `assets/` | Styles, browser behavior, fonts, and images |
| `tools/` | Content loading, validation, generation, and preview |
| `tests/` | Validation and regression tests |
| `fixtures/development/` | Fictional development examples |
| `inputs/` | Source documents used during preparation |
| `site/` | Generated website |
| `.github/workflows/pages.yml` | GitHub Pages build and deployment |

## Development workflow

1. Read relevant source files and existing changes before editing.
2. Implement the requested change while preserving unrelated work and established behavior.
3. Update documentation and review records affected by the change.
4. Run appropriate checks. For content or generator changes, use:

   ```sh
   npm test
   npm run validate
   npm run build
   ```

5. Inspect the generated result and report the outcome, verification performed, and unresolved issues.

Keep implementation choices proportionate to the problem. Prefer clear data structures, reusable existing tools, and focused changes. Describe completed work briefly and distinguish source review, automated checks, browser testing, and deployment evidence.

## Content preparation

Use the [official wiki](https://wiki.bloodontheclocktower.com/Main_Page) as the primary reference for game rules and strategy. The [official Script Tool](https://script.bloodontheclocktower.com/) provides additional script and presentation context. Record supplementary references with the statements they support.

`Anonymous Cult Dishonesty` is the existing editorial reference for Spanish names, terminology, presentation, and synthesis. Recheck source references when reusing material and adapt contextual filtering to the new inventory.

For each script:

1. Inspect every page of the source image or PDF.
2. Extract its title, author, version, categories, character order, and relevant notes.
3. Match characters to stable IDs and confirm the inventory and category counts.
4. Read each character's current official page, including its relevant sections.
5. Record source URLs, revisions or permanent links, consultation dates, section coverage, and review status.
6. Translate into natural, accessible Spanish and resolve unclear wording against the sources.
7. Filter context-dependent material against the script inventory.
8. Prepare the final synthesis and review its meaning and coverage.
9. Validate, generate, and inspect the player-facing HTML.

Use `pending` to identify unresolved text, uncertain character matches, or material whose provenance needs review. Record issues precisely so that work on other content can continue.

### Section mapping

Player-facing sections retain their Spanish labels and appear in this order:

| Source | Display label | Editorial treatment |
| --- | --- | --- |
| Summary | Resumen | Faithful ability text followed by concise explanations |
| Tips & Tricks | Trucos | Contextual filtering and concise strategy synthesis |
| Examples | Ejemplos | Faithful translation of applicable examples |
| Bluffing as the character | Farolear | Contextual filtering and concise bluffing synthesis |
| How to Run | Cómo funciona para el narrador | Complete translated procedure |

Keep section provenance explicit. An absent section has an absence record; an empty filtered section has documented omission decisions. Render headings for sections with content.

### Translation and contextual filtering

Preserve actors, targets, timing, quantities, conditions, exceptions, negations, and degree of certainty. Use consistent terminology for character type and alignment, death and execution, nomination and voting, drunkenness and poisoning, and initial, nightly, or once-per-game abilities.

Evaluate complete ideas rather than isolated names. For strategy, examples, and bluffing:

- Retain material that applies independently of absent characters.
- Remove an absent-character clause when the remaining idea is understandable and accurate.
- Retain present members of equivalent-character lists and adjust the wording accordingly.
- Omit a dependent unit when removing its absent character would break its reasoning or example.
- Preserve general advice, including advice that mentions no specific character.

Summary and storyteller procedures retain the rules and exceptions needed to explain the character. A script inventory describes available characters; a particular game's character composition is a separate matter.

Review visible night instructions, setup notes, and tables alongside character guides. Abbreviations should retain the actor, target restrictions, timing, and activation conditions. Keep the supplied script's identity and order traceable to its source document.

### Resolving ambiguity

Compare unclear wording with the ability, Summary, and How to Run on the same page. Consult the glossary, rulebook, or another relevant official character page when an applicable exception needs clarification.

Pay particular attention to:

- A real character change versus a change in the character a player claims to be.
- A bluff that pretends to gain an ability versus actually gaining that ability.
- Being the Drunk character versus being affected by drunkenness.
- Choosing a character versus choosing a player.
- Death versus execution, including execution that causes no death.
- Living-player counts before and after a death.
- Deductions that depend on functioning abilities, expected player counts, or effects that prevent death.

Apply supported clarifications to the translated input before synthesis. Record the previous text, correction, reason, source section, and supplementary references. Keep clarification focused on the meaning of the source rather than extending it into new strategic advice.

## Synthesis and editorial review

The preparation sequence is:

**Read and understand the sources → translate → filter by script → fix the reviewed input → synthesize → compare meaning and coverage → render.**

The visible guide should be meaningfully shorter and easier to consult than a long translation. Condense explanations in Summary, Tips, and Bluffing while retaining distinct ideas, strategic options, benefits, risks, conditions, and exceptions. Combining unchanged paragraphs into fewer bullets is grouping rather than substantive synthesis.

Bring opposing strategies together in one point within their original section. Present both as options, with the source's reasons and cautions: reveal or remain hidden, survive or seek death, act early or wait. Keep the choice open when the source does. Preserve concise units unchanged where a rewrite adds little value or loses detail.

Use the translated and filtered material as the synthesis input. Keep the ability sentence, applicable Examples, and storyteller procedure identical to that fixed input during synthesis. Corrections to those texts belong to the preceding translation review and receive their own records.

Measure reduction after editing when useful; choose length according to semantic coverage rather than a fixed percentage or bullet count.

### Data and traceability

The existing format uses:

- `reviewUnits`: translated input with `section`, `sourceUnit`, `mentionedCharacterIds`, `requiredCharacterIds`, `decision`, `reason`, and applicable `textEs`.
- `displaySections`: final blocks with `textEs` and supporting `sourceUnits`.
- `synthesisReview`: section-level review status, `unchanged` or `condensed`, consultation date, and rationale.

Retain a verifiable version of the input, such as a reviewed snapshot or hash. When an idea moves to another block in the same section, its supporting reference moves with it.

Review in both directions: each output statement has support in the input, and every distinct retained input idea remains represented. A unit ID establishes a reference; editorial comparison establishes whether its meaning survived.

Keep difference reports aligned with current data and generated HTML. Separate translation corrections from synthesis changes, and identify earlier audits as historical records with links to their resolution.

Automated validation checks structure, references, dependency decisions, and equality of protected sections. Semantic review checks meaning, causality, and completeness. Report these as distinct forms of evidence.

## Interface and accessibility

The visual identity combines the BLOODPALS logo, Gamepals attribution, dark fantasy styling, and readable parchment panels. Existing character images are reviewed AI-generated WebP artwork, with provenance in `content/reviews/character-ai-artwork-sources.json`.

Design for available screen space, readable typography, clear hierarchy, sufficient contrast, and touch targets of at least 44 × 44 pixels. Maintain Spanish language metadata, UTF-8, a responsive viewport, zoom support, and safe spacing around mobile browser controls.

Character dialogs support an accessible close control, Escape, browser history, focus restoration, and restoration of the script's scroll position. Swipe dismissal should coexist with vertical reading, zooming, and text selection. Progressive enhancement provides usable content when JavaScript, dialog support, images, or visual effects are unavailable.

For interface work, inspect narrow layouts, desktop layouts, landscape orientation, long text, keyboard navigation, reduced motion, and enlarged text. Existing coverage targets include 320, 360, 390, 430, 768, 1280, and 1440 pixels. Identify emulation and physical-device testing accurately in the completion report.

## Verification and release

For content changes, compare the rendered ability and all display sections with reviewed data, including dialog templates and the HTML reading fallback. Exercise relevant regressions such as death versus execution, Demon succession, character versus player selection, bluffing versus real abilities, and applicable character exceptions.

For generator and interface changes, verify direct routes, reloads, relative assets, repository-prefix hosting, and the reading flow. Adapt tests to accept equivalent wording when exact text equality is not part of the data contract.

The existing GitHub Pages workflow runs tests, validation, and generation before uploading `site/`. Configure Pages to use GitHub Actions. Verify the deployed homepage, a direct script URL, a reload, and a character guide when reporting a release.

Keep public documentation current with the implementation and use repository-relative paths in project files. Present BLOODPALS as a community project and keep attribution and artwork provenance clear.
