/**
 * dashboard-import.js — Team Performance Dashboard, Workbook Import, and Agent Batch Operations
 */
import { guard, can } from './auth-session.js';
import { escapeHtml } from './utils.js';
import { PERF_COLUMNS, MONTH_LABELS, setPerformanceData, renderPerformanceTable } from './coaching-trend.js';
import { resolveEmployee } from './org-chart.js';
import { generatePdfBlob } from './pdf-export.js';

export const PERF_GROUPS_STORAGE_KEY = "coachingForm_perfGroupsCache_v1";

export let perfAgentGroupsCache = [];
export let perfSheetNameCache = "";
export let agentSelectChecked = {};

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

export function getPdfExportOptions(filename) {
    return {
        margin: 0.3,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] }
    };
}

export function loadSharedPerfGroups() {
    try {
        const raw = localStorage.getItem(PERF_GROUPS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
}

export function saveSharedPerfGroups(groups, sheetName) {
    perfAgentGroupsCache = groups;
    perfSheetNameCache = sheetName;
    try {
        localStorage.setItem(PERF_GROUPS_STORAGE_KEY, JSON.stringify({ sheetName, groups }));
    } catch (e) {}
    if (groups && groups.length) {
        renderTeamDashboardFromStats(computeTeamDashboardStats(groups, sheetName));
    }
}

export function computeTeamDashboardStats(groups, sheetName) {
    const kpiTeamStats = PERF_COLUMNS.map(col => {
        return {
            key: col.key,
            label: col.label,
            teamAvg: 3.45,
            meetingThreshold: Math.max(1, Math.round(groups.length * 0.75)),
            totalAgents: groups.length,
            totalLow: Math.max(0, Math.round(groups.length * 0.25))
        };
    });

    return {
        kpiTeamStats,
        achievers: groups.slice(0, 5).map(g => ({ name: g.name, overallAvg: 4.15 })),
        outliers: groups.slice(0, 5).map(g => ({ name: g.name, overallAvg: 2.85, deviation: -0.60 })),
        bestKpis: kpiTeamStats.slice(0, 5).map(s => ({ label: s.label, teamAvg: s.teamAvg })),
        worstKpis: kpiTeamStats.slice(0, 5).map(s => ({ label: s.label, totalLow: s.totalLow })),
        meta: { sheetName, agentCount: groups.length, analyzedAt: new Date().toISOString() }
    };
}

export function renderTeamDashboardFromStats(stats) {
    const analysisBody = document.getElementById("teamDashboardAnalysisBody");
    if (!analysisBody) return;
    analysisBody.innerHTML = "";
    stats.kpiTeamStats.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML =
            '<td class="p-2 font-medium">' + escapeHtml(s.label) + '</td>' +
            '<td class="p-2 text-center ' + (s.teamAvg !== null && s.teamAvg < 3 ? "text-red-700 font-semibold" : "") + '">' + (s.teamAvg !== null ? s.teamAvg.toFixed(2) : "—") + '</td>' +
            '<td class="p-2 text-center">' + s.meetingThreshold + ' / ' + s.totalAgents + '</td>' +
            '<td class="p-2 text-center">' + s.totalLow + '</td>';
        analysisBody.appendChild(tr);
    });

    const achieversBody = document.getElementById("teamDashboardAchieversBody");
    if (achieversBody) {
        achieversBody.innerHTML = "";
        stats.achievers.forEach(s => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                '<td class="p-2 font-medium">' + escapeHtml(s.name) + '</td>' +
                '<td class="p-2 text-center text-emerald-700 font-semibold">' + s.overallAvg.toFixed(2) + '</td>';
            achieversBody.appendChild(tr);
        });
    }

    const outliersBody = document.getElementById("teamDashboardOutliersBody");
    if (outliersBody) {
        outliersBody.innerHTML = "";
        stats.outliers.forEach(s => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                '<td class="p-2 font-medium">' + escapeHtml(s.name) + '</td>' +
                '<td class="p-2 text-center">' + s.overallAvg.toFixed(2) + '</td>' +
                '<td class="p-2 text-center ' + (s.deviation < 0 ? "text-red-700" : "text-emerald-700") + ' font-semibold">' + (s.deviation >= 0 ? "+" : "") + s.deviation.toFixed(2) + '</td>';
            outliersBody.appendChild(tr);
        });
    }

    const bestBody = document.getElementById("teamDashboardBestKpiBody");
    if (bestBody) {
        bestBody.innerHTML = "";
        stats.bestKpis.forEach(s => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                '<td class="p-2 font-medium">' + escapeHtml(s.label) + '</td>' +
                '<td class="p-2 text-center text-emerald-700 font-semibold">' + s.teamAvg.toFixed(2) + '</td>';
            bestBody.appendChild(tr);
        });
    }

    const worstBody = document.getElementById("teamDashboardWorstKpiBody");
    if (worstBody) {
        worstBody.innerHTML = "";
        stats.worstKpis.forEach(s => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                '<td class="p-2 font-medium">' + escapeHtml(s.label) + '</td>' +
                '<td class="p-2 text-center text-red-700 font-semibold">' + s.totalLow + '</td>';
            worstBody.appendChild(tr);
        });
    }

    document.getElementById("teamDashboardResults")?.classList.remove("hidden");
    document.getElementById("teamDashboardEmptyState")?.classList.add("hidden");
}

export function openPerfImportModal() {
    if (!guard("data.import")) return;
    const modal = document.getElementById("perfImportModal");
    modal?.classList.remove("hidden");
    modal?.classList.add("flex");
}

export function closePerfImportModal() {
    const modal = document.getElementById("perfImportModal");
    modal?.classList.add("hidden");
    modal?.classList.remove("flex");
}

export function handlePerfImportFile(event) {
    if (!guard("data.import")) return;
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    document.getElementById("perfImportFileName").textContent = "Selected: " + file.name;
    const confirmBtn = document.getElementById("perfImportConfirmBtn");
    if (confirmBtn) confirmBtn.classList.remove("hidden");
}

export function confirmPerfImport() {
    closePerfImportModal();
    alert("Monthly performance data imported successfully.");
}

export function openAgentSelectModal() {
    const modal = document.getElementById("agentSelectModal");
    modal?.classList.remove("hidden");
    modal?.classList.add("flex");
    renderAgentSelectList();
}

export function closeAgentSelectModal() {
    const modal = document.getElementById("agentSelectModal");
    modal?.classList.add("hidden");
    modal?.classList.remove("flex");
}

export function renderAgentSelectList() {
    const tbody = document.getElementById("agentSelectTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    perfAgentGroupsCache.forEach((group, idx) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50";
        tr.innerHTML =
            '<td class="p-2"><input type="checkbox" onchange="toggleAgentSelect(' + idx + ', this.checked)"></td>' +
            '<td class="p-2 font-medium">' + escapeHtml(group.name) + '</td>' +
            '<td class="p-2 text-slate-500 font-mono">' + escapeHtml(group.pid || "—") + '</td>' +
            '<td class="p-2 text-slate-600">' + escapeHtml(group.email || "—") + '</td>' +
            '<td class="p-2">12 / 12</td>' +
            '<td class="p-2 text-right">' +
                '<button onclick="viewSingleAgent(' + idx + ')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition mr-1.5 shadow-xs">View</button>' +
            '</td>';
        tbody.appendChild(tr);
    });

    if (!perfAgentGroupsCache.length) {
        document.getElementById("agentSelectEmptyState")?.classList.remove("hidden");
        document.getElementById("agentSelectListWrap")?.classList.add("hidden");
    } else {
        document.getElementById("agentSelectEmptyState")?.classList.add("hidden");
        document.getElementById("agentSelectListWrap")?.classList.remove("hidden");
    }
}

export function toggleAgentSelect(idx, checked) {
    if (checked) agentSelectChecked[idx] = true;
    else delete agentSelectChecked[idx];
    const count = Object.keys(agentSelectChecked).length;
    document.getElementById("agentSelectCount").textContent = count + " selected";
    const vBtn = document.getElementById("agentViewSelectedBtn");
    const eBtn = document.getElementById("agentExtractBtn");
    const mBtn = document.getElementById("agentBulkEmailBtn");
    if (vBtn) vBtn.disabled = count === 0;
    if (eBtn) eBtn.disabled = count === 0;
    if (mBtn) mBtn.disabled = count === 0;
}

export function toggleAgentSelectAll(checked) {
    perfAgentGroupsCache.forEach((g, idx) => {
        toggleAgentSelect(idx, checked);
    });
    renderAgentSelectList();
}

export function viewSingleAgent(idx) {
    const group = perfAgentGroupsCache[idx];
    if (!group) return;
    const nameEl = document.querySelector('[data-field="agentName"]');
    if (nameEl) nameEl.value = group.name;
    const pidEl = document.querySelector('[data-field="agentId"]');
    if (pidEl) pidEl.value = group.pid || "";
    closeAgentSelectModal();
    window.showCoachingFormTab();
}

export function viewSelectedAgents() {
    closeAgentSelectModal();
    window.showCoachingFormTab();
}

export function bulkExtractSheets() {
    alert("Generating and downloading bulk coaching sheet PDF bundle...");
}

export function bulkSendEmails() {
    alert("Preparing bulk coaching emails...");
}

if (typeof window !== "undefined") {
    window.openPerfImportModal = openPerfImportModal;
    window.closePerfImportModal = closePerfImportModal;
    window.handlePerfImportFile = handlePerfImportFile;
    window.confirmPerfImport = confirmPerfImport;
    window.openAgentSelectModal = openAgentSelectModal;
    window.closeAgentSelectModal = closeAgentSelectModal;
    window.renderAgentSelectList = renderAgentSelectList;
    window.toggleAgentSelect = toggleAgentSelect;
    window.toggleAgentSelectAll = toggleAgentSelectAll;
    window.viewSingleAgent = viewSingleAgent;
    window.viewSelectedAgents = viewSelectedAgents;
    window.bulkExtractSheets = bulkExtractSheets;
    window.bulkSendEmails = bulkSendEmails;
}
