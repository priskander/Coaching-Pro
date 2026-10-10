/**
 * auth-session.js — Access control, session management, profile menu, and RBAC guards.
 */
import { RBAC_CONFIG, createRbac } from './rbac.js';
import { employeeRecords, getEmployeeByPid } from './org-chart.js';
import { escapeHtml } from './utils.js';

export const SESSION_STORAGE_KEY = "coachingForm_session_v1";
export const SETUP_USER = { pid: "", name: "Setup Administrator", role: "admin", contractStatus: "Active", setup: true };
export const TAB_PERMISSIONS = {
    teamDashboardTab: "dashboard.view",
    coachingFormTab: "coaching.view",
    actionsTab: "actions.view",
    orgChartTab: "employees.view",
    controlPanelTab: "admin.panel"
};

export const $id = id => document.getElementById(id);

export let RBAC = createRbac(RBAC_CONFIG, { users: () => employeeRecords });

export function updateRbacInstance() {
    RBAC = createRbac(RBAC_CONFIG, { users: () => employeeRecords });
}

export function readSessionPid() {
    try { return sessionStorage.getItem(SESSION_STORAGE_KEY) || ""; } catch (e) { return ""; }
}
export function writeSession(pid) {
    try { sessionStorage.setItem(SESSION_STORAGE_KEY, pid); } catch (e) {}
}
export function clearSession() {
    try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch (e) {}
}
export function hasActiveAdmin() {
    return employeeRecords.some(e => e.role === "admin" && RBAC.isActiveAccount(e));
}
export function rbacActive() {
    return hasActiveAdmin();
}

export function currentUser() {
    if (!rbacActive()) return SETUP_USER;
    const pid = readSessionPid();
    const e = pid ? getEmployeeByPid(pid) : null;
    return e && RBAC.isActiveAccount(e) && RBAC.roleOf(e) ? e : null;
}

export function can(permission) {
    const u = currentUser();
    return !!u && RBAC.can(u, permission);
}

export function userScope() {
    const u = currentUser();
    return u ? RBAC.scopeOf(u) : "none";
}

export function subjectOfEmployee(e) {
    return { pid: e.pid, name: e.name, teamLeader: e.teamLeader, managerPid: e.managerPid };
}

export function canViewEmployeeRecord(e) {
    const u = currentUser();
    return !!u && (userScope() === "org" || RBAC.inScope(u, subjectOfEmployee(e)));
}

let accessToastTimer = null;
export function showAccessToast(msg) {
    let t = $id("accessToast");
    if (!t) {
        t = document.createElement("div");
        t.id = "accessToast";
        t.setAttribute("role", "alert");
        t.className = "no-print fixed bottom-4 right-4 z-[120] max-w-sm bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg";
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(accessToastTimer);
    accessToastTimer = setTimeout(function () { t.classList.add("hidden"); }, 4000);
}

export function guard(permission) {
    if (can(permission)) {
        // Special case: Control Panel tab is strictly for 'admin' role, even if others have permissions
        if (permission === "admin.panel") {
            const u = currentUser();
            if (!u || u.role !== 'admin') {
                showAccessToast("Only Administrators can access the Control Panel.");
                return false;
            }
        }
        return true;
    }
    const p = RBAC_CONFIG.permissions[permission];
    showAccessToast("Your role doesn't allow this" + (p ? " (" + p.label + ")" : "") + ".");
    return false;
}
export const guardRoute = guard;

const AVATAR_COLORS = ["bg-emerald-600", "bg-indigo-600", "bg-orange-600", "bg-rose-600", "bg-teal-600", "bg-purple-600"];

export function avatarHtml(user, px) {
    const size = 'style="width:' + px + 'px;height:' + px + 'px"';
    if (user.photo) return '<img src="' + escapeHtml(user.photo) + '" alt="" ' + size + ' class="rounded-full object-cover shrink-0">';
    const name = String(user.displayName || user.name || "").trim();
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
    if (!initials || user.setup) {
        return '<span ' + size + ' class="rounded-full bg-slate-300 text-slate-600 inline-flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-3/5 w-3/5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg></span>';
    }
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return '<span ' + size + ' class="rounded-full ' + AVATAR_COLORS[h % AVATAR_COLORS.length] + ' text-white font-semibold inline-flex items-center justify-center shrink-0" style="width:' + px + 'px;height:' + px + 'px;font-size:' + Math.round(px * 0.38) + 'px">' + escapeHtml(initials) + '</span>';
}

export function roleTitleOf(u) {
    if (u.setup) return "Administrator (setup mode)";
    const r = RBAC_CONFIG.roles.find(x => x.id === u.role);
    return r ? r.label : "No role";
}

export function renderProfileHeader() {
    const u = currentUser();
    const root = $id("profileMenuRoot");
    if (!root) return;
    root.classList.toggle("hidden", !u);
    if (!u) { closeProfileMenu(); return; }
    $id("profileAvatar").innerHTML = avatarHtml(u, 36);
    $id("profileName").textContent = u.displayName || u.name;
    $id("profileRole").textContent = roleTitleOf(u);
    if (!$id("profileMenu").classList.contains("hidden")) renderProfileMenu();
}

export function renderProfileMenu() {
    const u = currentUser();
    if (!u) return;
    const sum = RBAC.summarize(u);
    const scopeText = { org: "Organization-wide", team: "Own team", peers: "Own team peers", self: "Personal records only" }[sum.scope] || "No access";
    const dept = [u.department, u.subDepartment].filter(Boolean).join(" › ");
    
    $id("profileMenu").innerHTML =
        '<div class="p-4 flex items-center gap-3 border-b border-slate-200">' + avatarHtml(u, 48) +
            '<div class="min-w-0"><p class="font-semibold text-slate-900 truncate">' + escapeHtml(u.displayName || u.name) + '</p>' +
            '<p class="text-xs text-teal-700 font-medium">' + escapeHtml(roleTitleOf(u)) + '</p>' +
            (u.email ? '<p class="text-[11px] text-slate-500 truncate">' + escapeHtml(u.email) + '</p>' : "") + '</div></div>' +
        '<div class="p-4 border-b border-slate-200 text-xs space-y-1.5"><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Account Position</p>' +
            '<p><span class="text-slate-500">Scope:</span> <span class="font-medium text-slate-800">' + escapeHtml(scopeText) + '</span></p>' +
            (dept ? '<p><span class="text-slate-500">Dept:</span> <span class="font-medium text-slate-800">' + escapeHtml(dept) + '</span></p>' : '') +
        '</div>' +
        '<div class="p-2 flex flex-col">' +
            '<button type="button" role="menuitem" onclick="openEditProfileModal()" class="text-left text-sm text-slate-700 hover:bg-slate-100 rounded px-3 py-2 transition">Edit Profile</button>' +
            (can("admin.panel") ? '<button type="button" role="menuitem" onclick="closeProfileMenu();showControlPanelTab()" class="text-left text-sm text-slate-700 hover:bg-slate-100 rounded px-3 py-2 transition">Control Panel</button>' : "") +
            (u.setup ? "" : '<button type="button" role="menuitem" onclick="signOut()" class="text-left text-sm text-red-700 hover:bg-red-50 rounded px-3 py-2 transition font-medium">Sign out</button>') +
        '</div>';
}

export function toggleProfileMenu() {
    const menu = $id("profileMenu");
    if (!menu) return;
    const open = menu.classList.contains("hidden");
    if (open) { renderProfileMenu(); menu.classList.remove("hidden"); } else menu.classList.add("hidden");
    $id("profileMenuBtn")?.setAttribute("aria-expanded", open ? "true" : "false");
}

export function closeProfileMenu() {
    $id("profileMenu")?.classList.add("hidden");
    $id("profileMenuBtn")?.setAttribute("aria-expanded", "false");
}

export function submitSignIn(ev) {
    if (ev) ev.preventDefault();
    const err = $id("signInError");
    const pid = $id("signInPid").value.trim();
    const email = $id("signInEmail").value.trim().toLowerCase();
    const e = pid ? getEmployeeByPid(pid) : null;
    if (!e || !RBAC.isActiveAccount(e) || !RBAC.roleOf(e) || !email || String(e.email || "").toLowerCase() !== email) {
        if (err) err.textContent = "PID and email don't match an active employee profile with an assigned role.";
        return false;
    }
    if (err) err.textContent = "";
    $id("signInPid").value = ""; $id("signInEmail").value = "";
    writeSession(e.pid);
    renderAccessUI();
    routeToLanding();
    return false;
}

export function signOut() {
    clearSession();
    location.reload();
}

export function routeToLanding() {
    if (can("dashboard.view")) return window.showTeamDashboardTab();
    if (can("coaching.view")) return window.showCoachingFormTab();
    if (can("actions.view")) return window.showActionsTab();
    showAccessToast("Your role has no accessible sections.");
}

export function enforceCurrentRoute() {
    if (!currentUser()) return;
    const visible = Object.keys(TAB_PERMISSIONS).find(id => !$id(id).classList.contains("hidden"));
    if (!visible || !can(TAB_PERMISSIONS[visible])) routeToLanding();
}

export function applyPermissionUI() {
    document.querySelectorAll("[data-perm]").forEach(el => el.classList.toggle("rbac-hidden", !can(el.dataset.perm)));
    document.querySelectorAll("[data-perm-any]").forEach(el => el.classList.toggle("rbac-hidden", !el.dataset.permAny.split(/\s+/).some(can)));
    const role = $id("empRole");
    if (role) { role.disabled = !can("admin.users"); }
    const form = $id("coachingForm");
    if (form) { if (can("coaching.edit")) form.removeAttribute("inert"); else form.setAttribute("inert", ""); }
}

export function renderAccessUI() {
    if (rbacActive() && readSessionPid() && !currentUser()) clearSession();
    const u = currentUser();
    const overlay = $id("authOverlay");
    if (overlay) {
        overlay.classList.toggle("hidden", !!u);
        overlay.classList.toggle("flex", !u);
    }
    document.body.classList.toggle("overflow-hidden", !u);
    $id("setupBanner")?.classList.toggle("hidden", !(u && u.setup));
    renderProfileHeader();
    applyPermissionUI();
    if (u) enforceCurrentRoute(); else setTimeout(function () { $id("signInPid")?.focus(); }, 0);
}

if (typeof window !== "undefined") {
    window.toggleProfileMenu = toggleProfileMenu;
    window.closeProfileMenu = closeProfileMenu;
    window.submitSignIn = submitSignIn;
    window.signOut = signOut;
    window.currentUser = currentUser;
    window.can = can;
    window.guard = guard;
    window.guardRoute = guardRoute;
    window.renderAccessUI = renderAccessUI;
}
