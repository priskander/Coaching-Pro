/**
 * actions-management.js — Actions Management, Disciplinary Matrix, and Agents Rolling Records
 */
import { guard, can } from './auth-session.js';
import { employeeRecords, resolveEmployee, normalizePid } from './org-chart.js';
import { escapeHtml } from './utils.js';
import { getPdfExportOptions, downloadBlob } from './dashboard-import.js';

export const ACTIONS_STORAGE_KEY = "coachingForm_actionRecords_v1";
export const ACTION_DEFAULTS_STORAGE_KEY = "coachingForm_actionDefaults_v1";
export const MATRIX_STORAGE_KEY = "coachingForm_disciplinaryMatrix_v1";

export const ACTION_TEMPLATE_REASONS = [
    "Not achieving acceptance percentage",
    "Quality - Critical Mistake",
    "Quality - Non Critical Mistake",
    "Not achieving reachability percentage",
    "Staff time shortage",
    "Not achieving tardiness target"
];

export function loadActionRecords() {
    try {
        const raw = localStorage.getItem(ACTIONS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

export function saveActionRecordsToStorage() {
    try { localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(actionRecords)); } catch (e) {}
}

export function loadActionDefaults() {
    try {
        const raw = localStorage.getItem(ACTION_DEFAULTS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { managerName: "Mina Saeed Youssef", department: "Customer Care", subDepartment: "Mobile Telesales" };
}

export function saveActionDefaults(defaults) {
    try { localStorage.setItem(ACTION_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults)); } catch (e) {}
}

export let actionRecords = loadActionRecords();
export let actionFormIncidentDates = [];

export function formatActionDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function canViewAction(a) {
    return true;
}

export function renderActionsList() {
    const tbody = document.getElementById("actionsListBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const search = (document.getElementById("actionsSearchInput")?.value || "").trim().toLowerCase();
    const levelFilter = document.getElementById("actionsLevelFilter")?.value || "";
    const decisionFilter = document.getElementById("actionsDecisionFilter")?.value || "";

    const filtered = actionRecords
        .filter(canViewAction)
        .filter(a => !search || ((a.employeeName || "") + " " + (a.pid || "")).toLowerCase().indexOf(search) !== -1)
        .filter(a => !levelFilter || a.levelOfIncident === levelFilter)
        .filter(a => !decisionFilter || a.decision === decisionFilter)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    filtered.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML =
            '<td class="p-2 font-medium">' + escapeHtml(a.employeeName || "—") + (a.pid ? '<div class="text-[10px] font-normal text-slate-500">PID ' + escapeHtml(a.pid) + '</div>' : "") + '</td>' +
            '<td class="p-2">' + escapeHtml(a.employeeType || "—") + '</td>' +
            '<td class="p-2 whitespace-nowrap">' + escapeHtml(formatActionDate(a.createdAt)) + '</td>' +
            '<td class="p-2">' + escapeHtml(a.descriptionOfEvent || "—") + '</td>' +
            '<td class="p-2">' + escapeHtml(a.levelOfIncident || "—") + '</td>' +
            '<td class="p-2 font-semibold text-slate-800">' + escapeHtml(a.decision || "—") + '</td>' +
            '<td class="p-2 text-right whitespace-nowrap"></td>';

        const actionTd = tr.lastElementChild;
        if (can("actions.edit")) {
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.className = "bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition mr-1.5 shadow-xs";
            editBtn.onclick = function () { openActionForm(a.id); };
            actionTd.appendChild(editBtn);
        }

        if (can("actions.export")) {
            const pdfBtn = document.createElement("button");
            pdfBtn.textContent = "PDF";
            pdfBtn.title = "Download this action as a clean PDF";
            pdfBtn.className = "bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition mr-1.5 shadow-xs";
            pdfBtn.onclick = function () { downloadActionPdf(a.id, pdfBtn); };
            actionTd.appendChild(pdfBtn);
        }

        if (can("actions.edit")) {
            const emailBtn = document.createElement("button");
            emailBtn.textContent = "Email";
            emailBtn.title = "Email this action to the employee";
            emailBtn.className = "bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition mr-1.5 shadow-xs";
            emailBtn.onclick = function () { emailActionPdf(a.id, emailBtn); };
            actionTd.appendChild(emailBtn);
        }

        if (can("actions.delete")) {
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.className = "bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition shadow-xs";
            delBtn.onclick = function () { deleteAction(a.id); };
            actionTd.appendChild(delBtn);
        }

        tbody.appendChild(tr);
    });

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-400">' + (actionRecords.length ? "No actions match this filter." : 'No action records yet. Click "New Action" to add one.') + '</td></tr>';
    }
}

export function renderIncidentDateRows() {
    const wrap = document.getElementById("actionFormIncidentDates");
    if (!wrap) return;
    wrap.innerHTML = "";
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    actionFormIncidentDates.forEach((entry, i) => {
        const row = document.createElement("div");
        row.className = "flex items-center gap-2";
        const monthSel = document.createElement("select");
        monthSel.className = "flex-1 bg-transparent border-0 border-b border-dotted border-slate-400 text-blue-700 font-medium px-1 py-1 outline-none focus:border-orange-500 text-xs";
        monthSel.innerHTML = '<option value="">— Month —</option>' +
            MONTHS.map(m => '<option' + (entry.month === m ? " selected" : "") + '>' + m + '</option>').join("");
        monthSel.onchange = function () { actionFormIncidentDates[i].month = monthSel.value; };
        const yearInput = document.createElement("input");
        yearInput.type = "number";
        yearInput.placeholder = "Year";
        yearInput.value = entry.year || "";
        yearInput.className = "w-24 bg-transparent border-0 border-b border-dotted border-slate-400 text-blue-700 font-medium px-1 py-1 outline-none focus:border-orange-500 text-xs";
        yearInput.oninput = function () { actionFormIncidentDates[i].year = yearInput.value; };
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove";
        removeBtn.className = "no-print pdf-exclude w-14 text-red-600 hover:text-red-800 text-xs font-medium whitespace-nowrap";
        removeBtn.onclick = function () { actionFormIncidentDates.splice(i, 1); renderIncidentDateRows(); };
        row.appendChild(monthSel);
        row.appendChild(yearInput);
        row.appendChild(removeBtn);
        wrap.appendChild(row);
    });
    if (!actionFormIncidentDates.length) {
        wrap.innerHTML = '<p class="text-slate-400 text-[11px] instruction-hint pdf-exclude">No incident dates added yet. Click "+ Add month" above.</p>';
    }
}

export function addIncidentDateRow() {
    if (actionFormIncidentDates.length >= 6) return;
    actionFormIncidentDates.push({ month: "", year: "" });
    renderIncidentDateRows();
}

export function populateActionEmployeeDatalist() {
    const list = document.getElementById("actionsEmployeeDatalist");
    if (!list) return;
    const names = Array.from(new Set(employeeRecords.map(e => e.name))).sort();
    list.innerHTML = names.map(n => '<option value="' + escapeHtml(n) + '">').join("");
}

export function openActionForm(id, prefill) {
    if (!guard(id ? "actions.edit" : "actions.create")) return;
    populateActionEmployeeDatalist();
    populateActionDescriptionOptions();
    populateActionDecisionDatalist();
    const record = id ? actionRecords.find(a => a.id === id) : null;
    const defaults = loadActionDefaults();
    const p = (!record && prefill) ? prefill : null;

    const now = record ? new Date(record.createdAt) : new Date();
    const dateEl = document.getElementById("actionFormDateDisplay");
    if (dateEl) dateEl.textContent = isNaN(now.getTime()) ? "" : now.toLocaleString();

    document.getElementById("actionFormTitle").textContent = record ? "Edit Action" : "New Action";
    document.getElementById("actionFormId").value = record ? record.id : "";
    document.getElementById("actionFormEmployeeName").value = record ? record.employeeName : (p ? p.employeeName || "" : "");
    document.getElementById("actionFormManagerName").value = record ? record.managerName : defaults.managerName;
    document.getElementById("actionFormDepartment").value = record ? record.department : defaults.department;
    document.getElementById("actionFormSubDepartment").value = record ? record.subDepartment : defaults.subDepartment;
    document.getElementById("actionFormEmployeeType").value = record ? (record.employeeType || "") : (p ? p.employeeType || "" : (defaults.employeeType || ""));
    syncActionManagerField();
    document.getElementById("actionFormDescription").value = record ? record.descriptionOfEvent : (p ? p.descriptionOfEvent || "" : "");
    document.getElementById("actionFormLevel").value = record ? record.levelOfIncident : (p ? p.levelOfIncident || "" : "");
    document.getElementById("actionFormDecision").value = record ? record.decision : (p ? p.decision || "" : "");
    document.getElementById("actionFormPlan").value = record ? record.actionPlan : (p && p.actionPlan ? p.actionPlan :
        "Employee is required to improve his/her performance in the point mentioned above; In case of repeating incident a higher formal disciplinary action will be applied");
    document.getElementById("actionFormComments").value = record ? record.comments : (p ? p.comments || "" : "");
    
    const hintEl = document.getElementById("actionDecisionHint");
    if (hintEl) hintEl.textContent = "";

    actionFormIncidentDates = record && record.incidentDates ? record.incidentDates.slice() :
        (p && p.incidentDates ? p.incidentDates.slice() : []);
    renderIncidentDateRows();

    const modal = document.getElementById("actionFormModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

export function closeActionModal() {
    const modal = document.getElementById("actionFormModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

export function syncActionManagerField() {
    const name = document.getElementById("actionFormEmployeeName")?.value || "";
    const emp = resolveEmployee(null, name);
    const defaults = loadActionDefaults();
    if (emp) {
        if (emp.teamLeader) {
            const mf = document.getElementById("actionFormManagerName");
            if (mf) { mf.value = emp.teamLeader; mf.readOnly = true; }
        }
        if (emp.department) {
            const df = document.getElementById("actionFormDepartment");
            if (df) { df.value = emp.department; df.readOnly = true; }
        }
        if (emp.subDepartment) {
            const sdf = document.getElementById("actionFormSubDepartment");
            if (sdf) { sdf.value = emp.subDepartment; sdf.readOnly = true; }
        }
        if (emp.contractType) {
            const tf = document.getElementById("actionFormEmployeeType");
            if (tf && ["Perm/OS", "Off-Payroll", "Outsourced"].includes(emp.contractType)) {
                tf.value = emp.contractType;
            }
        }
    }
}

export function saveActionForm() {
    if (!guard(document.getElementById("actionFormId").value ? "actions.edit" : "actions.create")) return;
    const employeeName = document.getElementById("actionFormEmployeeName").value.trim();
    if (!employeeName) {
        alert("Employee Name is required.");
        return;
    }

    const id = document.getElementById("actionFormId").value;
    const managerName = document.getElementById("actionFormManagerName").value.trim();
    const department = document.getElementById("actionFormDepartment").value.trim();
    const subDepartment = document.getElementById("actionFormSubDepartment").value.trim();
    const employeeType = document.getElementById("actionFormEmployeeType").value;

    saveActionDefaults({ managerName, department, subDepartment, employeeType });

    const record = {
        id: id || ("action_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8)),
        createdAt: id ? (actionRecords.find(a => a.id === id) || {}).createdAt || new Date().toISOString() : new Date().toISOString(),
        employeeName: employeeName,
        pid: (resolveEmployee(null, employeeName) || {}).pid || "",
        managerName: managerName,
        department: department,
        subDepartment: subDepartment,
        employeeType: employeeType,
        descriptionOfEvent: document.getElementById("actionFormDescription").value,
        incidentDates: actionFormIncidentDates.filter(d => d.month || d.year),
        levelOfIncident: document.getElementById("actionFormLevel").value,
        decision: document.getElementById("actionFormDecision").value,
        actionPlan: document.getElementById("actionFormPlan").value,
        comments: document.getElementById("actionFormComments").value
    };

    if (id) {
        const idx = actionRecords.findIndex(a => a.id === id);
        if (idx !== -1) actionRecords[idx] = record; else actionRecords.push(record);
    } else {
        actionRecords.push(record);
    }

    saveActionRecordsToStorage();
    closeActionModal();
    renderActionsList();
}

export function deleteAction(id) {
    if (!guard("actions.delete")) return;
    if (!confirm("Delete this action record? This cannot be undone.")) return;
    actionRecords = actionRecords.filter(a => a.id !== id);
    saveActionRecordsToStorage();
    renderActionsList();
}

/**
 * Requirement 3: Action Form PDF Export
 * Excludes all instruction hints, tooltips, info icons, and explanatory text.
 */
export function generateActionPdfBlob(id) {
    const record = actionRecords.find(a => a.id === id);
    if (!record) return Promise.reject(new Error("Action record not found."));

    openActionForm(id);
    const element = document.getElementById("actionFormPdfContent");
    const safeName = (record.employeeName || "Agent").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const dateStr = new Date(record.createdAt || Date.now()).toISOString().split("T")[0];
    const filename = "Action_" + safeName + "_" + dateStr + ".pdf";

    element.classList.add("pdf-export-mode");
    // Ensure all tooltips and hints are completely hidden
    element.querySelectorAll('.instruction-hint, .info-tooltip-wrap, .tooltip-popup, .pdf-exclude, .help-text, .no-print, [role="tooltip"]')
        .forEach(el => el.style.setProperty('display', 'none', 'important'));

    // Swap textareas for text divs
    ["actionFormPlan", "actionFormComments"].forEach(function (tid) {
        const ta = document.getElementById(tid);
        if (ta) {
            const div = document.createElement("div");
            div.className = "pdf-notes-render w-full border border-dashed border-slate-300 rounded-sm p-2 text-blue-700 font-medium text-xs";
            div.style.whiteSpace = "pre-wrap";
            div.style.wordBreak = "break-word";
            div.style.minHeight = ta.offsetHeight + "px";
            div.textContent = ta.value;
            ta.insertAdjacentElement("afterend", div);
            ta.classList.add("pdf-swapped-out");
        }
    });

    return window.html2pdf().set(getPdfExportOptions(filename)).from(element).outputPdf("blob").then(function (blob) {
        element.classList.remove("pdf-export-mode");
        element.querySelectorAll('.pdf-notes-render').forEach(d => d.remove());
        element.querySelectorAll('textarea.pdf-swapped-out').forEach(ta => ta.classList.remove("pdf-swapped-out"));
        element.querySelectorAll('.instruction-hint, .info-tooltip-wrap, .tooltip-popup, .pdf-exclude, .help-text, .no-print, [role="tooltip"]')
            .forEach(el => el.style.removeProperty('display'));
        closeActionModal();
        return { blob: blob, filename: filename };
    }).catch(function (err) {
        element.classList.remove("pdf-export-mode");
        element.querySelectorAll('.pdf-notes-render').forEach(d => d.remove());
        element.querySelectorAll('textarea.pdf-swapped-out').forEach(ta => ta.classList.remove("pdf-swapped-out"));
        element.querySelectorAll('.instruction-hint, .info-tooltip-wrap, .tooltip-popup, .pdf-exclude, .help-text, .no-print, [role="tooltip"]')
            .forEach(el => el.style.removeProperty('display'));
        closeActionModal();
        throw err;
    });
}

export function downloadActionPdf(id, btn) {
    if (!guard("actions.export")) return;
    const orig = btn ? btn.textContent : "PDF";
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    generateActionPdfBlob(id).then(function (result) {
        downloadBlob(result.blob, result.filename);
    }).catch(function (err) {
        console.error(err);
        alert("Could not generate action PDF.");
    }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = orig; }
    });
}

export function emailActionPdf(id, btn) {
    if (!guard("actions.edit")) return;
    const record = actionRecords.find(a => a.id === id);
    if (!record) return;
    const emp = resolveEmployee(record.pid, record.employeeName);
    const email = emp ? emp.email : "";

    const orig = btn ? btn.textContent : "Email";
    if (btn) { btn.disabled = true; btn.textContent = "..."; }

    generateActionPdfBlob(id).then(function (result) {
        downloadBlob(result.blob, result.filename);
        const subject = "Action Notice — " + record.employeeName + (record.decision ? " — " + record.decision : "");
        const body = "Hi,\n\nPlease find attached the formal action document (" + (record.decision || "Disciplinary Notice") + ").\n\nThanks.";
        window.location.href = "mailto:" + encodeURIComponent(email) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }).catch(function (err) {
        console.error(err);
        alert("Could not prepare email.");
    }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = orig; }
    });
}

export function populateActionDescriptionOptions() {
    const sel = document.getElementById("actionFormDescription");
    if (!sel) return;
    const current = sel.value;
    const options = Array.from(new Set(ACTION_TEMPLATE_REASONS)).sort();
    sel.innerHTML = '<option value="">— Select —</option>' +
        options.map(o => '<option>' + escapeHtml(o) + '</option>').join("");
    sel.value = current;
}

export function populateActionDecisionDatalist() {
    const list = document.getElementById("actionDecisionDatalist");
    if (!list) return;
    const options = ["Internal Coaching Memo", "Verbal Warning", "Written Warning", "Dismissal Warning", "Contract Termination", "Memo", "Verbal", "Written", "Termination Notice"];
    list.innerHTML = options.map(o => '<option value="' + escapeHtml(o) + '">').join("");
}

export function applyMatrixDecisionSuggestion() {
    const hint = document.getElementById("actionDecisionHint");
    const category = document.getElementById("actionFormDescription")?.value || "";
    const employeeType = document.getElementById("actionFormEmployeeType")?.value || "";
    if (!hint) return;
    if (!category || !employeeType) {
        hint.textContent = "";
        return;
    }
    // Set appropriate suggestion
    const levelEl = document.getElementById("actionFormLevel");
    const decisionEl = document.getElementById("actionFormDecision");
    if (category.includes("Critical") || category.includes("Gross")) {
        if (levelEl) levelEl.value = "Gross";
        if (decisionEl) decisionEl.value = "Written Warning";
        hint.textContent = "Disciplinary Matrix suggests: Written Warning (Critical incident).";
    } else {
        if (levelEl) levelEl.value = "General";
        if (decisionEl) decisionEl.value = "Internal Coaching Memo";
        hint.textContent = "Disciplinary Matrix suggests: Internal Coaching Memo (Initial step).";
    }
}

// Window attachments
if (typeof window !== "undefined") {
    window.renderActionsList = renderActionsList;
    window.openActionForm = openActionForm;
    window.closeActionModal = closeActionModal;
    window.saveActionForm = saveActionForm;
    window.deleteAction = deleteAction;
    window.downloadActionPdf = downloadActionPdf;
    window.emailActionPdf = emailActionPdf;
    window.addIncidentDateRow = addIncidentDateRow;
    window.syncActionManagerField = syncActionManagerField;
    window.applyMatrixDecisionSuggestion = applyMatrixDecisionSuggestion;
}
