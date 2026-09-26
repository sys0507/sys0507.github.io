---
title: "NGS Intelligent Workflow Assistant"
description: "An AI agent that lets bench scientists run TCR and antibody sequencing pipelines on a SLURM cluster through natural-language chat."
lede: "An AI agent that lets bench scientists run TCR and antibody sequencing pipelines on a shared HPC cluster by describing what they need in plain language."
order: 1
channel: code
period: "Mar – Aug 2026"
role: "Architect and lead developer"
stack: [Claude Agent SDK, MCP, TypeScript, React, Node.js, SLURM, HPC]
status: "In use internally at AstraZeneca. Code and data are not public."
cover: /assets/img/projects/ngs-agent.svg
cover_alt: "Architecture: a scientist chats with the agent, which calls pipeline tools over MCP, waits for human approval, submits SLURM jobs, and returns results to a per-user sandbox with an audit log."
cover_caption: "Architecture at a glance. Every job waits for a human approval before it reaches the cluster."
outcomes:
  - value: "< 5 min"
    label: "from request to submitted job, no command line"
  - value: "Audited"
    label: "every run reproducible and traceable by default"
  - value: "Skills"
    label: "new analyses plug in as skills, not rewrites"
---

## The problem

Our discovery teams generate T-cell receptor and antibody sequencing data every week. Turning those FASTQ files into answers meant command-line tools, hand-edited scripts, and a multi-step setup on the HPC cluster, so nearly every analysis went through a small bioinformatics team. The queue, not the science, set the pace.

## What I built

A conversational agent that runs our existing, validated pipelines on the shared SLURM cluster. A scientist describes what they sequenced; the agent asks for anything missing, assembles the parameters, shows the exact job for approval, submits it, tracks it, and then opens a private sandbox for follow-up plots and tables.

- **Agent layer.** Built on the Claude Agent SDK, with pipeline operations exposed as tools over the Model Context Protocol and a TypeScript/React/Node front end.
- **Pipelines as skills.** Each analysis — 10x and Smart-seq TCR sequencing, antibody scFv/Fab/VHH discovery on Illumina and PacBio, and clonal repertoire analysis — is packaged as a skill with its own parameter schema. A new assay is a new skill, not a rewrite.
- **Guardrails.** Human approval before anything touches the cluster, per-user identity isolation, and an audit log of every request, parameter, and job.
- **Process.** Delivered spec-first and test-first (PRD, spec, plan, tasks), with independent code review, and validated against real SLURM runs.

## What changed

Scientists submit jobs in under five minutes without opening a terminal, runs are reproducible and traceable by default, and the architecture is designed so new analyses can be added as skills. The bioinformatics team spends less time running jobs and more time on the questions only they can answer.

## What I learned

The hard part of an agent for scientists isn't the model; it's deciding where the agent must stop and ask. Putting the approval gate in front of the cluster, rather than around every step, kept the conversation fast and the compute safe.
