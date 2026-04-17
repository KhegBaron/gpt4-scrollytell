# The 90th Percentile That Wasn't

An interactive data essay on OpenAI's misleading 90th-percentile claim for GPT-4's bar exam performance.
Built for Dartmouth's Sociology 77 (Numbers, AI, and Society), Assignment 1.

---

## What's in here

```
gpt4-scrollytell/
├── index.html      The page structure + content
├── styles.css      All visual design (editorial data-journalism aesthetic)
├── script.js       D3.js visualization + scroll-triggered interactions
└── README.md       This file
```

Three files, no build step, no npm, no dependencies beyond D3 (loaded from CDN) and two Google Fonts.

---

## How to run it

### Option 1 — VS Code + Live Server (recommended)

1. Open the `gpt4-scrollytell` folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey) if you don't already have it.
3. Right-click `index.html` and choose **"Open with Live Server"**.
4. The page will open in your default browser at `http://127.0.0.1:5500` (or similar). Any edits auto-reload.

### Option 2 — Double-click

Just open `index.html` directly in Chrome, Firefox, or Safari. Everything works locally (the only external calls are to Google Fonts and the D3 CDN).

### Option 3 — Python one-liner

From the folder in a terminal:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

---

## What to show your professor

Scroll slowly through **Act II — The Reanalysis**. This is the centerpiece:

- The D3 chart is *sticky* on the left while text steps scroll past on the right.
- Each step triggers a transition: the distribution reshapes, the percentile number animates, the title updates.
- The narrative arc: 90th percentile → but against whom? → 62nd against first-timers → 48th against qualified attorneys.

Other moments worth highlighting:

- **Act I** — the `90th` number counts up from 0 on scroll-in.
- **Act V** — three side-by-side studied-vs-claimed comparison columns reveal on scroll.
- **Act VI** — three sociological-frame cards tying the case to Porter, Durkheim, and Kasy (all from your course's reading list).
- **Finale** — dark closing section that previews Assignments 2 and 3.

---

## Technical notes

- **D3 v7** loaded from CDN. No bundler, no npm.
- **Fonts:** Fraunces (display serif, with variable axes) + IBM Plex Sans + IBM Plex Mono, all from Google Fonts.
- **Scroll triggers:** plain `IntersectionObserver` — no scrollama, no third-party libraries.
- **The distributions** are normal curves tuned so GPT-4's score of 298 yields the target percentile at each step. The parameters (mean, sd) are chosen to match the real percentile findings from Martínez (2024).

### Key data sources

- OpenAI. (2023). *GPT-4 Technical Report.* (For the 90th-percentile claim.)
- Martínez, E. (2024). "Re-evaluating GPT-4's bar exam performance." *Artificial Intelligence and Law.* (For the reanalysis figures: ~68th percentile against July takers, ~62nd against first-time takers, ~48th against those who passed.)
- Illinois Board of Admissions to the Bar (2019, 2023) — pass-rate data for first-timers vs. repeaters.

---

## Editing

The three files are independent and readable:

- To change **content / text** → edit `index.html`.
- To change **colors, type, spacing** → edit CSS variables at the top of `styles.css`.
- To change **distribution parameters or add a 5th state** → edit the `STATES` object at the top of `script.js`.

The accent color (`--amber`) is used sparingly and deliberately. If you swap it, keep it saturated enough to punch against the cream background.

---

*Sociology 77 · Assignment 1 Showcase · Spring 2026*
