---
title: "Attention, explained with T-cell receptors"
description: "The one equation behind transformers, walked through with a CDR3 sequence instead of a sentence — and why it matters for protein language models."
format: article
tags: [machine learning, transformers, immunology]
math: true
---

Most introductions to transformers use a sentence like “the cat sat on the mat.” Biologists already have a better example in their freezers: the CDR3 loop of a T-cell receptor. It's a short string of amino acids, and whether it binds an antigen depends on how its residues relate to one another. That is exactly the problem attention was built for.

## The question attention answers

Take the CDR3β sequence `CASSLGQAYEQYF`. To understand the role of the glycine in the middle, a model has to look at its neighbors, and sometimes at residues much farther away that sit next to it in the folded loop. Attention lets every position ask: *which other positions should I listen to, and how much?*

Each residue is first turned into a vector of numbers, its embedding. From that embedding the model makes three new vectors with three learned weight matrices:

- a **query** $$q$$ — what this residue is looking for,
- a **key** $$k$$ — what this residue offers to others,
- a **value** $$v$$ — the information it passes along if someone listens.

## The equation

Stack the queries, keys, and values for all residues into matrices $$Q$$, $$K$$, and $$V$$. Then

$$
\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right) V
$$

Read it from the inside out:

1. $$QK^{\top}$$ scores every pair of residues: how well does the query of residue $$i$$ match the key of residue $$j$$?
2. Dividing by $$\sqrt{d_k}$$, where $$d_k$$ is the key dimension, keeps those scores from growing so large that the softmax saturates.
3. The softmax turns each row of scores into weights that are positive and sum to one — an attention map.
4. Multiplying by $$V$$ gives each residue a new representation: a weighted blend of what the other residues offered.

That's the whole mechanism. A transformer layer runs several of these in parallel (**multi-head attention**), so one head can track charge while another tracks spacing, then mixes the results with a small feed-forward network. Stack a few dozen layers and you have a model that can represent long-range dependencies in a sequence.

## In code

```python
import torch
import torch.nn.functional as F

def attention(q, k, v, mask=None):
    """q, k, v: (batch, length, d_k) tensors."""
    d_k = q.size(-1)
    scores = q @ k.transpose(-2, -1) / d_k ** 0.5   # (batch, L, L)
    if mask is not None:                            # e.g. ignore padding
        scores = scores.masked_fill(mask == 0, float("-inf"))
    weights = F.softmax(scores, dim=-1)             # each row sums to 1
    return weights @ v, weights

# A 13-residue CDR3 with 64-dimensional embeddings
x = torch.randn(1, 13, 64)
W_q, W_k, W_v = (torch.nn.Linear(64, 64, bias=False) for _ in range(3))
out, attn_map = attention(W_q(x), W_k(x), W_v(x))
print(out.shape, attn_map.shape)   # torch.Size([1, 13, 64]) torch.Size([1, 13, 13])
```

The `attn_map` is a 13 × 13 matrix: one row per residue, showing where it looked. Plotted as a heatmap, it's the closest thing a transformer has to a figure you can inspect.

## Why order still matters

Attention on its own is blind to position: shuffle the residues and the scores are the same. Transformers add positional information to fix this. Protein language models such as ESM-2 use rotary position embeddings, which rotate queries and keys by an angle that depends on position, so the dot product between two residues also encodes how far apart they are.

## From one sequence to two chains

A TCR has two chains, α and β, and both help decide what it binds. In **self-attention**, queries, keys, and values all come from the same sequence. In **cross-attention**, the queries come from one sequence and the keys and values from another. Let the β-chain residues query the α-chain residues and the model can learn pairing effects that neither chain shows alone. That's the idea behind the paired-chain design in my [TCR Pathology Classifier](/projects/tcr-pathology-classifier/).

## Why pre-training helps

Labeled TCR–antigen pairs are scarce. Protein language models get around this by first learning from millions of unlabeled protein sequences with a simple game: hide some residues and predict them from the rest. To win, the model has to absorb a lot of biochemistry. Fine-tuning then adapts those representations to a small labeled task, which is why a model can rank TCRs usefully even when the labeled data is thin.

## Three things to remember

- Attention is a learned, data-dependent weighted average: each position decides whom to listen to.
- The $$\sqrt{d_k}$$ scaling and the softmax are there to keep that average well behaved.
- Self-attention relates residues within a chain; cross-attention relates two chains, or a receptor and its antigen.

*If you'd like a follow-up on reading attention maps without over-interpreting them, let me know.*
