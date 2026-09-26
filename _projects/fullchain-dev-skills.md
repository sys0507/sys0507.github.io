---
title: "Full-Chain Development Skills"
description: "Twenty-one open-source agent skills that take a software project from idea to release through eleven gated stages."
lede: "Twenty-one open-source agent skills that walk a project from idea to release — research, PRD, spec, design, test-driven build, and retrospective — with real stop points."
order: 3
channel: code
period: "2026"
role: "Author and maintainer"
stack: [Agent Skills, Claude Code, Python, MCP, Markdown]
cover: /assets/img/projects/fullchain-skills.svg
cover_alt: "A ring of eleven development stages from research to release, with gates marked where the workflow stops for a decision."
cover_caption: "Eleven stages; the bars mark gates where the chain stops and waits for a person."
repo: "https://github.com/sys0507/FullChain-Dev-Skills-EN"
video:
  src: /assets/video/FullChain-Dev-Skills.mp4
  caption: "An introduction to Full-Chain Development Skills."
outcomes:
  - value: "21"
    label: "skills covering 11 stages of development"
  - value: "11"
    label: "structural checks, each with its own tests"
  - value: "MIT"
    label: "licensed, usable chained or one at a time"
---

## Project introduction

{% include video.html video=page.video title=page.title %}

## Why

Coding agents are fast, but the expensive mistakes happen before any code is written: the wrong scope, a spec nobody agreed on, an assumption nobody tested. I wanted a way of working where an agent moves quickly inside each stage and stops where changing your mind later is costly.

## What it is

A library of reusable agent skills, one per stage, from a project ledger and kickoff research through adversarial architecture selection, MVP convergence, the PRD, a four-step spec pipeline, interface design, project context, test-driven implementation, testing, retrospective, and release packaging. A thin orchestrator skill works out the next stage and keeps a record of where the project stands.

## Design choices

- **Every skill also works alone.** Each upstream artifact has a "provide it directly" path, so you can use just the PRD writer or just the test router.
- **Gates are real stops.** Where a stage is gated, the skill says what it's waiting for and waits.
- **Honest labelling.** When a skill falls back, its output says what wasn't covered. A report with "unverified" in it beats one that looks green and isn't.
- **Safe installs.** The installer is idempotent, reports customized skills instead of overwriting them, and keeps English and Chinese editions strictly separate.
