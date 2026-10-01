---
title: "CAR-T vs. CAR-NKT in solid tumors"
description: "Spatiotemporal single-cell profiling of CAR-T and stem cell-derived CAR-NKT cells in solid tumors, published in Signal Transduction and Targeted Therapy (2026)."
lede: "Following two cell therapies through tissues and time to learn why one of them does better in solid tumors — and which checkpoint each one needs."
order: 4
channel: merge
period: "2022 – 2026"
role: "Co-first author; led the single-cell and transcriptomic analyses"
stack: [scRNA-seq, scTCR-seq, Seurat, Scanpy, R, Python]
cover: /assets/img/projects/car-t-car-nkt.png
cover_width: 1536
cover_height: 1024
cover_alt: "Hand-drawn graphic: single-cell and TCR profiling of 274,878 cells and over 3,200 receptor-ligand pairs follows PBMC-derived CAR-T and stem cell-derived CAR-NKT cells into MSLN-targeted solid tumors. CAR-T cells are held back by TIGIT-CD112 and pair with anti-TIGIT; CAR-NKT cells home better, persist longer, are held back by CD96-CD155, and pair with anti-CD96. Each cell therapy gets its own checkpoint partner."
cover_caption: "Cells to checkpoints: single-cell discovery on the left, the matched checkpoint partner for each cell product on the right."
paper: "https://www.nature.com/articles/s41392-026-02602-x"
outcomes:
  - value: "Homing"
    label: "CAR-NKT cells infiltrated and localized in tumors better"
  - value: "Persistence"
    label: "CAR-NKT cells lasted longer in vivo"
  - value: "TIGIT vs CD96"
    label: "a different checkpoint partner for each product"
---

## The question

CAR-T cells transform some blood cancers but struggle in solid tumors, where they infiltrate poorly and meet a hostile microenvironment. Invariant NKT cells home to tissues naturally and can reshape that environment, which makes allogeneic, stem cell-derived CAR-NKT cells an attractive alternative. We wanted to know how the two actually behave inside the body.

## What I did

I led the single-cell RNA and TCR sequencing analyses, profiling conventional CAR-T cells and IL-15-enhanced CAR-NKT cells across multiple tissues and time points in solid-tumor models: where each product goes, how long it stays, and which gene programs and checkpoint receptors it switches on inside tumors.

## What we found

The two products had distinct pharmacokinetic, pharmacodynamic, and immunoregulatory profiles. CAR-NKT cells homed to, infiltrated, and localized within tumors better and persisted longer, with their own checkpoint-receptor landscape. That landscape pointed to different combinations: CAR-T cells worked synergistically with TIGIT blockade, while CAR-NKT cells were more sensitive to CD96 blockade.

## Why it matters

Cell therapies are not interchangeable, and neither are their combination partners. Profiling them in space and time gives a rational way to pair each product with the checkpoint therapy most likely to help it.
