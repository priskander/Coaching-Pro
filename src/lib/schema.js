/* Dynamic fields schema core */
export const SchemaCore = (function () {
    const FIELD_TYPES = {
        text:     { label: "Text",              options: false },
        number:   { label: "Number",            options: false },
        date:     { label: "Date",              options: false },
        boolean:  { label: "Yes / No",          options: false },
        dropdown: { label: "Dropdown",          options: true  },
        radio:    { label: "Radio buttons",     options: true  },
        checkbox: { label: "Checkboxes (multi)", options: true  }
    };
    const ENTITIES = {
        employee: { label: "Employee Profile" },
        action:   { label: "Action Template" },
        coaching: { label: "Coaching Sheet" }
    };
    const RESERVED_KEYS = {
        employee: ["name", "pid", "email", "team_leader", "contract_type", "contract_status", "join_date", "department", "sub_department", "role", "id", "custom"],
        action:   ["id", "employee_name", "pid", "manager_name", "department", "sub_department", "employee_type", "description_of_event", "incident_dates", "level_of_incident", "decision", "action_plan", "comments", "created_at", "custom"],
        coaching: ["id", "agent_name", "agent_id", "pid", "custom"]
    };
    const KEY_RE = /^[a-z][a-z0-9_]{1,39}$/;
    const MAX_FIELDS_PER_ENTITY = 60, MAX_OPTIONS = 100;

    function clone(x) { return JSON.parse(JSON.stringify(x)); }
    function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
    let seq = 0;
    function genId(prefix) { seq += 1; return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + seq.toString(36); }

    function emptySchema() {
        const entities = {};
        Object.keys(ENTITIES).forEach(function (e) { entities[e] = { fields: [] }; });
        return { version: 0, updatedAt: null, entities: entities };
    }
    function normalizeSchema(raw) {
        const s = emptySchema();
        if (!isObj(raw)) return s;
        s.version = Number(raw.version) > 0 ? Math.floor(Number(raw.version)) : 0;
        s.updatedAt = raw.updatedAt || null;
        Object.keys(ENTITIES).forEach(function (e) {
            const list = raw.entities && raw.entities[e] && raw.entities[e].fields;
            if (Array.isArray(list)) s.entities[e].fields = list.filter(function (f) { return isObj(f) && f.id && f.key && FIELD_TYPES[f.type]; }).map(normalizeField);
        });
        return s;
    }
    function normalizeField(f) {
        const out = {
            id: String(f.id), key: String(f.key), label: String(f.label == null ? f.key : f.label).trim(), type: f.type,
            required: !!f.required, help: String(f.help || ""),
            defaultValue: f.defaultValue === undefined ? null : f.defaultValue,
            validation: isObj(f.validation) ? clone(f.validation) : {},
            options: []
        };
        if (FIELD_TYPES[f.type].options) {
            out.options = (Array.isArray(f.options) ? f.options : []).filter(function (o) { return isObj(o) && o.id; })
                .map(function (o) { return { id: String(o.id), label: String(o.label == null ? "" : o.label).trim(), active: o.active !== false }; });
        }
        return out;
    }
    function slugify(label) {
        let s = String(label || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        if (!/^[a-z]/.test(s)) s = "f_" + s;
        return s.slice(0, 40).replace(/_+$/, "") || "field";
    }
    function fieldsOf(schema, entity) { return schema.entities[entity].fields; }
    function findField(schema, entity, id) { return fieldsOf(schema, entity).find(function (f) { return f.id === id; }) || null; }
    function assertEntity(entity) { if (!ENTITIES[entity]) throw new SchemaError("Unknown entity '" + entity + "'", { entity: "Unknown entity" }); }

    function SchemaError(message, details) { const e = new Error(message); e.name = "SchemaError"; e.details = details || {}; return e; }

    function validateFieldDef(def, entity, others) {
        const err = {};
        const label = String(def.label || "").trim();
        if (label.length < 2 || label.length > 60) err.label = "Label must be 2–60 characters.";
        else if ((others || []).some(function (f) { return f.label.toLowerCase() === label.toLowerCase(); })) err.label = "Another field already uses this label.";
        if (!KEY_RE.test(def.key || "")) err.key = "Key: lower-case letters, digits and underscores, starting with a letter (2–40).";
        else if ((RESERVED_KEYS[entity] || []).indexOf(def.key) !== -1) err.key = "'" + def.key + "' is reserved by a built-in field.";
        else if ((others || []).some(function (f) { return f.key === def.key; })) err.key = "Another field already uses this key.";
        if (!FIELD_TYPES[def.type]) err.type = "Choose a data type.";
        const v = def.validation || {};
        const num = function (x) { return x !== undefined && x !== null && x !== "" && !isNaN(Number(x)); };
        if (def.type === "text") {
            if (v.minLength !== undefined && v.minLength !== null && v.minLength !== "" && !(num(v.minLength) && v.minLength >= 0)) err.minLength = "Minimum length must be 0 or more.";
            if (v.maxLength !== undefined && v.maxLength !== null && v.maxLength !== "" && !(num(v.maxLength) && v.maxLength >= 1)) err.maxLength = "Maximum length must be 1 or more.";
            if (num(v.minLength) && num(v.maxLength) && Number(v.minLength) > Number(v.maxLength)) err.maxLength = "Maximum must be at least the minimum.";
            if (v.pattern) { try { new RegExp(v.pattern); if (String(v.pattern).length > 200) err.pattern = "Pattern is too long."; } catch (e) { err.pattern = "Not a valid regular expression."; } }
        }
        if (def.type === "number" && num(v.min) && num(v.max) && Number(v.min) > Number(v.max)) err.max = "Maximum must be at least the minimum.";
        if (def.type === "date" && v.minDate && v.maxDate && v.minDate > v.maxDate) err.maxDate = "Latest date must not be before the earliest.";
        if (FIELD_TYPES[def.type] && FIELD_TYPES[def.type].options) {
            const opts = def.options || [];
            const live = opts.filter(function (o) { return o.active !== false; });
            if (!live.length) err.options = "Add at least one option.";
            else if (opts.length > MAX_OPTIONS) err.options = "At most " + MAX_OPTIONS + " options.";
            const seen = {};
            opts.forEach(function (o) {
                const k = String(o.label || "").trim().toLowerCase();
                if (!k) err.options = "Option labels cannot be empty.";
                else if (o.active !== false) { if (seen[k]) err.options = "Option labels must be unique."; seen[k] = 1; }
            });
        }
        if (!err.type && def.defaultValue !== null && def.defaultValue !== undefined && def.defaultValue !== "") {
            const m = validateValue(def, def.defaultValue, { ignoreRequired: true });
            if (m) err.defaultValue = "Default value: " + m;
        }
        return err;
    }

    function isEmpty(f, value) {
        if (value === null || value === undefined) return true;
        if (f.type === "checkbox") return !Array.isArray(value) || value.length === 0;
        if (f.type === "boolean") return false;
        return String(value).trim() === "";
    }
    function validateValue(f, value, opts) {
        opts = opts || {};
        if (isEmpty(f, value)) return (f.required && !opts.ignoreRequired) ? "This field is required." : "";
        const v = f.validation || {};
        switch (f.type) {
            case "text": {
                const s = String(value);
                if (v.minLength !== undefined && v.minLength !== null && v.minLength !== "" && s.length < Number(v.minLength)) return "At least " + v.minLength + " characters.";
                if (v.maxLength !== undefined && v.maxLength !== null && v.maxLength !== "" && s.length > Number(v.maxLength)) return "At most " + v.maxLength + " characters.";
                if (v.pattern) { try { if (!new RegExp(v.pattern).test(s)) return v.patternMessage || "Doesn't match the required format."; } catch (e) {} }
                return "";
            }
            case "number": {
                const n = Number(value);
                if (typeof value === "boolean" || isNaN(n) || !isFinite(n)) return "Enter a number.";
                if (v.min !== undefined && v.min !== null && v.min !== "" && n < Number(v.min)) return "Must be at least " + v.min + ".";
                if (v.max !== undefined && v.max !== null && v.max !== "" && n > Number(v.max)) return "Must be at most " + v.max + ".";
                return "";
            }
            case "date": {
                const s = String(value);
                if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(new Date(s + "T00:00:00Z").getTime())) return "Pick a valid date.";
                if (v.minDate && s < v.minDate) return "Not before " + v.minDate + ".";
                if (v.maxDate && s > v.maxDate) return "Not after " + v.maxDate + ".";
                return "";
            }
            case "boolean": return typeof value === "boolean" ? "" : "Choose Yes or No.";
            case "dropdown": case "radio": {
                const o = (f.options || []).find(function (x) { return x.id === value; });
                return o ? "" : "Choose one of the listed options.";
            }
            case "checkbox": {
                if (!Array.isArray(value)) return "Choose from the listed options.";
                return value.every(function (id) { return (f.options || []).some(function (x) { return x.id === id; }); }) ? "" : "Choose from the listed options.";
            }
        }
        return "";
    }
    function coerceValue(f, raw) {
        if (raw === null || raw === undefined) return null;
        switch (f.type) {
            case "number": return String(raw).trim() === "" ? null : Number(raw);
            case "boolean": return raw === true || raw === "true" || raw === "yes" ? true : (raw === false || raw === "false" || raw === "no" ? false : null);
            case "checkbox": return Array.isArray(raw) ? raw.slice() : [];
            default: { const s = String(raw).trim(); return s === "" ? null : s; }
        }
    }
    function defaultValue(f) {
        const d = f.defaultValue;
        if (d === null || d === undefined || d === "") return f.type === "checkbox" ? [] : null;
        return d;
    }
    function displayValue(f, value) {
        if (isEmpty(f, value)) return "";
        const lab = function (id) { const o = (f.options || []).find(function (x) { return x.id === id; }); return o ? o.label + (o.active === false ? " (inactive)" : "") : "(removed option)"; };
        switch (f.type) {
            case "boolean": return value ? "Yes" : "No";
            case "dropdown": case "radio": return lab(value);
            case "checkbox": return value.map(lab).join(", ");
            default: return String(value);
        }
    }
    function validateCustom(schema, entity, custom) {
        const errors = {}, values = {};
        fieldsOf(schema, entity).forEach(function (f) {
            const raw = custom && custom[f.id] !== undefined ? custom[f.id] : null;
            const v = coerceValue(f, raw);
            const m = validateValue(f, v);
            if (m) errors[f.id] = m;
            if (!isEmpty(f, v) || f.type === "boolean" && v !== null) values[f.id] = v;
        });
        return { errors: errors, values: values };
    }

    function mustBeValid(def, entity, others) {
        const err = validateFieldDef(def, entity, others);
        if (Object.keys(err).length) throw SchemaError("Invalid field definition", err);
    }
    function addField(schema, entity, input) {
        assertEntity(entity);
        const s = clone(schema), list = fieldsOf(s, entity);
        if (list.length >= MAX_FIELDS_PER_ENTITY) throw SchemaError("Too many fields", { entity: "At most " + MAX_FIELDS_PER_ENTITY + " custom fields per form." });
        const def = normalizeField({
            id: genId("fld"), key: input.key || slugify(input.label), label: input.label, type: input.type, required: !!input.required,
            help: input.help, defaultValue: input.defaultValue, validation: input.validation,
            options: (input.options || []).map(function (o) { return { id: o.id || genId("opt"), label: o.label, active: o.active !== false }; })
        });
        mustBeValid(def, entity, list);
        list.push(def);
        return { schema: s, field: def };
    }
    function updateField(schema, entity, id, patch) {
        assertEntity(entity);
        const s = clone(schema), list = fieldsOf(s, entity), i = list.findIndex(function (f) { return f.id === id; });
        if (i === -1) throw SchemaError("Field not found", { id: "Field not found" });
        const merged = Object.assign({}, list[i], patch, { id: list[i].id });
        if (patch.options) merged.options = patch.options.map(function (o) { return { id: o.id || genId("opt"), label: o.label, active: o.active !== false }; });
        const def = normalizeField(merged);
        mustBeValid(def, entity, list.filter(function (f) { return f.id !== id; }));
        list[i] = def;
        return { schema: s, field: def };
    }
    function removeField(schema, entity, id) {
        assertEntity(entity);
        const s = clone(schema), list = fieldsOf(s, entity), i = list.findIndex(function (f) { return f.id === id; });
        if (i === -1) throw SchemaError("Field not found", { id: "Field not found" });
        const removed = list.splice(i, 1)[0];
        return { schema: s, field: removed };
    }
    function moveField(schema, entity, id, delta) {
        assertEntity(entity);
        const s = clone(schema), list = fieldsOf(s, entity), i = list.findIndex(function (f) { return f.id === id; });
        if (i === -1) throw SchemaError("Field not found", { id: "Field not found" });
        const j = Math.max(0, Math.min(list.length - 1, i + delta));
        list.splice(j, 0, list.splice(i, 1)[0]);
        return { schema: s };
    }
    function reorderFields(schema, entity, ids) {
        assertEntity(entity);
        const s = clone(schema), list = fieldsOf(s, entity);
        if (!Array.isArray(ids) || ids.length !== list.length || list.some(function (f) { return ids.indexOf(f.id) === -1; }) || new Set(ids).size !== ids.length)
            throw SchemaError("Order must list every field exactly once", { order: "Invalid order" });
        s.entities[entity].fields = ids.map(function (id) { return list.find(function (f) { return f.id === id; }); });
        return { schema: s };
    }

    function optionAdd(options, label) { const o = options.slice(); o.push({ id: genId("opt"), label: String(label || "").trim(), active: true }); return o; }
    function optionRename(options, id, label) { return options.map(function (o) { return o.id === id ? { id: o.id, label: String(label || "").trim(), active: o.active } : o; }); }
    function optionSetActive(options, id, active) { return options.map(function (o) { return o.id === id ? { id: o.id, label: o.label, active: !!active } : o; }); }
    function optionMove(options, id, delta) {
        const o = options.slice(), i = o.findIndex(function (x) { return x.id === id; });
        if (i === -1) return o;
        const j = Math.max(0, Math.min(o.length - 1, i + delta));
        o.splice(j, 0, o.splice(i, 1)[0]);
        return o;
    }

    function countValues(records, fieldId) {
        return (records || []).filter(function (r) { const v = r && r.custom && r.custom[fieldId]; return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length); }).length;
    }
    function purgeValues(records, fieldId) {
        let n = 0;
        (records || []).forEach(function (r) { if (r && r.custom && Object.prototype.hasOwnProperty.call(r.custom, fieldId)) { delete r.custom[fieldId]; n++; } });
        return n;
    }
    function incompatibleValues(records, nextDef) {
        return (records || []).filter(function (r) {
            const v = r && r.custom && r.custom[nextDef.id];
            if (v === undefined || v === null || v === "") return false;
            return !!validateValue(nextDef, v, { ignoreRequired: true });
        });
    }
    function dropIncompatible(records, nextDef) {
        const bad = incompatibleValues(records, nextDef);
        bad.forEach(function (r) { delete r.custom[nextDef.id]; });
        return bad.length;
    }
    function toPublic(schema, entity, custom) {
        const out = {};
        fieldsOf(schema, entity).forEach(function (f) { if (custom && custom[f.id] !== undefined) out[f.key] = custom[f.id]; });
        return out;
    }

    const BUILTIN_FIELDS = {
        employee: [
            { id: "name", label: "Agent Name", placeholder: true }, { id: "pid", label: "PID / Person ID", placeholder: true }, { id: "email", label: "Email", placeholder: true },
            { id: "teamLeader", label: "Team Leader / Manager", placeholder: true }, { id: "contractType", label: "Contract Type" }, { id: "contractStatus", label: "Contract Status" },
            { id: "joinDate", label: "Join Date" }, { id: "department", label: "Department", placeholder: true }, { id: "subDepartment", label: "Sub-Department", placeholder: true }, { id: "role", label: "Agent Role" }
        ],
        action: [
            { id: "employeeName", label: "Employee Name" }, { id: "date", label: "Date" }, { id: "managerName", label: "Manager Name" }, { id: "department", label: "Department" },
            { id: "subDepartment", label: "Sub-Department" }, { id: "employeeType", label: "Employee Type" }, { id: "description", label: "Description of event" },
            { id: "incidentDate", label: "Date of incident" }, { id: "level", label: "Level of incident" }, { id: "decision", label: "Decision" }, { id: "actionPlan", label: "Action plan" }, { id: "comments", label: "Comments" }
        ],
        kpi: [
            { id: "name", label: "KPI Name" }, { id: "category", label: "Category" }, { id: "threshold", label: "Threshold" }, { id: "target", label: "Target" }, { id: "exceptional", label: "Exceptional" },
            { id: "weight", label: "Weight (%)" }, { id: "description", label: "Description" }, { id: "equation", label: "Equation" }, { id: "whatCalculation", label: "WHAT Calculation" }, { id: "coachingNotes", label: "Coaching Notes" }
        ],
        coaching: [
            { id: "agentName", label: "Agent Full Name", placeholder: true }, { id: "agentId", label: "Agent Performance ID", placeholder: true }, { id: "coachingDateTime", label: "Coaching Date & Time" },
            { id: "lob", label: "LOB / Campaign / Queue", placeholder: true }, { id: "teamLeader", label: "Team Leader Name", placeholder: true }, { id: "perfReviewYear", label: "Review Year", placeholder: true }
        ]
    };

    const BUILTIN_PROPS = {
        "employee": { "name": "name", "pid": "pid", "email": "email", "teamLeader": "teamLeader", "contractType": "contractType", "contractStatus": "contractStatus", "joinDate": "joinDate", "department": "department", "subDepartment": "subDepartment", "role": "role" },
        "action": { "employeeName": "employeeName", "date": "createdAt", "managerName": "managerName", "department": "department", "subDepartment": "subDepartment", "employeeType": "employeeType", "description": "descriptionOfEvent", "incidentDate": "incidentDates", "level": "levelOfIncident", "decision": "decision", "actionPlan": "actionPlan", "comments": "comments" }
    };
    const SECTIONS = [
        { id: "notes", entity: "coaching", label: "Coaching Notes (SMART)" },
        { id: "devReport", entity: "coaching", label: "Development Areas — Justification & Next Steps" },
        { id: "comments", entity: "coaching", label: "Comments" }
    ];
    function visKey(kind, entity, id) { return kind === "custom" ? "custom." + id : kind === "section" ? "section." + entity + "." + id : entity + "." + id; }
    function redactRecord(entity, record, hidden) {
        const out = JSON.parse(JSON.stringify(record || {})), h = hidden || [], map = BUILTIN_PROPS[entity] || {};
        Object.keys(map).forEach(function (id) { if (h.indexOf(entity + "." + id) !== -1) delete out[map[id]]; });
        if (out.custom) Object.keys(out.custom).forEach(function (fid) { if (h.indexOf("custom." + fid) !== -1) delete out.custom[fid]; });
        return out;
    }
    function builtinField(entity, id) { return (BUILTIN_FIELDS[entity] || []).find(function (f) { return f.id === id; }) || null; }
    function builtinLabel(overrides, entity, id) { const f = builtinField(entity, id), o = overrides && overrides[entity] && overrides[entity][id]; return (o && o.label) || (f && f.label) || ""; }
    function validateBuiltinPatch(entity, id, patch, overrides, schema) {
        const err = {}, f = builtinField(entity, id);
        if (!f) { err.id = "Unknown built-in field"; return err; }
        if (patch.label !== undefined) {
            const l = String(patch.label).trim();
            if (l.length < 2 || l.length > 60) err.label = "Label must be 2–60 characters.";
            else {
                const lc = l.toLowerCase();
                if ((BUILTIN_FIELDS[entity] || []).some(function (x) { return x.id !== id && builtinLabel(overrides, entity, x.id).toLowerCase() === lc; })) err.label = "Another field on this form already uses this label.";
                else if (schema && schema.entities[entity] && schema.entities[entity].fields.some(function (c) { return c.label.toLowerCase() === lc; })) err.label = "A custom field already uses this label.";
            }
        }
        if (patch.placeholder !== undefined) {
            if (!f.placeholder && String(patch.placeholder).trim()) err.placeholder = "This field has no placeholder.";
            else if (String(patch.placeholder).length > 60) err.placeholder = "At most 60 characters.";
        }
        return err;
    }

    return {
        FIELD_TYPES: FIELD_TYPES, ENTITIES: ENTITIES, RESERVED_KEYS: RESERVED_KEYS, KEY_RE: KEY_RE,
        emptySchema: emptySchema, normalizeSchema: normalizeSchema, normalizeField: normalizeField, slugify: slugify, SchemaError: SchemaError, genId: genId,
        findField: findField, fieldsOf: fieldsOf, validateFieldDef: validateFieldDef, validateValue: validateValue, coerceValue: coerceValue,
        defaultValue: defaultValue, displayValue: displayValue, validateCustom: validateCustom, isEmpty: isEmpty,
        addField: addField, updateField: updateField, removeField: removeField, moveField: moveField, reorderFields: reorderFields,
        optionAdd: optionAdd, optionRename: optionRename, optionSetActive: optionSetActive, optionMove: optionMove,
        BUILTIN_FIELDS: BUILTIN_FIELDS, BUILTIN_PROPS: BUILTIN_PROPS, SECTIONS: SECTIONS, visKey: visKey, redactRecord: redactRecord, builtinField: builtinField, builtinLabel: builtinLabel, validateBuiltinPatch: validateBuiltinPatch, countValues: countValues, purgeValues: purgeValues, incompatibleValues: incompatibleValues, dropIncompatible: dropIncompatible, toPublic: toPublic
    };
})();

if (typeof window !== "undefined") {
    window.SchemaCore = SchemaCore;
}
