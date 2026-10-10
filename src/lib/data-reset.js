/**
 * data-reset.js — selective "Delete Database"
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else if (typeof root === "object" && root) root.DataReset = factory();
    else if (typeof globalThis !== "undefined") globalThis.DataReset = factory();
}(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : this), function () {

    var PREFIX = "coachingForm_";
    var REGISTRY = {
        "coachingForm_perfGroupsCache_v1":     { cls: "transactional", label: "Imported performance workbook" },
        "coachingForm_actionRecords_v1":       { cls: "transactional", label: "Action records (incl. engine-generated)" },
        "coachingForm_coachingCustom_v1":      { cls: "transactional", label: "Coaching-sheet custom-field entries" },
        "coachingForm_rollingLedger_v1":       { cls: "transactional", label: "Rolling-records / action-engine ledger" },
        "coachingForm_actionDefaults_v1":      { cls: "transactional", label: "Saved action-form defaults" },
        "coachingForm_employees_v1":           { cls: "org", label: "Organizational Chart (employee profiles, hierarchy, roles)" },
        "coachingForm_agentEmails_v1":         { cls: "org", label: "Agent e-mail mapping" },
        "coachingForm_kpiLibrary_v1":          { cls: "config", label: "KPI Library" },
        "coachingForm_disciplinaryMatrix_v1":  { cls: "config", label: "Disciplinary Matrix" },
        "coachingForm_fieldSchema_v1":         { cls: "config", label: "Custom field definitions" },
        "coachingForm_rbacRoles_v1":           { cls: "config", label: "Roles & permissions" },
        "coachingForm_builtinFields_v1":       { cls: "config", label: "Built-in field labels" },
        "coachingForm_builtinOptions_v1":      { cls: "config", label: "Built-in dropdown options" },
        "coachingForm_deletedUi_v1":           { cls: "config", label: "Deleted built-in fields" },
        "coachingForm_actionEngineConfig_v1":  { cls: "config", label: "Action-engine configuration" },
        "coachingForm_adminAudit_v1":          { cls: "config", label: "Admin audit log" },
        "coachingForm_session_v1":             { cls: "session", label: "Signed-in session" }
    };

    function classify(key) { var r = REGISTRY[key]; return r ? r.cls : "unknown"; }
    function keysOf(cls) { return Object.keys(REGISTRY).filter(function (k) { return REGISTRY[k].cls === cls; }); }

    function assertRegistry(reg) {
        reg = reg || REGISTRY;
        var classes = { transactional: 1, org: 1, config: 1, session: 1 }, org = 0;
        Object.keys(reg).forEach(function (k) {
            if (k.indexOf(PREFIX) !== 0) throw new Error("Key outside prefix: " + k);
            if (!classes[reg[k].cls]) throw new Error("Unknown class for " + k);
            if (reg[k].cls === "org") org++;
        });
        if (!org) throw new Error("Registry has no org collection — refusing to run.");
        return true;
    }

    function planReset(presentKeys) {
        assertRegistry();
        var wipe = [], keep = [], unknown = [];
        (presentKeys || []).forEach(function (k) {
            if (k.indexOf(PREFIX) !== 0) return;
            var c = classify(k);
            if (c === "transactional") wipe.push(k);
            else if (c === "unknown") { unknown.push(k); keep.push({ key: k, cls: "unknown" }); }
            else keep.push({ key: k, cls: c });
        });
        return { wipe: wipe, keep: keep, unknown: unknown };
    }

    function resetTransactional(adapter) {
        var plan = planReset(adapter.keys());
        var before = {}; plan.keep.forEach(function (k) { before[k.key] = adapter.get(k.key); });
        var problems = [];
        plan.wipe.forEach(function (k) { try { adapter.remove(k); } catch (e) { problems.push("could not remove " + k + ": " + e.message); } });
        var orgPreserved = true;
        plan.keep.forEach(function (k) { if (adapter.get(k.key) !== before[k.key]) { problems.push(k.key + " changed during reset"); if (k.cls === "org") orgPreserved = false; } });
        plan.wipe.forEach(function (k) { if (adapter.get(k) !== null && adapter.get(k) !== undefined) problems.push(k + " still present"); });
        return { ok: !problems.length, wiped: plan.wipe, kept: plan.keep.map(function (k) { return k.key; }), unknown: plan.unknown, orgPreserved: orgPreserved, problems: problems };
    }

    function storageAdapter(storage) {
        return { keys: function () { return Object.keys(storage); }, get: function (k) { return storage.getItem(k); }, remove: function (k) { storage.removeItem(k); } };
    }

    return { PREFIX: PREFIX, REGISTRY: REGISTRY, classify: classify, keysOf: keysOf, assertRegistry: assertRegistry, planReset: planReset, resetTransactional: resetTransactional, storageAdapter: storageAdapter };
}));
