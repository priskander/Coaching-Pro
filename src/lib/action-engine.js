/**
 * action-engine.js — Action Generation & Mapping Engine
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else if (typeof root === "object" && root) root.ActionEngine = factory();
    else if (typeof globalThis !== "undefined") globalThis.ActionEngine = factory();
}(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : this), function () {

    var DEFAULT_CONFIG = {
        version: 1,
        windowMonths: 6,
        unmappedPolicy: "report",
        tiers: [
            { tier: 1, name: "coaching", keywords: ["coaching memo"] },
            { tier: 2, name: "training", keywords: ["training", "shadowing"] },
            { tier: 3, name: "verbal", keywords: ["verbal"] },
            { tier: 4, name: "written", keywords: ["written"] },
            { tier: 5, name: "dismissal-warning", keywords: ["dismissal warning", "dismissal"] },
            { tier: 6, name: "termination", keywords: ["termination", "zero tolerance"] }
        ],
        formalTier: 3,
        metrics: [
            { key: "tardiness", label: "Tardiness", category: "Not achieving tardiness target", rule: { op: "lt", value: 2.5 } },
            { key: "sales", label: "Sales %", category: "Outbound Upselling Campaign", rule: { op: "lt", value: 2.5 } },
            { key: "critical", label: "Critical Quality", category: "Quality - Critical Mistake", rule: { op: "lt", value: 2.5 } },
            { key: "nonCritical", label: "Non-Critical Quality", category: "Quality - Non Critical Mistake", rule: { op: "lt", value: 2.5 } },
            { key: "reached", label: "Reached Customers %", category: "Not achieving reachability percentage", rule: { op: "lt", value: 2.5 } },
            { key: "staffTime", label: "Staff Time", category: "Staff time shortage", rule: { op: "lt", value: 2.5 } },
            { key: "callback", label: "Call Back %", category: "Not achieving acceptance percentage", rule: { op: "lt", value: 2.5 } },
            { key: "openSR", label: "Open SR", category: null, rule: { op: "lt", value: 2.5 } },
            { key: "srCreation", label: "SR Creation", category: null, rule: { op: "lt", value: 2.5 } }
        ],
        overrides: []
    };

    var OPS = {
        lt: function (v, t) { return v < t; },
        lte: function (v, t) { return v <= t; },
        gt: function (v, t) { return v > t; },
        gte: function (v, t) { return v >= t; },
        eq: function (v, t) { return v === t; },
        neq: function (v, t) { return v !== t; }
    };

    function isBlank(v) { return v === "" || v === undefined || v === null || (typeof v === "number" && isNaN(v)); }
    function toNum(v) { if (isBlank(v)) return null; var n = typeof v === "number" ? v : Number(String(v).replace(/%$/, "").trim()); return isNaN(n) ? null : n; }
    function norm(s) { return String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " "); }
    function isCycle(c) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(c); }
    function cycleIndex(c) { var p = c.split("-"); return +p[0] * 12 + (+p[1] - 1); }
    function cycleFromIndex(i) { var y = Math.floor(i / 12), m = i % 12; return y + "-" + (m < 9 ? "0" : "") + (m + 1); }
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function cycleLabel(c) { return MONTHS[+c.slice(5) - 1] + " " + c.slice(0, 4); }

    function mergeConfig(over) {
        var c = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        if (!over) return c;
        Object.keys(over).forEach(function (k) {
            if (k === "metrics" && Array.isArray(over.metrics)) {
                var byKey = {}; c.metrics.forEach(function (m) { byKey[m.key] = m; });
                over.metrics.forEach(function (m) {
                    if (byKey[m.key]) Object.assign(byKey[m.key], m); else { c.metrics.push(Object.assign({}, m)); byKey[m.key] = m; }
                });
            } else c[k] = over[k];
        });
        return c;
    }

    function validateConfig(cfg) {
        var errs = [];
        if (!cfg || !Array.isArray(cfg.metrics)) return ["config.metrics must be an array"];
        var seen = {};
        cfg.metrics.forEach(function (m, i) {
            if (!m.key) errs.push("metrics[" + i + "] has no key");
            if (seen[m.key]) errs.push("duplicate metric key " + m.key); seen[m.key] = 1;
            if (!m.rule || !OPS[m.rule.op] || typeof m.rule.value !== "number") errs.push("metric " + m.key + " needs rule {op: lt|lte|gt|gte|eq|neq, value: number}");
        });
        if (!(cfg.windowMonths >= 1)) errs.push("windowMonths must be >= 1");
        if (["report", "manualReview"].indexOf(cfg.unmappedPolicy) === -1) errs.push("unmappedPolicy must be report | manualReview");
        return errs;
    }

    function tierOf(text, cfg) {
        var t = norm(text), best = { tier: 0, name: "none" };
        cfg.tiers.slice().sort(function (a, b) { return b.tier - a.tier; }).some(function (def) {
            if (def.keywords.some(function (k) { return t.indexOf(k) !== -1; })) { best = { tier: def.tier, name: def.name }; return true; }
            return false;
        });
        return best;
    }

    function levelFromTier(tier) { return tier >= 5 ? "Gross" : tier >= 3 ? "Bad Performance" : "General"; }

    function lookupStep(matrix, category, employeeType, occurrence) {
        if (!category) return { status: "NO_CATEGORY" };
        if (!(occurrence >= 1) || Math.floor(occurrence) !== occurrence) return { status: "BAD_OCCURRENCE", occurrence: occurrence };
        var row = (matrix || []).filter(function (m) { return norm(m.category) === norm(category) && norm(m.employeeType) === norm(employeeType); })[0];
        if (!row || !row.steps || !row.steps.length) return { status: "NO_MATRIX_ROW", category: category, employeeType: employeeType };
        var n = row.steps.length, idx = Math.min(occurrence, n);
        return {
            status: occurrence > n ? "BEYOND_SCALE" : "OK",
            lookupKey: row.category + "|" + row.employeeType + "|" + occurrence,
            matrixRowId: row.id || null, step: row.steps[idx - 1], stepIndex: idx, scaleLength: n,
            escalatedBeyondScale: occurrence > n, isLastStep: idx === n, notes: row.notes || ""
        };
    }

    function windowCycles(cycle, windowMonths) {
        var end = cycleIndex(cycle), out = [];
        for (var i = end - windowMonths + 1; i <= end; i++) out.push(cycleFromIndex(i));
        return out;
    }

    function latestCycle(agents, cfg) {
        var best = null;
        (agents || []).forEach(function (a) {
            cfg.metrics.forEach(function (m) {
                var series = (a.metrics || {})[m.key] || {};
                Object.keys(series).forEach(function (c) { if (isCycle(c) && toNum(series[c]) !== null && (best === null || cycleIndex(c) > cycleIndex(best))) best = c; });
            });
        });
        return best;
    }

    function aggregateAgent(agent, cycle, cfg) {
        var win = windowCycles(cycle, cfg.windowMonths), perMetric = {}, perCategory = {}, bad = [];
        cfg.metrics.forEach(function (m) {
            var series = (agent.metrics || {})[m.key] || {}, breach = [], values = {};
            win.forEach(function (c) {
                var raw = series[c], v = toNum(raw);
                if (isBlank(raw)) return;
                if (v === null) { bad.push({ metric: m.key, cycle: c, value: raw }); return; }
                values[c] = v;
                if (OPS[m.rule.op](v, m.rule.value)) breach.push(c);
            });
            perMetric[m.key] = { breachCycles: breach, values: values };
            if (breach.length) {
                var cat = m.category || ("(unmapped) " + m.key);
                var e = perCategory[cat] || (perCategory[cat] = { cycles: [], metrics: [], mapped: !!m.category });
                e.metrics.push(m.key);
                breach.forEach(function (c) { if (e.cycles.indexOf(c) === -1) e.cycles.push(c); });
            }
        });
        Object.keys(perCategory).forEach(function (k) { perCategory[k].cycles.sort(); perCategory[k].occurrences = perCategory[k].cycles.length; });
        return { perMetric: perMetric, perCategory: perCategory, unparseable: bad, window: win };
    }

    function applyOverrides(ctx, cfg, matrix) {
        var trace = [], flags = [], decision = ctx.decision, tier = ctx.tier;
        (cfg.overrides || []).forEach(function (o) {
            var w = o.when || {}, a = o.apply || {};
            if (w.category && norm(w.category) !== norm(ctx.category)) return;
            if (w.employeeType && norm(w.employeeType) !== norm(ctx.employeeType)) return;
            if (w.occurrenceGte != null && !(ctx.occurrence >= w.occurrenceGte)) return;
            if (w.tierGte != null && !(tier >= w.tierGte)) return;
            if (w.cycleFormalCountGte != null && !(ctx.cycleFormalCount >= w.cycleFormalCountGte)) return;
            if (a.minTier != null && tier < a.minTier) {
                var row = (matrix || []).filter(function (m) { return norm(m.category) === norm(ctx.category) && norm(m.employeeType) === norm(ctx.employeeType); })[0];
                var cand = row ? row.steps.filter(function (s) { return tierOf(s, cfg).tier >= a.minTier; })[0] : null;
                if (cand) { trace.push({ override: o.id, from: decision, to: cand }); decision = cand; tier = tierOf(cand, cfg).tier; }
                else flags.push("OVERRIDE_UNSATISFIABLE:" + o.id);
            }
            if (a.decision) { trace.push({ override: o.id, from: decision, to: a.decision }); decision = a.decision; tier = tierOf(decision, cfg).tier; }
            if (a.flag) flags.push(a.flag);
        });
        return { decision: decision, tier: tier, trace: trace, flags: flags };
    }

    function run(input) {
        var cfg = mergeConfig(input.config), problems = validateConfig(cfg).map(function (m) { return { code: "BAD_CONFIG", message: m }; });
        var agents = input.agents || [], matrix = input.matrix || [];
        var cycle = input.cycle || latestCycle(agents, cfg);
        var out = { cycle: cycle, config: cfg, actions: [], skipped: [], rolling: [], cycleSummaries: [], problems: problems };
        if (problems.length) return out;
        if (!cycle) { out.problems.push({ code: "NO_DATA", message: "No performance values found for any configured metric." }); return out; }
        if (!isCycle(cycle)) { out.problems.push({ code: "BAD_CYCLE", message: "cycle must be YYYY-MM, got " + cycle }); return out; }

        var existingKeys = {}, legacy = [];
        (input.existing || []).forEach(function (a) { if (a.engineKey) existingKeys[a.engineKey] = a; else legacy.push(a); });
        var metricOrder = {}; cfg.metrics.forEach(function (m, i) { metricOrder[m.key] = i; });

        agents.forEach(function (agent) {
            var who = { pid: agent.pid || "", name: agent.name || "" };
            var agg = aggregateAgent(agent, cycle, cfg);

            var rollingRow = { pid: who.pid, name: who.name, cycle: cycle, window: agg.window, categories: {}, totalOccurrences: 0 };
            Object.keys(agg.perCategory).forEach(function (cat) {
                rollingRow.categories[cat] = { occurrences: agg.perCategory[cat].occurrences, cycles: agg.perCategory[cat].cycles, metrics: agg.perCategory[cat].metrics, mapped: agg.perCategory[cat].mapped };
                rollingRow.totalOccurrences += agg.perCategory[cat].occurrences;
            });
            rollingRow.metrics = {}; cfg.metrics.forEach(function (m) { rollingRow.metrics[m.key] = { occurrences: agg.perMetric[m.key].breachCycles.length, cycles: agg.perMetric[m.key].breachCycles }; });

            var violating = cfg.metrics.filter(function (m) { return agg.perMetric[m.key].breachCycles.indexOf(cycle) !== -1; });
            var entries = [];
            violating.forEach(function (m) {
                var base = { pid: who.pid, name: who.name, metric: m.key, metricLabel: m.label || m.key, category: m.category, cycle: cycle };
                if (agent.eligibility && agent.eligibility.eligible === false) {
                    out.skipped.push(Object.assign(base, { reason: "GRACE_PERIOD", detail: agent.eligibility.status })); return;
                }
                if (!m.category) {
                    out.skipped.push(Object.assign(base, { reason: "NO_CATEGORY", detail: "Metric has no matrix category" })); return;
                }
                if (!agent.employeeType) {
                    out.skipped.push(Object.assign(base, { reason: "NO_EMPLOYEE_TYPE", detail: "Employee Type missing" })); return;
                }
                var occurrence = agg.perCategory[m.category].occurrences;
                var lk = lookupStep(matrix, m.category, agent.employeeType, occurrence);
                if (lk.status === "NO_MATRIX_ROW") {
                    out.skipped.push(Object.assign(base, { reason: "NO_MATRIX_ROW", occurrence: occurrence })); return;
                }
                entries.push({ m: m, base: base, occurrence: occurrence, lk: lk });
            });

            var tiers = entries.map(function (e) { return e.lk.step ? tierOf(e.lk.step, cfg).tier : 0; });
            var formalCount = tiers.filter(function (t) { return t >= cfg.formalTier; }).length;

            entries.sort(function (a, b) { return metricOrder[a.m.key] - metricOrder[b.m.key]; });
            var agentActions = [];
            entries.forEach(function (e) {
                var m = e.m, lk = e.lk, flags = [];
                var step = lk.step || "", t = lk.step ? tierOf(step, cfg) : { tier: 0, name: "none" };
                var ov = applyOverrides({ decision: step, tier: t.tier, category: m.category, employeeType: agent.employeeType, occurrence: e.occurrence, cycleFormalCount: formalCount }, cfg, matrix);
                step = ov.decision; t = { tier: ov.tier, name: tierOf(step, cfg).name };
                if (lk.escalatedBeyondScale) flags.push("ESCALATED_BEYOND_SCALE");

                var key = (who.pid || norm(who.name)) + "|" + m.category + "|" + cycle + "|" + m.key;
                var months = agg.perMetric[m.key].breachCycles;
                var incidentDates = months.map(function (c) { return { month: MONTHS[+c.slice(5) - 1], year: c.slice(0, 4) }; });

                var scaleTxt = lk.scaleLength ? (lk.escalatedBeyondScale ? " (beyond matrix scale)" : " of " + lk.scaleLength) : "";
                var payload = {
                    employeeName: who.name, pid: who.pid, employeeType: agent.employeeType,
                    descriptionOfEvent: m.category, incidentDates: incidentDates,
                    decision: step, levelOfIncident: step ? levelFromTier(t.tier) : "",
                    actionPlan: "Focus area: " + (m.label || m.key) + " — occurrence #" + e.occurrence + scaleTxt,
                    comments: "Auto-generated from Matrix for " + cycleLabel(cycle) + "."
                };
                var action = {
                    engineKey: key,
                    sequence: 0, sequenceOf: 0,
                    payload: payload,
                    mapping: {
                        metric: m.key, metricLabel: m.label || m.key, cycle: cycle,
                        category: m.category, employeeType: agent.employeeType, occurrence: e.occurrence,
                        matrixStep: lk.step || null
                    },
                    flags: flags,
                    escalatedBeyondScale: !!lk.escalatedBeyondScale
                };
                agentActions.push(action);
            });

            agentActions.forEach(function (a, i) { a.sequence = i + 1; a.sequenceOf = agentActions.length; });
            agentActions.forEach(function (a) { out.actions.push(a); });

            rollingRow.actionsGenerated = agentActions.length;
            out.rolling.push(rollingRow);
            out.cycleSummaries.push({ pid: who.pid, name: who.name, cycle: cycle, violations: violating.length, actionsGenerated: agentActions.length });
        });
        return out;
    }

    function metricsFromMonthGrid(grid, latestMonthIdx, latestYear) {
        var metrics = {};
        (grid || []).forEach(function (row, i) {
            var year = i > latestMonthIdx ? latestYear - 1 : latestYear;
            var cyc = year + "-" + (i < 9 ? "0" : "") + (i + 1);
            Object.keys(row || {}).forEach(function (k) { if (!isBlank(row[k])) (metrics[k] = metrics[k] || {})[cyc] = row[k]; });
        });
        return metrics;
    }

    return {
        DEFAULT_CONFIG: DEFAULT_CONFIG, mergeConfig: mergeConfig, validateConfig: validateConfig,
        lookupStep: lookupStep, tierOf: tierOf, aggregateAgent: aggregateAgent, windowCycles: windowCycles, latestCycle: latestCycle,
        run: run, metricsFromMonthGrid: metricsFromMonthGrid, cycleLabel: cycleLabel
    };
}));
