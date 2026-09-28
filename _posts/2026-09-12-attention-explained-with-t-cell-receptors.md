---
title: "What is a Transformer? A visual guide, told with one T-cell receptor"
description: "A 10-minute narrated video and an illustrated walkthrough: tokens and positions, query, key and value, the attention formula step by step, multi-head attention, the Transformer block, ESM-2 guessing a hidden residue, and a Transformer hand-built in NumPy, all told with one CDR3β sequence."
format: video
tags: [machine learning, transformers, immunology, explainer]
math: true
video:
  src: /assets/video/what-is-a-transformer.mp4
  poster: /assets/img/notebook/transformer/poster.jpg
  duration: "9:47"
  caption: "Narrated, with captions. The full illustrated walkthrough and runnable code are below."
---

> **In one sentence:** a Transformer turns a sequence into vectors and, layer by layer, lets every token gather information from every other token through **attention**, then refines each token with a small neural network.
>
> $$\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V$$

The video above and the walkthrough below share one running example, thirteen letters long, **CASSIRSSYEQYF**: the CDR3β loop of a public T-cell receptor that recognizes the influenza peptide GILGFVFTL on HLA-A\*02:01 and turns up in many people. The toy numbers come from a tiny hand-built model you can run yourself (section 8). The ESM-2 numbers come from a real protein language model.

## 1. The problem: every letter needs context

The letter S appears four times in CASSIRSSYEQYF, but each S sits among different neighbors (A·S·S, S·S·I, R·S·S, S·S·Y), so each plays a slightly different role. A model has to read every letter *in context*.

Recurrent networks (RNNs) read one letter at a time and pass a running memory down the line. That is slow, because step 13 has to wait for step 12, and forgetful, because by the end the first letters have faded. In 2017, *Attention Is All You Need* (Vaswani et al.) proposed the fix: connect every letter to every other letter directly, and process them all in parallel.

## 2. Letters become vectors that know their position

Each amino acid becomes a **token**, and each token becomes a **vector**, a short list of numbers. Real models learn these numbers (ESM-2 650M uses 1,280 per residue). Our toy uses four that a chemist would recognize: hydropathy (Kyte–Doolittle ÷ 4.5), charge, polarity and aromaticity.

Attention on its own treats a sequence like a bag of letters: shuffle the input and the outputs are merely shuffled too. So we add a **positional encoding** made of sine and cosine waves of different frequencies:

$$PE_{(pos,\,2i)}=\sin\!\left(\frac{pos}{10000^{2i/d}}\right)\qquad PE_{(pos,\,2i+1)}=\cos\!\left(\frac{pos}{10000^{2i/d}}\right)$$

Real models *add* this to the token vector. For readability our toy *stacks* them: 4 chemistry numbers plus 4 position numbers (base 9 instead of 10000, two frequencies) gives 8 numbers per residue.

![Fig. 1. The toy input: one 8-number vector per residue](/assets/img/notebook/transformer/fig1_vectors.png)

*Fig. 1. The toy input: one 8-number vector per residue*
{: .muted}

## 3. Query, key, value

From its vector $$\mathbf{x}$$, every residue makes three new vectors with three learned matrices:

$$\mathbf{q}=\mathbf{x}W_Q \qquad \mathbf{k}=\mathbf{x}W_K \qquad \mathbf{v}=\mathbf{x}W_V$$

The **query** asks "what am I looking for?", the **key** says "what do I offer?", and the **value** is what the residue passes on if someone listens. In our first head, arginine's query says: *I'm looking for a negative partner.* How well a query matches a key is their dot product, which measures alignment.

![Fig. 2. Dot products in a two-dimensional head](/assets/img/notebook/transformer/fig2_qk.png)

*Fig. 2. Dot products in a two-dimensional head*
{: .muted}

## 4. The attention formula, one step at a time

$$\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V$$

Follow arginine (R, position 6) through one head:

1. **Score** its query against every key: glutamate +4, arginine itself −4, everyone else 0.
2. **Scale** by $$\sqrt{d_k}=\sqrt{2}$$: +2.83, −2.83 and 0.
3. **Softmax** turns scores into positive weights that add up to one, $$a_j=e^{s_j}/\sum_k e^{s_k}$$. Glutamate gets **0.605**, each of the other eleven residues 0.036, arginine 0.002. By hand: $$e^{2\sqrt2}/(e^{2\sqrt2}+11+e^{-2\sqrt2})=0.605$$.
4. **Blend** the values with those weights: $$\mathbf{z}_R=\sum_j a_{Rj}\,\mathbf{v}_j=[-0.60,\ 0.25]$$. Arginine's new vector now carries news from glutamate.

![Fig. 3. Arginine's row of attention](/assets/img/notebook/transformer/fig3_steps.png)

*Fig. 3. Arginine's row of attention*
{: .muted}

**Why divide by $$\sqrt{d_k}$$?** In ESM-2 each query and key has $$d_k=64$$ numbers, and dot products grow with dimension. With 13 random 64-number keys, the raw scores spread by about ±6, softmax turns spiky (one key takes 99.8% of the weight) and learning stalls because the gradients vanish. Dividing by $$\sqrt{64}=8$$ keeps the weights spread out (the largest is 33%).

## 5. The attention map and many heads

Every residue does this at the same time. With the queries stacked into $$Q$$ and the keys into $$K$$, a single matrix product $$QK^{\top}$$ gives all $$13\times13=169$$ scores, which is why Transformers train so fast on GPUs. After a softmax on each row, row $$i$$ of the **attention map** shows where residue $$i$$ looks. The price is that the number of pairs grows with the square of the length: a 1,000-residue protein means a million pairs per head, per layer.

One head captures only one kind of relationship, so Transformers run several heads in parallel, each with its own $$W_Q$$, $$W_K$$ and $$W_V$$, then join their outputs side by side and mix them with one more matrix:

$$\mathrm{MultiHead}(X)=\mathrm{Concat}(\mathrm{head}_1,\dots,\mathrm{head}_h)\,W_O$$

![Fig. 4. The four heads of the toy model](/assets/img/notebook/transformer/fig4_heads.png)

*Fig. 4. The four heads of the toy model*
{: .muted}

In our toy, one head pairs charges, one links hydrophobic residues, one looks at the previous residue and one at the next. The four S's entered with identical chemistry and leave as four different vectors, because the last two heads pulled in their different neighbors.

## 6. The Transformer block

Attention is only half of a block. The other half is a small **feed-forward network** applied to each residue on its own: expand, apply a nonlinearity, compress.

$$\mathrm{FFN}(\mathbf{x})=W_2\,\mathrm{GELU}(W_1\mathbf{x}+b_1)+b_2$$

An easy way to remember it: attention lets residues *talk* to each other, the feed-forward network lets each one *think*. Around each half runs a **residual connection** (a shortcut that adds the input back), plus **layer normalization** to keep the numbers stable:

$$\mathbf{x}\leftarrow\mathbf{x}+\mathrm{MHA}(\mathrm{LN}(\mathbf{x}))\qquad\mathbf{x}\leftarrow\mathbf{x}+\mathrm{FFN}(\mathrm{LN}(\mathbf{x}))$$

![Fig. 5. One pre-LayerNorm Transformer block](/assets/img/notebook/transformer/fig5_block.png)

*Fig. 5. One pre-LayerNorm Transformer block*
{: .muted}

Then you stack blocks: ESM-2 650M stacks 33 of them, with 1,280 numbers per residue and 20 heads.

## 7. Three family members, and how they learn

![Fig. 6. Encoder, decoder and cross-attention](/assets/img/notebook/transformer/fig6_family.png)

*Fig. 6. Encoder, decoder and cross-attention*
{: .muted}

An **encoder** lets every residue see the whole sequence; ESM-2 and BERT are encoders, built for understanding. A **decoder** masks the future so that each position can only look back,

$$\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}+M\right)V,\qquad M_{ij}=\begin{cases}0 & j\le i\\ -\infty & j>i\end{cases}$$

which lets it write new sequences one residue at a time, like GPT or generative antibody models. **Cross-attention** connects two sequences: queries from the T-cell receptor, keys and values from the peptide.

How does a protein model learn? With a simple game: hide a residue and guess it. Training minimizes

$$\mathcal{L}=-\log p_\theta(\text{true residue}\mid\text{rest of chain})$$

and backpropagation nudges every weight to do better, across millions of proteins. Here is a real, small model (ESM-2 with 12 layers) reading the whole 131-residue TCRβ chain:

![Fig. 7. ESM-2 guesses a hidden residue](/assets/img/notebook/transformer/fig7_esm.png)

*Fig. 7. ESM-2 guesses a hidden residue*
{: .muted}

It is 98% sure about the cysteine that opens the CDR3 but gives only 3% to the arginine. That is biology, not failure: the cysteine is written in the V gene, while the arginine sits in the junction that V(D)J recombination creates at random.

## 8. Build it in NumPy

Here is everything above in about 100 lines of NumPy: the toy input, attention, four heads, multi-head attention, one full block, and a check against PyTorch's own `TransformerEncoderLayer`.

```python
"""A Transformer, hand-built in NumPy, reading a T-cell receptor CDR3β.
Companion code for the video "What is a Transformer?". Toy model: 8 numbers per residue,
4 hand-set attention heads (d_k = 2). Only NumPy is required; PyTorch is used for an optional check."""
import numpy as np
from math import erf

# 1. Tokens -> vectors ------------------------------------------------------------------
SEQ = "CASSIRSSYEQYF"   # CDR3β of a public flu-specific TCR (binds GILGFVFTL on HLA-A*02:01)
KD = dict(A=1.8, C=2.5, E=-3.5, F=2.8, I=4.5, Q=-3.5, R=-4.5, S=-0.8, Y=-1.3)  # Kyte-Doolittle
CHARGED, POLAR, AROMATIC = dict(R=1, K=1, D=-1, E=-1), set("STNQYH"), set("FWY")

def embed(a):  # 4 "chemistry" numbers per residue; real models learn these instead
    return [round(KD[a] / 4.5, 2), CHARGED.get(a, 0), float(a in POLAR), float(a in AROMATIC)]

def pos_enc(n, d=4, base=9.0):  # sinusoidal positions (the paper uses base 10000, d = d_model)
    pos, i = np.arange(n)[:, None], np.arange(d // 2)[None, :]
    ang = pos / base ** (2 * i / d)
    P = np.zeros((n, d))
    P[:, 0::2], P[:, 1::2] = np.sin(ang), np.cos(ang)
    return P

X = np.hstack([np.array([embed(a) for a in SEQ], float), pos_enc(len(SEQ))])  # 13 x 8

# 2. Attention ---------------------------------------------------------------------------
def softmax(S):
    E = np.exp(S - S.max(-1, keepdims=True))
    return E / E.sum(-1, keepdims=True)

def attention(X, Wq, Wk, Wv):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv       # 1 project
    S = Q @ K.T / np.sqrt(K.shape[-1])     # 2 score every pair, then scale
    A = softmax(S)                         # 3 each row sums to 1
    return A @ V, A                        # 4 blend the values

# 3. Four hand-set heads, d_k = 2 -------------------------------------------------------
HYD, CHG, POL, ARO, P1s, P1c, P2s, P2c = range(8)      # meaning of the 8 input numbers
W = [{m: np.zeros((8, 2)) for m in "QKV"} for _ in range(4)]
W[0]["Q"][CHG, 0], W[0]["Q"][POL, 1] = 2.0, 1.5       # head 1: + looks for -, polar for polar
W[0]["K"][CHG, 0], W[0]["K"][POL, 1] = -2.0, 1.5
W[0]["V"][CHG, 0], W[0]["V"][POL, 1] = 1.0, 1.0
W[1]["Q"][HYD, 0], W[1]["Q"][ARO, 1] = 2.0, 1.5       # head 2: hydrophobic finds hydrophobic
W[1]["K"][HYD, 0], W[1]["K"][ARO, 1] = 2.0, 1.5
W[1]["V"][HYD, 0], W[1]["V"][ARO, 1] = 1.0, 1.0
w, s = 1 / 3, 50.0                                     # heads 3-4: previous / next residue,
for h, d in [(2, -1), (3, +1)]:                        # by rotating the slow position wave
    W[h]["Q"][P2s, 0], W[h]["Q"][P2c, 0] = s * np.cos(w), s * d * np.sin(w)
    W[h]["Q"][P2s, 1], W[h]["Q"][P2c, 1] = -s * d * np.sin(w), s * np.cos(w)
    W[h]["K"][P2s, 0], W[h]["K"][P2c, 1] = 1.0, 1.0
    W[h]["V"][HYD, 0], W[h]["V"][CHG, 1] = 1.0, 1.0

Z, A = attention(X, W[0]["Q"], W[0]["K"], W[0]["V"])
print("head 1, row R:", A[5].round(3))
print("R -> E weight:", A[5, 9].round(3), "  z_R =", Z[5].round(3))

# 4. Multi-head attention ------------------------------------------------------------------
def multi_head(X, W, Wo):
    outs = [attention(X, w["Q"], w["K"], w["V"]) for w in W]
    return np.hstack([z for z, _ in outs]) @ Wo, [a for _, a in outs]

ctx, maps = multi_head(X, W, np.eye(8))
for i in [2, 3, 6, 7]:
    print(f"S at {i + 1:>2}: before {X[i, :4]}  after {ctx[i].round(2)}")

# 5. One full Transformer block (pre-LayerNorm, as in ESM-2) -------------------------------
def layer_norm(x, eps=1e-5):
    return (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + eps)

def gelu(x):
    return 0.5 * x * (1 + np.vectorize(erf)(x / np.sqrt(2)))

rng = np.random.default_rng(0)
Wo = rng.normal(0, 0.3, (8, 8))                        # mixes the 4 heads
W1, b1 = rng.normal(0, 0.3, (8, 32)), np.zeros(32)     # expand d -> 4d
W2, b2 = rng.normal(0, 0.3, (32, 8)), np.zeros(8)      # compress 4d -> d

def block(x):
    x = x + multi_head(layer_norm(x), W, Wo)[0]              # residues talk (attention)
    return x + gelu(layer_norm(x) @ W1 + b1) @ W2 + b2       # each residue thinks (FFN)

Y = block(X)
print("block output:", Y.shape, " attention params:", 4 * 8 * 8, " FFN params:", 2 * 8 * 32)

# 6. Check against PyTorch's own layer ---------------------------------------------------
try:
    import torch, torch.nn as nn
    layer = nn.TransformerEncoderLayer(d_model=8, nhead=4, dim_feedforward=32, dropout=0.0,
                                       activation="gelu", norm_first=True, batch_first=True)
    cat = lambda m: np.hstack([w[m] for w in W]).T          # PyTorch stores (out, in)
    t = lambda a: torch.tensor(a, dtype=torch.float32)
    with torch.no_grad():
        layer.self_attn.in_proj_weight.copy_(t(np.vstack([cat("Q"), cat("K"), cat("V")])))
        layer.self_attn.in_proj_bias.zero_()
        layer.self_attn.out_proj.weight.copy_(t(Wo.T)); layer.self_attn.out_proj.bias.zero_()
        layer.linear1.weight.copy_(t(W1.T)); layer.linear1.bias.zero_()
        layer.linear2.weight.copy_(t(W2.T)); layer.linear2.bias.zero_()
        Yt = layer(t(X[None]))[0].numpy()
    print("max |NumPy - PyTorch| =", f"{np.abs(Y - Yt).max():.1e}")
except ImportError:
    print("PyTorch not installed: skipping the check")
```

Output:

```text
head 1, row R: [0.036 0.036 0.036 0.036 0.036 0.002 0.036 0.036 0.036 0.605 0.036 0.036
 0.036]
R -> E weight: 0.605   z_R = [-0.603  0.25 ]
S at  3: before [-0.18  0.    1.    0.  ]  after [ 0.    0.85 -0.26  0.21  0.35  0.   -0.05  0.  ]
S at  4: before [-0.18  0.    1.    0.  ]  after [ 0.    0.85 -0.26  0.21 -0.11  0.    0.65  0.11]
S at  7: before [-0.18  0.    1.    0.  ]  after [ 0.    0.85 -0.26  0.21 -0.69  0.78 -0.19  0.  ]
S at  8: before [-0.18  0.    1.    0.  ]  after [ 0.    0.85 -0.26  0.21 -0.27  0.11 -0.33 -0.11]
block output: (13, 8)  attention params: 256  FFN params: 512
max |NumPy - PyTorch| = 4.1e-06
```

Every number matches the figures, and the NumPy block agrees with PyTorch to about $$10^{-6}$$ (float32 rounding). To reproduce the ESM-2 guesses (`pip install fair-esm torch`; downloads the 35M model once):

```python
"""Hide one residue of a TCR beta chain and let ESM-2 guess it (pip install fair-esm torch)."""
import torch, esm

model, alphabet = esm.pretrained.esm2_t12_35M_UR50D()      # 12 layers, 35M parameters
model.eval()
V_GENE = ("MSNQVLCCVVLCLLGANTVDGGITQSPKYLFRKEGQNVTLSCEQNLNHDAMYWYRQDPGQGLRLIYY"
          "SQIVNDFQKGDIAEGYSVSREKKESFPLTVTSAQKNPTAFYL")    # TRBV19, up to the CDR3
CDR3, J_END = "CASSIRSSYEQYF", "GPGTRLTVT"                  # CDR3β, then the rest of TRBJ2-7
chain = V_GENE + CDR3 + J_END                               # 131 residues
AA = "ACDEFGHIKLMNPQRSTVWY"

def guess(k):  # mask CDR3 position k (0-based) and return p(amino acid) over the 20 residues
    tokens = alphabet.get_batch_converter()([("tcr", chain)])[2]
    i = len(V_GENE) + k + 1                                  # +1 for the <cls> token
    tokens[0, i] = alphabet.mask_idx
    with torch.no_grad():
        logits = model(tokens)["logits"][0, i]
    p = torch.softmax(logits[[alphabet.get_idx(a) for a in AA]], -1)
    return dict(zip(AA, p.tolist()))

for k in [0, 5]:
    p = guess(k); true = CDR3[k]
    top = sorted(p, key=p.get, reverse=True)[:4]
    print(f"hide {true}: p({true}) = {p[true]:.3f}   top: " + ", ".join(f"{a} {p[a]:.2f}" for a in top))
```

```text
hide C: p(C) = 0.982   top: C 0.98, S 0.00, F 0.00, V 0.00
hide R: p(R) = 0.031   top: S 0.18, L 0.12, T 0.11, P 0.08
```

## 9. In the lab, and four traps

In immunology and drug discovery, the most common use is as a feature extractor: feed a TCR or antibody sequence into a pretrained protein language model, take one context-rich vector per residue, pool them, and train a small classifier to predict binding, specificity or developability. Antibody language models such as AntiBERTy and AbLang do the same for B-cell receptors, and AlphaFold uses attention to reason about pairs of residues in 3D.

| Myth | Truth |
|---|---|
| Attention weights show which residues matter. | They show where information flowed, in one head. Importance needs ablations and experiments. |
| A Transformer knows the order of a sequence. | Only through positional encoding. Without it, it sees a bag of letters. |
| Most of the weights are in attention. | About two thirds sit in the feed-forward layers: per block, attention has $$4d^2$$ weights and the FFN $$8d^2$$. |
| Transformers are just for language. | They work on any sequence of tokens: amino acids, nucleotides, even cells. |

---

*The toy weights are set by hand so that each head is easy to read; trained models learn theirs from data. The cross-attention map in Fig. 6 is illustrative. ESM-2 probabilities are renormalized over the 20 standard amino acids. Figures were drawn with [Excalidraw](https://excalidraw.com); the editable sources open directly on excalidraw.com: [Fig. 1](/assets/img/notebook/transformer/fig1_vectors.excalidraw), [Fig. 2](/assets/img/notebook/transformer/fig2_qk.excalidraw), [Fig. 3](/assets/img/notebook/transformer/fig3_steps.excalidraw), [Fig. 4](/assets/img/notebook/transformer/fig4_heads.excalidraw), [Fig. 5](/assets/img/notebook/transformer/fig5_block.excalidraw), [Fig. 6](/assets/img/notebook/transformer/fig6_family.excalidraw), [Fig. 7](/assets/img/notebook/transformer/fig7_esm.excalidraw). The video was animated with Remotion and narrated with a synthetic (text-to-speech) voice. Music: “Deliberate Thought” by Kevin MacLeod ([incompetech.com](https://incompetech.com)), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*
