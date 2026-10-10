/**
 * kpi-library.js — KPI library management & Metrics table
 */
import { escapeHtml } from './utils.js';
import { guard } from './auth-session.js';

export const KPI_STORAGE_KEY = "coachingForm_kpiLibrary_v1";

export const DEFAULT_KPI_LIBRARY = [
    {
        id: "quality", category: "Quality", kpiName: "Quality Audit Score (%)",
        description: "Percentage of audited transactions that pass all critical and non-critical checklist items.",
        coachingNotes: "Focus on script adherence, verification steps, and documentation accuracy.",
        equation: "(Passed Audit Points / Total Audit Points) x 100",
        threshold: "≥ 85.0%", target: "90.0%", exceptional: "≥ 97.0%",
        whatCalculation: "Calculated monthly from the QA audit tool using weighted checklist scoring.",
        defaultStatus: "unmet"
    },
    {
        id: "csat", category: "Customer Experience", kpiName: "CSAT / DSAT Score",
        description: "Customer satisfaction rating captured via post-interaction survey.",
        coachingNotes: "Emphasize empathy, tone, and first-touch ownership.",
        equation: "(Satisfied Responses / Total Survey Responses) x 100",
        threshold: "≥ 90.0%", target: "93.0%", exceptional: "≥ 98.0%",
        whatCalculation: "Aggregated weekly from post-call/chat CSAT survey results.",
        defaultStatus: "met"
    },
    {
        id: "fcr", category: "Efficiency", kpiName: "First Contact Resolution (FCR)",
        description: "Percentage of issues resolved without a repeat contact within 7 days.",
        coachingNotes: "Reinforce full issue diagnosis before case closure.",
        equation: "(Resolved on First Contact / Total Contacts) x 100",
        threshold: "≥ 75.0%", target: "80.0%", exceptional: "≥ 90.0%",
        whatCalculation: "Tracked via repeat-contact tagging in the ticketing system.",
        defaultStatus: "unmet"
    },
    {
        id: "aht", category: "Efficiency", kpiName: "Average Handling Time (AHT)",
        description: "Average total time spent per interaction, including hold and after-call work.",
        coachingNotes: "Balance speed with quality; avoid rushing verification steps.",
        equation: "(Talk Time + Hold Time + After Call Work) / Total Calls",
        threshold: "≤ 300 sec", target: "280 sec", exceptional: "≤ 240 sec",
        whatCalculation: "Pulled from ACD/telephony system call logs.",
        defaultStatus: "unmet"
    },
    {
        id: "adherence", category: "Adherence", kpiName: "Schedule Adherence",
        description: "Percentage of scheduled time the agent was available and following assigned activities.",
        coachingNotes: "Discuss punctuality, break discipline, and status code usage.",
        equation: "(Actual Adherent Time / Scheduled Time) x 100",
        threshold: "≥ 95.0%", target: "97.0%", exceptional: "≥ 99.0%",
        whatCalculation: "Calculated from the WFM system comparing scheduled vs. logged status.",
        defaultStatus: "met"
    },
    {
        id: "fatal", category: "Compliance", kpiName: "Zero Critical Error Rate (Fatal)",
        description: "Count of critical/compliance-breaking errors (e.g., security, data privacy) in the period.",
        coachingNotes: "Any single fatal error requires immediate retraining and sign-off.",
        equation: "Count of Fatal Errors Logged in Period",
        threshold: "0 Fatalities", target: "0", exceptional: "0 (12+ consecutive fatal-free months)",
        whatCalculation: "Identified during quality audits or compliance escalations.",
        defaultStatus: "met"
    },
    {
        id: "reached", category: "Monthly Trend", kpiName: "Reached Customers %", isTrendColumn: true,
        description: "Percentage of assigned customers actually reached during the month.",
        coachingNotes: "*Please follow campaign daily target for reached customers\n*Create SR for each call to document your reachability\n*Work on your AHT to achieve the daily target\n*Please call back the customer if the call dropped in the beginning",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's Reached Customers % column.",
        defaultStatus: "unmet"
    },
    {
        id: "callback", category: "Monthly Trend", kpiName: "Call Back%", isTrendColumn: true,
        description: "Percentage of required customer call-backs completed on time.",
        coachingNotes: "*Follow up must be done in case the customer is Callback/Thinking\n*You must agree with the customer on follow up date\n*In case the customer didn't answer you must call the customer back during the month",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's Call Back% column.",
        defaultStatus: "unmet"
    },
    {
        id: "sales", category: "Monthly Trend", kpiName: "Sales %", isTrendColumn: true,
        description: "Sales conversion rate across all campaigns.",
        coachingNotes: "*Work on your presentational and persuasion skills\n*Make sure to target all campaigns, don't focus on one only",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's Sales Percentage column.",
        defaultStatus: "unmet"
    },
    {
        id: "openSR", category: "Monthly Trend", kpiName: "Open SR", isTrendColumn: true,
        description: "Service requests left open past the required close window.",
        coachingNotes: "*Please close your opened SR's daily\n*Avoid any opened SR's not assigned to another team",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's Open SR column.",
        defaultStatus: "unmet"
    },
    {
        id: "critical", category: "Monthly Trend", kpiName: "Critical", isTrendColumn: true,
        description: "Critical quality errors rating for the month.",
        coachingNotes: "*Please stick to script main points to be mentioned during the call\n*Following our internal process during calls is a must",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's Critical column.",
        defaultStatus: "unmet"
    },
    {
        id: "nonCritical", category: "Monthly Trend", kpiName: "Non Critical", isTrendColumn: true,
        description: "Non-critical quality errors rating for the month.",
        coachingNotes: "*Avoid non-critical mistakes located on the COPC quality sheet",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's Non Critical column.",
        defaultStatus: "unmet"
    },
    {
        id: "srCreation", category: "Monthly Trend", kpiName: "SR Creation", isTrendColumn: true,
        description: "Service request creation compliance rating.",
        coachingNotes: "*Creating an SR on each call is a must\n*Number of SR's should be equal to or more than the number of calls",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's SR Creation column.",
        defaultStatus: "unmet"
    },
    {
        id: "staffTime", category: "Monthly Trend", kpiName: "Staff Time", isTrendColumn: true,
        description: "Staff/login time completion rating.",
        coachingNotes: "*Completing your staff time by the end of the month is a must\n*No login before 10 am or after 6 pm — it will not be considered\n*Do not misuse Not Ready, since Not Ready time must be compensated too",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's Staff time column.",
        defaultStatus: "unmet"
    },
    {
        id: "tardiness", category: "Monthly Trend", kpiName: "Tardiness", isTrendColumn: true,
        description: "Punctuality / login tardiness rating.",
        coachingNotes: "*No log-out daily from 10 am to 11 am\n*1st hour must be completed",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's Tardiness column.",
        defaultStatus: "unmet"
    },
    {
        id: "what", category: "Monthly Trend", kpiName: "WHAT", isTrendColumn: true,
        description: "Blended overall monthly performance score across all metrics.",
        coachingNotes: "",
        equation: "", threshold: "≥ 3", target: "4", exceptional: "5",
        whatCalculation: "Rated 1-5 monthly, mirrors the workbook's WHAT column.",
        defaultStatus: "unmet"
    }
];

export let kpiLibrary = [];
export let kpiEditingId = null;

export function loadKpiLibrary() {
    try {
        const raw = localStorage.getItem(KPI_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) {
                kpiLibrary = parsed;
                ensureTrendKpisPresent();
                return;
            }
        }
    } catch (e) {
        console.warn("Could not read saved KPI library, falling back to defaults.", e);
    }
    kpiLibrary = JSON.parse(JSON.stringify(DEFAULT_KPI_LIBRARY));
}

export function ensureTrendKpisPresent() {
    let changed = false;
    DEFAULT_KPI_LIBRARY.filter(k => k.isTrendColumn).forEach(defaultKpi => {
        if (!kpiLibrary.some(k => k.id === defaultKpi.id)) {
            kpiLibrary.push(JSON.parse(JSON.stringify(defaultKpi)));
            changed = true;
        }
    });
    if (changed) saveKpiLibraryToStorage();
}

export function saveKpiLibraryToStorage() {
    try {
        localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(kpiLibrary));
    } catch (e) {
        console.warn("Could not persist KPI library to localStorage.", e);
    }
}

export function slugifyKpiName(name) {
    const base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return (base || "kpi") + "_" + Math.random().toString(36).slice(2, 7);
}

export function captureMetricValues() {
    const values = {};
    kpiLibrary.forEach(kpi => {
        const actualEl = document.querySelector('[data-field="metric_' + kpi.id + '"]');
        const statusEl = document.querySelector('[data-field="metric_' + kpi.id + '_status"]');
        values[kpi.id] = {
            actual: actualEl ? actualEl.value : "",
            status: statusEl ? statusEl.value : null
        };
    });
    return values;
}

export function restoreMetricValues(values) {
    Object.keys(values || {}).forEach(id => {
        const actualEl = document.querySelector('[data-field="metric_' + id + '"]');
        const statusEl = document.querySelector('[data-field="metric_' + id + '_status"]');
        if (actualEl && values[id].actual) actualEl.value = values[id].actual;
        if (statusEl && values[id].status) statusEl.value = values[id].status;
    });
}

export function renderMetricsTable() {
    const savedValues = captureMetricValues();
    const tbody = document.getElementById("metricsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const overviewKpis = kpiLibrary.filter(kpi => !kpi.isTrendColumn);

    overviewKpis.forEach(kpi => {
        const tr = document.createElement("tr");
        const isFatalStyle = /fatal|critical/i.test(kpi.category || "") || /fatal|critical/i.test(kpi.kpiName || "");
        const categoryClass = isFatalStyle ? "text-red-700" : "";

        tr.innerHTML =
            '<td class="p-2 border border-slate-300 font-medium ' + categoryClass + '">' + escapeHtml(kpi.category || "—") + '</td>' +
            '<td class="p-2 border border-slate-300 ' + categoryClass + '">' +
                '<span class="font-medium">' + escapeHtml(kpi.kpiName || "Untitled KPI") + '</span>' +
                (kpi.description ? '<p class="text-[10px] text-slate-400 font-normal mt-0.5 instruction-hint pdf-exclude">' + escapeHtml(kpi.description) + '</p>' : '') +
            '</td>' +
            '<td class="p-2 border border-slate-300 font-mono">' + escapeHtml(kpi.threshold || "—") + '</td>' +
            '<td class="p-2 border border-slate-300 font-mono">' + escapeHtml(kpi.target || "—") + '</td>' +
            '<td class="p-2 border border-slate-300 font-mono text-emerald-700">' + escapeHtml(kpi.exceptional || "—") + '</td>' +
            '<td class="p-2 border border-slate-300">' +
                '<input type="text" data-field="metric_' + kpi.id + '" placeholder="Enter actual result" class="w-full border border-slate-300 rounded px-2 py-1 outline-none">' +
            '</td>' +
            '<td class="p-2 border border-slate-300 text-center">' +
                '<select data-field="metric_' + kpi.id + '_status" class="border border-slate-300 rounded px-1 py-0.5 text-xs">' +
                    '<option value="exceptional"' + (kpi.defaultStatus === "exceptional" ? " selected" : "") + '>Exceptional</option>' +
                    '<option value="met"' + (kpi.defaultStatus === "met" ? " selected" : "") + '>Met</option>' +
                    '<option value="unmet"' + (kpi.defaultStatus !== "met" && kpi.defaultStatus !== "exceptional" ? " selected" : "") + '>Unmet</option>' +
                '</select>' +
            '</td>';
        tbody.appendChild(tr);
    });

    if (!overviewKpis.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.className = "p-3 text-center text-slate-400 border border-slate-300";
        td.textContent = "No KPIs defined yet. Use \"Manage KPI Library\" to add one.";
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    restoreMetricValues(savedValues);
}

export function openKpiModal() {
    if (!guard("config.edit")) return;
    const modal = document.getElementById("kpiModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        showKpiListView();
    }
}

export function closeKpiModal() {
    const modal = document.getElementById("kpiModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

export function showKpiListView() {
    document.getElementById("kpiListView")?.classList.remove("hidden");
    document.getElementById("kpiFormView")?.classList.add("hidden");
    document.getElementById("kpiListFooter")?.classList.remove("hidden");
    const footer = document.getElementById("kpiFormFooter");
    if (footer) {
        footer.classList.add("hidden");
        footer.classList.remove("flex");
    }
    renderKpiList();
}

export function renderKpiList() {
    const searchEl = document.getElementById("kpiSearch");
    const searchTerm = (searchEl ? searchEl.value : "").toLowerCase();
    const tbody = document.getElementById("kpiListBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    kpiLibrary.forEach(kpi => {
        const haystack = (kpi.kpiName + " " + kpi.category).toLowerCase();
        if (searchTerm && !haystack.includes(searchTerm)) return;

        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50";
        tr.innerHTML =
            '<td class="p-2 font-medium">' + escapeHtml(kpi.kpiName) + '</td>' +
            '<td class="p-2">' + escapeHtml(kpi.category || "—") + '</td>' +
            '<td class="p-2 font-mono">' + escapeHtml(kpi.threshold || "—") + '</td>' +
            '<td class="p-2 font-mono">' + escapeHtml(kpi.target || "—") + '</td>' +
            '<td class="p-2 font-mono">' + escapeHtml(kpi.exceptional || "—") + '</td>' +
            '<td class="p-2 font-mono">' + (kpi.weight !== undefined && kpi.weight !== "" ? escapeHtml(String(kpi.weight)) + "%" : "—") + '</td>' +
            '<td class="p-2 text-right whitespace-nowrap"></td>';

        const actionTd = tr.lastElementChild;
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "text-blue-600 hover:text-blue-800 font-medium text-[11px] mr-3";
        editBtn.onclick = function () { openKpiForm(kpi.id); };
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "text-red-600 hover:text-red-800 font-medium text-[11px]";
        delBtn.onclick = function () { deleteKpi(kpi.id); };
        actionTd.appendChild(editBtn);
        actionTd.appendChild(delBtn);

        tbody.appendChild(tr);
    });

    if (!tbody.children.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.className = "p-3 text-center text-slate-400";
        td.textContent = "No KPIs found.";
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
}

export function openKpiForm(id) {
    kpiEditingId = id || null;
    const kpi = id ? kpiLibrary.find(k => k.id === id) : null;

    document.getElementById("kpiFormId").value = id || "";
    document.getElementById("kpiFormName").value = kpi ? kpi.kpiName : "";
    document.getElementById("kpiFormCategory").value = kpi ? kpi.category : "";
    document.getElementById("kpiFormThreshold").value = kpi ? kpi.threshold : "";
    document.getElementById("kpiFormTarget").value = kpi ? kpi.target : "";
    document.getElementById("kpiFormExceptional").value = kpi ? kpi.exceptional : "";
    document.getElementById("kpiFormWeight").value = kpi && kpi.weight !== undefined ? kpi.weight : "";
    document.getElementById("kpiFormDescription").value = kpi ? kpi.description : "";
    document.getElementById("kpiFormEquation").value = kpi ? kpi.equation : "";
    document.getElementById("kpiFormWhatCalculation").value = kpi ? kpi.whatCalculation : "";
    document.getElementById("kpiFormCoachingNotes").value = kpi ? kpi.coachingNotes : "";

    document.getElementById("kpiFormError")?.classList.add("hidden");
    document.getElementById("kpiListView")?.classList.add("hidden");
    document.getElementById("kpiFormView")?.classList.remove("hidden");
    document.getElementById("kpiListFooter")?.classList.add("hidden");
    const footer = document.getElementById("kpiFormFooter");
    if (footer) {
        footer.classList.remove("hidden");
        footer.classList.add("flex");
    }
}

export function closeKpiForm() {
    showKpiListView();
}

export function saveKpiForm() {
    if (!guard("config.edit")) return;
    const name = document.getElementById("kpiFormName").value.trim();
    const errorEl = document.getElementById("kpiFormError");

    if (!name) {
        if (errorEl) {
            errorEl.textContent = "KPI Name is required.";
            errorEl.classList.remove("hidden");
        }
        return;
    }

    const kpiData = {
        kpiName: name,
        category: document.getElementById("kpiFormCategory").value.trim(),
        threshold: document.getElementById("kpiFormThreshold").value.trim(),
        target: document.getElementById("kpiFormTarget").value.trim(),
        exceptional: document.getElementById("kpiFormExceptional").value.trim(),
        weight: document.getElementById("kpiFormWeight").value.trim(),
        description: document.getElementById("kpiFormDescription").value.trim(),
        equation: document.getElementById("kpiFormEquation").value.trim(),
        whatCalculation: document.getElementById("kpiFormWhatCalculation").value.trim(),
        coachingNotes: document.getElementById("kpiFormCoachingNotes").value.trim()
    };

    if (kpiEditingId) {
        const existing = kpiLibrary.find(k => k.id === kpiEditingId);
        if (existing) Object.assign(existing, kpiData);
    } else {
        kpiLibrary.push(Object.assign({ id: slugifyKpiName(name), defaultStatus: "unmet" }, kpiData));
    }

    saveKpiLibraryToStorage();
    renderMetricsTable();
    window.renderPerfTableHeader?.();
    window.updatePerfCounts?.();
    showKpiListView();
}

export function deleteKpi(id) {
    if (!guard("config.edit")) return;
    const kpi = kpiLibrary.find(k => k.id === id);
    if (!kpi) return;
    const scopeMsg = kpi.isTrendColumn
        ? "This will revert its column header in the Monthly Performance Trend table (Section 2) back to its default name."
        : "This will remove it from the Metrics Overview table.";
    if (!confirm('Delete "' + kpi.kpiName + '" from the KPI Library? ' + scopeMsg)) return;

    kpiLibrary = kpiLibrary.filter(k => k.id !== id);
    saveKpiLibraryToStorage();
    renderMetricsTable();
    window.renderPerfTableHeader?.();
    window.updatePerfCounts?.();
    renderKpiList();
}

export function setCoachingDateTimeNow() {
    const el = document.getElementById("coachingDateTime");
    if (!el) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const localValue = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) +
        "T" + pad(now.getHours()) + ":" + pad(now.getMinutes());
    el.value = localValue;
}

loadKpiLibrary();

if (typeof window !== "undefined") {
    window.openKpiModal = openKpiModal;
    window.closeKpiModal = closeKpiModal;
    window.showKpiListView = showKpiListView;
    window.renderKpiList = renderKpiList;
    window.openKpiForm = openKpiForm;
    window.closeKpiForm = closeKpiForm;
    window.saveKpiForm = saveKpiForm;
    window.deleteKpi = deleteKpi;
    window.setCoachingDateTimeNow = setCoachingDateTimeNow;
    window.renderMetricsTable = renderMetricsTable;
}
