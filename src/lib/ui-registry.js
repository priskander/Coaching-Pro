/* UI registry: built-in fields, sections, columns, and filters */
export const UiRegistry = (function () {
    var AREAS = [
        {"id":"coaching","label":"Coaching Sheet"},
        {"id":"dashboard","label":"Team Performance Dashboard"},
        {"id":"actions","label":"Actions Management — Log"},
        {"id":"rolling","label":"Actions Management — Agents Rolling Records"},
        {"id":"actionform","label":"Action form (popup)"},
        {"id":"org","label":"Organizational Chart"},
        {"id":"kpi","label":"Manage KPI Library (popup)"},
        {"id":"matrix","label":"Disciplinary Matrix (popup)"},
        {"id":"agents","label":"Coaching Sheets list (popup)"},
        {"id":"profile","label":"Edit Profile (popup)"}
    ];

    var ITEMS = [
        {"key":"ui.coaching.sec.form_header_title_doc_id_version","area":"coaching","kind":"sec","label":"Form header (title, Doc ID, version)"},
        {"key":"ui.coaching.sec.general_information_metadata","area":"coaching","kind":"sec","label":"General Information & Metadata"},
        {"key":"ui.coaching.sec.monthly_performance_trend_development_pl","area":"coaching","kind":"sec","label":"Monthly Performance Trend & Development Plan"},
        {"key":"ui.coaching.sec.performance_metric_overview_copc_alignme","area":"coaching","kind":"sec","label":"Performance & Metric Overview (COPC Alignment)"},
        {"key":"ui.coaching.sec.observed_interaction_transaction_details","area":"coaching","kind":"sec","label":"Observed Interaction / Transaction Details"},
        {"key":"ui.coaching.sec.key_strengths_positive_behaviors","area":"coaching","kind":"sec","label":"Key Strengths & Positive Behaviors"},
        {"key":"ui.coaching.sec.gap_analysis_behavior_identification","area":"coaching","kind":"sec","label":"Gap Analysis & Behavior Identification"},
        {"key":"ui.coaching.sec.copc_root_cause_analysis_rca","area":"coaching","kind":"sec","label":"COPC Root Cause Analysis (RCA)"},
        {"key":"ui.coaching.sec.smart_action_plan","area":"coaching","kind":"sec","label":"SMART Action Plan"},
        {"key":"ui.coaching.sec.agent_feedback_self_commitment","area":"coaching","kind":"sec","label":"Agent Feedback & Self-Commitment"},
        {"key":"ui.coaching.sec.governance_verification_sign_off","area":"coaching","kind":"sec","label":"Governance & Verification Sign-Off"},
        {"key":"ui.coaching.fld.coaching_location_channel","area":"coaching","kind":"fld","label":"Coaching Location / Channel","group":"1. General Information & Metadata"},
        {"key":"ui.coaching.fld.session_type","area":"coaching","kind":"fld","label":"Session Type","group":"1. General Information & Metadata"},
        {"key":"ui.coaching.fld.strength_points","area":"coaching","kind":"fld","label":"Strength Points","group":"2. Monthly Performance Trend & Development Plan"},
        {"key":"ui.coaching.fld.development_areas","area":"coaching","kind":"fld","label":"Development Areas","group":"2. Monthly Performance Trend & Development Plan"},
        {"key":"ui.coaching.fld.interaction_ticket_call_id","area":"coaching","kind":"fld","label":"Interaction / Ticket / Call ID","group":"4. Observed Interaction / Transaction Details"},
        {"key":"ui.coaching.fld.channel","area":"coaching","kind":"fld","label":"Channel","group":"4. Observed Interaction / Transaction Details"},
        {"key":"ui.coaching.fld.evaluation_date","area":"coaching","kind":"fld","label":"Evaluation Date","group":"4. Observed Interaction / Transaction Details"},
        {"key":"ui.coaching.fld.customer_issue_summary_scenario_context","area":"coaching","kind":"fld","label":"Customer Issue Summary / Scenario Context","group":"4. Observed Interaction / Transaction Details"},
        {"key":"ui.coaching.fld.observed_positive_practice_business_impa","area":"coaching","kind":"fld","label":"Observed Positive Practice & Business Impact","group":"5. Key Strengths & Positive Behaviors"},
        {"key":"ui.coaching.fld.observed_behavior_what_was_actually_done","area":"coaching","kind":"fld","label":"Observed Behavior (What was actually done/said)","group":"6. Gap Analysis & Behavior Identification"},
        {"key":"ui.coaching.fld.expected_standard_sop_requirement","area":"coaching","kind":"fld","label":"Expected Standard / SOP Requirement","group":"6. Gap Analysis & Behavior Identification"},
        {"key":"ui.coaching.fld.impact_on_customer_metric_business","area":"coaching","kind":"fld","label":"Impact on Customer / Metric / Business","group":"6. Gap Analysis & Behavior Identification"},
        {"key":"ui.coaching.fld.rca_qualitative_notes","area":"coaching","kind":"fld","label":"RCA Qualitative Notes","group":"7. COPC Root Cause Analysis (RCA)"},
        {"key":"ui.coaching.fld.agent_key_takeaways_commitments","area":"coaching","kind":"fld","label":"Agent Key Takeaways & Commitments","group":"9. Agent Feedback & Self-Commitment"},
        {"key":"ui.coaching.fld.follow_up_audit_session_date","area":"coaching","kind":"fld","label":"Follow-Up Audit / Session Date","group":"10. Governance & Verification Sign-Off"},
        {"key":"ui.coaching.fld.target_expected_score_outcome","area":"coaching","kind":"fld","label":"Target Expected Score / Outcome","group":"10. Governance & Verification Sign-Off"},
        {"key":"ui.coaching.fld.rca","area":"coaching","kind":"fld","label":"COPC Root Cause Analysis — cause checkboxes","group":"7. COPC Root Cause Analysis (RCA)"},
        {"key":"ui.coaching.col.performance_metric_overvie.metric_category","area":"coaching","kind":"col","label":"Metric Category","group":"Performance & Metric Overview (COPC Alignment)"},
        {"key":"ui.coaching.col.performance_metric_overvie.metric_name","area":"coaching","kind":"col","label":"Metric Name","group":"Performance & Metric Overview (COPC Alignment)"},
        {"key":"ui.coaching.col.performance_metric_overvie.threshold","area":"coaching","kind":"col","label":"Threshold","group":"Performance & Metric Overview (COPC Alignment)"},
        {"key":"ui.coaching.col.performance_metric_overvie.target","area":"coaching","kind":"col","label":"Target","group":"Performance & Metric Overview (COPC Alignment)"},
        {"key":"ui.coaching.col.performance_metric_overvie.exceptional","area":"coaching","kind":"col","label":"Exceptional","group":"Performance & Metric Overview (COPC Alignment)"},
        {"key":"ui.coaching.col.performance_metric_overvie.actual_score","area":"coaching","kind":"col","label":"Actual Score","group":"Performance & Metric Overview (COPC Alignment)"},
        {"key":"ui.coaching.col.performance_metric_overvie.status","area":"coaching","kind":"col","label":"Status","group":"Performance & Metric Overview (COPC Alignment)"},
        {"key":"ui.coaching.col.smart_action_plan.item","area":"coaching","kind":"col","label":"#","group":"SMART Action Plan"},
        {"key":"ui.coaching.col.smart_action_plan.action_item_specific_actionable","area":"coaching","kind":"col","label":"Action Item (Specific & Actionable)","group":"SMART Action Plan"},
        {"key":"ui.coaching.col.smart_action_plan.metric_impacted","area":"coaching","kind":"col","label":"Metric Impacted","group":"SMART Action Plan"},
        {"key":"ui.coaching.col.smart_action_plan.owner","area":"coaching","kind":"col","label":"Owner","group":"SMART Action Plan"},
        {"key":"ui.coaching.col.smart_action_plan.due_date","area":"coaching","kind":"col","label":"Due Date","group":"SMART Action Plan"},
        {"key":"ui.dashboard.sec.team_performance_analysis","area":"dashboard","kind":"sec","label":"Team Performance Analysis"},
        {"key":"ui.dashboard.sec.highest_achievers","area":"dashboard","kind":"sec","label":"Highest Achievers"},
        {"key":"ui.dashboard.sec.highest_outliers","area":"dashboard","kind":"sec","label":"Highest Outliers"},
        {"key":"ui.dashboard.sec.most_achieved_kpi_s","area":"dashboard","kind":"sec","label":"Most Achieved KPI's"},
        {"key":"ui.dashboard.sec.highest_not_achieved_kpi_s","area":"dashboard","kind":"sec","label":"Highest Not Achieved KPI's"},
        {"key":"ui.dashboard.col.team_performance_analysis.kpi","area":"dashboard","kind":"col","label":"KPI","group":"Team Performance Analysis"},
        {"key":"ui.dashboard.col.team_performance_analysis.team_average","area":"dashboard","kind":"col","label":"Team Average","group":"Team Performance Analysis"},
        {"key":"ui.dashboard.col.team_performance_analysis.agents_threshold","area":"dashboard","kind":"col","label":"Agents ≥ Threshold","group":"Team Performance Analysis"},
        {"key":"ui.dashboard.col.team_performance_analysis.below_3_occurrences","area":"dashboard","kind":"col","label":"Below-3 Occurrences","group":"Team Performance Analysis"},
        {"key":"ui.dashboard.col.highest_achievers.agent","area":"dashboard","kind":"col","label":"Agent","group":"Highest Achievers"},
        {"key":"ui.dashboard.col.highest_achievers.overall_avg","area":"dashboard","kind":"col","label":"Overall Avg","group":"Highest Achievers"},
        {"key":"ui.dashboard.col.highest_outliers.agent","area":"dashboard","kind":"col","label":"Agent","group":"Highest Outliers"},
        {"key":"ui.dashboard.col.highest_outliers.overall_avg","area":"dashboard","kind":"col","label":"Overall Avg","group":"Highest Outliers"},
        {"key":"ui.dashboard.col.highest_outliers.deviation","area":"dashboard","kind":"col","label":"Deviation","group":"Highest Outliers"},
        {"key":"ui.dashboard.col.most_achieved_kpi_s.kpi","area":"dashboard","kind":"col","label":"KPI","group":"Most Achieved KPI's"},
        {"key":"ui.dashboard.col.most_achieved_kpi_s.team_average","area":"dashboard","kind":"col","label":"Team Average","group":"Most Achieved KPI's"},
        {"key":"ui.dashboard.col.highest_not_achieved_kpi_s.kpi","area":"dashboard","kind":"col","label":"KPI","group":"Highest Not Achieved KPI's"},
        {"key":"ui.dashboard.col.highest_not_achieved_kpi_s.below_3_occurrences","area":"dashboard","kind":"col","label":"Below-3 Occurrences","group":"Highest Not Achieved KPI's"},
        {"key":"ui.actions.flt.actionssearchinput","area":"actions","kind":"flt","label":"Search by employee name"},
        {"key":"ui.actions.flt.actionslevelfilter","area":"actions","kind":"flt","label":"All Levels"},
        {"key":"ui.actions.flt.actionsdecisionfilter","area":"actions","kind":"flt","label":"All Decisions"},
        {"key":"ui.actions.col.actions.actions","area":"actions","kind":"col","label":"Actions","protected":"Holds the row buttons (edit, delete, open)."},
        {"key":"ui.rolling.flt.rollingrecordssearchinput","area":"rolling","kind":"flt","label":"Search by agent name"},
        {"key":"ui.rolling.col.rollingrecords.agent","area":"rolling","kind":"col","label":"Agent"},
        {"key":"ui.rolling.col.rollingrecords.pid","area":"rolling","kind":"col","label":"PID"},
        {"key":"ui.org.flt.empsearchinput","area":"org","kind":"flt","label":"Search by name, PID, email or team leader"},
        {"key":"ui.org.col.emp.linked_data","area":"org","kind":"col","label":"Linked Data"},
        {"key":"ui.org.col.emp.actions","area":"org","kind":"col","label":"Actions","protected":"Holds the row buttons (edit, delete, open)."},
        {"key":"ui.kpi.flt.kpisearch","area":"kpi","kind":"flt","label":"Filter KPIs by name or category"},
        {"key":"ui.kpi.col.kpi.actions","area":"kpi","kind":"col","label":"Actions","protected":"Holds the row buttons (edit, delete, open)."},
        {"key":"ui.matrix.fld.matrixformcategory","area":"matrix","kind":"fld","label":"Category (Description of event)","protected":"Required to save a matrix entry."},
        {"key":"ui.matrix.fld.matrixformemployeetype","area":"matrix","kind":"fld","label":"Employee Type","protected":"Required to save a matrix entry."},
        {"key":"ui.matrix.fld.steps","area":"matrix","kind":"fld","label":"Steps, in order of occurrence"},
        {"key":"ui.matrix.fld.matrixformnotes","area":"matrix","kind":"fld","label":"Notes"},
        {"key":"ui.matrix.flt.matrixsearchinput","area":"matrix","kind":"flt","label":"Search by category"},
        {"key":"ui.matrix.col.matrix.category_description_of_event","area":"matrix","kind":"col","label":"Category (Description of event)"},
        {"key":"ui.matrix.col.matrix.employee_type","area":"matrix","kind":"col","label":"Employee Type"},
        {"key":"ui.matrix.col.matrix.steps_by_occurrence","area":"matrix","kind":"col","label":"Steps (by occurrence)"},
        {"key":"ui.matrix.col.matrix.actions","area":"matrix","kind":"col","label":"Actions","protected":"Holds the row buttons (edit, delete, open)."},
        {"key":"ui.agents.col.agentselecttable.select","area":"agents","kind":"col","label":"Select (checkbox)","protected":"Holds the row selection boxes."},
        {"key":"ui.agents.col.agentselecttable.agent","area":"agents","kind":"col","label":"Agent"},
        {"key":"ui.agents.col.agentselecttable.pid","area":"agents","kind":"col","label":"PID"},
        {"key":"ui.agents.col.agentselecttable.email","area":"agents","kind":"col","label":"Email"},
        {"key":"ui.agents.col.agentselecttable.months","area":"agents","kind":"col","label":"Months"},
        {"key":"ui.agents.col.agentselecttable.action","area":"agents","kind":"col","label":"Action","protected":"Holds the row buttons (edit, delete, open)."},
        {"key":"ui.profile.fld.editprofilename","area":"profile","kind":"fld","label":"Display name","protected":"Required to save your profile."},
        {"key":"ui.coaching.col.trend.reached","area":"coaching","kind":"col","label":"Trend table — Reached Customers %","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.callback","area":"coaching","kind":"col","label":"Trend table — Call Back%","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.sales","area":"coaching","kind":"col","label":"Trend table — Sales %","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.openSR","area":"coaching","kind":"col","label":"Trend table — Open SR","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.critical","area":"coaching","kind":"col","label":"Trend table — Critical","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.nonCritical","area":"coaching","kind":"col","label":"Trend table — Non Critical","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.srCreation","area":"coaching","kind":"col","label":"Trend table — SR Creation","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.staffTime","area":"coaching","kind":"col","label":"Trend table — Staff Time","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.tardiness","area":"coaching","kind":"col","label":"Trend table — Tardiness","group":"Monthly Performance Trend"},
        {"key":"ui.coaching.col.trend.what","area":"coaching","kind":"col","label":"Trend table — WHAT","group":"Monthly Performance Trend"},
        {"key":"ui.rolling.col.reached","area":"rolling","kind":"col","label":"Rolling table — Reached Customers %"},
        {"key":"ui.rolling.col.callback","area":"rolling","kind":"col","label":"Rolling table — Call Back%"},
        {"key":"ui.rolling.col.sales","area":"rolling","kind":"col","label":"Rolling table — Sales %"},
        {"key":"ui.rolling.col.openSR","area":"rolling","kind":"col","label":"Rolling table — Open SR"},
        {"key":"ui.rolling.col.critical","area":"rolling","kind":"col","label":"Rolling table — Critical"},
        {"key":"ui.rolling.col.nonCritical","area":"rolling","kind":"col","label":"Rolling table — Non Critical"},
        {"key":"ui.rolling.col.srCreation","area":"rolling","kind":"col","label":"Rolling table — SR Creation"},
        {"key":"ui.rolling.col.staffTime","area":"rolling","kind":"col","label":"Rolling table — Staff Time"},
        {"key":"ui.rolling.col.tardiness","area":"rolling","kind":"col","label":"Rolling table — Tardiness"},
        {"key":"ui.rolling.col.total","area":"rolling","kind":"col","label":"Rolling table — Total"},
        {"key":"ui.rolling.col.action","area":"rolling","kind":"col","label":"Rolling table — Action","protected":"Holds the Create Action button."},
        {"key":"employee.name","area":"org","kind":"fld","label":"Agent Name","protected":"Primary label of every profile.","builtin":true},
        {"key":"employee.pid","area":"org","kind":"fld","label":"PID / Person ID","protected":"PID is the unique key that links every record.","builtin":true},
        {"key":"employee.email","area":"org","kind":"fld","label":"Email","protected":"Sign-in and e-mail use it.","builtin":true},
        {"key":"employee.teamLeader","area":"org","kind":"fld","label":"Team Leader / Manager","builtin":true},
        {"key":"employee.contractType","area":"org","kind":"fld","label":"Contract Type","builtin":true},
        {"key":"employee.contractStatus","area":"org","kind":"fld","label":"Contract Status","protected":"Inactive accounts are blocked by it.","builtin":true},
        {"key":"employee.joinDate","area":"org","kind":"fld","label":"Join Date","builtin":true},
        {"key":"employee.department","area":"org","kind":"fld","label":"Department","builtin":true},
        {"key":"employee.subDepartment","area":"org","kind":"fld","label":"Sub-Department","builtin":true},
        {"key":"employee.role","area":"org","kind":"fld","label":"Agent Role","protected":"Access control depends on it.","builtin":true},
        {"key":"action.employeeName","area":"actionform","kind":"fld","label":"Employee Name","protected":"Required to save an action.","builtin":true},
        {"key":"action.date","area":"actionform","kind":"fld","label":"Date","builtin":true},
        {"key":"action.managerName","area":"actionform","kind":"fld","label":"Manager Name","builtin":true},
        {"key":"action.department","area":"actionform","kind":"fld","label":"Department","builtin":true},
        {"key":"action.subDepartment","area":"actionform","kind":"fld","label":"Sub-Department","builtin":true},
        {"key":"action.employeeType","area":"actionform","kind":"fld","label":"Employee Type","builtin":true},
        {"key":"action.description","area":"actionform","kind":"fld","label":"Description of event","builtin":true},
        {"key":"action.incidentDate","area":"actionform","kind":"fld","label":"Date of incident","builtin":true},
        {"key":"action.level","area":"actionform","kind":"fld","label":"Level of incident","builtin":true},
        {"key":"action.decision","area":"actionform","kind":"fld","label":"Decision","builtin":true},
        {"key":"action.actionPlan","area":"actionform","kind":"fld","label":"Action plan","builtin":true},
        {"key":"action.comments","area":"actionform","kind":"fld","label":"Comments","builtin":true},
        {"key":"kpi.name","area":"kpi","kind":"fld","label":"KPI Name","protected":"Required to save a KPI.","builtin":true},
        {"key":"kpi.category","area":"kpi","kind":"fld","label":"Category","builtin":true},
        {"key":"kpi.threshold","area":"kpi","kind":"fld","label":"Threshold","builtin":true},
        {"key":"kpi.target","area":"kpi","kind":"fld","label":"Target","builtin":true},
        {"key":"kpi.exceptional","area":"kpi","kind":"fld","label":"Exceptional","builtin":true},
        {"key":"kpi.weight","area":"kpi","kind":"fld","label":"Weight (%)","builtin":true},
        {"key":"kpi.description","area":"kpi","kind":"fld","label":"Description","builtin":true},
        {"key":"kpi.equation","area":"kpi","kind":"fld","label":"Equation","builtin":true},
        {"key":"kpi.whatCalculation","area":"kpi","kind":"fld","label":"WHAT Calculation","builtin":true},
        {"key":"kpi.coachingNotes","area":"kpi","kind":"fld","label":"Coaching Notes","builtin":true},
        {"key":"coaching.agentName","area":"coaching","kind":"fld","label":"Agent Full Name","protected":"Links the sheet to the agent.","builtin":true},
        {"key":"coaching.agentId","area":"coaching","kind":"fld","label":"Agent Performance ID","protected":"Links the sheet to the agent's PID.","builtin":true},
        {"key":"coaching.coachingDateTime","area":"coaching","kind":"fld","label":"Coaching Date & Time","builtin":true},
        {"key":"coaching.lob","area":"coaching","kind":"fld","label":"LOB / Campaign / Queue","builtin":true},
        {"key":"coaching.teamLeader","area":"coaching","kind":"fld","label":"Team Leader Name","builtin":true},
        {"key":"coaching.perfReviewYear","area":"coaching","kind":"fld","label":"Review Year","builtin":true},
        {"key":"section.coaching.notes","area":"coaching","kind":"sec","label":"Coaching Notes (SMART)","builtin":true},
        {"key":"section.coaching.devReport","area":"coaching","kind":"sec","label":"Development Areas — Justification & Next Steps","builtin":true},
        {"key":"section.coaching.comments","area":"coaching","kind":"sec","label":"Comments","builtin":true}
    ];

    var KIND_ORDER = { sec: 0, fld: 1, flt: 2, col: 3 };
    var KIND_LABEL = { sec: "Section", fld: "Field", flt: "Filter", col: "Column" };
    var KEY_RE = /^(ui\.[a-z]+\.(sec|fld|flt|col)\.[A-Za-z0-9_.]+|(employee|action|coaching|kpi)\.[A-Za-z]+|section\.[a-z]+\.[A-Za-z]+|custom\.[A-Za-z0-9_]+)$/;
    var index = {}; ITEMS.forEach(function (i) { index[i.key] = i; });

    function get(key) { return index[key] || null; }
    function isKnown(key) { return !!index[key] || /^custom\.[A-Za-z0-9_]+$/.test(String(key)); }
    function isProtected(key) { var i = index[key]; return i && i.protected ? i.protected : ""; }
    function itemsOf(area) { return ITEMS.filter(function (i) { return !area || i.area === area; }).sort(function (a, b) { return KIND_ORDER[a.kind] - KIND_ORDER[b.kind]; }); }
    function deletable(area) { return itemsOf(area).filter(function (i) { return !i.protected; }); }
    function normalizeDeleted(list) {
        var keys = [], rejected = [], seen = {};
        (Array.isArray(list) ? list : []).forEach(function (k) {
            if (typeof k !== "string" || seen[k]) return; seen[k] = 1;
            var i = index[k];
            if (!i) rejected.push({ key: k, reason: "Unknown item" });
            else if (i.protected) rejected.push({ key: k, reason: i.protected });
            else keys.push(k);
        });
        return { keys: keys, rejected: rejected };
    }

    return {
        AREAS: AREAS, ITEMS: ITEMS, KIND_LABEL: KIND_LABEL, KEY_RE: KEY_RE,
        get: get, isKnown: isKnown, isProtected: isProtected, itemsOf: itemsOf,
        deletable: deletable, normalizeDeleted: normalizeDeleted
    };
})();

if (typeof window !== "undefined") {
    window.UiRegistry = UiRegistry;
}
