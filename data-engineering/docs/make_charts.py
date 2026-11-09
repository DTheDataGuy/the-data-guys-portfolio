"""Render the README / portfolio charts from the dbt marts (run after `make all`)."""
from pathlib import Path

import duckdb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.ticker import FuncFormatter  # noqa: E402

HERE = Path(__file__).parent
DB = HERE.parent / "seattle-permits-dbt-duckdb" / "target" / "permits.duckdb"
PAPER, INK, MUTED, TEAL, GOLD, RULE = "#F5F3EE", "#14161A", "#646A73", "#0F766E", "#C9971C", "#DCD8CF"

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 13, "axes.edgecolor": RULE,
                     "axes.labelcolor": MUTED, "xtick.color": MUTED, "ytick.color": MUTED,
                     "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True,
                     "grid.color": RULE, "grid.linewidth": 0.8, "axes.axisbelow": True})


def frame(title: str, subtitle: str):
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=100)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    fig.text(0.06, 0.93, title, fontsize=24, fontweight="bold", color=INK)
    fig.text(0.06, 0.885, subtitle, fontsize=14, color=MUTED, va="top" if "\n" in subtitle else "baseline")
    fig.text(0.06, 0.03, "Source: City of Seattle Building Permits (data.seattle.gov, public domain) · "
             "Polars → dbt/DuckDB → Spark pipeline", fontsize=11, color=MUTED)
    fig.subplots_adjust(left=0.08, right=0.96, top=0.80 if "\n" in subtitle else 0.82, bottom=0.12)
    return fig, ax


con = duckdb.connect(str(DB), read_only=True)

# 1. Cycle times for new buildings
ct = con.sql("""select applied_year, p50_days_to_issue, p90_days_to_issue from analytics.mart_cycle_time_trends
               where permit_type='Building' and permit_work_class='New' and applied_year between 2010 and 2025
               order by applied_year""").fetchall()
years, p50, p90 = zip(*ct)
fig, ax = frame("How long a new-building permit takes to issue",
                "Days from application to issue, new construction, by application year.\n"
                "Recent years are still maturing: permits not yet issued aren't counted.")
ax.fill_between(years, p50, p90, color=TEAL, alpha=0.12, linewidth=0)
ax.plot(years, p90, color=TEAL, linewidth=2, linestyle="--", label="90th percentile")
ax.plot(years, p50, color=TEAL, linewidth=3.5, marker="o", label="Median")
ax.annotate(f"{p50[-1]:.0f} days median", (years[-1], p50[-1]), xytext=(-175, -32), textcoords="offset points",
            color=INK, fontsize=13, arrowprops={"arrowstyle": "-", "color": MUTED})
ax.set_ylabel("Days")
ax.legend(frameon=False, loc="upper left")
fig.savefig(HERE / "chart_cycle_times.png", facecolor=PAPER)

# 2. Net housing units
hp = con.sql("""select issued_year, sum(net_units) from analytics.mart_housing_production
               where issued_year between 2006 and 2025 group by 1 order by 1""").fetchall()
yrs, net = zip(*hp)
fig, ax = frame("Net new housing units permitted in Seattle",
                "Units added minus units removed, by permit issue year")
bars = ax.bar(yrs, net, color=[GOLD if y == max(hp, key=lambda r: r[1])[0] else TEAL for y in yrs], width=0.72)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:,.0f}"))
peak = max(hp, key=lambda r: r[1])
ax.annotate(f"{peak[1]:,} units in {peak[0]}", (peak[0], peak[1]), xytext=(0, 10), textcoords="offset points",
            ha="center", color=INK, fontsize=13)
ax.grid(axis="x", visible=False)
ax.set_xticks(list(range(2006, 2026, 2)))
fig.savefig(HERE / "chart_housing_units.png", facecolor=PAPER)

# 3. Monthly applications
mp = con.sql("""select month, applications, applications_trailing_12m_avg from analytics.mart_monthly_pipeline
               where month >= date '2008-01-01' and not is_partial_month order by month""").fetchall()
m, a, avg = zip(*mp)
fig, ax = frame("Permit applications per month", "Monthly applications with the trailing 12-month average")
ax.plot(m, a, color=TEAL, alpha=0.35, linewidth=1.2, label="Monthly applications")
ax.plot(m, avg, color=INK, linewidth=3, label="Trailing 12-month average")
ax.legend(frameon=False, loc="upper left")
fig.savefig(HERE / "chart_monthly_applications.png", facecolor=PAPER)
print("charts written")
