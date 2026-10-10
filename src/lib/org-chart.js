/**
 * org-chart.js — Organizational Chart, Employee Registry, and Bulk Sync
 */
import { RBAC_CONFIG } from './rbac.js';
import { can, guard, showAccessToast, renderAccessUI, writeSession, rbacActive, updateRbacInstance } from './auth-session.js';
import { escapeHtml } from './utils.js';

export const EMPLOYEES_STORAGE_KEY = "coachingForm_employees_v1";
export const EMP_FIELD_IDS = {
    name: "empName", pid: "empPid", email: "empEmail", teamLeader: "empLeader",
    contractType: "empContract", contractStatus: "empStatus", joinDate: "empJoin",
    department: "empDept", subDepartment: "empSubDept", role: "empRole"
};
export let CONTRACT_TYPES = ["Full-Time", "Part-Time", "Vendor", "Off-Payroll", "Outsourced", "Perm/OS"];
export let CONTRACT_STATUSES = ["Active", "Probation", "On Leave", "Notice Period", "Resigned", "Terminated"];
export let EMPLOYEE_ROLES = RBAC_CONFIG.roles.map(r => ({ id: r.id, label: r.label }));

export function loadEmployees() {
    try {
        const arr = JSON.parse(localStorage.getItem(EMPLOYEES_STORAGE_KEY) || "[]");
        return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
}

export let employeeRecords = loadEmployees();

export function saveEmployees() {
    try {
        localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employeeRecords));
        updateRbacInstance();
    } catch (e) {
        console.warn("Could not save employees.", e);
    }
}

export function populateRoleOptions() {
    const sel = document.getElementById("empRole");
    if (sel) {
        sel.innerHTML = '<option value="">Select…</option>' +
            EMPLOYEE_ROLES.map(r => '<option value="' + r.id + '">' + escapeHtml(r.label) + '</option>').join("");
    }
}

export function normalizePid(p) { return String(p == null ? "" : p).trim().toUpperCase(); }
export function normalizeName(n) { return String(n || "").trim().replace(/\s+/g, " ").toLowerCase(); }

export function getEmployeeByPid(pid) {
    const k = normalizePid(pid);
    return k ? (employeeRecords.find(e => normalizePid(e.pid) === k) || null) : null;
}

export function getEmployeeByName(name) {
    const k = normalizeName(name);
    const m = k ? employeeRecords.filter(e => normalizeName(e.name) === k) : [];
    return m.length === 1 ? m[0] : null;
}

export function resolveEmployee(pid, name) {
    return getEmployeeByPid(pid) || getEmployeeByName(name);
}

export function getRoleLabel(id) {
    const r = EMPLOYEE_ROLES.find(x => x.id === id);
    return r ? r.label : "";
}

export function validateEmployeeInput(v, editingPid) {
    const err = {};
    if (v.name.length < 2) err.name = "Enter the agent's full name (at least 2 characters).";
    if (!v.pid) err.pid = "PID is required.";
    else if (!/^[A-Za-z0-9._-]{2,30}$/.test(v.pid)) err.pid = "Use 2–30 letters, digits, dots, dashes or underscores.";
    else {
        const dup = getEmployeeByPid(v.pid);
        if (dup && normalizePid(dup.pid) !== normalizePid(editingPid)) err.pid = "This PID already belongs to " + dup.name + ".";
    }
    if (!v.email) err.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) err.email = "Enter a valid email address.";
    if (!v.teamLeader) err.teamLeader = "Team Leader / Manager is required.";
    if (CONTRACT_TYPES.indexOf(v.contractType) === -1 && !((getEmployeeByPid(editingPid) || {}).contractType === v.contractType)) err.contractType = "Choose a contract type.";
    if (CONTRACT_STATUSES.indexOf(v.contractStatus) === -1 && !((getEmployeeByPid(editingPid) || {}).contractStatus === v.contractStatus)) err.contractStatus = "Choose a contract status.";
    if (v.department.length < 2) err.department = "Department is required.";
    if (v.subDepartment.length < 2) err.subDepartment = "Sub-Department is required.";
    if (!EMPLOYEE_ROLES.some(r => r.id === v.role)) err.role = "Choose an agent role.";
    if (!v.joinDate || isNaN(new Date(v.joinDate).getTime())) err.joinDate = "Pick a valid join date.";
    else if (v.joinDate < "1990-01-01") err.joinDate = "Join date looks too early.";
    return err;
}

export function readEmployeeForm() {
    const v = {};
    Object.keys(EMP_FIELD_IDS).forEach(k => {
        const el = document.getElementById(EMP_FIELD_IDS[k]);
        v[k] = el ? el.value.trim() : "";
    });
    return v;
}

export function showEmployeeErrors(err) {
    Object.keys(EMP_FIELD_IDS).forEach(k => {
        const el = document.getElementById(EMP_FIELD_IDS[k]);
        const errSlot = document.querySelector('[data-emp-err="' + k + '"]');
        if (errSlot) errSlot.textContent = err[k] || "";
        if (el) {
            el.classList.toggle("border-red-500", !!err[k]);
            el.classList.toggle("border-slate-300", !err[k]);
            el.setAttribute("aria-invalid", err[k] ? "true" : "false");
        }
    });
}

export function submitEmployeeForm(ev) {
    if (ev) ev.preventDefault();
    const v = readEmployeeForm();
    const editing = document.getElementById("empEditPid").value;
    const wasSetup = !rbacActive();
    const existingRec = editing ? getEmployeeByPid(editing) : null;

    if (!can(editing ? "employees.edit" : "employees.create")) {
        showAccessToast("Your role cannot modify employee profiles.");
        return false;
    }
    if (!can("admin.users")) v.role = existingRec ? existingRec.role : "agent";

    const err = validateEmployeeInput(v, editing);
    showEmployeeErrors(err);
    const firstBad = Object.keys(EMP_FIELD_IDS).find(k => err[k]);
    if (firstBad) { document.getElementById(EMP_FIELD_IDS[firstBad])?.focus(); return false; }

    const now = new Date().toISOString();
    const fields = {
        name: v.name, email: v.email, teamLeader: v.teamLeader, contractType: v.contractType,
        contractStatus: v.contractStatus, department: v.department, subDepartment: v.subDepartment,
        role: v.role, joinDate: v.joinDate, updatedAt: now
    };

    const existing = editing ? getEmployeeByPid(editing) : null;
    if (existing) {
        Object.assign(existing, fields);
    } else {
        employeeRecords.push(Object.assign({ pid: v.pid, createdAt: now }, fields));
    }

    saveEmployees();
    resetEmployeeForm();
    if (wasSetup && v.role === "admin" && rbacActive()) writeSession(v.pid);
    renderEmployeeList();
    renderAccessUI();
    const statusEl = document.getElementById("empFormStatus");
    if (statusEl) {
        statusEl.textContent = existing ? "Employee updated." : "Employee added successfully.";
        setTimeout(() => { if (statusEl.textContent.includes("Employee")) statusEl.textContent = ""; }, 4000);
    }
    return false;
}

export function resetEmployeeForm() {
    Object.keys(EMP_FIELD_IDS).forEach(k => {
        const el = document.getElementById(EMP_FIELD_IDS[k]);
        if (el) el.value = "";
    });
    const editPid = document.getElementById("empEditPid");
    if (editPid) editPid.value = "";
    const pidInput = document.getElementById("empPid");
    if (pidInput) pidInput.readOnly = false;
    const btn = document.getElementById("empSubmitBtn");
    if (btn) btn.textContent = "Add Employee";
    showEmployeeErrors({});
}

export function editEmployee(pid) {
    const e = getEmployeeByPid(pid);
    if (!e) return;
    if (!can("employees.edit")) { showAccessToast("Your role cannot edit employee records."); return; }
    Object.keys(EMP_FIELD_IDS).forEach(k => {
        const el = document.getElementById(EMP_FIELD_IDS[k]);
        if (el) el.value = e[k] || "";
    });
    document.getElementById("empEditPid").value = e.pid;
    document.getElementById("empPid").readOnly = true;
    document.getElementById("empSubmitBtn").textContent = "Save Changes";
    showEmployeeErrors({});
    document.getElementById("empName")?.focus();
}

export function deleteEmployee(pid) {
    if (!guard("employees.delete")) return;
    const e = getEmployeeByPid(pid);
    if (!e) return;
    if (!confirm("Remove " + e.name + "'s profile? Linked data will remain.")) return;
    employeeRecords = employeeRecords.filter(x => normalizePid(x.pid) !== normalizePid(pid));
    saveEmployees();
    if (normalizePid(document.getElementById("empEditPid").value) === normalizePid(pid)) resetEmployeeForm();
    renderEmployeeList();
}

export function renderEmployeeList() {
    const body = document.getElementById("empListBody");
    if (!body) return;
    const optList = key => Array.from(new Set(employeeRecords.map(e => e[key]).filter(Boolean)))
        .map(n => '<option value="' + escapeHtml(n) + '">').join("");
    
    document.getElementById("empDeptList").innerHTML = optList("department");
    document.getElementById("empSubDeptList").innerHTML = optList("subDepartment");
    document.getElementById("empLeaderList").innerHTML = Array.from(new Set(employeeRecords.map(e => e.name).concat(employeeRecords.map(e => e.teamLeader)).filter(Boolean)))
        .map(n => '<option value="' + escapeHtml(n) + '">').join("");

    const q = (document.getElementById("empSearchInput")?.value || "").trim().toLowerCase();
    const isAdmin = can("admin.panel");
    const rows = employeeRecords.filter(e => {
        if (!isAdmin && e.role === 'admin') return false;
        return !q || [e.name, e.pid, e.email, e.teamLeader, e.department, e.subDepartment, e.contractStatus, getRoleLabel(e.role)].join(" ").toLowerCase().indexOf(q) !== -1;
    })
        .slice().sort((a, b) => a.name.localeCompare(b.name));

    body.innerHTML = "";
    rows.forEach(e => {
        const tr = document.createElement("tr");
        const isAdmin = can("admin.panel");
        tr.innerHTML =
            '<td class="p-2 font-mono font-medium">' + escapeHtml(e.pid) + '</td>' +
            '<td class="p-2 font-medium">' + escapeHtml(e.name) + '</td>' +
            '<td class="p-2">' + escapeHtml(e.email) + '</td>' +
            '<td class="p-2">' + escapeHtml(e.teamLeader) + '</td>' +
            '<td class="p-2">' + escapeHtml(e.contractType) + (e.contractStatus ? '<div class="text-[10px] ' + (e.contractStatus === "Active" ? "text-emerald-700" : "text-amber-700") + '">' + escapeHtml(e.contractStatus) + '</div>' : '') + '</td>' +
            '<td class="p-2">' + escapeHtml(e.department || "—") + (e.subDepartment ? '<div class="text-[10px] text-slate-500">' + escapeHtml(e.subDepartment) + '</div>' : '') + '</td>' +
            (isAdmin ? '<td class="p-2 whitespace-nowrap">' + escapeHtml(getRoleLabel(e.role) || "—") + '</td>' : '') +
            '<td class="p-2 whitespace-nowrap">' + escapeHtml(e.joinDate) + '</td>' +
            '<td class="p-2 whitespace-nowrap text-slate-600">Active Profile</td>' +
            (isAdmin ? '<td class="p-2 text-right whitespace-nowrap">' +
                '<button type="button" onclick="editEmployee(\'' + e.pid + '\')" class="bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition mr-1.5">Edit</button>' +
                '<button type="button" onclick="deleteEmployee(\'' + e.pid + '\')" class="bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition">Delete</button>' +
            '</td>' : '');
        body.appendChild(tr);
    });

    if (!rows.length) {
        body.innerHTML = '<tr><td colspan="10" class="p-4 text-center text-slate-400">' + (employeeRecords.length ? "No employees match this search." : "No employee profiles yet — add the first one above.") + '</td></tr>';
    }
}

// Bulk sync handlers
let pendingOrgSync = null;

export function downloadOrgSyncTemplate() {
    if (window.OrgSync) {
        const blob = new Blob([window.OrgSync.templateCsv()], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "org-chart-template.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
}

export function onOrgSyncFile(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    if (!can("employees.create")) {
        showAccessToast("Your role cannot add employees.");
        input.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true });
            const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: true });
            previewOrgSync(rows, f.name);
        } catch (err) {
            showAccessToast("Could not read that file: " + err.message);
        }
        input.value = "";
    };
    reader.readAsArrayBuffer(f);
}

export function previewOrgSync(rows, fileName) {
    if (!window.OrgSync || !can("employees.create")) return null;
    pendingOrgSync = { rows: rows, fileName: fileName || "" };
    const opts = {
        contractTypes: CONTRACT_TYPES, contractStatuses: CONTRACT_STATUSES,
        roles: EMPLOYEE_ROLES, defaultRole: "agent", canAssignRole: can("admin.users")
    };
    const plan = window.OrgSync.planSync(employeeRecords, rows, opts);
    const S = plan.summary;
    const esc = escapeHtml;

    let html = '<div class="space-y-2">' +
        '<p class="font-semibold text-slate-800">' + S.new + ' new employee(s) ready to add, ' + S.matched + ' already in chart (kept unchanged).</p>' +
        (S.rejected ? '<p class="text-red-700">' + S.rejected + ' row(s) rejected due to validation errors.</p>' : '') +
    '</div>';

    document.getElementById("orgSyncBody").innerHTML = html;
    document.getElementById("orgSyncFileName").textContent = fileName || "";
    const btn = document.getElementById("orgSyncConfirmBtn");
    btn.disabled = !S.new;
    btn.textContent = S.new ? "Add " + S.new + " new employees" : "Nothing to add";
    const m = document.getElementById("orgSyncModal");
    m.classList.remove("hidden");
    m.classList.add("flex");
    return plan;
}

export function closeOrgSyncModal() {
    const m = document.getElementById("orgSyncModal");
    m.classList.add("hidden");
    m.classList.remove("flex");
    pendingOrgSync = null;
}

export function confirmOrgSync() {
    if (!guard("employees.create") || !pendingOrgSync || !window.OrgSync) return;
    const opts = {
        contractTypes: CONTRACT_TYPES, contractStatuses: CONTRACT_STATUSES,
        roles: EMPLOYEE_ROLES, defaultRole: "agent", canAssignRole: can("admin.users")
    };
    const plan = window.OrgSync.planSync(employeeRecords, pendingOrgSync.rows, opts);
    const res = window.OrgSync.applySync(employeeRecords, plan);
    if (res.added) {
        employeeRecords = res.records;
        saveEmployees();
    }
    closeOrgSyncModal();
    renderEmployeeList();
    const el = document.getElementById("orgSyncStatus");
    if (el) {
        el.textContent = res.added + " employee" + (res.added === 1 ? "" : "s") + " added successfully.";
        setTimeout(() => { if (el.textContent.includes("added")) el.textContent = ""; }, 6000);
    }
}

if (typeof window !== "undefined") {
    window.submitEmployeeForm = submitEmployeeForm;
    window.resetEmployeeForm = resetEmployeeForm;
    window.editEmployee = editEmployee;
    window.deleteEmployee = deleteEmployee;
    window.renderEmployeeList = renderEmployeeList;
    window.downloadOrgSyncTemplate = downloadOrgSyncTemplate;
    window.onOrgSyncFile = onOrgSyncFile;
    window.previewOrgSync = previewOrgSync;
    window.closeOrgSyncModal = closeOrgSyncModal;
    window.confirmOrgSync = confirmOrgSync;
}
