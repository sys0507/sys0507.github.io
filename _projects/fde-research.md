---
title: "FDE Research"
description: "Nine agent skills behind one entry that turn a vague enterprise AI request into research findings, a business proposal, a technical design and a delivery plan with quotation."
lede: "Nine agent skills behind one entry point that turn a vague enterprise AI request into a project plan you can defend: evidence first, human sign-off last."
order: 4
channel: code
period: "2026"
role: "Author and maintainer"
keywords: [Enterprise AI]
stack: [Agent Skills, Claude Code, Python, Markdown]
status: "Public on GitHub. All rights reserved; no open-source license is granted."
cover: /assets/img/projects/fde-research.png
cover_alt: "Hand-drawn graphic: Sentence to plan. Nine agent skills behind the /fde-research entry run from discovery, baseline and diagnosis through AI scenarios, an optional prototype, business proposal and readiness check to architecture and quotation, with human sign-off gates, a loop that sends conflicts back, and four deliverables produced from one vague sentence."
cover_caption: "Sentence to plan: nine skills, human sign-off gates, and conflicts that flow back instead of being cut."
thumb: /assets/img/projects/fde-research-thumb.webp
thumb_alt: "Project card graphic: an open binder of research findings, AI scenarios and technical architecture beside interviews, documents and process data, with tabs for research findings, AI business proposal, technical design, and delivery plan and quotation."
repo: "https://github.com/sys0507/fde-research"
video:
  src: /assets/video/FDE-Research-explainer.mp4
  caption: "An introduction to FDE Research."
outcomes:
  - value: "9"
    label: "specialist skills behind one /fde-research entry"
  - value: "4"
    label: "deliverables: findings, proposal, technical design, delivery plan and quotation"
  - value: "Human"
    label: "the agent drafts and checks; a person signs off"
---

## Project introduction

{% include video.html video=page.video title=page.title %}

## Why

Most enterprise AI projects start as one vague sentence, something like "use AI to speed up our NGS work". The expensive mistakes come next: a proposal built on a baseline nobody measured, a design that assumes data nobody has seen, a quote that quietly drops scope. I wanted a way to go from that sentence to a plan a business, a technical team and a finance lead can all review, without inventing numbers along the way.

## What it is

A package of nine agent skills for the period before implementation, plus one routing entry, `/fde-research`, that works out where a project stands and resumes from there. The entry is a router, not a tenth stage.

- **Investigate.** Discovery, baseline analysis and business diagnosis turn interviews, documents and process data into a scoped current state, a computed baseline and candidate opportunities.
- **Define and show.** AI scenario design writes before-and-after scenarios; an optional prototype makes the best one tangible.
- **Align and check.** A business proposal sets the scope and responsibilities, and an implementation-readiness check tests it against six dimensions of real conditions.
- **Design and quote.** Technical architecture produces the design and diagrams, and delivery planning produces the schedule, acceptance criteria and quotation.

Used end to end, it yields research findings, an AI business proposal, a technical design and a delivery plan with quotation.

## Design choices

- **Evidence first.** Every number traces back to its source, and a gap stays "not measured" rather than being filled with a plausible guess.
- **Humans sign off.** The agent drafts and checks. Generated, verified and business-confirmed are kept as separate states, and only a person confirms.
- **Conflicts flow back.** If time or budget clash with scope, the affected proposal or design is revisited. Scope is never silently reduced.
- **Use one skill or the full chain.** Each skill accepts equivalent inputs, so you can run just the baseline analysis or just the quotation, and one project's materials never leak into the package.
