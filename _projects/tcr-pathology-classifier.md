---
title: "TCR Pathology Classifier"
description: "A fine-tuned ESM2 protein language model that prioritizes disease-reactive T-cell receptors from sequence; 35% of model-picked clones validated in the lab."
lede: "A protein language model that ranks T-cell receptors by the disease they likely recognize, so the lab screens a short list instead of a whole repertoire."
order: 2
channel: merge
period: "Sep 2025 – Mar 2026"
role: "Built it end to end: data, modeling, deployment, and validation"
keywords: [Transformer, TCR Discovery, NGS]
stack: [PyTorch, ESM2, Hugging Face, Flask, pandas, scikit-learn]
cover: /assets/img/projects/tcr-classifier.png
cover_alt: "Hand-drawn graphic: 6,737 clones go into a fine-tuned ESM2 model with alpha/beta cross-attention, and 11 of 31 selected clones are confirmed, a 35% hit rate; repertoire to shortlist drops from 8 weeks to 10 days."
cover_caption: "From 6,737 clones to a 35% validated hit rate."
thumb: /assets/img/projects/tcr-classifier-thumb.webp
thumb_alt: "Project card graphic: TRA and TRB CDR3 sequences and V genes pass through fine-tuned ESM2 to rank disease-reactive TCR candidates, with 11 of 31 confirmed in a MART-1 proof of concept."
repo: "https://github.com/sys0507/TCR-Pathology-Classifier"
demo: "https://huggingface.co/sys0507/tcr-pathology-classifier"
demo_label: "Model on Hugging Face"
video:
  src: /assets/video/TCR-Pathology-Classifier-explainer.mp4
  caption: "An introduction to the TCR Pathology Classifier."
outcomes:
  - value: "35%"
    label: "validated hit rate among model-prioritized clones (11 of 31)"
  - value: "~10×"
    label: "smaller search space, from ~7,000 clones to 572"
  - value: "8 wk → 10 d"
    label: "from raw repertoire to a testable shortlist"
---

## Project introduction

{% include video.html video=page.video title=page.title %}

## The problem

Disease-reactive T-cell receptors are rare — some of the clones we care about sit at 0.0002% of a repertoire. Finding them the classic way takes about eight weeks of antigen-driven enrichment before anything reaches a functional assay.

## Approach

I asked whether sequence alone could tell us where to look first.

- **Data.** Paired α/β TCRs with pathology labels from the curated McPAS-TCR database, cleaned and split 70/15/15, with attention to class imbalance.
- **Model.** Paired TRA and TRB CDR3 sequences are embedded with ESM2 (650M parameters), fine-tuned end to end, combined through cross-attention, and fused with learned V-gene embeddings before a classifier head.
- **Comparison.** I benchmarked three designs — frozen embeddings with an MLP, a binary reactive/non-reactive model, and the fine-tuned model — and kept the fine-tuned one as the best performer.
- **Delivery.** A Flask web app for point-and-click inference, with model weights on Hugging Face.

## Validation at the bench

In a proof of concept, a 6,737-clone repertoire from a healthy donor was stimulated with the MART-1 melanoma antigen. The model narrowed it to 572 melanoma-associated candidates. We advanced 31 to functional testing and **11 were confirmed MART-1-reactive** — a 35% hit rate, including clones at 0.0002% frequency — and the time from raw repertoire to shortlist fell from about eight weeks to ten days.

## What's next

Extending the classifier toward open-set TCR–peptide–MHC ranking with bidirectional cross-attention and a contrastive objective, so the model can score antigens it has never seen.
