---
title: "The Virtual Biotech: an AI drug company made of agents"
description: "A 9-minute narrated video and an illustrated reading note on Zhang et al. (Science, 2026): how the multi-agent Virtual Biotech is built (a CSO orchestrator, eight specialist agents, MCP tools and a reviewer loop), what its three case studies found, how far to trust it, and what it means for drug discovery."
format: video
filters: [paper, note]   # also listed under Papers and Notes
tags: [AI agents, drug discovery, paper reading, multi-agent systems, single-cell]
math: true
video:
  src: /assets/video/virtual-biotech.mp4
  poster: /assets/img/notebook/virtual-biotech/poster.jpg
  duration: "8:59"
  caption: "Narrated, with captions. The illustrated reading note and runnable code are below."
image: /assets/img/notebook/virtual-biotech/abstract.png
image_alt: "Hand-drawn graphic: a crowned AI robot, the virtual CSO, leads four colored division robots (target, safety, modality, clinical) that share a box of MCP tools, while a red magnifier, the reviewer, reports back to the CSO."
---

*A reading note on Zhang, Eckmann, Miao, Mahon & Zou, "The Virtual Biotech: A multi-agent AI framework for therapeutic discovery and development", Science (2026), [doi:10.1126/science.aeg6779](https://doi.org/10.1126/science.aeg6779), and its 89-page supplement.*

> **In one sentence:** AI agents, organized like a drug company, with curated tools and a reviewer, can turn scattered biomedical evidence into fast, auditable, testable hypotheses.
>
> It is **not** a replacement for experiments, and **not yet** proof of better drugs: use it with human judgment, and test it prospectively.

The video above follows the paper in twelve short chapters. This note goes deeper where the video had to be brief, above all on **how the agents are built**, and ends with my own take and a small runnable sketch of the orchestration pattern. All numbers come from the paper and its supplement; the figures are frames from the video.

## The paper at a glance

| | |
|---|---|
| **Question** | Can a team of AI agents, organized like a biotech company, run the evidence integration of early drug R&D, from genes to clinical trials? |
| **System** | A virtual Chief Scientific Officer (CSO), a chief of staff, a scientific reviewer and 8 specialist agents in 4 divisions: 11 agents in total |
| **Data access** | 10 Model Context Protocol (MCP) servers with 100+ tools over Open Targets, CELLxGENE Census, Tabula Sapiens, Tahoe-100M, cBioPortal, ClinicalTrials.gov and more |
| **Models** | Claude Sonnet 4.5 (CSO and specialists), Claude Haiku 4.5 (chief of staff and reviewer), built on the Claude Agent SDK |
| **Case 1** | 37,075 agents curate trial outcomes in parallel (about 6 h); in the resulting 55,984-trial dataset, drugs on cell-type-specific targets are 48% more likely to reach the market, with 32% fewer adverse events |
| **Case 2** | B7-H3 in lung cancer: fibroblast-driven immune exclusion, worse survival, an antibody–drug conjugate (ADC) as the modality; $50 |
| **Case 3** | Why did the Phase II anti-OSMRβ trial in ulcerative colitis fail? Redundant gp130 signaling; a 10-gene score beats OSMR alone in 4 cohorts; $59 |
| **Checks** | 8 of 8 analyses reproduced by 4 human experts; more accurate trial annotation than Biomni, Kosmos and PantheonOS |

## 1. The problem: evidence lives in silos

It takes more than a decade and billions of dollars to bring a medicine to patients, and about nine in ten candidates that enter clinical trials never reach approval, mostly for lack of efficacy or for safety problems. The authors' diagnosis is not a shortage of data. Human genetics, single-cell atlases, chemistry, safety reports and trial records all exist, but each sits with its own team, tools and file formats. Integrating them is slow, hard to audit, and easily swayed by organizational dynamics and prior beliefs.

Their answer is to copy the *organization* of a drug company, not just its knowledge: build specialists, give them the right instruments, and let a leader coordinate them.

## 2. How the agents are built

This is the part I found most useful, because the supplement documents the system almost line by line: the MCP servers and their tools (Supplementary Text I), the two orchestration algorithms (II), a reviewer report (III), the trial-curation prompt (IV), full conversation transcripts (V, VI) and all eleven system prompts (X).

### 2.1 An org chart, not a single genius

![Fig. 1. The organization: a human scientist, a virtual CSO with its office, and four divisions of specialist agents](/assets/img/notebook/virtual-biotech/fig1_org.png)

*Fig. 1. The organization: a human scientist, a virtual CSO with its office, and four divisions of specialist agents*
{: .muted}

| Division | Agents | MCP servers they can use |
|---|---|---|
| Target identification | statistical geneticist; functional genomics & perturbation; single-cell atlas | genetics, target, disease; functional genomics, target; single cell, target, expression |
| Target safety | pathways & protein interactions; FDA safety officer; single-cell atlas (shared) | pathway, interaction, target; drug, target |
| Modality selection | target biologist, then pharmacologist (in sequence) | target, drug, expression, interaction, pathway |
| Clinical officers | clinical trialist; FDA safety officer (shared) | clinical trials, drug, target |
| Office of the CSO | chief of staff (field briefings, web search); scientific reviewer (read-only) | none |

The one rule that holds it together is written into the CSO's system prompt in capitals: the CSO is "a strategic orchestrator, NOT analyst". It must **never query data directly** and **never answer from memory**; even when it thinks it knows the answer, it re-delegates to a specialist who has the tools. This separation keeps domain expertise inside the specialists and stops the coordinator from hallucinating results.

### 2.2 Tools, not memory: ten MCP servers

![Fig. 2. Ten MCP servers give the agents more than 100 tools; each specialist is plugged into only the servers its job needs](/assets/img/notebook/virtual-biotech/fig2_tools.png)

*Fig. 2. Ten MCP servers give the agents more than 100 tools; each specialist is plugged into only the servers its job needs*
{: .muted}

The Model Context Protocol is a standard plug between a language model and software. Each of the ten servers is a FastMCP Python process; each tool is a typed Python function with a docstring, from which FastMCP generates the schema the model sees. Behind the tools sit 78,726 targets, 39,530 diseases, 14.5 million protein–protein interactions, more than 3 million genetic credible sets, more than 100 million single-cell profiles, 18,119 drugs and 114,270 FDA adverse-event reports.

Two design choices stood out to me. First, tools return **interpretable summaries and previews**, not raw dumps, so an agent can judge relevance before pulling more data (large results are saved to Parquet files instead of flooding the context). Second, **least privilege**: the geneticist simply cannot see clinical-trial tools, which narrows its choices and its mistakes.

### 2.3 Inside one agent: a ReAct loop with guard rails

![Fig. 3. Every agent runs the same reason–act–observe loop; specialists start with a fresh context, and hooks log and guard every tool call](/assets/img/notebook/virtual-biotech/fig3_loop.png)

*Fig. 3. Every agent runs the same reason–act–observe loop; specialists start with a fresh context, and hooks log and guard every tool call*
{: .muted}

Algorithm 2 of the supplement is the standard ReAct loop provided by the Claude Agent SDK, with a few practical details worth copying:

- The loop stops when the model makes no more tool calls, after a **maximum number of turns**, or when a **cost budget** is exceeded.
- **Read-only calls** (Read, Grep, MCP queries) run in parallel; **state-changing calls** (Write, Edit, Bash) run one at a time to avoid conflicts.
- A specialist is invoked with a **fresh message history**: its system prompt plus the CSO's task, not the parent's conversation.
- **Hooks** fire around tool calls: passive ones feed token counts into a cost tracker and write every input and output to a structured trace; pre-tool hooks enforce file-system boundaries and block destructive shell commands.
- Specialized workflows such as single-cell quality control are packaged as **Skills** with progressive disclosure, so their instructions enter the context only when needed.
- All agents use "high" reasoning effort and a session-scoped project memory.

### 2.4 How the team works: four phases

![Fig. 4. Orchestration: brief and clarify, decompose and dispatch, review and revise, synthesize](/assets/img/notebook/virtual-biotech/fig4_team.png)

*Fig. 4. Orchestration: brief and clarify, decompose and dispatch, review and revise, synthesize*
{: .muted}

Algorithm 1 has four phases:

1. **Strategic orientation.** For the first question of a session, the chief of staff writes a short brief (field overview, data landscape, recent news), and the CSO interviews the user with 2–4 numbered questions: which subtype, which evidence streams, how deep.
2. **Decomposition and dispatch.** The CSO splits the question into tasks with a priority group each. Tasks in the same group run **in parallel**; groups run **in sequence** (the target biologist always finishes before the pharmacologist, because biology informs chemistry). Routing rules are explicit, e.g. functional genomics only for cancers, because DepMap holds cancer cell lines.
3. **Quality assurance.** The scientific reviewer reads the question and all specialist outputs and checks methods, claims and alignment with the user's intent. If it finds gaps, the CSO re-delegates with the feedback appended, for at most **two revision cycles**.
4. **Synthesis.** The CSO combines the findings, looks for convergence and conflict, and is told explicitly that "synthesis ≠ analysis".

The sample reviewer report in the supplement is a good read. Reviewing a genetics analysis of OSMR, it returns "CONDITIONAL APPROVAL – Revisions Required" with six concrete gaps, such as "the MODERATE rating lacks explicit justification against defined criteria" and "L2G score not benchmarked against other IBD targets", each with a required fix.

The human's job is deliberately light: answer the CSO's clarifying questions and choose the next step from the options it proposes. Everything else, including writing and running the analysis code, is done by agents.

### 2.5 Why many agents instead of one?

The paper gives three reasons. **Context:** hundreds of tools and terabytes of data cannot fit in one context window; each agent works on a focused slice. **Parallelism:** one agent per trial turned an estimated 1,839 hours of sequential work into about 6 hours, a 184-fold speed-up. **Focus:** an agent with one trial or one task "gains deep familiarity" without the distraction of everything else.

## 3. Case 1: 37,075 agents, and a new predictor of trial success

![Fig. 5. One clinical-trialist agent per trial: 37,075 agents in parallel, each following a strict evidence cascade](/assets/img/notebook/virtual-biotech/fig5_swarm.png)

*Fig. 5. One clinical-trialist agent per trial: 37,075 agents in parallel, each following a strict evidence cascade*
{: .muted}

Trial registries are messy: results are often not posted, or only described in free text. To build a clean outcome dataset, the CSO had a clinical-trialist agent design a protocol and then launched **37,075 agents**, one for every Phase II and III trial in the Open Targets dataset. Each agent followed a strict three-level cascade (ClinicalTrials.gov, then PubMed full text, then press releases and news, always verifying the NCT ID), recorded the source of every field, and wrote a JSON file that had to pass a Pydantic schema check, fixing and re-validating until it did. The median cost was **$0.23 per trial**.

The labels held up: against manual review of 100 random trials they agreed for 88.4% of primary endpoints, 88.4% of secondary endpoints and 92.4% of adverse-event rates, and for 85.6% of the 7,666 trials shared with the Therapeutic Data Commons labels.

With 55,984 annotated trials, the single-cell agent proposed two features of each drug target, computed over 27 tissues of the Tabula Sapiens atlas:

$$\tau = \frac{\sum_{j=1}^{n}\left(1-\bar{x}_j/\bar{x}_{\max}\right)}{n-1} \qquad\qquad \mathrm{BC} = \frac{m_3^2+1}{m_4+\dfrac{3(n-1)^2}{(n-2)(n-3)}}$$

**Cell-type specificity** $$\tau$$ runs from 0 (expressed in all cell types) to 1 (one cell type only). The **bimodality coefficient** BC, borrowed from psychology, uses the skewness $$m_3$$ and kurtosis $$m_4$$ of expression among expressing cells to detect "on in some cells, off in others".

![Fig. 6. Specificity and bimodality of a target, and what they predict](/assets/img/notebook/virtual-biotech/fig6_features.png)

*Fig. 6. Specificity and bimodality of a target, and what they predict*
{: .muted}

Drugs whose targets are cell-type-specific were **48% more likely to reach Phase IV**, **40% more likely to progress from Phase I to II**, and their trials reported about **32% lower adverse-event rates**. Per standard deviation of $$\tau$$, the odds ratios were modest (1.12 for meeting primary endpoints, 1.27 for Phase I → II). The associations survived 1,000-fold permutation tests, mixed models adjusted for phase, start year, disease area and drug modality, and adjustment for human genetic evidence; they were as strong or stronger in the 75% of trials with no genetic support at all. In plain words: single-cell data seem to carry information that genetics alone does not.

## 4. Case 2: B7-H3 in lung cancer

![Fig. 7. The B7-H3 evidence chain, from genetics to modality](/assets/img/notebook/virtual-biotech/fig7_b7h3.png)

*Fig. 7. The B7-H3 evidence chain, from genetics to modality*
{: .muted}

The prompt was a single line: *"Evaluate the therapeutic candidacy of B7-H3 as a target in lung cancer."* The transcript in the supplement shows how the evidence chain grew over eight turns:

1. **Genetics:** no GWAS association and none of 59 L2G predictions involved lung cancer. The CSO's reasoning, written before any data came back, is the kind of judgment I hoped to see: for a checkpoint target, the rationale "derives from somatic tumor overexpression rather than germline genetic risk", so the absence is not disqualifying.
2. **Single cells:** 485,821 cells from CELLxGENE Census. The first attempt failed because three datasets used incompatible cell-type labels; the CSO proposed a manual Cell Ontology mapping, and the rerun found B7-H3 raised mainly in **fibroblasts** (log2 fold change 2.13 in small-cell, 1.79 in adenocarcinoma), not mainly in cancer cells.
3. **Cell–cell signals:** 180 and 226 ligand–receptor interactions specific to B7-H3-high fibroblasts, in five immunosuppressive classes.
4. **The reviewer's objection:** these interactions come from *dissociated* cells, which have lost their spatial context.
5. **Spatial data:** in 12 Visium samples, immune cells were depleted around B7-H3-high spots (monocytes −69%, T cells −37%), most strongly in the nearest ring, as expected for local exclusion.
6. **Survival:** in 477 TCGA patients, top- versus bottom-quartile B7-H3 meant worse overall survival (HR 1.62, $$p$$ = 0.028) and disease-free survival (HR 2.06).
7. **Modality:** antibody tractable, no small-molecule binders, so an **antibody–drug conjugate**, which delivers a payload into B7-H3-positive cells and also kills their neighbors.

The whole analysis cost $50 and ran without web search. In August 2025, after the model's January 2025 knowledge cutoff, the FDA granted Breakthrough Therapy designation to ifinatamab deruxtecan, a B7-H3 ADC, in small-cell lung cancer.

## 5. Case 3: why did a trial fail?

![Fig. 8. MOONGLOW: blocking OSMR leaves the other gp130-family doors open](/assets/img/notebook/virtual-biotech/fig8_osmr.png)

*Fig. 8. MOONGLOW: blocking OSMR leaves the other gp130-family doors open*
{: .muted}

MOONGLOW (NCT06137183) tested vixarelimab, a first-in-class antibody against OSMRβ, in moderate-to-severe ulcerative colitis, and was stopped for futility in June 2025. Starting from that one fact, the agents:

- read the full protocol and noticed that patients were **treatment-refractory**;
- found a single-cell atlas that matched this population (TAURUS: 435,857 cells from 20 patients, anti-TNF non-responders and responders, biopsied before and after therapy);
- confirmed OSMR up-regulation in non-responder fibroblasts, then screened transcription-factor activity and found **STAT1** raised in 9 of 10 OSMR-expressing stromal cell types;
- noticed that OSMRβ signals through **gp130**, which it shares with the IL-6 family (IL-6, LIF, IL-11, CNTF, CT-1), and used a Shapley variance decomposition to show that OSMR explained only a minority of STAT1 activity (about a fifth on average);
- concluded that blocking OSMR was a **partial blockade**: one door closed, the others open;
- built a 10-gene gp130-axis score that beat OSMR alone at predicting non-response in all four independent infliximab cohorts (AUC 0.77 → 0.91, 0.73 → 0.91, 0.65 → 0.83, 0.74 → 0.85), comparable to a published 5-gene signature;
- and surveyed 112 diseases, finding stromal OSMR up-regulation well beyond colitis.

Cost: $59, in under a day. This case is my favorite, because it aims straight at the most expensive failure point in drug development, Phase II efficacy. That is exactly where Bender and colleagues argued the value of AI hides (see my [earlier reading note](/notebook/2026/ai-in-drug-discovery-where-we-stand/)).

## 6. Can we trust it?

![Fig. 9. Expert re-implementation and a comparison with three other agent systems](/assets/img/notebook/virtual-biotech/fig9_trust.png)

*Fig. 9. Expert re-implementation and a comparison with three other agent systems*
{: .muted}

Four human experts each re-implemented two of the eight analyses behind Fig. 4 and Fig. 5 of the paper, following the same instructions the CSO gave its agents. All eight reached the same conclusions, and the agents' code was judged correct, with minor differences such as one cell-type mapping (myeloid labelled as monocyte). For the OSMR decomposition, the agent and expert estimates correlated at r = 0.88, and both put OSMR's mean share at 21%.

| Accuracy vs manual review | Primary endpoint | Secondary endpoint | Adverse events | TDC primary |
|---|---|---|---|---|
| **Virtual Biotech** | **88%** | **88%** | **92%** | **86%** |
| PantheonOS | 71% | 65% | 18% | 81% |
| Biomni | 67% | 65% | 53% | 79% |
| Kosmos | 64% | 54% | 58% | 57% |

The qualitative comparison is even more telling. Biomni compared tumor and normal expression on two different scales (TPM against read counts), and in the OSMR case "fabricated patient responses with a random number generator". PantheonOS used transcriptomic similarity as a stand-in for physical distance. Kosmos looked at B7-H3 only in malignant cells. Biomni and PantheonOS ran on the same base model as the Virtual Biotech, so the gap comes from the organization: curated tools, clear roles and a reviewer.

## 7. What it changes

1. **Discovery as an organization problem.** Quality depends on roles, tool curation and checks as much as on the model.
2. **Scale as a research method.** Curating 37,075 trials in about six hours made a new observational finding possible that no human team would have funded.
3. **Speed and cost.** A multi-scale target review in under a day, for $50–59 in API credits.
4. **Auditability.** Every claim comes with a tool trace and code anyone can rerun, an audit trail many human teams never keep.

## 8. My take

I am impressed, and the supplement's transparency (all prompts, transcripts and code on GitHub and Zenodo) deserves credit. Four cautions temper it.

![Fig. 10. Four cautions, and a lesson for anyone building agents](/assets/img/notebook/virtual-biotech/fig10_take.png)

*Fig. 10. Four cautions, and a lesson for anyone building agents*
{: .muted}

1. **Humans steered every case.** At each turn the scientist chose the next step from the CSO's menu. In the B7-H3 transcript, a median split of survival showed no significant effect (HR 1.28, $$p$$ = 0.15); the CSO then proposed quartiles, which gave $$p$$ = 0.028. The reasoning is defensible, but this is exactly the forking path a reviewer agent should flag, and it did not. Pre-registered analysis plans for agents would help.
2. **Associations, not causes.** Odds ratios of about 1.1–1.3 per standard deviation are useful for prioritization, but target choice, indication and sponsor are entangled, and residual confounding can remain.
3. **Not a blind prediction.** B7-H3 ADCs were already in clinical development before the January 2025 cutoff (the paper says so: earlier programs were motivated "through a cancer-cell-centric lens"). The new contribution is the fibroblast mechanism, not the ADC idea itself. The OSMR case is a cleaner test, because the trial readout came after the cutoff.
4. **No wet-lab or prospective test yet.** The hypotheses were not tested experimentally, and we do not know whether agent-picked targets fail less often in Phase II. That is the experiment that would settle the question.

**What I take away for building agents.** The [NGS workflow assistant](/projects/ngs-workflow-assistant/) I built uses the same stack (Claude Agent SDK, MCP, skills, human approval, audit logs), so this paper read like a well-documented reference design. The lessons I am taking:

- an orchestrator that **never analyzes**, only routes and synthesizes;
- **narrow tool access** per specialist, with tools that return summaries, not dumps;
- **schema-validated outputs** with source tracking for anything that will be aggregated;
- **one agent per item** when a task is embarrassingly parallel;
- a **skeptical reviewer** in the loop, ideally one told to look for forking paths;
- **evaluation by expert re-implementation**, not only by benchmark scores.

## Cheat sheet

| Term | Meaning |
|---|---|
| CSO | the orchestrator agent: plans, delegates, synthesizes, never touches data |
| MCP | Model Context Protocol, a standard interface for language models to call tools |
| ReAct loop | reason → act (tool call) → observe, repeated until done |
| Hook | a callback around tool calls, used here for cost, provenance and sandboxing |
| τ (tau) | cell-type specificity of a gene, 0 = everywhere, 1 = one cell type |
| Bimodality coefficient | high when a gene is on in some cells and off in others |
| ADC | antibody–drug conjugate: an antibody that carries a cytotoxic payload |
| gp130 | the signal-transducing receptor shared by the IL-6 family, OSMR included |

## Try it yourself (Python)

The first part reproduces the two single-cell features on toy numbers (the same τ values as the video). The second part is a dependency-free sketch of the orchestration pattern (Algorithms 1 and 2) with stub agents instead of language models, so the control flow can be read and run without an API key. The real system is open source at [github.com/harrisongzhang/TheVirtualBiotech](https://github.com/harrisongzhang/TheVirtualBiotech).

```python
"""Two small, runnable companions to the reading note on "The Virtual Biotech" (Zhang et al., Science 2026).
1) The paper's two single-cell features of a drug target: cell-type specificity (tau) and the bimodality coefficient.
2) A dependency-free sketch of the orchestration pattern (Algorithms 1 and 2 of the supplement), with stub agents
   instead of language models, so the control flow can be read and run without any API key."""
import numpy as np
from concurrent.futures import ThreadPoolExecutor

# ---------- 1) tau and the bimodality coefficient ----------
def tau(mean_expr):
    """tau = sum_j (1 - x_j / x_max) / (n - 1): 0 = expressed everywhere, 1 = one cell type only."""
    x = np.asarray(mean_expr, float)
    return float(np.sum(1 - x / x.max()) / (len(x) - 1))

def bimodality_coefficient(x):
    """BC = (g^2 + 1) / (k + 3(n-1)^2 / ((n-2)(n-3))), g = sample skewness, k = sample excess kurtosis
    (bias-corrected, as in Pfister et al. 2013). A uniform distribution gives 5/9 ~ 0.555; higher hints at two modes."""
    x = np.asarray(x, float); n = len(x); m = x.mean(); s2 = ((x - m) ** 2).mean()
    g1 = ((x - m) ** 3).mean() / s2 ** 1.5; k1 = ((x - m) ** 4).mean() / s2 ** 2 - 3
    g = g1 * np.sqrt(n * (n - 1)) / (n - 2)
    k = (n - 1) / ((n - 2) * (n - 3)) * ((n + 1) * k1 + 6)
    return float((g ** 2 + 1) / (k + 3 * (n - 1) ** 2 / ((n - 2) * (n - 3))))

rng = np.random.default_rng(0)
broad = [0.62, 0.70, 0.55, 0.66, 0.60, 0.72, 0.58, 0.64]      # mean expression in 8 cell types
specific = [0.04, 0.06, 0.95, 0.03, 0.05, 0.08, 0.04, 0.06]
print(f"tau, broad gene    = {tau(broad):.2f}")
print(f"tau, specific gene = {tau(specific):.2f}")
one_mode = rng.normal(2.0, 0.5, 400)                                        # expressing cells, one population
two_modes = np.r_[rng.normal(1.0, 0.3, 220), rng.normal(3.0, 0.4, 180)]    # 'on' in some cells, 'off' in others
print(f"BC, one population = {bimodality_coefficient(one_mode):.2f}")
print(f"BC, two populations = {bimodality_coefficient(two_modes):.2f}")

# ---------- 2) the orchestration pattern, with stub agents ----------
class Agent:
    def __init__(self, name, servers, plan):
        self.name, self.servers, self.plan = name, servers, plan   # plan: the tool calls a model would choose

    def run(self, task, max_turns=8, budget=1.0):
        """Algorithm 2 (ReAct): reason -> act (tool calls) -> observe, until no more tool calls, turns or budget run out.
        A specialist starts with a fresh context: only its role and the task, never the CSO's whole conversation."""
        messages, cost = [f"[system] you are the {self.name}", f"[task] {task}"], 0.0
        for turn, call in enumerate(self.plan[:max_turns], 1):
            cost += 0.01                                              # a stand-in for token cost, logged by a hook
            if cost > budget: return "budget exceeded", messages
            messages.append(f"[tool] {call} -> ok")                   # read-only calls could run in parallel here
        return f"{self.name}: finding on '{task}' ({len(self.plan)} tool calls)", messages

def reviewer(results):
    """Scientific reviewer: flags a gap if a claim rests on dissociated cells without spatial evidence."""
    joined = " ".join(results.values())
    return [] if "spatial" in joined else [("single-cell analyst", "dissociated cells lose spatial context: check intact tissue")]

TEAM = {"geneticist": Agent("geneticist", ["genetics", "target"], ["query_gwas", "l2g_scores"]),
        "single-cell analyst": Agent("single-cell analyst", ["single_cell", "expression"], ["census_query", "pseudobulk_de"])}

def cso(question):
    """Algorithm 1: (orientation and clarification omitted) decompose -> dispatch in parallel -> review (max 2 rounds) -> synthesize.
    The CSO never touches data itself; it only routes tasks and combines what the specialists return."""
    tasks = {"geneticist": "germline evidence for B7-H3 in lung cancer", "single-cell analyst": "where is B7-H3 expressed?"}
    with ThreadPoolExecutor() as pool:                                # independent analyses run in parallel
        results = dict(zip(tasks, pool.map(lambda kv: TEAM[kv[0]].run(kv[1])[0], tasks.items())))
    for round_ in range(1, 3):                                        # at most two revision rounds
        issues = reviewer(results)
        print(f"review round {round_}: {issues or 'approved'}")
        if not issues: break
        for who, feedback in issues:                                  # re-delegate with the reviewer's feedback appended
            TEAM[who].plan = TEAM[who].plan + ["visium_spatial_neighbourhoods"]
            results[who] = TEAM[who].run(tasks[who] + " | reviewer: " + feedback)[0] + " + spatial check"
    return "SYNTHESIS\n  " + "\n  ".join(results.values())

print(cso("Evaluate B7-H3 as a target in lung cancer"))
```

```text
tau, broad gene    = 0.14
tau, specific gene = 0.95
BC, one population = 0.30
BC, two populations = 0.70
review round 1: [('single-cell analyst', 'dissociated cells lose spatial context: check intact tissue')]
review round 2: approved
SYNTHESIS
  geneticist: finding on 'germline evidence for B7-H3 in lung cancer' (2 tool calls)
  single-cell analyst: finding on 'where is B7-H3 expressed? | reviewer: dissociated cells lose spatial context: check intact tissue' (3 tool calls) + spatial check
```

---

*This is an independent summary written for teaching; please read the [original paper](https://doi.org/10.1126/science.aeg6779) and its supplement for the full methods and references. All numbers are taken from the paper and supplement. The figures are frames from the video, drawn by us; the trial record and the tool signature in the video are illustrative, the survival curves in Fig. 7 are schematic, and the cell-type tiles in Fig. 6 are toy values (the same ones the code above uses). The bimodality coefficient in the code uses the standard bias-corrected excess kurtosis (Pfister et al., 2013). The opinions in section 8 are my own. The video was animated with Remotion and narrated with a synthetic voice (Kokoro-82M, run locally); the music is an original score generated for this video.*
