/**
 * coaching-trend.js — Section 2 Performance Trend, Dynamic Field Visibility for Strength & Development Areas,
 * SMART Coaching Notes, and Justification Report.
 */
import { kpiLibrary } from './kpi-library.js';
import { escapeHtml, isValidFieldContent } from './utils.js';

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const PERF_COLUMNS = [
    { key: "reached", label: "Reached Customers %" },
    { key: "callback", label: "Call Back%" },
    { key: "sales", label: "Sales %" },
    { key: "openSR", label: "Open SR" },
    { key: "critical", label: "Critical" },
    { key: "nonCritical", label: "Non Critical" },
    { key: "srCreation", label: "SR Creation" },
    { key: "staffTime", label: "Staff Time" },
    { key: "tardiness", label: "Tardiness" },
    { key: "what", label: "WHAT" }
];

export const PERF_FIELD_ALIASES = {
    month: ["month"],
    name: ["name", "agent name", "agent full name"],
    pid: ["pid", "agent id", "agent performance id", "employee id", "emp id", "id"],
    email: ["email", "agent email", "email address", "e-mail", "mail"],
    reached: ["reached customers %", "reached customer %", "reached customers%", "reached customers", "% reached customers"],
    callback: ["call back%", "call back %", "callback%", "call back"],
    sales: ["sales percentage", "sales %", "sales%", "sales"],
    openSR: ["open sr"],
    critical: ["critical"],
    nonCritical: ["non critical"],
    srCreation: ["sr creation"],
    staffTime: ["staff time"],
    tardiness: ["tardiness"],
    what: ["what"],
    teamLeader: ["team leader", "team leader name", "team lead", "tl", "manager", "manager name", "supervisor"]
};

export const EXTRA_COACHING_NOTE_OPTIONS = [
    { id: "extra_rejection", kpiName: "Rejection Percentage", equation: "", whatCalculation: "", coachingNotes: "*Make sure to choose the right reason for customer rejection in the subarea" },
    { id: "extra_wrongsr", kpiName: "Wrong SR", equation: "", whatCalculation: "", coachingNotes: "*Avoid missing smart script\n*Avoid missing questions in the smart script\n*Fill in all the requested data in the attack acceptance SR" },
    { id: "extra_adherence", kpiName: "Adherence", equation: "", whatCalculation: "", coachingNotes: "*Avoid using unnecessary Not Ready time, as this reflects in your adherence\n*Not Ready percentage should not exceed 1% of your login time" }
];

export function getCoachingNoteOption(id) {
    return kpiLibrary.find(k => k.id === id) || EXTRA_COACHING_NOTE_OPTIONS.find(k => k.id === id) || null;
}

export let performanceData = MONTH_LABELS.map(() => ({
    reached: "", callback: "", sales: "", openSR: "", critical: "",
    nonCritical: "", srCreation: "", staffTime: "", tardiness: "", what: ""
}));

export let strengthPointSelections = [];
export let developmentAreaSelections = [];
export let coachingNotesOverrides = {};

export function setPerformanceData(newData) {
    performanceData = newData;
}

export function normPerfLabel(h) {
    return String(h == null ? "" : h).trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchPerfField(rowObj, fieldKey) {
    const aliases = PERF_FIELD_ALIASES[fieldKey] || [];
    const keys = Object.keys(rowObj);
    for (const alias of aliases) {
        let found;
        for (const k of keys) {
            const bare = k.replace(/_\d+$/, "");
            if (normPerfLabel(bare) === alias) {
                const v = rowObj[k];
                if (v !== undefined && v !== null && v !== "") found = v;
            }
        }
        if (found !== undefined) return found;
    }
    return "";
}

export function renderPerfTableHeader() {
    const row = document.getElementById("perfTableHeadRow");
    if (!row) return;
    let html = '<th class="p-1.5 border border-slate-300 break-words" style="width:10%">Month</th>';
    PERF_COLUMNS.forEach(col => {
        const kpi = kpiLibrary.find(k => k.id === col.key && k.isTrendColumn);
        const label = kpi ? kpi.kpiName : col.label;
        const title = kpi && kpi.description ? ' title="' + escapeHtml(kpi.description) + '"' : "";
        html += '<th data-ui="ui.coaching.col.trend.' + col.key + '" class="p-1.5 border border-slate-300 break-words" style="width:10%"' + title + '>' + escapeHtml(label) + '</th>';
    });
    row.innerHTML = html;
}

export function perfCellIsLow(val) {
    if (val === "" || val === null || val === undefined) return false;
    const n = Number(val);
    return !isNaN(n) && n < 3;
}

export function renderPerformanceTable() {
    renderPerfTableHeader();
    const tbody = document.getElementById("perfTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    performanceData.forEach((row, i) => {
        const tr = document.createElement("tr");
        let html = '<td class="p-1.5 border border-slate-300 font-semibold">' + MONTH_LABELS[i] + '</td>';
        PERF_COLUMNS.forEach(col => {
            const val = row[col.key] === undefined || row[col.key] === null ? "" : row[col.key];
            html += '<td class="p-1.5 border border-slate-300">' +
                '<input type="text" data-perf-row="' + i + '" data-perf-col="' + col.key + '" value="' + escapeHtml(val) + '" ' +
                'oninput="onPerfCellInput(this)" class="w-full text-center border-0 focus:ring-1 focus:ring-teal-500 outline-none rounded px-1 py-0.5 ' + (perfCellIsLow(val) ? "bg-red-100 text-red-800 font-semibold" : "") + '">' +
                '</td>';
        });
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    updatePerfCounts();
}

export function onPerfCellInput(el) {
    const i = Number(el.getAttribute("data-perf-row"));
    const colKey = el.getAttribute("data-perf-col");
    performanceData[i][colKey] = el.value;
    el.classList.toggle("bg-red-100", perfCellIsLow(el.value));
    el.classList.toggle("text-red-800", perfCellIsLow(el.value));
    el.classList.toggle("font-semibold", perfCellIsLow(el.value));
    updatePerfCounts();
}

export function updatePerfCounts() {
    const counts = {};
    PERF_COLUMNS.forEach(col => {
        const count = performanceData.reduce((acc, row) => acc + (perfCellIsLow(row[col.key]) ? 1 : 0), 0);
        counts[col.key] = count;
        const el = document.getElementById("perfCount_" + col.key);
        if (el) el.textContent = count;
    });
    autoAssignStrengthDevelopmentFromTotals(counts);
}

export function autoAssignStrengthDevelopmentFromTotals(counts) {
    const scored = PERF_COLUMNS.filter(c => c.key !== "what").map(col => ({
        key: col.key,
        total: counts[col.key] || 0
    }));

    // Derive development areas, filtering to valid non-empty items
    developmentAreaSelections = pickDevelopmentAreas(scored).filter(isValidFieldContent);

    // Derive strength points (Total of 0), filtering to valid non-empty items
    const strong = scored.filter(s => s.total === 0);
    strengthPointSelections = strong.slice(0, 5).map(s => s.key).filter(isValidFieldContent);

    coachingNotesOverrides = {};
    renderStrengthDevelopmentLists();
}

export function getLastFilledMonthIndex() {
    for (let i = performanceData.length - 1; i >= 0; i--) {
        const hasData = PERF_COLUMNS.some(col =>
            col.key !== "what" &&
            performanceData[i][col.key] !== "" &&
            performanceData[i][col.key] !== undefined &&
            performanceData[i][col.key] !== null
        );
        if (hasData) return i;
    }
    return performanceData.length - 1;
}

export function kpiWeightOf(key) {
    const kpi = kpiLibrary.find(k => k.id === key);
    const w = kpi ? Number(kpi.weight) : NaN;
    return isNaN(w) ? 0 : w;
}

export function computeScoredTotals() {
    return PERF_COLUMNS.filter(c => c.key !== "what").map(col => ({
        key: col.key,
        total: performanceData.reduce((acc, row) => acc + (perfCellIsLow(row[col.key]) ? 1 : 0), 0)
    }));
}

export function analyzeMissedKpis(scored) {
    const lastMonth = getLastFilledMonthIndex();
    const monthRow = performanceData[lastMonth] || {};

    const missed = scored
        .filter(s => perfCellIsLow(monthRow[s.key]))
        .map(s => ({
            key: s.key,
            total: s.total,
            weight: kpiWeightOf(s.key),
            lastScore: monthRow[s.key]
        }));

    missed.sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight;
        return b.total - a.total;
    });

    return { lastMonth: lastMonth, lastMonthLabel: MONTH_LABELS[lastMonth], missed: missed };
}

export function pickDevelopmentAreas(scored) {
    return analyzeMissedKpis(scored).missed.slice(0, 5).map(s => s.key);
}

/**
 * Requirement 2: Dynamic Field Visibility (Dashed / Empty Data)
 * Automatically detect and hide any empty or dashed fields (e.g. "-") in Strength and Development Areas.
 * Only render and display when valid content exists.
 */
export function renderStrengthDevelopmentLists() {
    const strengthWrap = document.getElementById("strengthPointsList");
    const devWrap = document.getElementById("developmentAreasList");
    if (!strengthWrap || !devWrap) return;
    strengthWrap.innerHTML = "";
    devWrap.innerHTML = "";

    const trendOptions = kpiLibrary.filter(k => k.isTrendColumn && k.id !== "what")
        .map(k => ({ id: k.id, label: k.kpiName }))
        .concat(EXTRA_COACHING_NOTE_OPTIONS.map(k => ({ id: k.id, label: k.kpiName })));
    const optionsHtml = ['<option value="">— Select —</option>'].concat(
        trendOptions.map(o => '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.label) + '</option>')
    ).join("");

    // --- STRENGTH POINTS: Filter out any empty, dashed, or invalid items ---
    const validStrength = [];
    strengthPointSelections.forEach((val, idx) => {
        if (isValidFieldContent(val)) {
            validStrength.push({ val: val, idx: idx });
        }
    });

    if (validStrength.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.className = "text-[11px] text-slate-400 italic py-1 no-print pdf-exclude";
        emptyMsg.textContent = "No strength points identified (Total = 0).";
        strengthWrap.appendChild(emptyMsg);
    } else {
        validStrength.forEach((item, num) => {
            const sRow = document.createElement("div");
            sRow.className = "flex items-center gap-2 dynamic-field-row";
            sRow.innerHTML =
                '<span class="w-5 text-center font-bold text-emerald-800 bg-emerald-100 rounded text-[11px] py-0.5">' + (num + 1) + '</span>' +
                '<select data-strength-idx="' + item.idx + '" onchange="onStrengthChange(this)" class="flex-1 border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white">' +
                    optionsHtml +
                '</select>' +
                '<button type="button" onclick="removeStrengthPoint(' + item.idx + ')" class="no-print pdf-exclude text-slate-400 hover:text-red-600 px-1.5 py-0.5 text-xs rounded transition" title="Remove strength point">✕</button>';
            strengthWrap.appendChild(sRow);
            sRow.querySelector("select").value = item.val;
        });
    }

    // Add button (only shown when < 5 items, completely excluded from PDF)
    if (validStrength.length < 5) {
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "no-print pdf-exclude btn-add-item text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 rounded px-2.5 py-1 transition flex items-center gap-1 mt-1";
        addBtn.innerHTML = '<span>+</span> <span>Add Strength Point</span>';
        addBtn.onclick = function () {
            strengthPointSelections.push("");
            // Re-render with new slot
            renderNewSlot('strength');
        };
        strengthWrap.appendChild(addBtn);
    }

    // --- DEVELOPMENT AREAS: Filter out any empty, dashed, or invalid items ---
    const validDev = [];
    developmentAreaSelections.forEach((val, idx) => {
        if (isValidFieldContent(val)) {
            validDev.push({ val: val, idx: idx });
        }
    });

    if (validDev.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.className = "text-[11px] text-slate-400 italic py-1 no-print pdf-exclude";
        emptyMsg.textContent = "No development areas identified.";
        devWrap.appendChild(emptyMsg);
    } else {
        validDev.forEach((item, num) => {
            const dRow = document.createElement("div");
            dRow.className = "flex items-center gap-2 dynamic-field-row";
            dRow.innerHTML =
                '<span class="w-5 text-center font-bold text-amber-800 bg-amber-100 rounded text-[11px] py-0.5">' + (num + 1) + '</span>' +
                '<select data-dev-idx="' + item.idx + '" onchange="onDevAreaChange(this)" class="flex-1 border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-amber-500 text-xs bg-white">' +
                    optionsHtml +
                '</select>' +
                '<button type="button" onclick="removeDevArea(' + item.idx + ')" class="no-print pdf-exclude text-slate-400 hover:text-red-600 px-1.5 py-0.5 text-xs rounded transition" title="Remove development area">✕</button>';
            devWrap.appendChild(dRow);
            dRow.querySelector("select").value = item.val;
        });
    }

    // Add button (only shown when < 5 items, completely excluded from PDF)
    if (validDev.length < 5) {
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "no-print pdf-exclude btn-add-item text-[11px] font-medium text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 rounded px-2.5 py-1 transition flex items-center gap-1 mt-1";
        addBtn.innerHTML = '<span>+</span> <span>Add Development Area</span>';
        addBtn.onclick = function () {
            developmentAreaSelections.push("");
            renderNewSlot('dev');
        };
        devWrap.appendChild(addBtn);
    }

    renderCoachingNotes();
    renderDevelopmentAreaReport();
}

function renderNewSlot(type) {
    const wrap = type === 'strength' ? document.getElementById("strengthPointsList") : document.getElementById("developmentAreasList");
    const arr = type === 'strength' ? strengthPointSelections : developmentAreaSelections;
    const idx = arr.length - 1;
    const trendOptions = kpiLibrary.filter(k => k.isTrendColumn && k.id !== "what")
        .map(k => ({ id: k.id, label: k.kpiName }))
        .concat(EXTRA_COACHING_NOTE_OPTIONS.map(k => ({ id: k.id, label: k.kpiName })));
    const optionsHtml = ['<option value="">— Select —</option>'].concat(
        trendOptions.map(o => '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.label) + '</option>')
    ).join("");

    const row = document.createElement("div");
    row.className = "flex items-center gap-2 dynamic-field-row";
    row.innerHTML =
        '<span class="w-5 text-center font-bold text-slate-500 bg-slate-100 rounded text-[11px] py-0.5">+</span>' +
        '<select ' + (type === 'strength' ? 'data-strength-idx="' : 'data-dev-idx="') + idx + '" onchange="' + (type === 'strength' ? 'onStrengthChange(this)' : 'onDevAreaChange(this)') + '" class="flex-1 border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-teal-500 text-xs bg-white">' +
            optionsHtml +
        '</select>' +
        '<button type="button" onclick="' + (type === 'strength' ? 'removeStrengthPoint(' : 'removeDevArea(') + idx + ')" class="no-print pdf-exclude text-slate-400 hover:text-red-600 px-1.5 py-0.5 text-xs rounded transition" title="Cancel">✕</button>';
    
    // Insert before the add button
    const lastBtn = wrap.querySelector('.btn-add-item');
    if (lastBtn) wrap.insertBefore(row, lastBtn);
    else wrap.appendChild(row);

    const sel = row.querySelector("select");
    if (sel) sel.focus();
}

export function onStrengthChange(el) {
    const idx = Number(el.getAttribute("data-strength-idx"));
    strengthPointSelections[idx] = el.value;
    if (!isValidFieldContent(el.value)) {
        strengthPointSelections[idx] = "";
        strengthPointSelections = strengthPointSelections.filter(isValidFieldContent);
    }
    renderStrengthDevelopmentLists();
}

export function removeStrengthPoint(idx) {
    strengthPointSelections[idx] = "";
    strengthPointSelections = strengthPointSelections.filter(isValidFieldContent);
    renderStrengthDevelopmentLists();
}

export function onDevAreaChange(el) {
    const idx = Number(el.getAttribute("data-dev-idx"));
    developmentAreaSelections[idx] = el.value;
    delete coachingNotesOverrides[idx];
    if (!isValidFieldContent(el.value)) {
        developmentAreaSelections[idx] = "";
        developmentAreaSelections = developmentAreaSelections.filter(isValidFieldContent);
    }
    renderStrengthDevelopmentLists();
}

export function removeDevArea(idx) {
    developmentAreaSelections[idx] = "";
    developmentAreaSelections = developmentAreaSelections.filter(isValidFieldContent);
    delete coachingNotesOverrides[idx];
    renderStrengthDevelopmentLists();
}

export function autoGrowTextarea(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

export function renderCoachingNotes() {
    const wrap = document.getElementById("coachingNotesList");
    if (!wrap) return;
    wrap.innerHTML = "";

    // Strictly filter to valid selections (hiding any empty/dashed items)
    const rows = developmentAreaSelections
        .map((id, idx) => ({ id: id, idx: idx }))
        .filter(r => isValidFieldContent(r.id));

    if (!rows.length) {
        wrap.innerHTML = '<p class="text-slate-400 text-[11px] italic py-1 no-print pdf-exclude">Select at least one Development Area above to see its coaching notes.</p>';
        return;
    }

    const table = document.createElement("table");
    table.className = "w-full border border-slate-300 border-collapse table-fixed text-xs";
    const thead = document.createElement("thead");
    thead.innerHTML =
        '<tr><th colspan="4" class="border border-slate-300 bg-slate-100 text-slate-800 font-bold text-center p-1.5">' +
            'Coaching Notes (SMART)' +
        '</th></tr>' +
        '<tr class="bg-slate-50 text-slate-700 font-semibold">' +
            '<th class="border border-slate-300 p-1.5 text-left break-words" style="width:16%">KPI Name</th>' +
            '<th class="border border-slate-300 p-1.5 text-left break-words" style="width:24%">Equation</th>' +
            '<th class="border border-slate-300 p-1.5 text-left break-words" style="width:24%">WHAT Calculation</th>' +
            '<th class="border border-slate-300 p-1.5 text-left break-words" style="width:36%">Coaching Notes</th>' +
        '</tr>';
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(function (r) {
        const kpi = getCoachingNoteOption(r.id);
        if (!kpi) return;
        const text = coachingNotesOverrides[r.idx] !== undefined ? coachingNotesOverrides[r.idx] : (kpi.coachingNotes || "");

        const tr = document.createElement("tr");
        tr.innerHTML =
            '<td class="border border-slate-300 p-1.5 align-top break-words font-semibold text-slate-800">' + escapeHtml(kpi.kpiName) + '</td>' +
            '<td class="border border-slate-300 p-1.5 align-top break-words whitespace-pre-line text-slate-600">' + escapeHtml(kpi.equation || "—") + '</td>' +
            '<td class="border border-slate-300 p-1.5 align-top break-words whitespace-pre-line text-slate-600">' + escapeHtml(kpi.whatCalculation || "—") + '</td>' +
            '<td class="border border-slate-300 p-1.5 align-top"></td>';

        const notesTd = tr.lastElementChild;
        const ta = document.createElement("textarea");
        ta.rows = 1;
        ta.setAttribute("data-notes-idx", r.idx);
        ta.className = "w-full border border-slate-300 rounded p-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500 resize-none overflow-hidden break-words";
        ta.style.whiteSpace = "pre-wrap";
        ta.style.wordBreak = "break-word";
        ta.value = text;
        ta.oninput = function () { onCoachingNoteEdit(this); };
        notesTd.appendChild(ta);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    wrap.querySelectorAll("textarea[data-notes-idx]").forEach(autoGrowTextarea);
}

export function onCoachingNoteEdit(el) {
    coachingNotesOverrides[Number(el.getAttribute("data-notes-idx"))] = el.value;
    autoGrowTextarea(el);
}

export function renderDevelopmentAreaReport() {
    const wrap = document.getElementById("daReportList");
    if (!wrap) return;
    wrap.innerHTML = "";

    // Strictly filter to valid selections (hiding any empty/dashed items)
    const selected = developmentAreaSelections.filter(k => isValidFieldContent(k));
    if (!selected.length) {
        wrap.innerHTML = '<p class="text-slate-400 text-[11px] italic py-1 no-print pdf-exclude">Select at least one Development Area above to see its justification and next steps.</p>';
        return;
    }

    const trackedCount = PERF_COLUMNS.filter(c => c.key !== "what").length;
    const analysis = analyzeMissedKpis(computeScoredTotals());
    const missedCount = analysis.missed.length;

    const weightTierCounts = {};
    analysis.missed.forEach(function (m) { weightTierCounts[m.weight] = (weightTierCounts[m.weight] || 0) + 1; });

    selected.forEach(function (key, i) {
        const kpi = getCoachingNoteOption(key);
        const name = kpi ? kpi.kpiName : key;
        const found = analysis.missed.find(function (m) { return m.key === key; });

        let justification;
        if (found) {
            const parts = [];
            parts.push("Scored " + found.lastScore + " (below target) in " + analysis.lastMonthLabel + ".");
            if (missedCount > 5) {
                parts.push("Weight: " + found.weight + "% — top 5 missed by weight priority.");
                if (weightTierCounts[found.weight] > 1) {
                    parts.push("Tied on weight with " + (weightTierCounts[found.weight] - 1) +
                        " other missed KPI(s); ranked by higher yearly Total (" +
                        found.total + " month" + (found.total === 1 ? "" : "s") + " below target).");
                }
            } else {
                parts.push("Included directly — " + missedCount + " of " + trackedCount +
                    " tracked KPIs missed target in latest period.");
            }
            justification = parts.join(" ");
        } else {
            justification = "Custom development priority assigned by Team Leader.";
        }

        const nextSteps = (kpi && kpi.coachingNotes) ? kpi.coachingNotes :
            "No coaching guidance on file for this KPI — add guidance in Manage KPI Library.";

        const row = document.createElement("div");
        row.className = "border border-slate-200 rounded-lg p-3 space-y-1 bg-white text-xs";
        row.innerHTML =
            '<p class="font-bold text-slate-800">' + (i + 1) + ". " + escapeHtml(name) + '</p>' +
            '<p><span class="font-semibold text-slate-700">Why:</span> <span class="text-slate-600">' + escapeHtml(justification) + '</span></p>' +
            '<p class="whitespace-pre-line"><span class="font-semibold text-slate-700">Next steps:</span> <span class="text-slate-600">' + escapeHtml(nextSteps) + '</span></p>';
        wrap.appendChild(row);
    });
}

// Attach to window for inline event handlers
if (typeof window !== "undefined") {
    window.renderPerformanceTable = renderPerformanceTable;
    window.renderPerfTableHeader = renderPerfTableHeader;
    window.onPerfCellInput = onPerfCellInput;
    window.updatePerfCounts = updatePerfCounts;
    window.renderStrengthDevelopmentLists = renderStrengthDevelopmentLists;
    window.onStrengthChange = onStrengthChange;
    window.removeStrengthPoint = removeStrengthPoint;
    window.onDevAreaChange = onDevAreaChange;
    window.removeDevArea = removeDevArea;
    window.autoGrowTextarea = autoGrowTextarea;
    window.onCoachingNoteEdit = onCoachingNoteEdit;
}
