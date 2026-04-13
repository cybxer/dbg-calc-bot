import { useEffect, useState } from "react";
import { calculateWorldtree } from "./calc.js";

const DEFAULT_FORM = {
  apples: 73,
  milestones: 0,
  hp: 0,
  mana: 0,
  fifteen: 0,
  max_ascension: 0,
  starforce: 0,
  wt4: "None",
  mage: false,
  smite_push: false,
  use_bt: false,
  use_gw: false,
  ea_max: 0,
  lb_max: 0,
  show_count: 3,
  sort_mode: "Balanced",
  flat_weight: 5,
};

const STORAGE_KEY = "dbg-worldtree-activity-form";
const rawDiscordClientId = import.meta.env.VITE_DISCORD_CLIENT_ID ?? "";
const DISCORD_CLIENT_ID =
  rawDiscordClientId === "YOUR_DISCORD_APPLICATION_ID" ? "" : rawDiscordClientId;

const MILESTONE_DATA = [
  ["1", "10K"],
  ["2", "100K"],
  ["3", "1M"],
  ["4", "10M"],
  ["5", "100M"],
  ["6", "1B"],
  ["7", "10B"],
  ["8", "100B"],
  ["9", "1T"],
  ["10", "10T"],
  ["11", "100T"],
  ["12", "1aa"],
  ["13", "10aa"],
  ["14", "100aa"],
  ["15", "1ab"],
  ["16", "10ab"],
  ["17", "100ab"],
  ["18", "1ac"],
  ["19", "10ac"],
  ["20", "100ac"],
  ["21", "1ad"],
  ["22", "10ad"],
  ["23", "100ad"],
  ["24", "1ae"],
  ["25", "10ae"],
  ["26", "100ae"],
  ["27", "1af"],
  ["28", "10af"],
  ["29", "100af"],
  ["30", "1ag"],
  ["31", "10ag"],
  ["32", "100ag"],
  ["33", "1ah"],
  ["34", "10ah"],
  ["35", "100ah"],
  ["36", "1ai"],
  ["37", "10ai"],
  ["38", "100ai"],
  ["39", "1aj"],
  ["40", "10aj"],
  ["41", "100aj"],
  ["42", "1ak"],
];

const LB_DATA = [
  ["LB 1", "250.00al"],
  ["LB 2", "250.00ap"],
  ["LB 3", "250.00av"],
  ["LB 4", "250.00bd"],
  ["LB 5", "250.00bn"],
  ["LB 6", "250.00bz"],
  ["LB 7", "250.00cn"],
  ["LB 8", "250.00dd"],
  ["LB 9", "250.00dw"],
];

function normalizeNumber(value, fallback = 0) {
  return value === "" ? fallback : value;
}

function loadSavedForm() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    return {
      ...DEFAULT_FORM,
      ...JSON.parse(saved),
    };
  } catch {
    return null;
  }
}

function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [results, setResults] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [referenceOpen, setReferenceOpen] = useState(false);
  const isDiscordHost = window.location.origin.includes("discordsays.com");

  useEffect(() => {
    const savedForm = loadSavedForm();
    if (savedForm) {
      setForm(savedForm);
    }
  }, []);

  useEffect(() => {
    if (!isDiscordHost || !DISCORD_CLIENT_ID) {
      return;
    }

    let isCancelled = false;

    async function setupDiscordSdk() {
      try {
        const { DiscordSDK } = await import("@discord/embedded-app-sdk");
        if (isCancelled) {
          return;
        }

        const discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await discordSdk.ready();
      } catch {
        // Keep the calculator usable even if the embedded SDK is unavailable.
      }
    }

    void setupDiscordSdk();

    return () => {
      isCancelled = true;
    };
  }, [isDiscordHost]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage issues and keep the calculator usable.
    }
  }, [form]);

  const currentPage = results?.pages[pageIndex] ?? null;
  const bestEntry = currentPage?.entries[0] ?? null;

  async function handleCalculate() {
    setStatus("Calculating...");
    setError("");

    try {
      const requestPayload = {
        apples: normalizeNumber(form.apples, 73),
        milestones: normalizeNumber(form.milestones),
        hp: normalizeNumber(form.hp),
        mana: normalizeNumber(form.mana),
        fifteen: normalizeNumber(form.fifteen),
        max_ascension: normalizeNumber(form.max_ascension),
        starforce: normalizeNumber(form.starforce),
        wt4: form.wt4,
        mage: form.mage,
        smite_push: form.smite_push,
        use_bt: form.use_bt,
        use_gw: form.use_gw,
        ea_max: normalizeNumber(form.ea_max),
        lb_max: normalizeNumber(form.lb_max),
        show_count: normalizeNumber(form.show_count, 3),
        sort_mode: form.sort_mode,
        flat_weight: normalizeNumber(form.flat_weight, 5),
      };
      const resultPayload = calculateWorldtree(requestPayload);
      setResults(resultPayload);
      setPageIndex(0);
      setStatus(resultPayload.perf_text);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unknown error.";
      setError(message);
      setStatus("Calculation failed.");
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetAll() {
    setForm(DEFAULT_FORM);
    setResults(null);
    setError("");
    setStatus("Reset to defaults.");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage issues.
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">DBG Calculator</p>
          <h1>Monarchs World Tree Planner</h1>
          <p className="hero-copy">Credit to Monarch for the original calc.</p>
        </div>
      </section>

      <section className="layout">
        <div className="card form-card">
          <div className="section-head">
            <h2>Player Stats</h2>
          </div>

          <div className="input-grid">
            <NumberField label="Apples" value={form.apples} onChange={(value) => updateField("apples", value)} />
            <NumberField
              label="Milestones"
              value={form.milestones}
              onChange={(value) => updateField("milestones", value)}
              actionLabel="Lookup"
              onAction={() => setReferenceOpen(true)}
            />
            <NumberField label="Max HP" value={form.hp} onChange={(value) => updateField("hp", value)} />
            <NumberField label="Mana" value={form.mana} onChange={(value) => updateField("mana", value)} />
            <NumberField label="15* Heroes" value={form.fifteen} onChange={(value) => updateField("fifteen", value)} />
            <NumberField label="Max Ascension" value={form.max_ascension} onChange={(value) => updateField("max_ascension", value)} />
            <NumberField label="Starforce" value={form.starforce} onChange={(value) => updateField("starforce", value)} />
          </div>

          <div className="section-head split-head">
            <h2>Settings & Toggles</h2>
          </div>

          <div className="input-grid">
            <SelectField label="WT4" value={form.wt4} onChange={(value) => updateField("wt4", value)} options={["None", "Perfect Storm", "Wind", "Cold", "Holy"]} />
            <NumberField label="EA Max" value={form.ea_max} onChange={(value) => updateField("ea_max", value)} />
            <NumberField
              label="LB Max"
              value={form.lb_max}
              onChange={(value) => updateField("lb_max", value)}
              actionLabel="Lookup"
              onAction={() => setReferenceOpen(true)}
            />
            <SelectField label="Sort" value={form.sort_mode} onChange={(value) => updateField("sort_mode", value)} options={["Balanced", "Max Push"]} />
            <NumberField label="Show Count" value={form.show_count} onChange={(value) => updateField("show_count", value)} />
            <NumberField label="Flat Weight" value={form.flat_weight} step="0.1" onChange={(value) => updateField("flat_weight", value)} />
          </div>

          <div className="toggle-row">
            <ToggleButton label="Mage" enabled={form.mage} onClick={() => updateField("mage", !form.mage)} />
            <ToggleButton label="Smite" enabled={form.smite_push} onClick={() => updateField("smite_push", !form.smite_push)} />
            <ToggleButton label="BT" enabled={form.use_bt} onClick={() => updateField("use_bt", !form.use_bt)} />
            <ToggleButton label="GW" enabled={form.use_gw} onClick={() => updateField("use_gw", !form.use_gw)} />
          </div>

          <div className="action-row">
            <button className="primary-button" onClick={handleCalculate}>Run Calculator</button>
            <button className="ghost-button" onClick={resetAll}>Reset</button>
          </div>

          <details className="terminology-box">
            <summary>Terminology Guide</summary>
            <div className="term-grid">
              <div>
                <h4>Traveler</h4>
                <p><strong>IN</strong> Influence</p>
                <p><strong>TD</strong> Time Dilation</p>
                <p><strong>PM</strong> Path Mastery</p>
                <p><strong>AT</strong> Astral Travel</p>
                <p><strong>GW</strong> Gawain&apos;s Grace</p>
                <p><strong>RD</strong> Raison D&apos;etre</p>
                <p><strong>AS</strong> Ascende Superius</p>
              </div>
              <div>
                <h4>Defender</h4>
                <p><strong>TE</strong> Third Eye</p>
                <p><strong>BL</strong> Bloodlust</p>
                <p><strong>BT</strong> Bloodthirster</p>
                <p><strong>EA</strong> Excruciating Agony</p>
                <p><strong>BV</strong> Blood Vessel</p>
                <p><strong>AC</strong> Astaroth&apos;s Curse</p>
              </div>
              <div>
                <h4>Conjurer</h4>
                <p><strong>FA</strong> Forbidden Arts</p>
                <p><strong>AP</strong> Arcane Pulse</p>
                <p><strong>MS</strong> Mana Siphon/Surge</p>
                <p><strong>LB</strong> Limit Break</p>
                <p><strong>SM</strong> Spell Master</p>
              </div>
              <div>
                <h4>Enhancer</h4>
                <p><strong>PS</strong> Perfect Storm</p>
                <p><strong>TS</strong> Thirster Smite</p>
                <p><strong>LS</strong> Limit Smite</p>
                <p><strong>WS/CS/HS</strong> Wind/Cold/Holy Smite</p>
                <p><strong>RT/CT/GT</strong> Ray/Chill/Gale Thirster</p>
              </div>
            </div>
          </details>
        </div>

        <div className="card result-card">
          <div className="section-head">
            <h2>Results</h2>
            <p>{status}</p>
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          {!currentPage || !bestEntry ? (
            <div className="placeholder-panel">
              <p>Run the calculator to see the best build, recommended node path, and a few alternates.</p>
            </div>
          ) : (
            <>
              <div className="stat-strip">
                <Metric label="Apples" value={String(currentPage.apples)} />
                <Metric label="Target Day" value={String(currentPage.target_day)} />
                <Metric label="Best Push" value={`+${currentPage.best_days.toFixed(1)}d`} />
                <Metric label="Mode" value={form.sort_mode} />
              </div>

              <div className="primary-result">
                <div className="result-title-row">
                  <div>
                    <p className="eyebrow">Top Build</p>
                    <h3>{bestEntry.name}</h3>
                  </div>
                  <div className="page-controls">
                    <button
                      className="ghost-button small"
                      disabled={!results || pageIndex === 0}
                      onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                    >
                      Prev
                    </button>
                    <span>{pageIndex + 1}/{results?.pages.length ?? 1}</span>
                    <button
                      className="ghost-button small"
                      disabled={!results || pageIndex >= (results.pages.length - 1)}
                      onClick={() => setPageIndex((current) => Math.min((results?.pages.length ?? 1) - 1, current + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="nodes-box">{bestEntry.build}</div>

                <div className="detail-grid">
                  <Metric label="Push" value={`+${bestEntry.days.toFixed(1)}d`} />
                  <Metric label="Delta" value={bestEntry.delta.toFixed(1)} />
                  <Metric label="Score" value={bestEntry.score.toFixed(1)} />
                  <Metric label="Flat" value={String(bestEntry.flat)} />
                </div>
              </div>

              {currentPage.entries.length > 1 ? (
                <div className="alt-list">
                  <p className="eyebrow">Also Worth Checking</p>
                  {currentPage.entries.slice(1).map((entry) => (
                    <div key={`${entry.rank}-${entry.name}`} className="alt-card">
                      <div className="alt-header">
                        <strong>#{entry.rank} {entry.name}</strong>
                        <span>+{entry.days.toFixed(1)}d</span>
                      </div>
                      <div className="alt-build">{entry.build}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {referenceOpen ? (
        <ReferenceSheet onClose={() => setReferenceOpen(false)} />
      ) : null}
    </main>
  );
}

function NumberField({ label, value, onChange, step, actionLabel, onAction }) {
  const [rawValue, setRawValue] = useState(value === "" ? "" : String(value));

  useEffect(() => {
    setRawValue(value === "" ? "" : String(value));
  }, [value]);

  return (
    <label className="field">
      <span className="field-label">
        <span>{label}</span>
        {actionLabel && onAction ? (
          <button
            type="button"
            className="field-link"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </span>
      <input
        type="number"
        value={rawValue}
        step={step}
        onChange={(event) => {
          const nextValue = event.target.value;
          setRawValue(nextValue);
          onChange(nextValue === "" ? "" : Number(nextValue));
        }}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleButton({ label, enabled, onClick }) {
  return (
    <button className={enabled ? "toggle enabled" : "toggle"} onClick={onClick}>
      {label} {enabled ? "ON" : "OFF"}
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReferenceSheet({ onClose }) {
  return (
    <div className="reference-overlay" role="dialog" aria-modal="true" aria-label="Milestones and Limit Break reference">
      <div className="reference-card">
        <div className="reference-head">
          <div>
            <p className="eyebrow">Reference Sheet</p>
            <h2>Milestones and LB Max</h2>
            <p className="hero-copy">Quick lookup for skill milestones and Limit Break costs.</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="reference-grid">
          <section className="reference-section">
            <h3>Skill Milestones</h3>
            <div className="reference-table-wrap">
              <table className="reference-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Skill Level</th>
                  </tr>
                </thead>
                <tbody>
                  {MILESTONE_DATA.map(([level, value]) => (
                    <tr key={level}>
                      <td>{level}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="reference-section">
            <h3>Limit Break Costs</h3>
            <table className="reference-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Gold Cost</th>
                </tr>
              </thead>
              <tbody>
                {LB_DATA.map(([level, value]) => (
                  <tr key={level}>
                    <td>{level}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
