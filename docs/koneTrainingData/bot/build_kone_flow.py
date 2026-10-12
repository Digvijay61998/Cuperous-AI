"""Generates kone-mykone-assistant-flow.json, the myKONE Assistant bot flow.

Same format as QuantumMind-backend/demo/demo-bot-flow.json:
    PATCH /api/bots/:botId/flow   body = { nodes, edges, customAttributes }

Run: python3 build_kone_flow.py   (stdlib only). The script validates the graph
against the runtime rules of message-handler.service.ts before writing.
"""
import json
import os
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "kone-mykone-assistant-flow.json")

WEBHOOK_ID = "REPLACE_ME_WEBHOOK_ID_MYKONE_CONNECTOR"
TEMPLATE_ID = "REPLACE_ME_TEMPLATE_ID_CONTACT_FORM"
SEG_REMINDERS = "REPLACE_ME_SEGMENT_ID_DELIVERY_REMINDERS"
EMERGENCY_NO = "[local KONE 24/7 service number]"
COMPANY = "KONE"

AI_ICON = "streamline:computer-robot-cyborg-artificial-robotics-robot-intelligence-machine-technology-android"
META = {  # nodeType -> (canvas type, label, icon)  (mirrors dropdownList/nodeList.tsx)
    "START_NODE": ("start_node", "Start Point", "ant-design:home-filled"),
    "BOT_RESPONSE": ("custom_node", "Bot Response", "bi:send-fill"),
    "USER_INPUT": ("custom_node", "User Input", "bxs:user"),
    "QUESTIONS": ("custom_node", "Questionnaire", "akar-icons:question-fill"),
    "FILE_ATTACHMENT": ("custom_node", "Attachment Input", "eva:attach-fill"),
    "SET_ATTRIBUTES": ("custom_node", "Set Attributes", "bi:braces-asterisk"),
    "WEBHOOK": ("custom_node", "Webhook", "tabler:fish-hook"),
    "AI_NODE": ("custom_node", "AI Node", AI_ICON),
    "AI_RESPONSE": ("custom_node", "AI Node", AI_ICON),
    "TICKET": ("custom_node", "Create Service Request", "bx:git-pull-request"),
    "TRANSFER_TO_AGENT": ("custom_node", "Transfer To Agent", "bx:transfer"),
    "OPEN_TEMPLATE": ("custom_node", "Open Template", "material-symbols-light:web-sharp"),
    "ADD_TO_SEGMENT": ("custom_node", "Add To Segment", "bx:pie-chart-alt"),
    "REMOVE_FROM_SEGMENT": ("custom_node", "Delete from Segment", "ep:remove-filled"),
    "GO_TO_STEP": ("custom_node", "Go To Step", "icon-park-solid:transfer"),
    "FALL_BACK": ("custom_node", "Fall Back", "pajamas:false-positive"),
    "SUCCESS": ("custom_node", "Success", "akar-icons:circle-check-fill"),
    "FAILURE": ("custom_node", "Failure", "entypo:circle-with-cross"),
    "TIMEOUT": ("custom_node", "Timeout", "mdi:timer-sand"),
    "CLOSE_CHAT": ("end_node", "Close Chat", "akar-icons:chat-error"),
}
ENTITIES = {"jarcube.email", "jarcube.phone_number", "jarcube.number", "jarcube.date",
            "jarcube.alphanumeric", "jarcube.any", "jarcube.country", "jarcube.text",
            "jarcube.yes_no", "jarcube.yes", "jarcube.no"}

nodes, edges = {}, []


def node(nid, ntype, title, responses=None, payload=None, keywords=None, utterance=None):
    assert nid not in nodes, f"duplicate id {nid}"
    ctype, label, icon = META[ntype]
    nodes[nid] = {
        "id": nid, "nodeType": ntype, "type": ctype, "title": title,
        "data": {"label": label, "icon": icon, "title": title},
        "position": {"x": 0, "y": 0},
        "utterance": utterance or [], "keywords": keywords or [],
        "responses": responses or [], "payload": payload or {},
    }
    return nid


def link(src, *targets):
    for t in targets:
        edges.append({"id": f"e_{len(edges) + 1:03d}", "source": src, "target": t})


def text(v): return {"type": "text", "value": v}
def buttons(v, pairs): return {"type": "buttons", "value": v, "buttons": [{"title": t, "type": "text", "value": val} for t, val in pairs]}
def say(nid, title, *msgs): return node(nid, "BOT_RESPONSE", title, list(msgs))
def choice(nid, title, kws, utter=None): return node(nid, "USER_INPUT", title, keywords=kws, utterance=utter)
def entity_choice(nid, title, ent): return node(nid, "USER_INPUT", title, payload={"entity": ent})
def capture(nid, title, alias, ent="jarcube.any"): return node(nid, "USER_INPUT", title, payload={"alias": alias, "entity": ent, "secure": False})
def goto(nid, title, target): return node(nid, "GO_TO_STEP", title, payload={"blockId": target})
def ok(nid, title="Success"): return node(nid, "SUCCESS", title)
def fail(nid, title="Failure"): return node(nid, "FAILURE", title)
def ai(nid, title, ntype="AI_NODE"): return node(nid, ntype, title, payload={"companyName": COMPANY})


def webhook(nid, title, event, on_ok, on_fail):
    node(nid, "WEBHOOK", title, payload={"webhookId": WEBHOOK_ID, "eventField": event, "secure": False})
    s, f = ok(nid + "_ok", title + ": data returned"), fail(nid + "_fail", title + ": connector failed")
    link(nid, s, f); link(s, on_ok); link(f, on_fail)
    return nid


MENU_BACK = ["menu", "main menu", "back"]
EMERGENCY_KW = ["emergency", "trapped", "entrapment", "someone is stuck", "someone stuck", "person stuck",
                "people stuck", "people trapped", "stuck in the lift", "stuck in the elevator", "stuck inside",
                "is stuck", "are stuck", "injured", "fire in the building", "smoke"]

# ===================================================================== start
node("kone_start", "START_NODE", "Start Point")
say("kone_menu", "Main Menu",
    text("Hi, I'm the myKONE Assistant. I can help with your delivery projects, equipment, tenders, "
         "inspection reports, invoices and using myKONE."),
    {"type": "random_text", "values": ["What can I help you with today?", "What would you like to check?",
                                       "How can I help you today?"]},
    buttons("Choose a topic, or just type your question. Type start at any time to come back here.",
            [("Delivery & projects", "delivery"), ("Equipment & visits", "equipment"),
             ("Tenders & quotes", "tenders"), ("Inspection reports", "reports"), ("Invoices", "invoices"),
             ("How do I…?", "ask a question"), ("Talk to KONE", "talk to kone"), ("🚨 Emergency", "emergency")]))
node("kone_fallback", "FALL_BACK", "Default Fall Back")
link("kone_start", "kone_menu", "kone_fallback")

# shared navigation
goto("kone_goto_menu", "Back to Main Menu", "kone_menu")
goto("kone_goto_help", "Go to Help Menu", "kone_help_menu")
goto("kone_goto_human", "Go to Specialist Hand-over", "kone_human_start")
choice("kone_in_menu", "Chose Main Menu", MENU_BACK)
link("kone_in_menu", "kone_goto_menu")
choice("kone_in_emergency", "Emergency Detected", EMERGENCY_KW,
       ["someone is stuck in the lift", "people are trapped in the elevator"])
entity_choice("kone_in_yes_human", "Said Yes to Specialist", "jarcube.yes")
link("kone_in_yes_human", "kone_goto_human")

# ===================================================================== main menu branches
main_branches = [
    choice("kone_in_delivery", "Chose Delivery", ["delivery", "delivery & projects", "my project", "project status",
           "milestone", "milestones", "installation date", "where is my elevator", "new elevator", "handover date"]),
    choice("kone_in_equipment", "Chose Equipment", ["equipment", "equipment & visits", "out of service",
           "service visit", "next visit", "maintenance", "technician", "work order", "callout"]),
    choice("kone_in_tenders", "Chose Tenders", ["tender", "tenders", "tenders & quotes", "quote", "quotation",
           "repair offer", "po number", "purchase order"]),
    choice("kone_in_reports", "Chose Reports", ["report", "reports", "inspection", "inspection report",
           "inspection reports", "finding", "findings", "3pi"]),
    choice("kone_in_invoices", "Chose Invoices", ["invoice", "invoices", "bill", "unpaid", "overdue"]),
    choice("kone_in_howto", "Chose Ask a Question", ["ask a question"]),
    choice("kone_in_human", "Chose Talk to KONE", ["talk to kone", "specialist", "agent", "human", "real person",
           "contact kone", "call me", "talk to someone"]),
    choice("kone_in_portal", "Chose Portal Problem", ["portal problem", "error message", "page not loading",
           "bug", "cannot log in", "can't log in"]),
    choice("kone_in_stop_rem", "Chose Stop Reminders", ["stop reminders", "unsubscribe", "no more reminders"]),
    choice("kone_in_bye", "Chose Exit", ["exit", "bye", "goodbye", "no thanks"], ["that is all thanks", "nothing else"]),
    "kone_in_emergency", "kone_in_menu",
]
link("kone_menu", *main_branches)
link("kone_in_human", "kone_goto_human")
link("kone_in_portal", "kone_r_portal_ask")
node("kone_close", "CLOSE_CHAT", "Close Chat")
link("kone_in_bye", "kone_close")

# ===================================================================== fallback -> AI (open Q&A)
# No SUCCESS child on purpose: after a confident answer the AI node stays the
# current node, so follow-up questions keep going to the knowledge base.
ai("kone_ai_open", "AI Answer (catch-all)", "AI_RESPONSE")
link("kone_fallback", "kone_ai_open")
fail("kone_ai_open_fail", "Catch-all AI Not Confident")
link("kone_ai_open", "kone_ai_open_fail")
say("kone_r_ai_fail", "No Grounded Answer",
    text("I couldn't find a reliable answer to that in the approved myKONE content, so I'd rather not guess."))
link("kone_ai_open_fail", "kone_r_ai_fail")
link("kone_r_ai_fail", "kone_goto_help")

# how-to: ask -> capture -> AI
say("kone_r_howto_ask", "Ask For Question",
    text("Sure. Ask me anything about myKONE, for example \"How do I add a new user?\" or "
         "\"What does Waiting for PO number mean?\""))
capture("kone_cap_question", "Capture Question", "user_question")
ai("kone_ai_howto", "AI Answer (how-to)")
fail("kone_ai_howto_fail", "How-to AI Not Confident")
link("kone_in_howto", "kone_r_howto_ask"); link("kone_r_howto_ask", "kone_cap_question")
link("kone_cap_question", "kone_ai_howto"); link("kone_ai_howto", "kone_ai_howto_fail")
link("kone_ai_howto_fail", "kone_r_ai_fail")

# ===================================================================== help menu (entered via GO_TO only)
say("kone_help_menu", "Help Menu",
    buttons("Would you like help from a person?",
            [("Yes, talk to KONE", "yes"), ("Report a myKONE problem", "portal problem"),
             ("Main menu", "menu"), ("No thanks", "no")]))
choice("kone_in_help_talk", "Help: Talk to KONE", ["talk to kone", "specialist", "person", "agent", "human"])
choice("kone_in_help_portal", "Help: Portal Problem", ["portal problem", "report a myKONE problem", "error", "bug"])
entity_choice("kone_in_help_no", "Help: Said No", "jarcube.no")
say("kone_r_help_no", "Help Declined", text("No problem."))
link("kone_help_menu", "kone_in_yes_human", "kone_in_help_talk", "kone_in_help_portal", "kone_in_help_no",
     "kone_in_emergency", "kone_in_menu")
link("kone_in_help_talk", "kone_goto_human"); link("kone_in_help_portal", "kone_r_portal_ask")
link("kone_in_help_no", "kone_r_help_no"); link("kone_r_help_no", "kone_goto_menu")

# ===================================================================== emergency
say("kone_r_emergency", "Emergency Instructions",
    text(f"🚨 If someone is trapped or anyone is in danger, call KONE's 24/7 service line now: {EMERGENCY_NO}. "
         "If you are inside the car, press the alarm button. Do not try to open the doors yourself."),
    text("I can't handle emergencies in chat, but I'm alerting a KONE specialist now as well."))
# The handover node opens a CRITICAL incident and its service request itself
# (incidentHandover, R19.1), so there is no separate TICKET node here. The
# visitor is never told whether a specialist is online (D2).
node("kone_agent_emg", "TRANSFER_TO_AGENT", "Record Emergency For Specialist",
     payload={"emergency": True, "ticketSubject": "URGENT: emergency reported via myKONE Assistant",
              "ticketAttributes": ["contact_topic", "context_equipment"]})
ok("kone_agent_emg_ok", "Emergency Recorded")
fail("kone_agent_emg_fail", "Emergency Could Not Be Recorded")
say("kone_r_emg_done", "Emergency Recorded",
    text(f"If the situation is not resolved, call {EMERGENCY_NO}. You can keep writing here in the meantime."))
say("kone_r_emg_busy", "Emergency: Call Now",
    text(f"Please call {EMERGENCY_NO} now. We could not record your report in chat."))
link("kone_in_emergency", "kone_r_emergency"); link("kone_r_emergency", "kone_agent_emg")
link("kone_agent_emg", "kone_agent_emg_ok", "kone_agent_emg_fail")
link("kone_agent_emg_ok", "kone_r_emg_done"); link("kone_r_emg_done", "kone_ai_rest")
link("kone_agent_emg_fail", "kone_r_emg_busy"); link("kone_r_emg_busy", "kone_close")

# ===================================================================== delivery
say("kone_dlv_menu", "Delivery Menu",
    buttons("Delivery & projects. What would you like to know?",
            [("All my projects", "my projects"), ("Check one elevator", "check equipment"),
             ("What do I need to do?", "my tasks"), ("Delivery stages explained", "delivery stages"),
             ("Main menu", "menu")]))
say("kone_dlv_after", "Delivery Follow-up Menu",
    buttons("Anything else about your projects?",
            [("Check another elevator", "check equipment"), ("My tasks", "my tasks"),
             ("Remind me about my tasks", "remind me"), ("Talk to my Project Manager", "project manager"),
             ("Main menu", "menu")]))
goto("kone_goto_dlv_menu", "Back to Delivery Menu", "kone_dlv_menu")
goto("kone_goto_dlv_after", "Go to Delivery Follow-up", "kone_dlv_after")
say("kone_r_dlv_unavail", "Delivery Data Unavailable",
    text("I can't load your delivery data right now. You can always see it in myKONE under Delivery, "
         "where each elevator shows its milestones, expected dates and your open tasks."))
link("kone_r_dlv_unavail", "kone_goto_help")

webhook("kone_wh_dlv_projects", "Get All Projects", "delivery.projects", "kone_goto_dlv_after", "kone_r_dlv_unavail")
webhook("kone_wh_dlv_status", "Get Elevator Status", "delivery.status", "kone_goto_dlv_after", "kone_r_dlv_unavail")
webhook("kone_wh_dlv_actions", "Get My Delivery Tasks", "delivery.actions", "kone_goto_dlv_after", "kone_r_dlv_unavail")

say("kone_r_ask_dlv_eq", "Ask Delivery Equipment Number",
    text("Please type the equipment number (for example 41234561). You can find it on your order "
         "confirmation or in myKONE under Delivery."))
capture("kone_cap_dlv_eq", "Capture Delivery Equipment Number", "equipment_number")
node("kone_set_ctx_dlv", "SET_ATTRIBUTES", "Remember Delivery Equipment",
     payload={"attributes": [{"set": "equipment_number", "to": "context_equipment"}]})
link("kone_r_ask_dlv_eq", "kone_cap_dlv_eq"); link("kone_cap_dlv_eq", "kone_set_ctx_dlv")
link("kone_set_ctx_dlv", "kone_wh_dlv_status")

say("kone_r_dlv_stages", "Delivery Stages Explained",
    text("A new elevator goes through these stages in myKONE:\n"
         "1. Order confirmed\n2. Drawings approved\n3. Production started\n4. Equipment shipped\n"
         "5. Delivered to site\n6. Installation started\n7. Installation completed\n"
         "8. Final inspection completed\n9. Project handed over"),
    text("Some stages have tasks for you, such as approving drawings, confirming installation and handover "
         "dates, or getting the site ready. Ask \"What do I need to do?\" to see yours."))
link("kone_r_dlv_stages", "kone_goto_dlv_menu")

for nid, title, kws, target in [
        ("kone_in_dlv_all", "Delivery: All Projects", ["my projects", "all my projects", "all projects", "show my projects"], "kone_wh_dlv_projects"),
        ("kone_in_dlv_eq", "Delivery: One Elevator", ["check equipment", "check one elevator", "one elevator", "equipment number"], "kone_r_ask_dlv_eq"),
        ("kone_in_dlv_tasks", "Delivery: My Tasks", ["my tasks", "tasks", "what do i need to do", "actions"], "kone_wh_dlv_actions"),
        ("kone_in_dlv_stages", "Delivery: Stages", ["delivery stages", "stages", "milestones", "delivery stages explained"], "kone_r_dlv_stages")]:
    choice(nid, title, kws); link(nid, target)
link("kone_in_delivery", "kone_dlv_menu")
link("kone_dlv_menu", "kone_in_dlv_all", "kone_in_dlv_eq", "kone_in_dlv_tasks", "kone_in_dlv_stages",
     "kone_in_emergency", "kone_in_menu")

choice("kone_in_dlva_eq", "Follow-up: Another Elevator", ["check equipment", "another elevator", "check another elevator"])
choice("kone_in_dlva_tasks", "Follow-up: My Tasks", ["my tasks", "tasks", "what do i need to do"])
choice("kone_in_dlva_remind", "Follow-up: Remind Me", ["remind me", "reminder", "remind me about my tasks"])
choice("kone_in_dlva_pm", "Follow-up: Project Manager", ["project manager", "talk to my project manager", "talk to kone"])
node("kone_seg_add_rem", "ADD_TO_SEGMENT", "Opt In: Delivery Reminders", payload={"segmentId": SEG_REMINDERS})
say("kone_r_rem_added", "Reminder Opt-in Confirmed",
    text("Done. You're on the list for delivery task reminders. Type stop reminders at any time to opt out."))
link("kone_dlv_after", "kone_in_dlva_eq", "kone_in_dlva_tasks", "kone_in_dlva_remind", "kone_in_dlva_pm",
     "kone_in_emergency", "kone_in_menu")
link("kone_in_dlva_eq", "kone_r_ask_dlv_eq"); link("kone_in_dlva_tasks", "kone_wh_dlv_actions")
link("kone_in_dlva_remind", "kone_seg_add_rem"); link("kone_seg_add_rem", "kone_r_rem_added")
link("kone_r_rem_added", "kone_goto_menu"); link("kone_in_dlva_pm", "kone_goto_human")

node("kone_seg_remove_rem", "REMOVE_FROM_SEGMENT", "Opt Out: Delivery Reminders", payload={"segmentId": SEG_REMINDERS})
say("kone_r_rem_removed", "Reminder Opt-out Confirmed", text("Done. You won't get delivery task reminders any more."))
link("kone_in_stop_rem", "kone_seg_remove_rem"); link("kone_seg_remove_rem", "kone_r_rem_removed")
link("kone_r_rem_removed", "kone_goto_menu")

# ===================================================================== equipment
say("kone_r_ask_eq", "Ask Equipment Number",
    text("Which equipment? Type the equipment number shown in myKONE under Equipment (for example 41230018)."))
capture("kone_cap_eq", "Capture Equipment Number", "equipment_number")
node("kone_set_ctx_eq", "SET_ATTRIBUTES", "Remember Equipment",
     payload={"attributes": [{"set": "equipment_number", "to": "context_equipment"}]})
say("kone_eq_menu", "Equipment Menu",
    buttons("What would you like to know about equipment {{equipment_number}}?",
            [("Is it running?", "status"), ("Next service visit", "next visit"),
             ("Recent stops & callouts", "recent stops"), ("Report a fault", "report a fault"),
             ("Another equipment", "another equipment"), ("Main menu", "menu")]))
goto("kone_goto_eq_menu", "Back to Equipment Menu", "kone_eq_menu")
say("kone_r_eq_unavail", "Equipment Data Unavailable",
    text("I can't load live data for this equipment right now. You can see its status, service visits and "
         "work orders in myKONE under Equipment."))
link("kone_r_eq_unavail", "kone_goto_help")
say("kone_r_eq_fault", "How To Report A Fault",
    text(f"To report a fault, call KONE's service line on {EMERGENCY_NO}. KONE raises the callout and sends "
         "a technician, and you can then follow it in myKONE under Equipment > Work orders."),
    text("If anyone is trapped, call straight away."))
link("kone_r_eq_fault", "kone_goto_help")

webhook("kone_wh_eq_status", "Get Equipment Status", "equipment.status", "kone_goto_eq_menu", "kone_r_eq_unavail")
webhook("kone_wh_eq_visit", "Get Next Service Visit", "equipment.next_visit", "kone_goto_eq_menu", "kone_r_eq_unavail")
webhook("kone_wh_eq_history", "Get Recent Stops", "equipment.history", "kone_goto_eq_menu", "kone_r_eq_unavail")

link("kone_in_equipment", "kone_r_ask_eq"); link("kone_r_ask_eq", "kone_cap_eq")
link("kone_cap_eq", "kone_set_ctx_eq"); link("kone_set_ctx_eq", "kone_eq_menu")
eq_children = []
for nid, title, kws, target in [
        ("kone_in_eqm_status", "Equipment: Status", ["status", "is it running", "running"], "kone_wh_eq_status"),
        ("kone_in_eqm_visit", "Equipment: Next Visit", ["next visit", "next service visit", "service visit", "maintenance"], "kone_wh_eq_visit"),
        ("kone_in_eqm_hist", "Equipment: Recent Stops", ["recent stops", "callouts", "why was it stopped", "history"], "kone_wh_eq_history"),
        ("kone_in_eqm_fault", "Equipment: Report Fault", ["report a fault", "fault", "broken", "not working"], "kone_r_eq_fault"),
        ("kone_in_eqm_other", "Equipment: Another One", ["another equipment", "other equipment", "different equipment"], "kone_r_ask_eq")]:
    choice(nid, title, kws); link(nid, target); eq_children.append(nid)
link("kone_eq_menu", *eq_children, "kone_in_emergency", "kone_in_menu")

# ===================================================================== tenders
say("kone_tnd_menu", "Tenders Menu",
    buttons("Tenders & quotes. What do you need?",
            [("What needs my action?", "needs my action"), ("All active tenders", "active tenders"),
             ("What does a status mean?", "status meaning"),
             ("How do I approve or add a PO?", "How do I approve a tender or add a PO number?"),
             ("Main menu", "menu")]))
goto("kone_goto_tnd", "Back to Tenders Menu", "kone_tnd_menu")
say("kone_r_tnd_unavail", "Tender Data Unavailable",
    text("I can't load your tenders right now. You can see them all in myKONE under Tenders."))
link("kone_r_tnd_unavail", "kone_goto_help")
webhook("kone_wh_tnd_pending", "Get Tenders Waiting For Me", "tenders.pending", "kone_goto_tnd", "kone_r_tnd_unavail")
webhook("kone_wh_tnd_list", "Get Active Tenders", "tenders.list", "kone_goto_tnd", "kone_r_tnd_unavail")
say("kone_r_tnd_glossary", "Tender Status Glossary",
    text("What tender statuses mean in myKONE:\n"
         "• Pending approval: KONE has sent you a tender. Review it, then approve, reject or request a change.\n"
         "• Waiting for PO number: you approved it. Add your purchase order number so KONE can plan the work.\n"
         "• Waiting for signed tender: it needs your signature before work can start.\n"
         "• Change requested: you asked for changes and KONE is updating the tender.\n"
         "• Approved, Rejected, Cancelled, Expired: the tender is closed. Expired means no decision was made "
         "in time. Ask KONE for a new one if you still need the work."))
link("kone_r_tnd_glossary", "kone_goto_tnd")
ai("kone_ai_tnd", "AI Answer (tender how-to)")
ok("kone_ai_tnd_ok", "Tender AI Answered")
fail("kone_ai_tnd_fail", "Tender AI Not Confident")
link("kone_ai_tnd", "kone_ai_tnd_ok", "kone_ai_tnd_fail")
link("kone_ai_tnd_ok", "kone_goto_tnd"); link("kone_ai_tnd_fail", "kone_r_ai_fail")
tnd_children = []
for nid, title, kws, target in [
        ("kone_in_tnd_pending", "Tenders: Needs My Action", ["needs my action", "what needs my action", "pending", "waiting for me"], "kone_wh_tnd_pending"),
        ("kone_in_tnd_list", "Tenders: All Active", ["active tenders", "all active tenders", "all tenders"], "kone_wh_tnd_list"),
        ("kone_in_tnd_gloss", "Tenders: Status Meaning", ["status meaning", "what does a status mean", "statuses"], "kone_r_tnd_glossary"),
        ("kone_in_tnd_howto", "Tenders: How To Approve", ["approve", "po number", "purchase order", "sign"], "kone_ai_tnd")]:
    choice(nid, title, kws); link(nid, target); tnd_children.append(nid)
link("kone_in_tenders", "kone_tnd_menu")
link("kone_tnd_menu", *tnd_children, "kone_in_emergency", "kone_in_menu")

# ===================================================================== inspection reports
say("kone_rpt_menu", "Reports Menu",
    buttons("Inspection reports. What would you like to do?",
            [("Latest inspection report", "latest report"), ("Open findings & safety issues", "open findings"),
             ("Explain a finding", "explain a finding"), ("Can KONE fix these?", "can kone fix these"),
             ("Main menu", "menu")]))
goto("kone_goto_rpt", "Back to Reports Menu", "kone_rpt_menu")
say("kone_r_rpt_unavail", "Report Data Unavailable",
    text("I can't load your inspection reports right now. You can find them in myKONE under Reports, "
         "with findings on the Active and Closed tabs."))
link("kone_r_rpt_unavail", "kone_goto_help")
webhook("kone_wh_rpt_latest", "Get Latest Report", "reports.latest", "kone_goto_rpt", "kone_r_rpt_unavail")
webhook("kone_wh_rpt_findings", "Get Open Findings", "reports.findings", "kone_goto_rpt", "kone_r_rpt_unavail")
say("kone_r_ask_finding", "Ask For Finding",
    text("Type or paste the finding as it appears in the report, and I'll explain it in plain language."))
capture("kone_cap_finding", "Capture Finding Text", "finding_text")
ai("kone_ai_finding", "AI Explain Finding")
ok("kone_ai_finding_ok", "Finding Explained")
fail("kone_ai_finding_fail", "Finding AI Not Confident")
link("kone_r_ask_finding", "kone_cap_finding"); link("kone_cap_finding", "kone_ai_finding")
link("kone_ai_finding", "kone_ai_finding_ok", "kone_ai_finding_fail")
link("kone_ai_finding_ok", "kone_goto_rpt"); link("kone_ai_finding_fail", "kone_r_ai_fail")
say("kone_r_repair", "Repair Offer",
    text("KONE prepares repair tenders for findings. When one is ready you'll see \"Repair tender pending\" "
         "on the finding, and the tender itself under Tenders."),
    buttons("Would you like me to ask your KONE contact about fixing the open findings?", [("Yes", "yes"), ("No", "no")]))
entity_choice("kone_in_rep_no", "Repair: Said No", "jarcube.no")
say("kone_r_rep_no", "Repair Declined", text("OK. Any repair tender KONE prepares will appear under Tenders."))
link("kone_r_repair", "kone_in_yes_human", "kone_in_rep_no", "kone_in_emergency", "kone_in_menu")
link("kone_in_rep_no", "kone_r_rep_no"); link("kone_r_rep_no", "kone_goto_rpt")
rpt_children = []
for nid, title, kws, target in [
        ("kone_in_rpt_latest", "Reports: Latest", ["latest report", "latest inspection report", "last report"], "kone_wh_rpt_latest"),
        ("kone_in_rpt_findings", "Reports: Open Findings", ["open findings", "findings", "safety issues", "safety issue"], "kone_wh_rpt_findings"),
        ("kone_in_rpt_explain", "Reports: Explain Finding", ["explain a finding", "explain"], "kone_r_ask_finding"),
        ("kone_in_rpt_repair", "Reports: Can KONE Fix", ["can kone fix these", "repair", "fix", "repair quote"], "kone_r_repair")]:
    choice(nid, title, kws); link(nid, target); rpt_children.append(nid)
link("kone_in_reports", "kone_rpt_menu")
link("kone_rpt_menu", *rpt_children, "kone_in_emergency", "kone_in_menu")

# ===================================================================== invoices
say("kone_inv_menu", "Invoices Menu",
    buttons("Invoices. What do you need?",
            [("Open or overdue invoices", "open invoices"), ("Download an invoice", "download invoice"),
             ("I can't see my invoices", "cant see invoices"), ("Question about an invoice", "invoice question"),
             ("Main menu", "menu")]))
goto("kone_goto_inv", "Back to Invoices Menu", "kone_inv_menu")
say("kone_r_inv_unavail", "Invoice Data Unavailable",
    text("I can't load your invoices right now. You can see them in myKONE under Invoices."))
link("kone_r_inv_unavail", "kone_goto_help")
webhook("kone_wh_inv_open", "Get Open Invoices", "invoices.open", "kone_goto_inv", "kone_r_inv_unavail")
say("kone_r_inv_download", "How To Download Invoice",
    text("In myKONE, go to Invoices, open the invoice you need and download it as a PDF."))
link("kone_r_inv_download", "kone_goto_inv")
say("kone_r_inv_access", "Why Invoices Are Hidden",
    text("Invoices are only shown to users who have invoice access. Ask your company's myKONE admin to give "
         "you access, or I can put you in touch with KONE."))
link("kone_r_inv_access", "kone_goto_inv")
inv_children = []
for nid, title, kws, target in [
        ("kone_in_inv_open", "Invoices: Open", ["open invoices", "overdue", "unpaid", "outstanding"], "kone_wh_inv_open"),
        ("kone_in_inv_dl", "Invoices: Download", ["download invoice", "download", "pdf", "copy of invoice"], "kone_r_inv_download"),
        ("kone_in_inv_access", "Invoices: Can't See", ["cant see invoices", "can't see invoices", "no access"], "kone_r_inv_access"),
        ("kone_in_inv_q", "Invoices: Question", ["invoice question", "dispute", "wrong invoice", "question about an invoice"], "kone_goto_human")]:
    choice(nid, title, kws); link(nid, target); inv_children.append(nid)
link("kone_in_invoices", "kone_inv_menu")
link("kone_inv_menu", *inv_children, "kone_in_emergency", "kone_in_menu")

# ===================================================================== portal problem (screenshot)
say("kone_r_portal_ask", "Ask For Portal Problem", text("Sorry about that. Describe what went wrong in a sentence or two."))
capture("kone_cap_issue", "Capture Problem Description", "issue_description", "jarcube.text")
say("kone_r_portal_shot", "Ask For Screenshot",
    text("Thanks. If you can, attach a screenshot of the page. Otherwise type skip."))
node("kone_file_shot", "FILE_ATTACHMENT", "Screenshot Upload", payload={"alias": "issue_screenshot"})
node("kone_set_issue", "SET_ATTRIBUTES", "Map Problem For Ticket",
     payload={"attributes": [{"set": "issue_description", "to": "ticket_summary"},
                             {"set": "issue_screenshot", "to": "ticket_evidence"}]})
node("kone_ticket_portal", "TICKET", "Portal Problem Ticket", payload={"ticketSubject": "myKONE portal problem reported via assistant"})
say("kone_r_portal_done", "Portal Problem Logged",
    text("A KONE specialist will look into it, and you'll get an update by email."))
link("kone_r_portal_ask", "kone_cap_issue"); link("kone_cap_issue", "kone_r_portal_shot")
link("kone_r_portal_shot", "kone_file_shot"); link("kone_file_shot", "kone_set_issue")
link("kone_set_issue", "kone_ticket_portal"); link("kone_ticket_portal", "kone_r_portal_done")
link("kone_r_portal_done", "kone_goto_menu")

# ===================================================================== specialist hand-over
say("kone_human_start", "Start Hand-over",
    text("I'll get a KONE specialist to help. First, a few details so your request reaches the right person."))
node("kone_tpl_contact", "OPEN_TEMPLATE", "Open Contact Form",
     responses=[text("Fill in this short contact form. It takes less than a minute.")],
     payload={"templateId": TEMPLATE_ID, "buttonText": "Open contact form",
              "buttonIcon": "material-symbols:support-agent",
              "variableMappings": [{"templateKey": "equipment_number", "source": "attribute", "value": "context_equipment"},
                                   {"templateKey": "channel", "source": "static", "value": "myKONE Assistant"}],
              "callbackEvent": "kone.contact.submitted", "timeoutMinutes": 10,
              "sessionExpiryMinutes": 30, "analyticsEnabled": True})
ok("kone_tpl_ok", "Contact Form Submitted")
node("kone_tpl_timeout", "TIMEOUT", "Contact Form Abandoned")
fail("kone_tpl_fail", "Form Unavailable: Ask In Chat")
say("kone_r_tpl_timeout", "Form Still Open",
    text("Your contact form is still open and stays valid for 30 minutes."))
node("kone_q_contact", "QUESTIONS", "Contact Details In Chat", payload={"elements": [
    {"prompt": "What's your name?", "entity": "jarcube.text", "alias": "contact_name",
     "lifespan": 2, "actionOnFailure": "continue", "secure": False},
    {"prompt": "Which email address should KONE reply to?", "entity": "jarcube.email", "alias": "contact_email",
     "lifespan": 2, "actionOnFailure": "fallback", "secure": False},
    {"prompt": "A phone number in case KONE needs to call you? Type skip to leave it out.",
     "entity": "jarcube.phone_number", "alias": "contact_phone", "lifespan": 1, "actionOnFailure": "continue", "secure": False},
    {"prompt": "Which equipment number or site is this about? Type skip if it's general.",
     "entity": "jarcube.any", "alias": "contact_reference", "lifespan": 1, "actionOnFailure": "continue", "secure": False},
    {"prompt": "In a sentence, what do you need help with?", "entity": "jarcube.text", "alias": "contact_topic",
     "lifespan": 2, "actionOnFailure": "continue", "secure": False}]})
ok("kone_q_ok", "Contact Details Complete")
fail("kone_q_fail", "Contact Details Incomplete")
# Terminal (R14.8): with the closure prompt on, the visitor is asked whether
# they are done instead of being sent back to the main menu. The menu edge is
# kept for bots with the prompt off.
node("kone_r_q_fail", "BOT_RESPONSE", "Contact Details Abandoned",
     [text("No problem, let's leave it there. You can also reach KONE through the contact details in myKONE.")],
     payload={"terminal": True})
# Both contact paths end with the problem in `contact_topic` (the questionnaire
# asks for it; the form's submitted `contact_topic` field is merged into the
# attributes). The handover node then opens the incident AND its service
# request with that description (incidentHandover, R4, R19.1), so there is no
# separate TICKET node. The reference goes into the ticket description.
node("kone_set_ticket", "SET_ATTRIBUTES", "Map Request For Ticket",
     payload={"attributes": [{"set": "contact_topic", "to": "ticket_summary"},
                             {"set": "contact_reference", "to": "ticket_reference"}]})
say("kone_r_handover", "Recording Request", text("Thanks. Let me record your request for a KONE specialist."))
node("kone_agent", "TRANSFER_TO_AGENT", "Record Request For Specialist",
     payload={"ticketSubject": "Customer request from myKONE Assistant",
              "ticketAttributes": ["ticket_reference"]})
ok("kone_agent_ok", "Request Recorded")
fail("kone_agent_fail", "Request Could Not Be Recorded")
# After the "recorded" message the visitor can keep asking; the assistant answers
# until a specialist joins (R19.3). No menu restart.
ai("kone_ai_rest", "Answer While Waiting")
fail("kone_ai_rest_fail", "Assistant Could Not Answer")
say("kone_r_ai_rest_fail", "Assistant Fallback",
    text("I couldn't find that. A KONE specialist has your request and will follow up."))
# Ends in CLOSE_CHAT, a Terminal_Outcome: the closure prompt offers
# "Start again", so the text no longer tells the visitor to type start (R14).
say("kone_r_agent_fail", "Request Not Recorded",
    text("You can also reach KONE through the contact details in myKONE."))

link("kone_human_start", "kone_tpl_contact")
link("kone_tpl_contact", "kone_tpl_ok", "kone_tpl_timeout", "kone_tpl_fail")
link("kone_tpl_ok", "kone_set_ticket")
link("kone_tpl_timeout", "kone_r_tpl_timeout"); link("kone_r_tpl_timeout", "kone_goto_menu")
link("kone_tpl_fail", "kone_q_contact"); link("kone_q_contact", "kone_q_ok", "kone_q_fail")
link("kone_q_ok", "kone_set_ticket"); link("kone_q_fail", "kone_r_q_fail"); link("kone_r_q_fail", "kone_goto_menu")
link("kone_set_ticket", "kone_r_handover")
link("kone_r_handover", "kone_agent"); link("kone_agent", "kone_agent_ok", "kone_agent_fail")
link("kone_agent_ok", "kone_ai_rest")
link("kone_ai_rest", "kone_ai_rest_fail"); link("kone_ai_rest_fail", "kone_r_ai_rest_fail")
link("kone_r_ai_rest_fail", "kone_goto_ai_rest")
goto("kone_goto_ai_rest", "Keep Answering", "kone_ai_rest")
link("kone_agent_fail", "kone_r_agent_fail"); link("kone_r_agent_fail", "kone_close")


# ===================================================================== validation
def children(nid): return [e["target"] for e in edges if e["source"] == nid]


def validate():
    errs = []
    for e in edges:
        for k in ("source", "target"):
            if e[k] not in nodes: errs.append(f"edge {e['id']} -> unknown {e[k]}")
    seen = set()
    for e in edges:
        key = (e["source"], e["target"])
        if key in seen: errs.append(f"duplicate edge {key}")
        seen.add(key)
    for nid, n in nodes.items():
        t, ch = n["nodeType"], children(nid)
        ctypes = [nodes[c]["nodeType"] for c in ch if c in nodes]
        if t in ("USER_INPUT", "SET_ATTRIBUTES", "TICKET", "FILE_ATTACHMENT", "ADD_TO_SEGMENT",
                 "REMOVE_FROM_SEGMENT", "FALL_BACK") and len(ch) != 1:
            errs.append(f"{nid} ({t}) needs exactly 1 child, has {len(ch)}")
        if t in ("SUCCESS", "FAILURE", "TIMEOUT", "GO_TO_STEP", "CLOSE_CHAT") and len(ch) > (0 if t in ("GO_TO_STEP", "CLOSE_CHAT") else 1):
            errs.append(f"{nid} ({t}) has too many children")
        if t == "BOT_RESPONSE":
            if len(ch) == 0: errs.append(f"{nid} BOT_RESPONSE dead-ends")
            if len(ch) > 1 and any(ct != "USER_INPUT" for ct in ctypes):
                errs.append(f"{nid} menu has non-USER_INPUT children")
            if len(ch) > 1:  # sibling keyword collisions
                kw = {}
                for c in ch:
                    for k in nodes[c]["keywords"]:
                        if k in kw: errs.append(f"{nid}: keyword '{k}' in {kw[k]} and {c}")
                        kw[k] = c
        if t in ("WEBHOOK", "QUESTIONS", "TRANSFER_TO_AGENT") and sorted(ctypes) != ["FAILURE", "SUCCESS"]:
            errs.append(f"{nid} ({t}) needs SUCCESS + FAILURE, has {ctypes}")
        if t == "OPEN_TEMPLATE" and sorted(ctypes) != ["FAILURE", "SUCCESS", "TIMEOUT"]:
            errs.append(f"{nid} OPEN_TEMPLATE needs SUCCESS/TIMEOUT/FAILURE")
        if t in ("AI_NODE", "AI_RESPONSE") and "FAILURE" not in ctypes:
            errs.append(f"{nid} AI node without FAILURE")
        if t == "GO_TO_STEP" and n["payload"]["blockId"] not in nodes:
            errs.append(f"{nid} GO_TO target missing")
        if t == "START_NODE" and sorted(ctypes) != ["BOT_RESPONSE", "FALL_BACK"]:
            errs.append("start node must link to menu + fallback")
        ent = n["payload"].get("entity")
        if ent and ent not in ENTITIES: errs.append(f"{nid} bad entity {ent}")
        for el in n["payload"].get("elements", []):
            if el["entity"] not in ENTITIES: errs.append(f"{nid} bad element entity {el['entity']}")
    # Runtime rule: a multi-child BOT_RESPONSE that is still AWAITING re-reads the
    # same message if re-entered in that turn -> fallback -> AI -> loop. Every
    # AI FAILURE path must therefore pass a GO_TO_STEP (which resets node state)
    # before reaching a menu.
    for nid, n in nodes.items():
        if n["nodeType"] not in ("AI_NODE", "AI_RESPONSE"): continue
        for f in children(nid):
            if nodes[f]["nodeType"] != "FAILURE": continue
            cur, hops = f, 0
            while nodes[cur]["nodeType"] != "GO_TO_STEP" and hops < 20:
                ch = children(cur)
                if nodes[cur]["nodeType"] == "BOT_RESPONSE" and len(ch) > 1:
                    errs.append(f"AI failure path from {nid} reaches menu {cur} without GO_TO_STEP"); break
                if not ch: break
                cur, hops = ch[0], hops + 1
    # reachability (edges + GO_TO jumps)
    q, reach = deque(["kone_start"]), {"kone_start"}
    while q:
        c = q.popleft()
        nxt = children(c) + ([nodes[c]["payload"]["blockId"]] if nodes[c]["nodeType"] == "GO_TO_STEP" else [])
        for x in nxt:
            if x not in reach: reach.add(x); q.append(x)
    for nid in nodes:
        if nid not in reach: errs.append(f"unreachable {nid}")
    return errs, reach


def layout():
    depth, q = {"kone_start": 0}, deque(["kone_start"])
    while q:
        c = q.popleft()
        jump = [nodes[c]["payload"]["blockId"]] if nodes[c]["nodeType"] == "GO_TO_STEP" else []
        for x in children(c) + jump:
            if x not in depth: depth[x] = depth[c] + 1; q.append(x)
    rows = {}
    for nid in nodes:  # insertion order keeps related nodes together
        d = depth.get(nid, 0)
        rows.setdefault(d, []).append(nid)
    for d, ids in rows.items():
        for i, nid in enumerate(ids):
            nodes[nid]["position"] = {"x": 40 + d * 340, "y": 40 + i * 120}


errors, _ = validate()
if errors:
    raise SystemExit("Flow validation failed:\n  " + "\n  ".join(errors))
layout()

custom_attributes = ["equipment_number", "context_equipment", "user_question", "finding_text",
                     "contact_name", "contact_email", "contact_phone", "contact_reference", "contact_topic",
                     "ticket_summary", "ticket_reference", "issue_description", "issue_screenshot", "ticket_evidence"]
flow = {
    "_README": [
        "myKONE Assistant bot flow (Know / Track / Act / Hand over). Generated by build_kone_flow.py.",
        "Load: PATCH /api/bots/:botId/flow with this file as the JSON body. Node ids are globally unique, so load it into ONE bot.",
        f"Replace before going live: {WEBHOOK_ID} (myKONE connector webhook), {TEMPLATE_ID} (contact form template), "
        f"{SEG_REMINDERS} (segment 'Delivery task reminders'), and the text '{EMERGENCY_NO}' in the emergency and fault messages.",
        "With placeholders left in place, WEBHOOK and segment nodes throw and the bot replies with its generic fallback message "
        "(they do NOT take the FAILURE branch), so create the webhook and segment before demoing those paths. A placeholder "
        "template makes the contact form take FAILURE, which falls back to the in-chat questionnaire.",
        "AI nodes have no clientId, so they use this bot's own knowledge base. Upload the KONE knowledge pack to this bot's training data.",
        "Connector contract: the webhook POSTs {attributes, event, metadata}; event is one of delivery.projects, delivery.status, "
        "delivery.actions, equipment.status, equipment.next_visit, equipment.history, tenders.pending, tenders.list, "
        "reports.latest, reports.findings, invoices.open. Reply 2xx with {response:[{type:'text',value:'...'}], metadata:{}}. "
        "It must also answer the GET verification call JarCube makes before every POST. A non-2xx reply takes the FAILURE branch.",
    ],
    "customAttributes": custom_attributes,
    "nodes": list(nodes.values()),
    "edges": edges,
}
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(flow, fh, ensure_ascii=False, indent=2)
counts = {}
for n in nodes.values():
    counts[n["nodeType"]] = counts.get(n["nodeType"], 0) + 1
print(f"wrote {OUT}\n{len(nodes)} nodes, {len(edges)} edges, {len(counts)} node types")
print(", ".join(f"{k}={v}" for k, v in sorted(counts.items())))
