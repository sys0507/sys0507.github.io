# sys0507.github.io

Personal site of Miao Li, Ph.D. — research-developer portfolio, publications, CV, and a notebook for articles and short videos.

Plain Jekyll, built by GitHub Pages itself. No Node, no GitHub Actions, no theme gem. Everything you edit day to day is Markdown or YAML.

---

## Publish it (once)

1. Create a **public** repository named exactly `sys0507.github.io`.
2. Upload the contents of this folder to the repository root (drag-and-drop in the GitHub web UI works) and commit to `main`.
3. Go to **Settings → Pages**, set *Source* to **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. After a minute the site is live at `https://sys0507.github.io`.
5. Optional but recommended: add the site to [Google Search Console](https://search.google.com/search-console), paste the verification token into `google_site_verification` in `_config.yml`, and submit `https://sys0507.github.io/sitemap.xml`.

Custom domain later? Add it under Settings → Pages and change `url` in `_config.yml`.

---

## Everyday edits

| I want to… | Edit |
|---|---|
| Post an article | add `_posts/YYYY-MM-DD-short-title.md` with `format: article` |
| Post a video | add `_posts/YYYY-MM-DD-short-title.md` with `format: video` and `video.youtube` |
| Post a quick note | add `_posts/YYYY-MM-DD-short-title.md` with `format: note` |
| Add a paper | add a block at the top of `_data/publications.yml` and a graphic in `assets/img/pubs/` |
| Add a project | add `_projects/my-project.md` and a cover in `assets/img/projects/` |
| Update the CV PDF | replace `assets/cv/Miao_Li_CV.pdf` (keep the file name) |
| Change jobs, education, skills | `_data/experience.yml`, `_data/education.yml`, `_data/skills.yml` |
| Change links, email, bio note | `_config.yml` |
| Change Fig. 0 on the home page | `_data/fig0.yml` |

Counts on the home page (papers, first-author papers, projects, posts) update themselves.

### A new post

```markdown
---
title: "What a UMAP can and can't tell you"
description: "One or two sentences. Shown in lists and in search results."
format: article          # article | video | note
tags: [single-cell, visualization]
math: true               # only if the post has equations
---

Your text in Markdown.

Inline math: $$e^{i\pi} + 1 = 0$$ (double dollars, inline).

Display math on its own lines:

$$
p = \Pr(T \ge t_{\text{obs}} \mid H_0)
$$
```

Code blocks with a language (```python) are syntax-highlighted automatically.

### A video post

```yaml
format: video
video:
  youtube: "a1B2c3D4e5F"   # the part after watch?v=
  # bilibili: "BV1xx411c7mD"  # or a Bilibili BV id instead
  duration: "1:30"
  caption: "Script and notes below."
```

Prefer YouTube or Bilibili for hosting; GitHub repos aren't meant for video files. For a short self-hosted clip use `video.src: /assets/video/clip.mp4` (keep it under ~20 MB) and optionally `video.poster` and `video.captions` (a `.vtt` file). Put the script or key points in the body: it helps viewers, accessibility, and search.

Posts dated in the future are not published until that date.

### A new paper

Copy an existing block in `_data/publications.yml`. The fields that matter:

- `role`: `first`, `co-first`, or `contributing` — drives the "First or co-first author" filter and badge.
- `topics`: `cell-therapy` and/or `imaging` — drive the other filters. To add a topic, add a button in `publications/index.html` with the same `data-filter` value.
- `kind`: `article`, `review`, or `perspective`.
- `selected: true` shows it on the home page (keep 3–4 selected).
- `summary`: one or two plain-English sentences. This is what recruiters and non-specialists read.

"Copy BibTeX" fetches a full citation from Crossref using the DOI, so you never type BibTeX by hand.

### Abstract graphics

The 13 paper graphics and 3 project covers are original SVG schematics drawn in one visual style, so they can be published without copyright concerns. Two ways to add one for a new paper:

1. **Your own schematic.** Export a 16:10 image (e.g. 1280×800 PNG or an SVG) from BioRender, Illustrator, or PowerPoint into `assets/img/pubs/`. BioRender figures need a publication license for use on a website.
2. **The published graphical abstract.** Only for open-access papers under CC BY (for example STTT, Frontiers, Nature Biotechnology, Cancers here). Add a credit line to the paper's `summary`, e.g. "Graphical abstract from Li et al., *Signal Transduct Target Ther* 2026, CC BY 4.0." Don't use figures from subscription papers (Cell, Med, JPCB, ACS Nano, Nano Letters) without the publisher's permission.

### A new project

```markdown
---
title: "Project name"
description: "One sentence for search results."
lede: "One or two sentences shown on cards and at the top of the page."
order: 5                 # position in lists
channel: code            # research | code | merge
period: "2026"
role: "What you did"
stack: [Python, PyTorch]
cover: /assets/img/projects/my-project.png
cover_alt: "Describe what the image shows."
repo: "https://github.com/…"      # optional
paper: "https://doi.org/…"         # optional
demo: "https://…"                  # optional
outcomes:                          # optional, up to 3 shown on cards
  - value: "35%"
    label: "validated hit rate"
---

## The problem
## What I built
## Results
```

The home page shows the first three projects by `order`.

---

## Preview locally (optional)

```bash
gem install bundler
bundle install
bundle exec jekyll serve      # open http://localhost:4000
```

---

## Design notes

See `docs/THEME.md` for the colour tokens, type, and the reasoning behind "Two Channels". Colours live at the top of `assets/css/main.css`. The site is light-only by design: a soft mist background that stays the same whatever the visitor's system theme.

## Before going live, check

- `author.email` in `_config.yml`: a personal address is usually better than a work address on a public site.
- `assets/cv/Miao_Li_CV.pdf` contains your phone number; consider a web version without it.
- Internal work (the NGS assistant) is described at architecture level only; confirm this matches your employer's policy on external communications.
- The three starter posts are drafts in your voice. Edit or delete them freely.
