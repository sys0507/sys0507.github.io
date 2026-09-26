---
title: "What a p-value is, and isn't, in 90 seconds"
description: "A short video explainer with the script below: the definition, the three most common misreadings, and why 20,000 genes change everything."
format: video
tags: [statistics, explainer]
math: true
video:
  youtube: ""        # paste the YouTube video ID here, e.g. "a1B2c3D4e5F"
  duration: "1:30"
  caption: "Script and notes below."
---

## The definition

A p-value answers one narrow question: **if there were truly no effect, how surprising would data like mine be?** More precisely, it's the probability of getting a test statistic at least as extreme as the one you observed, assuming the null hypothesis is true:

$$
p = \Pr\left(T \geq t_{\text{obs}} \mid H_0\right)
$$

Say treated tumors are smaller than controls and the test gives $$p = 0.03$$. That means: *if the treatment did nothing*, a difference this large or larger would show up in about 3% of experiments like this one, just from chance.

## Three things it is not

**It is not the probability that the null hypothesis is true.** The p-value is computed *assuming* $$H_0$$ is true, so it can't also tell you how likely $$H_0$$ is. Getting from one to the other needs prior information, which is what Bayesian methods add.

**It is not the size of the effect.** With enough samples, a trivially small difference can give a tiny p-value. Always report the effect size and its confidence interval next to it.

**It is not proof of “no effect” when it's large.** $$p = 0.4$$ means your data are compatible with no effect; they may also be compatible with a large one if the study was small. Absence of evidence isn't evidence of absence.

## Why 20,000 genes change everything

In a single-cell experiment you might test every gene for differential expression. If none of 20,000 genes truly changed, a 0.05 cutoff would still flag about 1,000 of them. That's why genomics reports adjusted p-values, usually controlling the false discovery rate with the Benjamini–Hochberg procedure, rather than raw ones.

## One-line summary

A p-value measures how surprising your data would be in a world with no effect. It doesn't measure how likely that world is, or how big the effect is.
