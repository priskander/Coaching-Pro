/**
 * control-panel.js — Administrator Control Panel: Field Builder & Role Management
 */
import { SchemaCore } from './schema.js';
import { guard } from './auth-session.js';

export const SCHEMA_STORAGE_KEY = "coachingForm_fieldSchema_v1";

export function loadSchema() {
    try {
        const raw = JSON.parse(localStorage.getItem(SCHEMA_STORAGE_KEY) || "{}");
        return SchemaCore.normalizeSchema(raw);
    } catch (e) {
        return SchemaCore.emptySchema();
    }
}

export function saveSchema(schema) {
    try {
        schema.updatedAt = new Date().toISOString();
        localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schema));
    } catch (e) {
        console.error("Could not save schema.", e);
    }
}

export function renderFieldBuilder(entity = 'coaching') {
    const root = document.getElementById("cpFieldsRoot");
    if (!root) return;
    const schema = loadSchema();
    const fields = SchemaCore.fieldsOf(schema, entity);
    
    let html = '<h3 class="font-bold text-lg mb-4">Field Builder: ' + SchemaCore.ENTITIES[entity].label + '</h3>';
    html += '<div class="space-y-3">';
    fields.forEach(f => {
        html += '<div class="flex items-center justify-between border-b pb-2">' +
                '<span>' + f.label + ' (' + f.type + ')</span>' +
                '<div>' +
                    '<button onclick="deleteField(\'' + entity + '\', \'' + f.id + '\')" class="text-red-600 hover:text-red-800 text-xs mr-2">Delete</button>' +
                '</div>' +
            '</div>';
    });
    html += '</div>';
    
    root.innerHTML = html;
}

export function deleteField(entity, id) {
    if (!guard("admin.panel")) return;
    if (!confirm("Delete this field? This action cannot be undone.")) return;
    let schema = loadSchema();
    const result = SchemaCore.removeField(schema, entity, id);
    saveSchema(result.schema);
    renderFieldBuilder(entity);
}

if (typeof window !== "undefined") {
    window.renderFieldBuilder = renderFieldBuilder;
    window.deleteField = deleteField;
}
