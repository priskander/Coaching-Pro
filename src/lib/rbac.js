/* RBAC: shared with the backend (rbac-schema.json + rbac-core.js). */
export const RBAC_CONFIG = {
  "inactiveStatuses": [
    "Resigned",
    "Terminated"
  ],
  "permissions": {
    "dashboard.view": {
      "group": "read",
      "label": "Team Performance Dashboard",
      "module": "dashboard",
      "action": "view"
    },
    "coaching.view": {
      "group": "read",
      "label": "Coaching Sheets",
      "module": "coaching",
      "action": "view"
    },
    "coaching.edit": {
      "group": "edit",
      "label": "Create & edit coaching sheets",
      "module": "coaching",
      "action": "edit",
      "hint": "Also covers creating a sheet and sending it by email"
    },
    "coaching.export": {
      "group": "read",
      "label": "Download coaching sheets (PDF)",
      "module": "coaching",
      "action": "export"
    },
    "actions.view": {
      "group": "read",
      "label": "Actions Management",
      "module": "actions",
      "action": "view"
    },
    "actions.create": {
      "group": "edit",
      "label": "Create actions",
      "module": "actions",
      "action": "create"
    },
    "actions.edit": {
      "group": "edit",
      "label": "Edit & e-mail actions",
      "module": "actions",
      "action": "edit"
    },
    "actions.delete": {
      "group": "edit",
      "label": "Delete actions",
      "module": "actions",
      "action": "delete"
    },
    "actions.export": {
      "group": "read",
      "label": "Download action PDFs",
      "module": "actions",
      "action": "export"
    },
    "rolling.view": {
      "group": "read",
      "label": "Agents Rolling Records",
      "module": "rolling",
      "action": "view"
    },
    "employees.view": {
      "group": "read",
      "label": "Organizational Chart",
      "module": "employees",
      "action": "view"
    },
    "employees.create": {
      "group": "edit",
      "label": "Add employee profiles",
      "module": "employees",
      "action": "create"
    },
    "employees.edit": {
      "group": "edit",
      "label": "Edit employee profiles",
      "module": "employees",
      "action": "edit"
    },
    "employees.delete": {
      "group": "edit",
      "label": "Delete employee profiles",
      "module": "employees",
      "action": "delete"
    },
    "config.edit": {
      "group": "edit",
      "label": "Edit KPI Library & Disciplinary Matrix",
      "module": "config",
      "action": "edit"
    },
    "data.import": {
      "group": "edit",
      "label": "Import monthly performance",
      "module": "import",
      "action": "create"
    },
    "admin.reset": {
      "group": "admin",
      "label": "Delete database / data reset",
      "module": "reset",
      "action": "admin"
    },
    "admin.users": {
      "group": "admin",
      "label": "Assign roles & manage users",
      "module": "users",
      "action": "admin",
      "lockedTo": "admin"
    },
    "admin.panel": {
      "group": "admin",
      "label": "Administrative Control Panel",
      "module": "panel",
      "action": "admin",
      "lockedTo": "admin",
      "hint": "Administrator role only; cannot be granted to other roles"
    }
  },
  "roles": [
    {
      "id": "admin",
      "label": "Administrator",
      "scope": "org",
      "description": "Full create / read / update / delete on every tab, plus user management, the Control Panel and full database reset.",
      "permissions": [
        "dashboard.view",
        "coaching.view",
        "coaching.edit",
        "coaching.export",
        "actions.view",
        "actions.create",
        "actions.edit",
        "actions.delete",
        "actions.export",
        "rolling.view",
        "employees.view",
        "employees.create",
        "employees.edit",
        "employees.delete",
        "config.edit",
        "data.import",
        "admin.reset",
        "admin.users",
        "admin.panel"
      ],
      "system": true
    },
    {
      "id": "operations_manager",
      "label": "Operations Manager",
      "scope": "org",
      "description": "Upper management: organization-wide view and edit, no user management, Control Panel or database reset.",
      "permissions": [
        "dashboard.view",
        "coaching.view",
        "coaching.edit",
        "coaching.export",
        "actions.view",
        "actions.create",
        "actions.edit",
        "actions.delete",
        "actions.export",
        "rolling.view",
        "employees.view",
        "employees.create",
        "employees.edit",
        "employees.delete",
        "config.edit",
        "data.import"
      ],
      "system": true
    },
    {
      "id": "team_leader",
      "label": "Team Leader",
      "scope": "team",
      "description": "Every tab, limited to themselves and their direct reports; edits coaching sheets and actions; can reset the data (org chart profiles are kept).",
      "permissions": [
        "dashboard.view",
        "coaching.view",
        "coaching.edit",
        "coaching.export",
        "actions.view",
        "actions.create",
        "actions.edit",
        "actions.delete",
        "actions.export",
        "rolling.view",
        "employees.view",
        "admin.reset"
      ],
      "system": true
    },
    {
      "id": "quality_analyst",
      "label": "Quality Supervisor",
      "scope": "org",
      "description": "Coaching Sheets tab only: view, create, edit and export, for every agent.",
      "permissions": [
        "coaching.view",
        "coaching.edit",
        "coaching.export"
      ],
      "system": true
    },
    {
      "id": "senior_agent",
      "label": "Senior Agent",
      "scope": "peers",
      "description": "Read-only: own data plus the rest of their team (colleagues under the same team leader).",
      "permissions": [
        "dashboard.view",
        "coaching.view",
        "coaching.export",
        "actions.view",
        "actions.export",
        "rolling.view"
      ],
      "system": true
    },
    {
      "id": "agent",
      "label": "Agent",
      "scope": "self",
      "description": "Read-only: own coaching sheet and the actions submitted to them.",
      "permissions": [
        "coaching.view",
        "coaching.export",
        "actions.view",
        "actions.export"
      ],
      "system": true
    }
  ],
  "modules": [
    { "id": "dashboard", "label": "Team Performance Dashboard" },
    { "id": "coaching", "label": "Coaching Sheets" },
    { "id": "actions", "label": "Actions Management" },
    { "id": "rolling", "label": "Agents Rolling Records" },
    { "id": "employees", "label": "Organizational Chart" },
    { "id": "config", "label": "KPI Library & Disciplinary Matrix" },
    { "id": "import", "label": "Performance Import" },
    { "id": "reset", "label": "Database Reset" },
    { "id": "users", "label": "User & Role Management" },
    { "id": "panel", "label": "Control Panel" }
  ],
  "actions": [
    { "id": "view", "label": "View" },
    { "id": "create", "label": "Create" },
    { "id": "edit", "label": "Edit" },
    { "id": "delete", "label": "Delete" },
    { "id": "export", "label": "Export" },
    { "id": "admin", "label": "Admin" }
  ]
};

export const RBAC_DEFAULT_ROLES = JSON.parse(JSON.stringify(RBAC_CONFIG.roles));
export const RBAC_OVERRIDE_KEY = "coachingForm_rbacRoles_v1";

export function createRbac(config, opts) {
    const getUsers = (opts && opts.users) || null;
    const roles = {};
    (config.roles || []).forEach(function (r) { roles[r.id] = r; });
    const inactive = config.inactiveStatuses || [];

    const nameKey = function (n) { return String(n == null ? "" : n).trim().replace(/\s+/g, " ").toLowerCase(); };
    const pidKey = function (p) { return String(p == null ? "" : p).trim().toUpperCase(); };

    function roleOf(user) { return (user && roles[user.role]) || null; }
    function isActiveAccount(user) { return !!user && inactive.indexOf(user.contractStatus) === -1; }

    function can(user, permission) {
        const r = roleOf(user);
        if (!r || !isActiveAccount(user)) return false;
        const def = config.permissions && config.permissions[permission];
        if (def && def.lockedTo) return r.id === def.lockedTo;
        if (r.id === "admin") return !!def;
        return r.permissions.indexOf(permission) !== -1;
    }

    function scopeOf(user) { const r = roleOf(user); return r && isActiveAccount(user) ? r.scope : "none"; }

    function samePerson(user, subject) {
        if (!user || !subject) return false;
        if (pidKey(subject.pid)) return pidKey(subject.pid) === pidKey(user.pid);
        return !!nameKey(subject.name) && nameKey(subject.name) === nameKey(user.name);
    }

    function nameMatches(text, manager) {
        const a = nameKey(text), b = nameKey(manager.name);
        if (!a || !b) return false;
        if (a === b || pidKey(text) === pidKey(manager.pid)) return true;
        const m = String(text).match(/\(([^)]+)\)\s*$/); if (m && pidKey(m[1]) === pidKey(manager.pid)) return true;
        const ta = a.split(" ").sort(), tb = b.split(" ").sort();
        if (ta.join(" ") === tb.join(" ")) return true;
        const small = ta.length <= tb.length ? ta : tb, big = ta.length <= tb.length ? tb : ta;
        return small.length >= 2 && small.every(function (w) { return big.indexOf(w) !== -1; });
    }

    function isDirectReport(manager, target) {
        if (!manager || !target || pidKey(target.pid) === pidKey(manager.pid)) return false;
        if (pidKey(target.managerPid)) return pidKey(target.managerPid) === pidKey(manager.pid);
        return nameMatches(target.teamLeader, manager);
    }

    function managerOf(target, users) {
        if (!target) return null;
        const list = users || [];
        if (pidKey(target.managerPid)) return list.find(function (u) { return pidKey(u.pid) === pidKey(target.managerPid); }) || null;
        const hit = list.filter(function (u) { return pidKey(u.pid) !== pidKey(target.pid) && nameMatches(target.teamLeader, u); });
        if (hit.length <= 1) return hit[0] || null;
        const exact = hit.filter(function (u) { return nameKey(u.name) === nameKey(target.teamLeader); });
        return exact.length === 1 ? exact[0] : null;
    }

    function isSubordinate(manager, target, users) {
        if (isDirectReport(manager, target)) return true;
        const list = users || (getUsers ? getUsers() : null);
        if (!list || !manager || !target) return false;
        const seen = {};
        let cur = target;
        for (let i = 0; i < 12 && cur; i++) {
            const up = managerOf(cur, list);
            if (!up || seen[pidKey(up.pid)]) return false;
            if (pidKey(up.pid) === pidKey(manager.pid)) return true;
            seen[pidKey(up.pid)] = 1; cur = up;
        }
        return false;
    }

    function teamKey(x) {
        if (!x) return "";
        if (pidKey(x.managerPid)) return "pid:" + pidKey(x.managerPid);
        return nameKey(x.teamLeader) ? "name:" + nameKey(x.teamLeader) : "";
    }

    function sameTeam(user, target, users) {
        const list = users || (getUsers ? getUsers() : null);
        if (list) { const a = managerOf(user, list), b = managerOf(target, list); if (a && b) return pidKey(a.pid) === pidKey(b.pid); }
        const k = teamKey(user); return !!k && k === teamKey(target);
    }

    function enrich(subject, users) {
        if (!subject || subject.teamLeader || subject.managerPid) return subject;
        const list = users || (getUsers ? getUsers() : null); if (!list) return subject;
        let p = pidKey(subject.pid) ? list.find(function (u) { return pidKey(u.pid) === pidKey(subject.pid); }) : null;
        if (!p && nameKey(subject.name)) { const m = list.filter(function (u) { return nameKey(u.name) === nameKey(subject.name); }); if (m.length === 1) p = m[0]; }
        return p ? { pid: p.pid, name: p.name, teamLeader: p.teamLeader, managerPid: p.managerPid } : subject;
    }

    function isVisible(user, key) {
        const r = roleOf(user);
        if (!r || !isActiveAccount(user)) return false;
        if (r.id === "admin") return true;
        return !(r.hiddenFields || []).some(function (k) { return k === key; });
    }

    function hiddenKeys(user) { const r = roleOf(user); return !r || r.id === "admin" || !isActiveAccount(user) ? [] : (r.hiddenFields || []).slice(); }

    function inScope(user, subject, users) {
        switch (scopeOf(user)) {
            case "org": return true;
            case "team": return samePerson(user, subject) || isSubordinate(user, enrich(subject, users), users);
            case "peers": return samePerson(user, subject) || sameTeam(user, enrich(subject, users), users);
            case "self": return samePerson(user, subject);
            default: return false;
        }
    }

    function authorize(user, permission, subject, users) {
        if (!user) return { allowed: false, reason: "unauthenticated" };
        if (!isActiveAccount(user)) return { allowed: false, reason: "account inactive" };
        if (!roleOf(user)) return { allowed: false, reason: "no role assigned" };
        if (!can(user, permission)) return { allowed: false, reason: "missing permission " + permission };
        if (subject && !inScope(user, subject, users)) return { allowed: false, reason: "subject outside view scope (" + scopeOf(user) + ")" };
        return { allowed: true, reason: "ok" };
    }

    function filterVisible(user, items, toSubject, users) {
        return (items || []).filter(function (it) { return inScope(user, toSubject(it), users); });
    }

    function summarize(user) {
        const out = { scope: scopeOf(user), role: roleOf(user), read: [], edit: [], admin: [] };
        Object.keys(config.permissions).forEach(function (key) {
            const p = config.permissions[key];
            if (can(user, key)) out[p.group].push({ key: key, label: p.label });
        });
        return out;
    }

    function wouldRemoveLastAdmin(allUsers, pid, change) {
        const admins = (allUsers || []).filter(function (u) { return u.role === "admin" && isActiveAccount(u); });
        if (!admins.some(function (a) { return pidKey(a.pid) === pidKey(pid); })) return false;
        const after = admins.filter(function (a) { return pidKey(a.pid) !== pidKey(pid); });
        const kept = change && !change.remove && (change.role || "admin") === "admin" &&
            inactive.indexOf(change.contractStatus || "Active") === -1;
        return after.length === 0 && !kept;
    }

    return {
        config: config, roleOf: roleOf, isActiveAccount: isActiveAccount, can: can, scopeOf: scopeOf,
        samePerson: samePerson, isDirectReport: isDirectReport, isSubordinate: isSubordinate, managerOf: managerOf,
        nameMatches: nameMatches, sameTeam: sameTeam, isVisible: isVisible, hiddenKeys: hiddenKeys, inScope: inScope,
        authorize: authorize, filterVisible: filterVisible, summarize: summarize, wouldRemoveLastAdmin: wouldRemoveLastAdmin
    };
}

if (typeof window !== "undefined") {
    window.RBAC_CONFIG = RBAC_CONFIG;
    window.RBAC_DEFAULT_ROLES = RBAC_DEFAULT_ROLES;
    window.createRbac = createRbac;
}
