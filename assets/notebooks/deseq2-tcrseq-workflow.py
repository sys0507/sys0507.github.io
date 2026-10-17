"""DESeq2 for bulk TCR-seq V-gene usage: a complete, runnable workflow (PyDESeq2 0.5.4).

Design: TRBV9-targeting CAR-T vs untransduced (UTD) T cells, 3 donors x 2 technical-replicate libraries,
48 TRBV genes, read counts without UMIs. The data are SIMULATED for teaching: TRBV9 is depleted ~97%,
one other gene (TRBV12-3) is reduced ~30%, everything else is unchanged. Replace simulate() with your own
count table (genes x libraries) and metadata to analyse real data.
"""
import io, contextlib, warnings
import numpy as np, pandas as pd
from pydeseq2.dds import DeseqDataSet
from pydeseq2.ds import DeseqStats
from pydeseq2.default_inference import DefaultInference
warnings.filterwarnings("ignore")

GENES = ["TRBV2", "TRBV3-1", "TRBV4-1", "TRBV4-2", "TRBV4-3", "TRBV5-1", "TRBV5-4", "TRBV5-5", "TRBV5-6", "TRBV5-8",
         "TRBV6-1", "TRBV6-2", "TRBV6-4", "TRBV6-5", "TRBV6-6", "TRBV6-8", "TRBV6-9", "TRBV7-2", "TRBV7-3", "TRBV7-4",
         "TRBV7-6", "TRBV7-7", "TRBV7-8", "TRBV7-9", "TRBV9", "TRBV10-1", "TRBV10-2", "TRBV10-3", "TRBV11-1", "TRBV11-2",
         "TRBV11-3", "TRBV12-3", "TRBV12-4", "TRBV12-5", "TRBV13", "TRBV14", "TRBV15", "TRBV16", "TRBV18", "TRBV19",
         "TRBV20-1", "TRBV24-1", "TRBV25-1", "TRBV27", "TRBV28", "TRBV29-1", "TRBV30", "TRBV7-1"]
TARGET, CAND = "TRBV9", "TRBV12-3"
def quiet(f, *a, **k):
    """Run a PyDESeq2 step without its progress messages."""
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        return f(*a, **k)

def simulate(seed=1):
    rng = np.random.default_rng(seed); G = len(GENES); gi = {g: i for i, g in enumerate(GENES)}
    base = np.exp(rng.normal(0, 1.05, G)); base /= base.sum()
    base[gi[TARGET]] = 0.040; base[gi["TRBV20-1"]] = max(base[gi["TRBV20-1"]], 0.10); base[gi[CAND]] = 0.030
    rest = [i for i in range(G) if GENES[i] not in (TARGET, "TRBV20-1", CAND)]
    base[rest] *= (1 - base[gi[TARGET]] - base[gi["TRBV20-1"]] - base[gi[CAND]]) / base[rest].sum()
    eff = np.ones(G); eff[gi[TARGET]] = 0.03; eff[gi[CAND]] = 0.70
    libs, rows = [], []
    for d in ["D1", "D2", "D3"]:
        dfac = np.exp(rng.normal(0, 0.35, G))                      # donor-to-donor biology
        for c in ["UTD", "CART"]:
            prop = base * dfac * np.exp(rng.normal(0, 0.10, G)) * (eff if c == "CART" else 1); prop /= prop.sum()
            for r in ["r1", "r2"]:
                p2 = prop * np.exp(rng.normal(0, 0.06, G)); p2 /= p2.sum()   # library prep / PCR noise (no UMIs)
                rows.append(rng.multinomial(int(rng.uniform(0.8e6, 2.5e6)), p2)); libs.append(f"{d}_{c}_{r}")
    counts = pd.DataFrame(np.array(rows).T, index=GENES, columns=libs)
    meta = pd.DataFrame({"sample": [l.rsplit("_", 1)[0] for l in libs], "donor": [l.split("_")[0] for l in libs],
                         "condition": [l.split("_")[1] for l in libs], "rep": [l.split("_")[2] for l in libs]}, index=libs)
    return counts, meta

counts, meta = simulate()

# 1. Technical replicates: noise floor first (288 = 6 samples x 48 genes log2 ratios), then SUM them.
cpm = counts / counts.sum() * 1e6
pairs = meta.reset_index().pivot(index="sample", columns="rep", values="index")
diffs = np.concatenate([np.log2((cpm[a] + 1) / (cpm[b] + 1)).values for a, b in pairs.values])
lo, hi = np.percentile(diffs, [2.5, 97.5]); N = max(-lo, hi)
print(f"replicate differences: n={diffs.size}, middle 95% {lo:+.2f} to {hi:+.2f}  ->  noise floor N = {N:.2f} log2 ({(2**N-1)*100:.0f}%)")
summed = counts.T.groupby(meta["sample"]).sum().T                 # never treat technical replicates as donors
md = meta.drop_duplicates("sample").set_index("sample").loc[summed.columns, ["donor", "condition"]]
md["condition"] = pd.Categorical(md.condition, ["UTD", "CART"])

# 2. DESeq2 with donor as a blocking factor (each donor is its own control)
inf = DefaultInference(n_cpus=1)
dds = DeseqDataSet(counts=summed.T, metadata=md, design="~donor + condition", inference=inf, quiet=True)
quiet(dds.deseq2)
print("size factors:", {s: round(float(v), 2) for s, v in zip(dds.obs_names, dds.obs["size_factors"])})
print("median dispersion:", round(float(np.median(dds.var["dispersions"])), 4))
st = DeseqStats(dds, contrast=["condition", "CART", "UTD"], alpha=0.05, inference=inf, quiet=True); quiet(st.summary)
res = st.results_df.copy()
quiet(st.lfc_shrink, coeff="condition[T.CART]"); res["lfc_shrunk"] = st.results_df.log2FoldChange

# 3. Threshold tests: is the loss larger than 50% / 90%?  (PyDESeq2's lfc_null is SIGNED, unlike R's lfcThreshold)
def thr(lfc_null):
    s = DeseqStats(dds, contrast=["condition", "CART", "UTD"], lfc_null=lfc_null, alt_hypothesis="less", inference=inf, quiet=True)
    quiet(s.summary); return s.results_df.padj
res["padj_gt50"], res["padj_gt90"] = thr(-1.0), thr(-np.log2(10))

# 4. Per-donor log2FC on normalised counts, each donor classified as down / flat / up relative to N
nc = pd.DataFrame(dds.layers["normed_counts"], index=dds.obs_names, columns=dds.var_names)
per = pd.DataFrame({d: np.log2((nc.loc[f"{d}_CART"] + 1) / (nc.loc[f"{d}_UTD"] + 1)) for d in ["D1", "D2", "D3"]})

def classify(g):
    r, d = res.loc[g], per.loc[g]; up, down = (d > N).sum(), (d < -N).sum(); flat = 3 - up - down
    if pd.isna(r.padj): return "1 not tested", ""
    if r.padj >= 0.05: return ("2 no evidence of change" if abs(r.lfc_shrunk) <= N else "3 inconclusive"), ""
    if abs(r.lfc_shrunk) <= N: return "4 below noise floor", ""
    if r.lfc_shrunk > 0: return "8 candidate increase", ("direction inconsistent" if down else "magnitude inconsistent" if flat else "")
    if up: return "7 candidate reduction", "direction inconsistent"
    flag = "magnitude inconsistent" if flat else ""
    if r.lfc_shrunk <= -np.log2(10) and r.padj_gt90 < 0.05: return "5 eliminated", flag
    if r.lfc_shrunk <= -1 and r.padj_gt50 < 0.05: return "6 strongly reduced", flag
    return "7 candidate reduction", flag

res[["call", "flag"]] = [classify(g) for g in res.index]
res["change_%"] = (2 ** res.lfc_shrunk - 1) * 100
show = res.sort_values("pvalue")[["lfc_shrunk", "change_%", "lfcSE", "stat", "pvalue", "padj", "call"]]
print(show.head(4).round(4).to_string())
print(res.call.value_counts().to_string())
print("median log2FC of all V genes (compositional check):", round(float(res.lfc_shrunk.median()), 3))
