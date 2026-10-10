/**
 * app-core.js — COPC Agent Coaching & Performance Management System Core Controller
 * Strictly preserves all core logic, variable names, functions, and features.
 */
import { RBAC_CONFIG, RBAC_DEFAULT_ROLES, RBAC_OVERRIDE_KEY, createRbac } from './lib/rbac.js';
import { SchemaCore } from './lib/schema.js';
import { UiRegistry } from './lib/ui-registry.js';
import './lib/kpi-library.js';
import './lib/coaching-trend.js';
import './lib/pdf-export.js';
import './lib/auth-session.js';
import './lib/org-chart.js';
import './lib/actions-management.js';
import './lib/dashboard-import.js';

import { isValidFieldContent, escapeHtml } from './lib/utils.js';
import { guard, guardRoute, renderAccessUI } from './lib/auth-session.js';
import { renderPerformanceTable } from './lib/coaching-trend.js';
import { setCoachingDateTimeNow } from './lib/kpi-library.js';
import { renderActionsList } from './lib/actions-management.js';
import { renderEmployeeList, populateRoleOptions } from './lib/org-chart.js';

// ============================================================
// Navigation: Full Page Tab Switching
// ============================================================
export function hideAllMainTabs() {
    document.getElementById("coachingFormTab")?.classList.add("hidden");
    document.getElementById("teamDashboardTab")?.classList.add("hidden");
    document.getElementById("actionsTab")?.classList.add("hidden");
    document.getElementById("orgChartTab")?.classList.add("hidden");
    document.getElementById("controlPanelTab")?.classList.add("hidden");
}

export function showTeamDashboardTab() {
    if (!guardRoute("dashboard.view")) return;
    hideAllMainTabs();
    document.getElementById("teamDashboardTab")?.classList.remove("hidden");
    window.scrollTo(0, 0);
}

export function showCoachingFormTab() {
    if (!guardRoute("coaching.view")) return;
    hideAllMainTabs();
    document.getElementById("coachingFormTab")?.classList.remove("hidden");
    window.scrollTo(0, 0);
}

export function showActionsTab(sub) {
    if (!guardRoute("actions.view")) return;
    hideAllMainTabs();
    document.getElementById("actionsTab")?.classList.remove("hidden");
    showActionsSubTab(sub === "rolling" ? "rolling" : "log");
    window.scrollTo(0, 0);
}

export function showActionsSubTab(sub) {
    const logBtn = document.querySelector('[data-subtab="log"]');
    const rollBtn = document.querySelector('[data-subtab="rolling"]');
    const logP = document.getElementById("actionsSubLog");
    const rollP = document.getElementById("actionsSubRolling");

    if (sub === "rolling") {
        logBtn?.classList.remove("border-slate-900", "text-slate-900", "font-semibold");
        logBtn?.classList.add("border-transparent", "text-slate-500");
        rollBtn?.classList.add("border-slate-900", "text-slate-900", "font-semibold");
        rollBtn?.classList.remove("border-transparent", "text-slate-500");
        logP?.classList.add("hidden");
        rollP?.classList.remove("hidden");
    } else {
        rollBtn?.classList.remove("border-slate-900", "text-slate-900", "font-semibold");
        rollBtn?.classList.add("border-transparent", "text-slate-500");
        logBtn?.classList.add("border-slate-900", "text-slate-900", "font-semibold");
        logBtn?.classList.remove("border-transparent", "text-slate-500");
        rollP?.classList.add("hidden");
        logP?.classList.remove("hidden");
        renderActionsList();
    }
}

export function showOrgChartTab() {
    if (!guardRoute("employees.view")) return;
    hideAllMainTabs();
    document.getElementById("orgChartTab")?.classList.remove("hidden");
    renderEmployeeList();
    window.scrollTo(0, 0);
}

export function showControlPanelTab(sub) {
    if (!guardRoute("admin.panel")) return;
    hideAllMainTabs();
    document.getElementById("controlPanelTab")?.classList.remove("hidden");
    showCpSubTab(sub || "fields");
    window.scrollTo(0, 0);
}

export function showCpSubTab(sub) {
    ["fields", "builtin", "roles", "audit"].forEach(s => {
        const btn = document.querySelector('[data-subtab="' + s + '"]');
        const p = document.getElementById(s === "fields" ? "cpFieldsPanel" : s === "builtin" ? "cpBuiltinPanel" : s === "roles" ? "cpRolesPanel" : "cpAuditPanel");
        if (s === sub) {
            btn?.classList.add("border-slate-900", "text-slate-900", "font-semibold");
            btn?.classList.remove("border-transparent", "text-slate-500");
            p?.classList.remove("hidden");
        } else {
            btn?.classList.remove("border-slate-900", "text-slate-900", "font-semibold");
            btn?.classList.add("border-transparent", "text-slate-500");
            p?.classList.add("hidden");
        }
    });
}

// Disciplinary Matrix Modal
export function openMatrixModal() {
    if (!guard("config.edit")) return;
    const modal = document.getElementById("matrixModal");
    modal?.classList.remove("hidden");
    modal?.classList.add("flex");
}

export function closeMatrixModal() {
    const modal = document.getElementById("matrixModal");
    modal?.classList.add("hidden");
    modal?.classList.remove("flex");
}

// Delete Database Modal
export function openDeleteDbModal() {
    if (!guard("admin.reset")) return;
    const listEl = document.getElementById("deleteDbList");
    if (listEl) {
        listEl.innerHTML =
            '<li>Uploaded performance sheets and monthly trend records</li>' +
            '<li>Action records and disciplinary notices</li>' +
            '<li>Coaching session notes and SMART entries</li>' +
            '<li class="list-none pt-1"><strong>Kept securely:</strong> Organizational Chart (profiles, PIDs, team leaders, roles), Disciplinary Matrix, and KPI Library.</li>';
    }
    const modal = document.getElementById("deleteDbModal");
    modal?.classList.remove("hidden");
    modal?.classList.add("flex");
}

export function closeDeleteDbModal() {
    const modal = document.getElementById("deleteDbModal");
    modal?.classList.add("hidden");
    modal?.classList.remove("flex");
}

export function confirmDeleteDatabase() {
    if (!guard("admin.reset")) return;
    if (window.DataReset) {
        window.DataReset.resetTransactional(window.DataReset.storageAdapter(window.localStorage));
    } else {
        localStorage.removeItem("coachingForm_perfGroupsCache_v1");
        localStorage.removeItem("coachingForm_actionRecords_v1");
        localStorage.removeItem("coachingForm_coachingCustom_v1");
        localStorage.removeItem("coachingForm_rollingLedger_v1");
        localStorage.removeItem("coachingForm_actionDefaults_v1");
    }
    closeDeleteDbModal();
    alert("Transactional data reset successfully. Organizational Chart and configurations preserved.");
    location.reload();
}

// Global Keyboard Accessibility for Tooltips and Modals
document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
        // Blur active element to smoothly dismiss any active tooltip popup
        if (document.activeElement && document.activeElement.classList.contains("info-tooltip-btn")) {
            document.activeElement.blur();
        }
        closeMatrixModal();
        closeDeleteDbModal();
        window.closeActionModal?.();
        window.closeKpiModal?.();
        window.closeAgentSelectModal?.();
        window.closePerfImportModal?.();
        window.closeProfileMenu?.();
    }
});

// Window attachments for inline event handlers
if (typeof window !== "undefined") {
    window.hideAllMainTabs = hideAllMainTabs;
    window.showTeamDashboardTab = showTeamDashboardTab;
    window.showCoachingFormTab = showCoachingFormTab;
    window.showActionsTab = showActionsTab;
    window.showActionsSubTab = showActionsSubTab;
    window.showOrgChartTab = showOrgChartTab;
    window.showControlPanelTab = showControlPanelTab;
    window.showCpSubTab = showCpSubTab;
    window.openMatrixModal = openMatrixModal;
    window.closeMatrixModal = closeMatrixModal;
    window.openDeleteDbModal = openDeleteDbModal;
    window.closeDeleteDbModal = closeDeleteDbModal;
    window.confirmDeleteDatabase = confirmDeleteDatabase;
    window.isValidFieldContent = isValidFieldContent;
}

// Initialization on DOM ready
document.addEventListener("DOMContentLoaded", function () {
    populateRoleOptions();
    renderEmployeeList();
    renderPerformanceTable();
    setCoachingDateTimeNow();
    renderActionsList();
    renderAccessUI();
    showTeamDashboardTab();
});
