type SortMode = "Balanced" | "Max Push";
type Wt4Type = "None" | "Perfect Storm" | "Wind" | "Cold" | "Holy";

type FormPayload = {
  apples: number;
  milestones: number;
  hp: number;
  mana: number;
  fifteen: number;
  max_ascension: number;
  starforce: number;
  wt4: Wt4Type;
  mage: boolean;
  smite_push: boolean;
  use_bt: boolean;
  use_gw: boolean;
  ea_max: number;
  lb_max: number;
  show_count: number;
  sort_mode: SortMode;
  flat_weight: number;
};

type ResultEntry = {
  rank: number;
  name: string;
  days: number;
  delta: number;
  flat: number;
  score: number;
  build: string;
};

type ResultPage = {
  apples: number;
  target_day: number;
  best_days: number;
  entries: ResultEntry[];
};

export type ApiResponse = {
  pages: ResultPage[];
  perf_text: string;
};

const HEADERS = [
  "IN", "TD", "AT", "GW", "RD", "AS",
  "TE", "BL", "S", "BT", "EA", "AC",
  "FA", "AP", "MS", "LB", "SM", "PS", "TS", "LS",
] as const;

type StatKey = typeof HEADERS[number] | "PM";
type StatMap = Record<StatKey, number[]>;

const LB_MAX = 9;
const LOOK = 10;

function wt4ToLevel(wt4: string): number {
  const value = String(wt4).trim().toLowerCase();
  if (value === "perfect storm") return 1;
  if (value === "wind") return 2;
  if (value === "cold") return 3;
  if (value === "holy") return 4;
  return 0;
}

function getSimpleApples(lbMax: number, wt4: number) {
  const lb = Math.min(Number(lbMax), LB_MAX);
  return {
    IN: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    TD: [0, 1, 2],
    PM: [0, 1],
    AT: [0, 1, 2],
    GW: [0, 1, 2, 3, 4],
    RD: [0, 1, 1, 1, 1, 1, 1, 1, 1],
    AS: [0, 1, 1, 1, 1, 1, 1],
    TE: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    BL: [0, 1, 2],
    S: [0, 1],
    BT: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    EA: [0, 1, 2, 3, 4, 5, 6, 7],
    AC: [0, 2, 2, 3, 4, 5, 6, 7, 8],
    FA: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    AP: [0, 1, 2],
    MS: [0, 3, 2, 3, 4, 5, 6, 7],
    LB: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, lb + 1),
    SM: [0, 1, 2, 3, 4],
    PS: wt4 > 0 ? [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] : [0],
    TS: wt4 > 1 ? [0, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [0],
    LS: wt4 > 1 ? [0, 1, 2] : [0],
  };
}

function getDamages(stats: number[], wt4: number, lbMax: number) {
  const [milestones, hp, mana, fifteen, maxAscension, starforce] = stats;
  if (maxAscension > 20) {
    throw new Error("Max Ascension must be <= 20");
  }

  const lb = Math.min(lbMax, LB_MAX);

  let ls = [1];
  if (wt4 === 2) ls = [1, 1250, 1280000];
  else if (wt4 === 3) ls = [1, 250, 256000];
  else if (wt4 === 4) ls = [1, 50, 51200];

  return {
    IN: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (n / 2) ** milestones),
    TD: [1, 50, 51200],
    PM: [1, 1],
    AT: [1, 1.4, 2].map((n) => n ** maxAscension),
    GW: [1, 1.103, 1.3025, 1.5871, 1.96].map((n) => n ** 60),
    RD: [0, 150, 300, 450, 600, 750, 900, 1050, 1200].map((n) => 1.03 ** Math.min(starforce, n)),
    AS: [0, 10, 20, 30, 40, 50, 60].map((n) => 2 ** Math.min(fifteen, n)),
    TE: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (n / 2) ** milestones),
    BL: [1, 50, 51200],
    S: [1, 100],
    BT: [
      [1, 50],
      [1.05, 100],
      [1.1, 150],
      [1.15, 200],
      [1.2, 250],
      [1.25, 300],
      [1.3, 350],
      [1.35, 400],
      [1.4, 450],
      [1.45, 500],
      [1.5, 550],
      [1.55, 600],
    ].map(([k, e]) => k ** e),
    EA: [0, 1, 3, 6, 10, 15, 21, 28].map((n) => 100 ** n),
    AC: [1].concat(
      Array.from({ length: 8 }, (_, i) => (1.005 + 0.0015 * i) ** Math.min((i + 2) * 1000, hp - 1)),
    ),
    FA: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (n / 2) ** milestones),
    AP: [1, 50, 51200],
    MS: [
      1,
      ...[1, 2, 3, 4, 5, 6].map((i) => (1.005 + 0.0025 * i) ** Math.min((i + 1) * 1000, mana - 1)),
      1.0225 ** Math.min(7500, mana - 1),
    ],
    LB: [0, 1, 3, 6, 10, 15, 21, 28, 36, 45].map((i) => 83 ** i).slice(0, lb + 1),
    SM: [1, 1.8, 4.89, 15.98, 56.69].map((i) => i ** 10),
    PS: wt4 > 0 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (1 + 0.15 * n / 2) ** (milestones * 2)) : [1],
    TS: wt4 > 1
      ? [
        [1, 100],
        [1.05, 150],
        [1.1, 200],
        [1.15, 250],
        [1.2, 300],
        [1.25, 350],
        [1.3, 400],
        [1.35, 450],
        [1.4, 500],
        [1.45, 550],
        [1.5, 600],
        [1.55, 650],
      ].map(([k, e]) => k ** e)
      : [1],
    LS: ls,
  };
}

function getSimpleDamages(stats: number[], wt4: number, lbMax: number) {
  const damages = getDamages(stats, wt4, lbMax);
  Object.values(damages).forEach((row) => {
    for (let i = row.length - 1; i > 0; i -= 1) {
      row[i] /= row[i - 1];
    }
  });
  return damages;
}

function calcDaysFromDamage(damage: number) {
  if (damage <= 0) return 0;
  return Math.log(damage) / Math.log(1.066);
}

function targetDayFromApples(apples: number) {
  return 9855 + (apples * 365);
}

function formatBuildName(name: string) {
  return name || "Base Build";
}

type NodeType = {
  apples: number;
  damage: number;
  name: string;
  stats: Record<StatKey, number>;
  increment: (h: StatKey) => NodeType | null;
  computeName: () => void;
  getDays: () => number;
  getFlatNodes: () => number;
  getBalancedScore: (flatWeight: number) => number;
  getDetailedBuild: () => string;
};

function planAhead(form: FormPayload) {
  const wt4 = wt4ToLevel(form.wt4);
  const lbMax = Math.min(Number(form.lb_max), LB_MAX);
  const apples = Number(form.apples);
  const maxEa = Number(form.ea_max);

  if (wt4 > 0 && apples < 73) {
    throw new Error("Apples must be >= 73 for WT4.");
  }

  const simpleApples = getSimpleApples(lbMax, wt4) as StatMap;
  const simpleDamages = getSimpleDamages(
    [form.milestones, form.hp, form.mana, form.fifteen, form.max_ascension, form.starforce],
    wt4,
    lbMax,
  ) as StatMap;

  if (!form.smite_push) {
    simpleDamages.S = [1, 1];
  }

  const maxApples = apples + LOOK;
  let nodeCount = 0;

  class Node implements NodeType {
    apples = 0;
    damage = 1;
    name = "";
    stats: Record<StatKey, number>;

    constructor(other?: Node) {
      nodeCount += 1;
      if (other) {
        this.apples = other.apples;
        this.damage = other.damage;
        this.name = other.name;
        this.stats = { ...other.stats };
      } else {
        this.stats = {
          IN: 0, TD: 0, AT: 0, GW: 0, RD: 0, AS: 0,
          TE: 0, BL: 0, S: 0, BT: 0, EA: 0, AC: 0,
          FA: 0, AP: 0, MS: 0, LB: 0, SM: 0, PS: 0, TS: 0, LS: 0,
          PM: 0,
        };
      }
    }

    increment(h: StatKey) {
      const current = this.stats[h];
      if (current + 1 >= simpleApples[h].length) return null;

      const appleCost = simpleApples[h][current + 1];
      if (this.apples + appleCost >= maxApples) return null;

      const newNode = new Node(this);
      newNode.stats[h] = current + 1;
      newNode.apples += appleCost;
      newNode.damage *= simpleDamages[h][current + 1];
      return newNode;
    }

    computeName() {
      const names: string[] = [];
      if (this.stats.MS) names.push(`MS${this.stats.MS}`);
      if (this.stats.SM) names.push(`SM${this.stats.SM}`);
      if (this.stats.BT) names.push(`BT${this.stats.BT}`);
      if (this.stats.AC) names.push(`AC${this.stats.AC}`);
      if (this.stats.GW) names.push(`GW${this.stats.GW}`);
      if (this.stats.EA > 2) names.push(`EA${this.stats.EA}`);
      if (this.stats.LB > 2) names.push(`LB${this.stats.LB}`);
      if (this.stats.PS) names.push(`PS${this.stats.PS}`);
      if (this.stats.TS) names.push(`TS${this.stats.TS}`);
      this.name = names.join("+");
    }

    getDays() {
      return calcDaysFromDamage(this.damage);
    }

    getFlatNodes() {
      return (
        this.stats.IN
        + [0, 1, 3][this.stats.TD]
        + this.stats.RD
        + this.stats.AS
        + this.stats.TE
        + [0, 1, 3][this.stats.BL]
        + [0, 1, 3, 0, 0, 0, 0, 0, 0][this.stats.EA]
        + this.stats.FA
        + [0, 1, 3][this.stats.AP]
        + [0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0][this.stats.LB]
        + this.stats.PS
      );
    }

    getBalancedScore(flatWeight: number) {
      return this.getDays() - (this.getFlatNodes() * flatWeight);
    }

    getDetailedBuild() {
      const parts: string[] = [];
      HEADERS.forEach((h) => {
        const val = this.stats[h];
        if (val > 0) parts.push(`${h}${val}`);
      });
      return parts.join(", ");
    }
  }

  const dp: Record<string, Node>[] = Array.from({ length: maxApples + 1 }, () => ({}));

  const insertNode = (node?: Node | null) => {
    if (!node) return;
    node.computeName();
    dp[node.apples][node.name] = node;
  };

  let startNode = new Node();
  let start = 0;

  if (wt4 > 0) {
    startNode = startNode.increment("TE")!
      .increment("S")!
      .increment("BT")!
      .increment("BT")!
      .increment("BT")!
      .increment("EA")!
      .increment("PS")!;
    start += 10;
  }

  insertNode(startNode);

  for (let i = start; i < maxApples; i += 1) {
    Object.values(dp[i]).forEach((node) => {
      const teNode = node.stats.TE ? node : node.increment("TE");
      if (teNode) {
        if (form.use_bt || maxEa) {
          const sNode = teNode.stats.S ? teNode : teNode.increment("S");
          if (sNode) {
            insertNode(sNode.increment("BT"));
            if (maxEa > 2 && sNode.stats.BT >= 3) {
              if (sNode.stats.EA === 0) {
                const ea1 = sNode.increment("EA");
                const ea2 = ea1 ? ea1.increment("EA") : null;
                const ea3 = ea2 ? ea2.increment("EA") : null;
                insertNode(ea3);
              }
              if (sNode.stats.EA === 1) {
                const ea2 = sNode.increment("EA");
                const ea3 = ea2 ? ea2.increment("EA") : null;
                insertNode(ea3);
              }
              if (sNode.stats.EA > 2 && sNode.stats.EA < maxEa) {
                insertNode(sNode.increment("EA"));
              }
            }
          }
        }
        insertNode(teNode.increment("AC"));
      }

      if (!form.mage) {
        const inNode = node.stats.IN ? node : node.increment("IN");
        if (inNode && form.use_gw) {
          const pmNode = inNode.stats.PM ? inNode : inNode.increment("PM");
          if (pmNode) {
            const atNode = pmNode.stats.AT ? pmNode : pmNode.increment("AT");
            if (atNode) insertNode(atNode.increment("GW"));
          }
        }
      }

      if (form.mage) {
        const faNode = node.stats.FA ? node : node.increment("FA");
        if (faNode) {
          insertNode(faNode.increment("MS"));
          const lbNode = faNode.stats.LB ? faNode : faNode.increment("LB");
          if (lbNode) {
            if (lbNode.stats.LB === 1) {
              const lb2 = lbNode.increment("LB");
              const lb3 = lb2 ? lb2.increment("LB") : null;
              insertNode(lb3);
            } else {
              insertNode(lbNode.increment("LB"));
            }
            insertNode(lbNode.increment("SM"));
          }
        }
      }

      if (wt4 > 0) {
        insertNode(node.increment("TS"));
      }
    });
  }

  for (let i = start; i < maxApples - 1; i += 1) {
    if (i > start) {
      const nodes = Object.entries(dp[i]).sort((a, b) => b[1].damage - a[1].damage);
      if (nodes.length) {
        const prevNodes = dp[i - 1];
        const bestDamage = nodes[0][1].damage;
        const prevBestDamage = Object.values(prevNodes)[0]?.damage ?? 0;

        let j = 10;
        while (j < nodes.length) {
          const node = nodes[j][1];
          const prev = prevNodes[node.name];
          if (prev) {
            const delta = bestDamage / node.damage;
            const prevDelta = prevBestDamage / prev.damage;
            if (prevDelta && (delta / prevDelta) > 1.1) {
              nodes.splice(j, 1);
              continue;
            }
          }
          j += 1;
        }

        dp[i] = Object.fromEntries(nodes);
      }
    }

    Object.values(dp[i]).forEach((node) => {
      const prev1 = dp[i - 1]?.[node.name];
      const prev2 = dp[i - 2]?.[node.name];
      const prev3 = dp[i - 3]?.[node.name];

      let bestNode: Node | null = null;
      let bestDamage = 0;

      const testNode = (candidate?: Node | null) => {
        if (candidate && candidate.damage > bestDamage) {
          bestNode = candidate;
          bestDamage = candidate.damage * 1.001;
        }
      };

      const addCon = (h: StatKey) => {
        if (node.stats[h] + 1 < simpleDamages[h].length) {
          testNode(node.increment(h));
        }
      };

      const addPrevCon = (prev: Node | undefined, h: StatKey) => {
        if (prev && prev.stats[h] + 1 < simpleDamages[h].length) {
          testNode(prev.increment(h));
        }
      };

      addCon("TE");
      if (node.stats.TE) {
        if (!node.stats.BL) addCon("BL");
        if (form.smite_push && !node.stats.S) addCon("S");
        if (maxEa > 0 && node.stats.BT >= 3 && !node.stats.EA) addCon("EA");
      }

      if (prev1 && prev1.stats.TE) {
        if (prev1.stats.BL) addPrevCon(prev1, "BL");
        if (maxEa > 1 && prev1.stats.EA === 1) addPrevCon(prev1, "EA");
      }

      if (!form.mage) {
        addCon("IN");
        if (node.stats.IN) {
          if (!node.stats.TD) addCon("TD");
          if (node.stats.PM && !node.stats.AT) addCon("AT");
          addCon("RD");
          if (node.stats.RD) addCon("AS");
        }

        if (prev1 && prev1.stats.IN) {
          if (prev1.stats.TD) addPrevCon(prev1, "TD");
          if (prev1.stats.PM && prev1.stats.AT === 1) testNode(prev1.increment("AT"));
          if (!prev1.stats.PM) {
            const pm = prev1.increment("PM");
            if (pm) testNode(pm.increment("AT"));
          }
          if (!prev1.stats.RD) {
            const rd = prev1.increment("RD");
            if (rd) testNode(rd.increment("AS"));
          }
        }

        if (prev2 && prev2.stats.IN) {
          if (prev2.stats.PM && !prev2.stats.AT) {
            const at = prev2.increment("AT");
            if (at) testNode(at.increment("AT"));
          }
          if (!prev2.stats.RD) {
            const rd = prev2.increment("RD");
            if (rd) {
              const as1 = rd.increment("AS");
              if (as1) testNode(as1.increment("AS"));
            }
          }
        }

        if (prev3 && prev3.stats.IN) {
          if (!prev3.stats.PM) {
            const pm = prev3.increment("PM");
            if (pm) {
              const at1 = pm.increment("AT");
              if (at1) testNode(at1.increment("AT"));
            }
          }
          if (!prev3.stats.RD) {
            const rd = prev3.increment("RD");
            if (rd) {
              const as1 = rd.increment("AS");
              if (as1) {
                const as2 = as1.increment("AS");
                if (as2) testNode(as2.increment("AS"));
              }
            }
          }
        }
      }

      if (form.mage) {
        addCon("FA");
        if (node.stats.FA) {
          if (!node.stats.AP) addCon("AP");
          if (!node.stats.LB) addCon("LB");
        }

        if (prev1 && prev1.stats.FA) {
          if (prev1.stats.AP) addPrevCon(prev1, "AP");
          if (prev1.stats.LB === 1) addPrevCon(prev1, "LB");
        }
      }

      if (wt4 > 0) {
        addCon("PS");
        if (form.mage) {
          if (node.stats.TS && !node.stats.LS) addCon("LS");
          if (prev1 && prev1.stats.TS && prev1.stats.LS) addPrevCon(prev1, "LS");
        }
      }

      if (bestNode) insertNode(bestNode);
    });
  }

  const totalTreeCount = dp.reduce((total, map) => total + Object.keys(map).length, 0);
  return { dp, nodeCount, totalTreeCount };
}

function buildResultPages(apples: number, dp: Record<string, NodeType>[], showCount: number, sortMode: SortMode, flatWeight: number) {
  const pages: ResultPage[] = [];
  for (let k = apples; k < apples + LOOK; k += 1) {
    const values = Object.values(dp[k] ?? {});
    if (!values.length) continue;

    const absoluteBestDays = Math.max(...values.map((v) => v.getDays()));
    if (sortMode === "Balanced") {
      values.sort((a, b) => b.getBalancedScore(flatWeight) - a.getBalancedScore(flatWeight));
    } else {
      values.sort((a, b) => b.damage - a.damage);
    }

    const entries: ResultEntry[] = values.slice(0, showCount).map((node, idx) => {
      const days = node.getDays();
      const delta = days - absoluteBestDays;
      const flat = node.getFlatNodes();
      const score = node.getBalancedScore(flatWeight);
      return {
        rank: idx + 1,
        name: formatBuildName(node.name),
        days,
        delta: delta >= -0.001 ? 0 : Math.round(delta * 10) / 10,
        flat,
        score,
        build: node.getDetailedBuild() || "No nodes selected.",
      };
    });

    pages.push({
      apples: k,
      target_day: targetDayFromApples(k),
      best_days: absoluteBestDays,
      entries,
    });
  }

  return pages;
}

export function calculateWorldtree(form: FormPayload): ApiResponse {
  const { dp, nodeCount, totalTreeCount } = planAhead(form);
  const pages = buildResultPages(form.apples, dp, form.show_count, form.sort_mode, form.flat_weight);
  const perf_text = `${totalTreeCount.toLocaleString()} trees, ${nodeCount.toLocaleString()} nodes`;
  return { pages, perf_text };
}
