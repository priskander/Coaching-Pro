/**
 * org-sync.js — delta synchronisation of the Organizational Chart (pure logic; no DOM / storage).
 *
 * WHAT IT DOES
 *   Takes a master employee list (CSV / Excel rows) and the CURRENT Org Chart, and works out exactly which people are
 *   new. Only those are appended. Existing people are matched by PID (or e-mail) and are NEVER modified, moved,
 *   re-parented or duplicated; differences between the file and an existing record are reported, not applied.
 *
 *   planSync(existing, incomingRows, options) -> plan   (no side effects; safe to preview)
 *   applySync(existing, plan, ctx)            -> { records, added }   (append-only; existing objects are returned untouched)
 *
 * PIPELINE (per incoming row)
 *   1 normalise    header aliases, trimming, e-mail lower-case, PID upper-cased for comparison, dates -> YYYY-MM-DD
 *   2 de-duplicate rows repeated inside the file (first wins; later ones reported)
 *   3 match        PID first, then e-mail  ->  matched (kept as is)  |  conflict  |  new
 *   4 validate     new rows only; same rules as the Add Employee form (leader optional, so root nodes can be loaded)
 *   5 hierarchy    leaders must resolve (warning if not, like the form); self-leading and reporting cycles are rejected;
 *                  new rows may report to other new rows in the same file
 *   6 order        accepted rows are returned leaders-first, ready for a single bulk insert
 *
 * Reason codes (rejected): MISSING_FIELD INVALID_VALUE DUPLICATE_IN_FILE EMAIL_BELONGS_TO_OTHER_PID
 *   EMAIL_DUPLICATE_IN_FILE MISSING_PID LEADER_IS_SELF HIERARCHY_CYCLE
 * Warnings: UNRESOLVED_LEADER NO_LEADER INACTIVE_LEADER ROLE_IGNORED EXISTING_DIFFERS EMAIL_BELONGS_TO_OTHER_PID(info)
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else if (typeof root === "object" && root) root.OrgSync = factory();
    else if (typeof globalThis !== "undefined") globalThis.OrgSync = factory();
}(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : this), function () {

    var FIELDS = ["name", "pid", "email", "teamLeader", "contractType", "contractStatus", "joinDate", "department", "subDepartment", "role"];
    var ALIASES = {
        name: ["name", "agent name", "agent full name", "employee name", "full name"],
        pid: ["pid", "person id", "pid / person id", "employee id", "emp id", "agent id", "id"],
        email: ["email", "e-mail", "email address", "mail"],
        teamLeader: ["team leader", "team leader / manager", "team leader name", "manager", "manager name", "team lead", "supervisor", "tl"],
        contractType: ["contract type", "employee type", "contract"],
        contractStatus: ["contract status", "status"],
        joinDate: ["join date", "joining date", "hire date", "start date", "joined"],
        department: ["department", "dept"],
        subDepartment: ["sub-department", "sub department", "subdepartment", "sub dept"],
        role: ["agent role", "role", "access role"]
    };
    var LABELS = { name: "Agent Name", pid: "PID", email: "Email", teamLeader: "Team Leader", contractType: "Contract Type", contractStatus: "Contract Status", joinDate: "Join Date", department: "Department", subDepartment: "Sub-Department", role: "Agent Role" };
    var INACTIVE = ["resigned", "terminated"];

    function str(v) { return v === undefined || v === null ? "" : String(v).replace(/\s+/g, " ").trim(); }
    function normPid(p) { return str(p).toUpperCase(); }
    function normName(n) { return str(n).toLowerCase(); }
    function pad(n) { return (n < 10 ? "0" : "") + n; }

    /** Date / Excel serial / "YYYY-MM-DD" / "YYYY/MM/DD" -> "YYYY-MM-DD" or "" (never guesses D/M vs M/D). */
    function toIsoDate(v) {
        if (v instanceof Date) return isNaN(v.getTime()) ? "" : v.getUTCFullYear() + "-" + pad(v.getUTCMonth() + 1) + "-" + pad(v.getUTCDate());
        if (typeof v === "number" && isFinite(v) && v > 20000 && v < 80000) return toIsoDate(new Date(Math.round((v - 25569) * 86400000)));
        var m = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/.exec(str(v));
        if (!m) return "";
        var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        return (d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]) ? m[1] + "-" + pad(+m[2]) + "-" + pad(+m[3]) : "";
    }

    /** Raw spreadsheet row ({ "Agent Name": "...", ...}) -> canonical row. Unknown columns are ignored. */
    function normalizeRow(raw) {
        var lower = {}; Object.keys(raw || {}).forEach(function (k) { lower[str(k).toLowerCase()] = raw[k]; });
        var out = {};
        FIELDS.forEach(function (f) {
            var hit = ALIASES[f].filter(function (a) { return lower[a] !== undefined; })[0];
            var v = hit === undefined ? "" : lower[hit];
            out[f] = f === "joinDate" ? (toIsoDate(v) || str(v)) : str(v);
        });
        out.email = out.email.toLowerCase();
        return out;
    }
    function isBlankRow(r) { return FIELDS.every(function (f) { return !r[f]; }); }

    function indexOf(list) {
        var byPid = {}, byEmail = {};
        list.forEach(function (e) { if (e.pid) byPid[normPid(e.pid)] = e; if (e.email) byEmail[str(e.email).toLowerCase()] = e; });
        return { byPid: byPid, byEmail: byEmail };
    }

    function pick(list, value, opts) {   // case-insensitive match to a configured list, returns canonical value or ""
        var v = normName(value);
        return (list || []).filter(function (x) { return normName(x) === v; })[0] || "";
    }

    function defaultResolveLeader(ref, dir) {
        var r = str(ref); if (!r) return null;
        var k = normPid(r), n = normName(r);
        return dir.filter(function (e) { return normPid(e.pid) === k; })[0] || dir.filter(function (e) { return normName(e.name) === n; })[0] || dir.filter(function (e) { return str(e.email).toLowerCase() === n; })[0] || null;
    }

    function planSync(existing, incoming, options) {
        var o = options || {}, resolve = o.resolveLeader || defaultResolveLeader, now = o.now || new Date().toISOString();
        var roleList = o.roles || [{ id: "agent", label: "Agent" }], defaultRole = o.defaultRole || "agent";
        var ex = indexOf(existing || []);
        var matched = [], rejected = [], warnings = [], accepted = [], seenPid = {}, seenEmail = {};
        var rows = (incoming || []).map(function (raw, i) { return { line: (o.firstLine || 2) + i, row: normalizeRow(raw) }; }).filter(function (r) { return !isBlankRow(r.row); });
        var reject = function (r, code, msg) { rejected.push({ line: r.line, pid: r.row.pid, name: r.row.name, reasons: [{ code: code, message: msg }] }); };

        rows.forEach(function (r) {
            var row = r.row, pk = normPid(row.pid);
            // 2. duplicates inside the file
            if (pk && seenPid[pk]) { reject(r, "DUPLICATE_IN_FILE", "PID " + row.pid + " already appears on line " + seenPid[pk] + " of this file (first one used)."); return; }
            // 3. match against the preserved Org Chart
            var byPid = pk ? ex.byPid[pk] : null, byMail = row.email ? ex.byEmail[row.email] : null;
            if (byPid || byMail) {
                if (byPid && byMail && byMail !== byPid) warnings.push({ line: r.line, pid: row.pid, code: "EMAIL_BELONGS_TO_OTHER_PID", message: "Email " + row.email + " belongs to " + byMail.name + " (" + byMail.pid + "); matched by PID, nothing changed." });
                if (!byPid && pk && byMail) { reject(r, "EMAIL_BELONGS_TO_OTHER_PID", "Email " + row.email + " already belongs to " + byMail.name + " (" + byMail.pid + "), so " + row.pid + " was not added as a new person."); return; }
                var rec = byPid || byMail;
                if (pk) seenPid[pk] = r.line; else seenPid[normPid(rec.pid)] = r.line;
                var diffs = [];
                ["name", "email", "teamLeader", "contractType", "contractStatus", "joinDate", "department", "subDepartment"].forEach(function (f) {
                    if (row[f] && normName(row[f]) !== normName(rec[f])) diffs.push({ field: f, label: LABELS[f], existing: str(rec[f]), incoming: row[f] });
                });
                matched.push({ line: r.line, pid: rec.pid, name: rec.name, matchedBy: byPid ? "pid" : "email", diffs: diffs });
                if (diffs.length) warnings.push({ line: r.line, pid: rec.pid, code: "EXISTING_DIFFERS", message: rec.name + ": file differs from the Org Chart in " + diffs.map(function (d) { return d.label; }).join(", ") + " — existing record kept unchanged." });
                return;
            }
            // 4. validate a genuinely new person
            var errs = [], fix = Object.assign({}, row);
            if (!pk) errs.push(["MISSING_PID", "PID is required to add a new person."]);
            else if (!/^[A-Za-z0-9._-]{2,30}$/.test(row.pid)) errs.push(["INVALID_VALUE", "PID must be 2–30 letters, digits, dots, dashes or underscores."]);
            if (row.name.length < 2) errs.push(["MISSING_FIELD", "Agent Name is required."]);
            if (!row.email) errs.push(["MISSING_FIELD", "Email is required."]); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(row.email)) errs.push(["INVALID_VALUE", "Email “" + row.email + "” is not valid."]);
            var ct = pick(o.contractTypes, row.contractType), cs = pick(o.contractStatuses, row.contractStatus);
            if (!row.contractType) errs.push(["MISSING_FIELD", "Contract Type is required."]); else if (!ct) errs.push(["INVALID_VALUE", "Contract Type “" + row.contractType + "” is not one of: " + (o.contractTypes || []).join(", ") + "."]); else fix.contractType = ct;
            if (!row.contractStatus) errs.push(["MISSING_FIELD", "Contract Status is required."]); else if (!cs) errs.push(["INVALID_VALUE", "Contract Status “" + row.contractStatus + "” is not one of: " + (o.contractStatuses || []).join(", ") + "."]); else fix.contractStatus = cs;
            if (row.department.length < 2) errs.push(["MISSING_FIELD", "Department is required."]);
            if (row.subDepartment.length < 2) errs.push(["MISSING_FIELD", "Sub-Department is required."]);
            if (!toIsoDate(row.joinDate)) errs.push([row.joinDate ? "INVALID_VALUE" : "MISSING_FIELD", row.joinDate ? "Join Date “" + row.joinDate + "” must be YYYY-MM-DD (or an Excel date)." : "Join Date is required."]); else if (row.joinDate < "1990-01-01") errs.push(["INVALID_VALUE", "Join Date looks too early."]);
            // role: only administrators may assign roles
            var roleHit = roleList.filter(function (x) { return normName(x.id) === normName(row.role) || normName(x.label) === normName(row.role); })[0];
            if (o.canAssignRole) { if (row.role && !roleHit) errs.push(["INVALID_VALUE", "Agent Role “" + row.role + "” is not a known role."]); fix.role = roleHit ? roleHit.id : defaultRole; }
            else { if (row.role && (!roleHit || roleHit.id !== defaultRole)) warnings.push({ line: r.line, pid: row.pid, code: "ROLE_IGNORED", message: "Only administrators assign roles; " + row.name + " is added as " + defaultRole + "." }); fix.role = defaultRole; }
            if (pk && row.email && seenEmail[row.email]) errs.push(["EMAIL_DUPLICATE_IN_FILE", "Email " + row.email + " is already used by line " + seenEmail[row.email] + " of this file."]);
            if (errs.length) { rejected.push({ line: r.line, pid: row.pid, name: row.name, reasons: errs.map(function (e) { return { code: e[0], message: e[1] }; }) }); if (pk) seenPid[pk] = r.line; return; }
            seenPid[pk] = r.line; seenEmail[row.email] = r.line;
            fix.joinDate = toIsoDate(row.joinDate);
            accepted.push({ line: r.line, rec: fix });
        });

        // 5. hierarchy integrity on the merged tree (existing + accepted), repeated until stable because rejecting a cycle member re-parents nothing but can orphan others
        var changed = true, guard = 0;
        while (changed && guard++ < 50) {
            changed = false;
            var dir = (existing || []).concat(accepted.map(function (a) { return a.rec; }));
            for (var i = 0; i < accepted.length; i++) {
                var a = accepted[i], lead = a.rec.teamLeader ? resolve(a.rec.teamLeader, dir) : null;
                if (lead && normPid(lead.pid) === normPid(a.rec.pid)) { rejected.push({ line: a.line, pid: a.rec.pid, name: a.rec.name, reasons: [{ code: "LEADER_IS_SELF", message: a.rec.name + " is listed as their own team leader." }] }); accepted.splice(i, 1); changed = true; break; }
                var seen = {}, members = [normPid(a.rec.pid)], cur = lead, cyc = false; seen[members[0]] = 1;
                while (cur) { var k = normPid(cur.pid); if (seen[k]) { cyc = k === members[0]; break; } seen[k] = 1; members.push(k); cur = cur.teamLeader ? resolve(cur.teamLeader, dir) : null; }
                if (cyc) {   // the whole loop is inconsistent data: reject every new member of it, keep anything outside it
                    accepted = accepted.filter(function (b) {
                        if (members.indexOf(normPid(b.rec.pid)) === -1) return true;
                        rejected.push({ line: b.line, pid: b.rec.pid, name: b.rec.name, reasons: [{ code: "HIERARCHY_CYCLE", message: b.rec.name + " is part of a reporting loop (" + members.length + " people lead back to each other)." }] });
                        return false;
                    });
                    changed = true; break;
                }
            }
        }
        var finalDir = (existing || []).concat(accepted.map(function (a) { return a.rec; }));
        accepted.forEach(function (a) {
            var lead = a.rec.teamLeader ? resolve(a.rec.teamLeader, finalDir) : null;
            if (!a.rec.teamLeader) warnings.push({ line: a.line, pid: a.rec.pid, code: "NO_LEADER", message: a.rec.name + " has no team leader (added as a top-level node)." });
            else if (!lead) warnings.push({ line: a.line, pid: a.rec.pid, code: "UNRESOLVED_LEADER", message: "No profile matches the team leader “" + a.rec.teamLeader + "” for " + a.rec.name + " yet." });
            else if (INACTIVE.indexOf(normName(lead.contractStatus)) !== -1) warnings.push({ line: a.line, pid: a.rec.pid, code: "INACTIVE_LEADER", message: a.rec.name + " reports to " + lead.name + ", whose contract status is " + lead.contractStatus + "." });
        });

        // 6. leaders-first order (a new leader is inserted before the new people who report to them)
        var ordered = [], placed = {}, pending = accepted.slice(), pass = 0;
        while (pending.length && pass++ < 100) {
            var next = [];
            pending.forEach(function (a) {
                var lead = a.rec.teamLeader ? resolve(a.rec.teamLeader, finalDir) : null;
                var waiting = lead && accepted.some(function (b) { return b.rec === lead; }) && !placed[normPid(lead.pid)];
                if (waiting) next.push(a); else { ordered.push(a); placed[normPid(a.rec.pid)] = 1; }
            });
            if (next.length === pending.length) { next.forEach(function (a) { ordered.push(a); }); break; }
            pending = next;
        }
        var stamp = o.batchId || "sync_" + now.replace(/\D/g, "").slice(0, 14);
        var newRecords = ordered.map(function (a) { return Object.assign({ createdAt: now, syncBatch: stamp, custom: {} }, a.rec); });
        rejected.sort(function (a, b) { return a.line - b.line; });
        return {
            batchId: stamp, now: now,
            summary: { rows: rows.length, matched: matched.length, new: newRecords.length, rejected: rejected.length, warnings: warnings.length, existingDiffer: matched.filter(function (m) { return m.diffs.length; }).length },
            matched: matched, newRecords: newRecords, rejected: rejected, warnings: warnings
        };
    }

    /**
     * Append-only application of a plan. `existing` is not mutated; the same record objects come back in the same order,
     * followed by the new ones. Anything whose PID/e-mail appeared meanwhile is skipped (re-checked at write time).
     */
    function applySync(existing, plan) {
        var ex = indexOf(existing || []), added = [], skipped = [];
        plan.newRecords.forEach(function (r) {
            if (ex.byPid[normPid(r.pid)] || (r.email && ex.byEmail[r.email])) { skipped.push(r.pid); return; }
            ex.byPid[normPid(r.pid)] = r; if (r.email) ex.byEmail[r.email] = r; added.push(r);
        });
        return { records: (existing || []).concat(added), added: added.length, addedPids: added.map(function (r) { return r.pid; }), skipped: skipped };
    }

    /** CSV template (header + one example row). */
    function templateCsv() {
        return FIELDS.map(function (f) { return LABELS[f]; }).join(",") + "\r\nJohn Doe,EMP-10923,john.doe@company.com,Jane Smith,Perm/OS,Active,2026-09-01,Customer Care,Mobile Telesales,agent\r\n";
    }

    return { FIELDS: FIELDS, LABELS: LABELS, normalizeRow: normalizeRow, toIsoDate: toIsoDate, planSync: planSync, applySync: applySync, templateCsv: templateCsv };
}));
