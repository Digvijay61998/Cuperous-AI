"""myKONE Assistant knowledge base: source content.

Every entry is a self-contained question + answer so that the RAG chunker
(500 chars, 50 overlap) keeps a question and its answer together and every
chunk names its own topic. Wording follows the English myKONE portal texts
(mykone-portal/microapps/*/frontend/src/locales/en). Keep answers factual;
do not add numbers, phone lines or policies that the portal does not state.

SECTIONS = [(section title, intro, [(question, answer), ...]), ...]
"""

SECTIONS = []


def section(title, intro=""):
    entries = []
    SECTIONS.append((title, intro, entries))
    return lambda q, a: entries.append((q, a))


# ============================================================ 1 About myKONE
qa = section("About myKONE", "What myKONE is, who can use it and what it contains.")
qa("What is myKONE?",
   "myKONE is KONE's customer portal: a single place to follow your equipment, services, deliveries, tenders, "
   "inspection reports and invoices online. KONE describes it as a new channel and a smarter way to connect with KONE. "
   "Quick guides are available at https://www.kone.com/global/en/service/mykone.html.")
qa("What can I do in myKONE?",
   "In myKONE you can: follow the status of your elevators, escalators, doors and other equipment; see planned, ongoing "
   "and closed service work orders and download service reports; track the delivery of new equipment and Upgrade "
   "(modernization) projects; review, approve, sign or reject tenders; read inspection report analyses; view and "
   "download invoices; manage your team's users; customize elevator screens; and request EU Data Act data.")
qa("Which pages or sections does myKONE have?",
   "The main myKONE sections are: Home, Equipment (with the In service and In delivery tabs), Delivery, Tenders, "
   "Reports, Invoices, Customization, My team (user management), EU Data Act, and Profile and settings. Which sections "
   "you see depends on your role, your permissions and the services your company has with KONE.")
qa("Who can use myKONE?",
   "myKONE is for representatives of KONE customers whose elevators, escalators, automatic building doors or other "
   "equipment are installed, modernized or maintained by KONE. You need personal user credentials created by KONE, "
   "your company or someone they have authorized, for example your company's myKONE admin.")
qa("What equipment types does myKONE show?",
   "myKONE shows these equipment types: Elevator, Escalator, Autowalk, Door, Dumbwaiter, Marine Elevator and "
   "Marine Escalator.")
qa("What is the difference between myKONE and KONE Online?",
   "KONE Online is KONE's earlier customer portal. myKONE is the new portal. Some users and settings still come from "
   "KONE Online: for example, a user's role, permissions or site visibility can be synced from KONE Online portfolio "
   "settings until an admin unlinks them in myKONE. Some service orders are also shown in KONE Online.")
qa("Is myKONE a new or pilot service?",
   "Parts of myKONE are still being developed and some features are marked as pilot, beta or coming soon. KONE notes "
   "that the scope and features expand over time. Some features are only available in some countries or for "
   "customers with certain contracts.")
qa("Is myKONE available in my language?",
   "myKONE is available in many languages. You can choose your preferred language in Profile and settings. If a text "
   "is not available in your language, it is usually shown in English.")
qa("Where can I find myKONE quick guides or FAQs?",
   "On the myKONE Home page, under Useful links, choose \"Have questions? Check myKONE quick guides\". The guides are at "
   "https://www.kone.com/global/en/service/mykone.html.")

# ============================================================ 2 Getting started
qa = section("Getting started, login and account", "Logging in, terms of use, maintenance breaks and errors.")
qa("How do I get access to myKONE?",
   "Your company's myKONE admin can create a user for you under My team, or KONE can create it. You then receive a "
   "welcome or invitation email with onboarding instructions. If you don't have access, ask your company's myKONE admin "
   "or your KONE contact.")
qa("I didn't receive my myKONE invitation email. What should I do?",
   "Check your junk or spam folder first. If the email still isn't there, ask your company's myKONE admin to resend it: "
   "admins can choose Resend invitation in the user's profile under My team. You can also contact your KONE contact.")
qa("How do I log in to myKONE?",
   "Open myKONE and choose Log in, then sign in with the email address your myKONE user was created with. The first "
   "time, you'll be asked to accept the Terms of Use and Privacy Statement.")
qa("Why do I have to accept the Terms of Use?",
   "Before using myKONE you must accept the myKONE Customer Portal Terms of Use and the Privacy Statement. You need to "
   "scroll to the bottom of the terms to accept them. If you don't accept them, you can't use the portal.")
qa("Why can't I log in? It says my email doesn't match.",
   "If the contact's email address in KONE's records does not match the email address (user ID) used for login, you "
   "cannot log in to myKONE. This is shown as \"Email mismatching\". Contact your local KONE key user or your KONE "
   "contact to correct it.")
qa("My session expired. What should I do?",
   "For security, myKONE sessions expire after a while. If you see \"Your session expired. Please sign in again.\", log "
   "in again and repeat what you were doing.")
qa("How do I log out of myKONE?",
   "Open Profile and settings and choose Log out.")
qa("myKONE is not working or shows a maintenance message. Why?",
   "myKONE sometimes has scheduled maintenance breaks, announced in the portal. During a break, myKONE is temporarily "
   "unavailable. If there is an unplanned technical problem, the portal shows a message that KONE's team is working "
   "to restore full functionality. Please try again later.")
qa("I see \"Oops, something went wrong\". What should I do?",
   "This is a temporary error. Reload the page or try again later. If it keeps happening, contact KONE customer "
   "support and tell them which page you were on.")
qa("I see \"Oops, it seems like you don't have access rights to this page\". Why?",
   "Your myKONE role or permissions don't include this page, or the content belongs to a site you can't see. Ask your "
   "company's myKONE admin to check your role, permissions and site visibility under My team.")
qa("I see \"Oops, the page is gone\" or \"Content unavailable\". What does it mean?",
   "The page or item may have been moved or removed, or the address may be incorrect. Go back to the Home page and "
   "open it again from the menu.")
qa("What is \"Viewing as\" or impersonation in myKONE?",
   "Authorized KONE staff can view myKONE as a specific customer user to help with support. When this happens, the "
   "portal shows \"Viewing as\" and an option to end the impersonation.")
qa("Can I share my myKONE login with a colleague?",
   "No. myKONE credentials are personal and only for your professional duties, and must not be given to anyone else. "
   "Ask your company's myKONE admin to create a separate user for your colleague.")
qa("Can I keep using myKONE after I leave my company?",
   "No. According to the Terms of Use, you may not continue to use myKONE when your employment or other association "
   "with the customer ends, or when your duties no longer relate to the equipment, even if your login still works.")

# ============================================================ 3 Home
qa = section("Home page and Spotlights")
qa("What is on the myKONE Home page?",
   "The Home page shows a welcome, the \"For you\" Spotlights with tasks that need your action, tiles to Equipment and "
   "Services (\"Follow up what's on your site\"), Tenders (\"Easily review and approve your tenders online\") and "
   "Customization (\"Make the ride yours\"), Useful links (quick guides and feedback), and a feedback form.")
qa("What are Spotlights or \"For you\" tasks on the Home page?",
   "Spotlights are task cards that appear when your action is needed, for example to review a repair tender by its "
   "due date, review an equipment tender, or add a PO number to an approved repair tender. More task types are being "
   "added. If there is nothing to do, the Home page says \"We got you covered.\"")
qa("Can I dismiss a Spotlight task?",
   "Yes. You can dismiss a Spotlight card; it shows \"Dismissed for now\" with an Undo option. Dismissing a card does "
   "not complete the task itself, for example the tender still needs to be reviewed.")
qa("Why does a Spotlight say \"Safety issue was identified\" or \"Equipment is out of service\"?",
   "These Spotlights tell you that a repair tender is urgent: a safety issue was identified, or the equipment is out of "
   "service and the repair is needed to bring it back. Review the repair tender by the date shown.")
qa("How do I give feedback about myKONE?",
   "Use \"Share your feedback\" on the Home page or on other pages, give a star rating and optionally a comment. Please "
   "don't include personal information. The team reads all feedback to improve myKONE, but can't reply to it. For "
   "questions that need an answer, contact KONE.")

# ============================================================ 4 Equipment
qa = section("Equipment and equipment status", "The Equipment page: sites, equipment, status, health and connectivity.")
qa("Where can I see my equipment in myKONE?",
   "Open Equipment. The In service tab shows equipment KONE maintains, grouped by site, with a Site Summary of equipment "
   "in operation, out of service, ongoing services and planned services. The In delivery tab shows equipment that is "
   "still being delivered or installed.")
qa("What information does myKONE show for a piece of equipment?",
   "Equipment details can include: equipment number, equipment name, type, product name, manufacturer name and number, "
   "year of construction, floors served, speed, max load, address and location details, contract and contract "
   "coverage, connectivity, status, health, ongoing and planned services, and service history.")
qa("What does \"In operation\" mean for my equipment?",
   "\"In operation\" (in service) means the equipment is running. For connected equipment this is based on KONE's "
   "latest IoT data. For other equipment it's based on what the technician reported at the last visit: \"This "
   "equipment was running smoothly during our last visit.\"")
qa("What does \"Out of service\" mean?",
   "\"Out of service\" means the equipment is not running. For connected equipment this comes from KONE's latest IoT "
   "data; myKONE then says \"Heads up! The equipment has stopped, but we're already investigating. No action needed "
   "from you!\" KONE creates a work order if the equipment doesn't recover. For other equipment it means it was out of "
   "service at the technician's last visit.")
qa("What does \"In maintenance\" or \"Maintenance ongoing\" mean?",
   "\"In maintenance\" means the equipment is out of service because of an ongoing work order, for example a "
   "technician is working on it. It returns to \"In operation\" when the work is completed.")
qa("What does \"Disconnected\" mean for my equipment?",
   "\"Disconnected\" means KONE has lost contact with connected equipment. This can happen at night, because of a "
   "network issue, or during maintenance. myKONE says: \"Connection is off, but should be back soon.\" KONE will act if "
   "the connection doesn't return. It doesn't necessarily mean the equipment has stopped.")
qa("What does \"Unknown\" status mean?",
   "\"Unknown\" means KONE couldn't get status data for the equipment. It should be updated after the next technician "
   "visit or when new data arrives. If you think something is wrong with the equipment, contact KONE.")
qa("What is the difference between real-time status and technician-reported status?",
   "Connected equipment shows real-time status from IoT data (\"Real-time equipment status\", \"updated on\"). Equipment "
   "without connectivity shows the status the technician manually reported at the last visit (\"Technician manually "
   "reported on\"), so it may not reflect the current situation.")
qa("What does connectivity mean (full, partial, no connectivity)?",
   "Connectivity tells you whether the equipment sends data to KONE. \"Full connectivity\" and \"Partial connectivity\" "
   "mean it is connected to KONE remote services (depending on elevator type). \"No connectivity\" means it doesn't "
   "send data, so status comes from technician visits. Connectivity for predictive maintenance lets KONE spot issues "
   "early.")
qa("What does \"Real-time monitored\" or \"Daily monitored\" mean?",
   "\"Real-time monitored\" means the equipment's health is updated in real time. \"Daily monitored\" means its health "
   "is updated once a day. Equipment without connectivity has no equipment health information.")
qa("What is equipment health in myKONE?",
   "Equipment health shows issues KONE's remote monitoring has identified on connected equipment, grouped by part of "
   "the equipment. \"No issues identified\" means all is well: \"All good! Everything's running smoothly, and we're "
   "keeping a close eye on it.\"")
qa("myKONE says issues were identified but the equipment is still in operation. Do I need to do anything?",
   "No. myKONE says: \"We identified an issue but equipment is still in operation. We're already investigating. No "
   "action needed from you!\" KONE will keep you informed of progress (\"We are on it!\").")
qa("Which parts of an elevator does equipment health cover?",
   "Health is grouped as: Car (the inside of the elevator: lighting, ventilation, accessories, safety features); Doors "
   "and entrances (car door, landing door); Machinery (hoist motor, gear, brake); Shaft (guide rails, counterweight, "
   "cables, buffer); and User interface (call buttons, displays, access control).")
qa("What are the equipment health sub-groups?",
   "Equipment health sub-groups include cabin, car door, landing door, car sling, drive unit, control unit, machine "
   "room equipment, hoisting ropes, guide rails, counterweight, shaft equipment, buttons, indicators, access control "
   "and auxiliary components.")
qa("How do I filter or sort my equipment list?",
   "On the Equipment page you can filter by equipment status, equipment type (elevator, escalator & autowalk, others), "
   "connectivity type and work order type, or show only \"out of service\" and \"in maintenance\" equipment. You can sort "
   "by most urgent status first, equipment name A-Z or Z-A, or group by site and sort sites by name.")
qa("myKONE says \"Looks like we hit a filter wall\". What does it mean?",
   "No equipment, tenders or items match the filters you selected. Clear or change the filters, or check again later.")
qa("Why can't I see some of my equipment or sites?",
   "Your user may be restricted to certain sites, or equipment visibility may be blocked by KONE Online portfolio "
   "settings. Ask your company's myKONE admin to check your site visibility under My team. Also, myKONE only shows "
   "equipment linked to your company's account.")
qa("myKONE says I don't have any equipment in service. Why?",
   "\"Oops, it seems you don't have any equipment in service\" means no maintained equipment is linked to your user. "
   "Your equipment may still be in delivery (see the In delivery tab), your site visibility may be restricted, or the "
   "equipment isn't linked to your account. Contact your myKONE admin or KONE.")
qa("How do I report a problem with my equipment?",
   "If you notice something wrong with your equipment, contact KONE: the Equipment page has a Contact us / Report "
   "issue option with KONE's contact details for your country. If anyone is trapped or in danger, call KONE's 24/7 "
   "emergency service line immediately and use the alarm button in the elevator car.")
qa("Can I raise a callout or service request in myKONE?",
   "In most countries you request service by contacting KONE through the contact details shown in myKONE. KONE then "
   "creates the work order (callout or service request), and you can follow it in myKONE under Equipment.")

# ============================================================ 5 Work orders
qa = section("Service, work orders and technician visits", "Planned, ongoing and closed service work.")
qa("What is a work order in myKONE?",
   "A work order is a piece of KONE service work on your equipment, for example planned maintenance, a callout, a "
   "repair or an inspection. In myKONE, work orders are shown as Planned, Ongoing or Closed, with their steps, "
   "technician visits, notes and service reports.")
qa("What work order types are there?",
   "Work order types in myKONE include: Planned maintenance, Predictive maintenance, Preventive check, Callout, "
   "Entrapment, Service request, Repair, Proactive breakdown response, Inspection, Inspection findings resolution, "
   "Immediate service need, Survey, Clinica and Construction time unity.")
qa("What is the difference between planned and unexpected work orders?",
   "Planned work orders are scheduled in advance: planned maintenance, predictive maintenance, inspection and "
   "inspection findings resolution. Unexpected work orders respond to an event: entrapment, callout or service "
   "request, repair and proactive breakdown response. You can choose notifications for planned only, unexpected only, "
   "or all work orders.")
qa("What is a callout?",
   "A callout is an unplanned service visit requested because there is a problem with the equipment, for example it "
   "has stopped or is not working correctly. KONE creates the work order and sends a technician.")
qa("What is an entrapment work order?",
   "An entrapment is when passengers are trapped in an elevator. KONE handles it as an urgent work order. When "
   "passengers are released, myKONE shows \"Passengers released safely\". Sometimes an entrapment is resolved "
   "remotely. In an entrapment, always call KONE's 24/7 emergency line; don't rely on the portal.")
qa("What is predictive maintenance or proactive breakdown response?",
   "With connected equipment, KONE's remote monitoring can detect issues early. Predictive maintenance tasks are "
   "scheduled for the next planned visit, before the issue affects performance. A proactive breakdown response is "
   "when KONE acts on a critical finding immediately, sometimes before you notice a problem.")
qa("What do the work order steps mean (e.g. technician assigned, on the way)?",
   "Typical work order steps: Work order created, \"Appointment created, assigning technician soon\", \"Technician "
   "assigned, planned for\" a date, Technician on the way, Technician arrived, Work in progress, Technician visit done, "
   "and Work order completed. Steps can also be paused, rescheduled, cancelled or show \"Passengers released safely\".")
qa("Why is my work order on pause or on hold?",
   "A work order or visit can be paused or on hold while waiting for something, for example: awaiting parts, a "
   "follow-up visit required, site or equipment inaccessible, or awaiting specialist support. It continues when the "
   "reason is resolved. Contact KONE if you have questions.")
qa("Why was my work order cancelled?",
   "A work order can be cancelled because the customer cancelled it, it was duplicate work, it expired, the "
   "information was not correct, it was routed to a third party, or another reason. The cancellation reason is shown "
   "on the work order when available.")
qa("Why was my equipment stopped? Where can I see the reason?",
   "Open the work order in Equipment to see its reason, for example technical failure, misuse, vandalism, building "
   "power down, door broken by accident, foreign object in the door sill, object in the elevator pit, water or weather "
   "damage, shutdown by a safety-related or seismic device, unit on fire service operation, or no fault found.")
qa("What is \"condition on arrival\" and \"condition on departure\" on a work order?",
   "These are what the technician recorded. Condition on arrival is how the equipment was when they arrived, for "
   "example running correctly, not running between floors, or doors jammed. Condition on departure is how they left "
   "it, for example \"Equipment Running - Back to Normal Operation\", \"Running but Not Finally Fixed\", \"Not Running or "
   "Still Out of Order\" or \"Equipment Secured\".")
qa("What does \"Extra cost\" on a work order mean?",
   "\"Extra cost: Yes\" means the work is not fully covered by your service contract and may be invoiced separately. "
   "\"No\" means it is covered. Contact KONE if you have questions about charges.")
qa("How do I download a service report?",
   "Open the work order under Equipment and go to Reports to download the service report. If it says \"No service "
   "reports available yet\", the report hasn't been added yet; check again later.")
qa("When is my next service visit?",
   "Open the equipment under Equipment and look at Planned services: it shows the next planned work orders and visit "
   "dates. If it says \"Nothing planned for this equipment\", there is no visit scheduled yet.")
qa("What are the work order types \"with contract\" and \"without contract\"?",
   "Planned or unplanned service orders \"with contract\" are covered by your service contract. Those \"without "
   "contract\" (w/o contract) are outside it and are usually charged separately. A Package Service Repair is a repair "
   "at a fixed price.")

# ============================================================ 6 Delivery
qa = section("Delivery of new equipment", "Following a new elevator or other equipment from order to handover.")
qa("Where can I track the delivery of my new equipment?",
   "Open Delivery (or Equipment > In delivery). Each project shows its equipment, the current milestone, expected "
   "dates, your tasks for each step, and your KONE project contacts. You can group by buildings and sort by earliest "
   "handover first or last.")
qa("What are the delivery milestones for a new elevator?",
   "For new equipment, myKONE shows these steps: 1. Order confirmation, 2. Approving drawings, 3. Starting production, "
   "4. Shipping equipment, 5. Delivering equipment to site, 6. Starting installation, 7. Completing installation, "
   "8. Completing final inspection, 9. Handing over the project, followed by Delivery complete. Some deliveries don't "
   "include the drawing approval step.")
qa("What does \"in schedule\" or \"delayed\" mean for my delivery?",
   "\"In schedule\" means the project is on track against its planned dates. \"Delayed\" or \"Milestone delayed\" / "
   "\"Milestone overdue\" means the current milestone's planned date has passed and it is not yet completed. Check "
   "your tasks for the step and contact your KONE Project Manager if you have questions.")
qa("What do I need to do at Order confirmation?",
   "Nothing yet. At Order confirmation your project has officially started. Thank you for choosing KONE!")
qa("What do I need to do at the Approving drawings step?",
   "At Approving drawings your tasks are: validate the elevator design choices, approve the drawings, and agree the "
   "installation and handover dates if they differ from those in the contract.")
qa("What do I need to do when production starts?",
   "When production starts, your tasks are: prepare the elevator shaft according to KONE's layout and safety "
   "requirements for a successful shaft survey; confirm the installation and handover dates; and make sure the site "
   "is ready by meeting the 5 key requirements.")
qa("What are the 5 key site-readiness requirements for installation?",
   "The 5 key requirements are: 1. Provide storage space near the elevator shaft and clear access to "
   "the shaft. 2. Make sure the shaft is clean and dry before installation. 3. Construct the shaft according to the "
   "KONE layout, mark the finished floor level (FFL) and seal the shaft openings for safety. 4. Make sure a three-phase "
   "power supply is available. 5. Install lifting hooks and ventilation ducts according to the KONE layout.")
qa("What do I need to do when the equipment is shipped?",
   "When the equipment is being shipped, ensure site logistics, including truck access and crane availability, as "
   "agreed with the KONE team, and make sure the site is ready by meeting the 5 key site-readiness requirements.")
qa("What do I need to do when the equipment is delivered to site?",
   "KONE is delivering your equipment to your site. Please make sure that KONE's trucks are granted access to your site.")
qa("What do I need to do during installation?",
   "When installation starts, please make sure the KONE team can work safely and efficiently within their working "
   "area. While installation is being completed, there's nothing you need to do.")
qa("What do I need to do for the final inspection?",
   "For the final inspection: make sure building works are completed to comply with regulations, if necessary; "
   "coordinate the inspection appointment with KONE; ensure uninterrupted power supply for the elevator system; make "
   "sure the building is accessible for weight testing; and if a lift attendant is required, arrange for them to be "
   "present at the test point for the key handover.")
qa("What happens at the project handover?",
   "At Handing over the project, attend the handover meeting with the KONE representative and verify the equipment "
   "conditions. After that, delivery is complete.")
qa("What happens after delivery is complete?",
   "When delivery is complete, please provide a contact person on the property side. KONE's service sales team will "
   "follow up with a service (maintenance) proposal for the equipment installed by KONE.")
qa("What happens if I don't complete my delivery tasks?",
   "Your tasks prepare the site and decisions KONE needs for the next step. If they are not done on time, the next "
   "milestone, for example installation, can be delayed. Contact your KONE Project Manager if you can't complete a task "
   "in time.")
qa("Who are my KONE project contacts for a delivery?",
   "The project's Contact section lists your KONE team, such as the KONE Project Manager, Project Administrator and "
   "Supervisor, and the site contacts. If you are not the right person or want to update your contact information, "
   "get in touch with your KONE contact.")
qa("What delivery information is shown for each equipment?",
   "For equipment in delivery myKONE shows the equipment number, type, site and address, current milestone and status, "
   "installation start and end dates, handover date, and technical details such as floors, load (kg), speed (m/s), "
   "manufacturer and year of construction.")
qa("Will I get emails about my delivery?",
   "Yes. myKONE sends delivery updates by email, for example a welcome letter when delivery starts and updates when "
   "drawings are approved, equipment is in production, ready to be shipped, delivered, installation has started or is "
   "completed, the final inspection is completed, and handover is complete. You can manage these under Profile and "
   "settings > Email notifications.")
qa("myKONE says I have no deliveries. Why?",
   "\"You have no deliveries\" means no equipment in delivery is linked to your user. Your project may not be in myKONE "
   "yet, or your access may not include deliveries. Contact your KONE Project Manager or your myKONE admin.")

# ============================================================ 7 Full replacement / Upgrade
qa = section("Full replacement and Upgrade (modernization) projects")
qa("What is an Upgrade in myKONE?",
   "Upgrade is KONE's new name for modernization: renewing existing equipment. myKONE shows Upgrade projects with "
   "their progress, milestones, your tasks, tentative downtime and project contacts, and weekly progress reports when "
   "available.")
qa("What are the steps of an Upgrade project?",
   "An Upgrade project goes through: Order confirmed (queued for production), Engineering (project setup, site "
   "details, drawings, schedule and kickoff), Equipment in production, Installation (old equipment removed and new "
   "system installed), Final inspection (code checks and functional tests), and Returning equipment to use.")
qa("What happens during the Engineering phase of an Upgrade?",
   "During Engineering, KONE sets up your project and starts the technical work: verifying site details, contacts and "
   "permits, issuing a baseline schedule and inviting you to a kickoff meeting, and finalizing drawings, wiring and code "
   "compliance. When engineering is complete, the project scope is locked in.")
qa("What are the 5 key requirements before an Upgrade installation?",
   "Your KONE Project Manager will confirm: 1. laydown area and unload plan; 2. start date, working times and quiet "
   "hours; 3. rigging and hoisting plan for equipment into the building and machine room; 4. related work "
   "subcontractors; and 5. building access or training requirements.")
qa("Will my elevator be out of service during an Upgrade?",
   "Yes. During Upgrade installation the equipment is out of service while technicians remove or refurbish old "
   "equipment and install new components. myKONE shows the tentative downtime, and KONE shares updates so tenants and "
   "staff can plan ahead.")
qa("What do \"Upgrade planned\", \"Upgrade downtime\" and \"Upgrade completed\" mean?",
   "\"Upgrade planned\" means the Upgrade is scheduled but work hasn't started. \"Upgrade downtime\" means installation "
   "is in progress and the equipment is out of service. \"Upgrade completed\" means it is ready for public use.")
qa("What is a full replacement project and what are my tasks?",
   "A full replacement replaces existing equipment with new equipment. Your tasks include: confirm the start of "
   "dismantling and handover dates; provide a loading/unloading area, storage for new material, containers, waste and "
   "tools, an access route with defined dimensions, and welfare facilities (toilet, changing rooms); and ensure site "
   "logistics such as truck access and crane availability.")
qa("What happens when the old equipment is taken out of service in a full replacement?",
   "Dismantling of the existing equipment begins and the equipment is taken out of service. Reserve and secure storage "
   "space for incoming equipment, and be aware of ongoing work: KONE personnel will try to minimize disturbances.")
qa("What happens when replaced or upgraded equipment is returned to use?",
   "Attend the handover meeting with the KONE representative. The equipment is then ready to be used by building "
   "tenants. Final documentation is shared with you, and KONE monitors performance in the first weeks, including "
   "24/7 connected services if applicable.")
qa("Who do I contact about my Upgrade project?",
   "Contact your KONE Project Manager if you have questions, notice anything unexpected or need to update your contact "
   "information. Project contacts are shown on the project in myKONE.")

# ============================================================ 8 Tenders
qa = section("Tenders and repair quotes", "Reviewing, approving, signing and rejecting tenders.")
qa("What is a tender in myKONE?",
   "A tender is a KONE offer for you to review and approve. myKONE has three tender types: Repair (a repair or "
   "proposed repair for your equipment), New equipment, and Full replacement. Open Tenders to see them.")
qa("Where do I find my tenders?",
   "Open Tenders. The Active page shows tenders waiting for your action or being updated. The Archived page shows "
   "approved, rejected and expired tenders. You can filter, sort and show only tenders assigned to you.")
qa("What does tender status \"Pending approval\" mean?",
   "\"Pending approval\" means KONE has sent you a tender to review. Open it and approve it, reject it, or request an "
   "update. Check the \"Valid until\" date: if no decision is made in time, the tender expires.")
qa("What does tender status \"Waiting for PO number\" mean?",
   "\"Waiting for PO number\" means the tender has been approved and KONE needs your Purchase Order (PO) number, for "
   "example because your contract requires it. Open the tender and choose Add PO number. KONE can't plan the work "
   "until the PO number is added.")
qa("What does tender status \"Preparing Contract\" or \"Waiting for signed tender\" mean?",
   "\"Preparing Contract\" means KONE is preparing your signed contract after approval. This should only take a moment; "
   "the contract document will appear on the tender page soon.")
qa("What does tender status \"Change requested\" mean?",
   "\"Change requested\" means you or a colleague asked KONE to update the tender. KONE is working on the update and it "
   "will soon be available for approval again.")
qa("What do tender statuses Approved, Rejected, Cancelled and Expired mean?",
   "Approved: the tender was accepted. Rejected: it was declined. Cancelled: KONE cancelled it. Expired: no decision "
   "was made before the \"Valid until\" date. These tenders are on the Archived page. If circumstances have changed, you "
   "can request to reopen an expired or rejected tender.")
qa("How do I approve a repair tender?",
   "Open the tender in Tenders and go through the steps: Review, Purchaser, Billing, Delivery and Approve. Confirm that "
   "you have read and accept the proposal including KONE's Terms and Conditions, add a PO number if needed, and choose "
   "Approve. You'll get a confirmation email.")
qa("Who can approve tenders?",
   "To approve repair tenders you need the \"Approve Repair Tenders\" or \"Approve Business Documents\" permission in "
   "myKONE. If the Approve button is missing, ask your company's myKONE admin to update your permissions.")
qa("How do I sign a tender electronically?",
   "Some tenders must be signed. When approving, either type your full name to confirm (numbers are not allowed), or an "
   "Adobe Sign window opens for your signature. Once signed, your approval is confirmed. You must have the right to "
   "sign on behalf of your company.")
qa("What is a PO number?",
   "A Purchase Order (PO) number is a unique identifier assigned by the buyer (your company) to help manage and track "
   "purchases. KONE uses it on the order and invoice.")
qa("Do I have to add a PO number?",
   "When approving, choose \"I want to add a PO number\", \"I will provide a PO number later\" or \"I don't need to add a "
   "PO number\". If your contract requires a PO, myKONE asks you to add one. If it's missing, the tender shows "
   "\"Waiting for PO number\" and a Spotlight reminds you.")
qa("How do I reject a tender?",
   "Open the tender and choose \"I want to reject this repair\". Select a reason: it's too expensive; my team or other "
   "providers will handle the repair; I decided to upgrade my equipment; I don't understand why it's needed; or other "
   "reason. You'll get a confirmation email.")
qa("Can I ask to be reminded about a repair later?",
   "Yes. If you're not ready to commit, you can reject the tender and ask KONE to remind you about the repair need in "
   "3 months, 6 months or 1 year. The price may change by then.")
qa("How do I request changes to a tender?",
   "Open the tender and choose \"Request a tender update\", then describe what you need. Other tender approvers in your "
   "team are also notified. The status becomes \"Change requested\" until KONE sends the updated tender.")
qa("How do I ask KONE a question about a tender?",
   "Open the tender and choose \"I have a question about this tender\", then write your question. KONE replies as soon "
   "as possible, and other tender approvers in your team are notified.")
qa("I'm not the right person for this tender. What do I do?",
   "Open the tender and choose \"I'm not the right person\". Choose a reason (another company is now responsible for "
   "the site; I am not responsible for this site; I am not responsible for repair tenders; other) and tell KONE who "
   "should get the tender instead, if you know.")
qa("How do I share a tender with a colleague?",
   "Open the tender and choose \"I want to share this tender\", then copy the link. Anyone with the link can view the "
   "tender, so share it only with people involved in the review. The link stops working when the tender is approved, "
   "declined or expired.")
qa("Can I upload documents to a tender?",
   "Yes. Under Additional documents you can upload billing-related documents, such as a PO document. Allowed formats "
   "are PDF, JPG, JPEG, PNG, HEIF and HEIC, up to 10 MB. Uploaded files are visible to you, KONE and other approvers, "
   "and can only be changed or deleted through KONE customer support.")
qa("Can I reopen an expired or rejected tender?",
   "Yes. Open the tender in Archived and choose Reopen, explaining what has changed. KONE reviews the request and "
   "notifies you; the previous tender is used as a reference, but terms and pricing may change.")
qa("What does the urgency on a repair tender mean?",
   "Safety issue: KONE identified a safety issue that requires immediate attention. Out of service: the equipment is "
   "out of order and the repair restores it. Your request: the tender answers an issue you raised. Urgent tenders "
   "should be reviewed by the date shown.")
qa("What happens after I approve a repair tender?",
   "KONE processes your approval and creates an order (\"Order created\"). Next, KONE schedules the repair; the service "
   "orders become visible once created. You can find the approved contract in Tenders > Archive.")
qa("What happens after I approve a new equipment tender?",
   "The next steps are: tender approved, advance payment (KONE contacts you with details), order confirmed, and then "
   "the delivery process starts and you can follow it in Delivery.")
qa("Where can I find approved tenders and contracts?",
   "Approved, rejected and expired tenders are in Tenders > Archived. You can download the tender letter and, after "
   "approval, the contract document. If it says the contract is still being processed, check again later.")
qa("What is a tender letter?",
   "The tender letter is the KONE offer document describing the work, price and terms. Open the tender and download "
   "the tender letter. If it says the tender is being processed, check back later.")
qa("Can I flag a tender?",
   "Yes. You can flag tenders to find them later using the \"My flags\" filter, and filter by tenders assigned to you, "
   "outcome, priority (urgent) and tender type.")
qa("What billing and delivery information is needed when approving a tender?",
   "When approving you may confirm the purchaser, billing information (invoicing address, billing contact, invoicing "
   "method by email or paper, tax ID and local tax numbers where required), and delivery information (delivery address "
   "and delivery contact). For delivery address changes, contact your KONE contact.")

# ============================================================ 9 Reports
qa = section("Inspection reports (third-party inspections)", "Inspection report analyses, remarks and findings.")
qa("What are inspection reports in myKONE?",
   "Reports shows inspection reports from third-party (external) inspection companies for your equipment, with KONE's "
   "analysis. Each report lists remarks (findings), their category and status, and what KONE proposes. You can "
   "download the report as a PDF.")
qa("What is a third-party inspection or 3PI?",
   "3PI means third-party inspection: a periodic inspection by an independent inspection company, often required by "
   "law. KONE receives the inspection report, analyses the remarks and shows them in myKONE under Reports.")
qa("Did KONE write the inspection remarks?",
   "No. The inspection remarks are issued directly by the inspection company and have not been written or reworded by "
   "KONE. KONE adds its analysis and proposes how to address each remark.")
qa("What are inspection remark categories?",
   "Each remark is one of: Service contract (KONE fixes it under your service contract with a work order), Repair "
   "tender (KONE sends a repair tender for you to approve), or Building owner task (the building owner must handle it). "
   "Some remarks need no further action.")
qa("What does \"Safety issue\" or \"Urgent\" mean on an inspection finding?",
   "A safety issue or urgent remark is a high-priority finding that should be addressed first. If KONE has prepared a "
   "repair tender for it, review and approve the tender quickly.")
qa("What do inspection report statuses mean?",
   "In progress: KONE is working on the remarks. Repair tender pending: a repair tender is waiting for your approval. "
   "Repair tender approved, rejected or expired: the outcome of that tender. Completed: all work under KONE's "
   "responsibility is done. Closed: no further action. \"All clear\" means no further action is required.")
qa("What does \"Repair tender pending\" mean on a finding?",
   "KONE has created a repair tender for this finding and it's waiting for your approval. Open it from the finding or "
   "from Tenders.")
qa("What are Active and Closed inspection findings?",
   "Inspection findings has two tabs: Active shows remarks still being handled, and Closed shows remarks that are "
   "completed or need no further action. You can filter by site and status.")
qa("My inspection report has no remarks. Do I need to do anything?",
   "No. If KONE's review found no remarks requiring follow-up from KONE or the building manager, no action is needed "
   "and the equipment is in order.")
qa("How do I download an inspection report?",
   "Open the report under Reports and choose Download report (pdf). The PDF reflects statuses at the time you download "
   "it.")
qa("Will I be notified when an inspection report is ready?",
   "Yes. You'll get an email when an inspection report analysis is ready in myKONE. You can choose which sites you're "
   "notified for under Profile and settings > Email notifications > Reports.")
qa("Can KONE fix all the inspection findings?",
   "Remarks under your service contract are fixed by KONE with a work order. For repair-tender remarks KONE sends a "
   "tender. Building owner tasks are your responsibility, but you can ask your KONE contact whether KONE can help.")

# ============================================================ 10 Invoices
qa = section("Invoices")
qa("Where can I see my KONE invoices?",
   "Open Invoices to see your invoices with invoice number, type, site, amount, due date and status. You can search, "
   "filter, sort, open the details and download the PDF.")
qa("Why can't I see the Invoices page?",
   "Invoices are only shown to users with the \"View Invoices\" permission, and only if your company has invoices "
   "available in myKONE. Ask your company's myKONE admin to give you the permission.")
qa("What do invoice statuses mean?",
   "Open: issued and not yet paid, not past due. Overdue: the due date has passed and it isn't paid. Paid: fully paid. "
   "Cancelled: cancelled and not payable. \"Unpaid\" and \"Overdue\" indicators highlight invoices that need attention.")
qa("What types of invoices are there?",
   "Invoice types include: Maintenance invoice, Tendered repair invoice (for a repair tender you approved), Non quoted "
   "repair invoice (repair without a tender) and Credit memo (a credit to your account).")
qa("How do I download an invoice?",
   "Open Invoices, open the invoice and choose Download invoice (pdf), or use Download in the list. If the PDF is not "
   "available or can't be requested for your country, contact KONE.")
qa("I already paid but the invoice still shows unpaid. Why?",
   "Bank transfers can take a few days to show in myKONE. If the invoice still isn't marked Paid after that, contact "
   "KONE with the invoice number.")
qa("How do I filter or sort invoices?",
   "Filter by status, type, and issued within the last 30 days, 3, 6 or 12 months. Sort by due date, amount or type "
   "name, or search by invoice number.")
qa("What details are shown on an invoice?",
   "Invoice details include amount, tax, paid amount, issued date, due date, terms of payment, PO number, service order "
   "number, site and address.")
qa("I have a question about an invoice or think it's wrong. What do I do?",
   "Open the invoice and choose \"I have a question about this invoice\", which opens KONE's contact page "
   "(https://www.kone.com/global/en/contact-us.html). Include the invoice number.")
qa("Can I pay my invoice in myKONE?",
   "No. myKONE lets you view and download invoices. Pay using the payment details on the invoice.")

# ============================================================ 11 Team
qa = section("My team: users, roles and permissions", "Managing your company's myKONE users.")
qa("How do I add a new user to my company's myKONE account?",
   "If you are an admin or have Manage Team permission: open My team, choose Add new member / Create myKONE user, and "
   "go through Information (name, email, phone, position, language), Role (and permissions), Sites (site visibility) "
   "and Review. Choose Confirm to create the user and send a welcome email.")
qa("I'm not an admin. Can I request a new user?",
   "Yes, if your role allows it you can submit a member request. It goes to your company's admin; once they confirm, "
   "the new user gets an email with onboarding instructions. Pending requests are under My team > Invitations.")
qa("What roles are there in myKONE?",
   "myKONE has three roles: Admin, Business user and Basic user. Admins manage the team and see all sites. Business "
   "users and basic users get access according to their permissions and site visibility.")
qa("What permissions are there in myKONE?",
   "Permissions include: View Operational Information (equipment status and delivery milestones), View Commercial "
   "Information (contracts and tenders), View Invoices, Approve Repair Tenders, Approve Business Documents (service "
   "contracts and repair tenders), and Manage Team. Some, such as Approve NBS Tenders, View Project Deliveries and "
   "Modify Elevator Content, are coming soon.")
qa("What is site visibility?",
   "Site visibility defines which sites, and their equipment and services, a user can see: \"Access to all\" or "
   "\"Selected only\" (up to 50 sites). With access to all, new sites become visible automatically; with selected "
   "sites, new sites must be added manually.")
qa("Do site restrictions apply to tenders?",
   "No. Site restrictions apply only to equipment and services, not to tenders. Also, when a user gets permission to "
   "manage users or approve, their site restrictions are removed; admins and business users with Manage Team "
   "permission always see all sites.")
qa("How do I change a user's role or permissions?",
   "In My team, open the user and choose Edit role or permissions, then select the role and any additional "
   "permissions. Only admins can edit users, and you can't edit your own role or permissions.")
qa("How do I remove a user from myKONE?",
   "In My team, open the user and choose Remove access from myKONE. This can't be undone. Only admins can remove users, "
   "and you can't remove your own account.")
qa("How do I resend a user's invitation email?",
   "In My team, open the user and choose Resend invitation. If myKONE says the invitation email was not sent, try "
   "again later from the user's profile.")
qa("What does it mean that a user's role is synced with KONE Online?",
   "Some users were created in KONE Online. Their role, permissions or site visibility may be synced from KONE Online "
   "portfolio settings. To manage them only in myKONE, choose Edit and unlink from KONE Online; changes then only "
   "affect myKONE.")
qa("Why does a user's access say it's blocked by KONE Online portfolio settings?",
   "Equipment visibility is restricted by KONE Online portfolio settings. To enable access, choose Edit site "
   "selections and select access to all sites, or remove the restrictions in KONE Online.")
qa("Can I import many users at once?",
   "Where enabled, admins can import users by uploading a CSV file under User import. myKONE validates the file, runs "
   "the import and shows a report with imported, skipped and failed rows.")
qa("Why can't I use My team?",
   "My team is available to admins and users with Manage Team permission, and currently only for customers with an "
   "active KONE maintenance contract. Ask your company's myKONE admin or KONE if you need access.")

# ============================================================ 12 Profile & notifications
qa = section("Profile, settings and notifications")
qa("How do I change my name, phone number or position?",
   "Open Profile and settings and choose Edit personal information. Enter phone numbers in international format, for "
   "example +358401234567. First name can be up to 40 characters and last name up to 80.")
qa("How do I change my login email address?",
   "Open Profile and settings and choose Edit email address. myKONE sends a 6-digit verification code to your current "
   "email and then to your new email; enter both codes. After the change you are logged out and sign in again with "
   "your new email. The new email must not already be in use.")
qa("My verification code doesn't work. What should I do?",
   "Codes are 6 digits and expire after a short time. If the code is invalid, expired or already used, or after too "
   "many failed attempts, request a new code with Resend code. Use the same email address you started with.")
qa("How do I change my myKONE language?",
   "Open Profile and settings and choose your preferred language. myKONE and its emails use it where available.")
qa("Where can I see my role, permissions and sites?",
   "Profile and settings shows your role and permissions and your site visibility, for example \"You have access to "
   "all sites\" or the list of sites you can see.")
qa("Which email notifications can I get from myKONE?",
   "You can choose notifications for: equipment out of service and back in operation; work orders created, in "
   "progress and completed (all, planned only or unexpected only); equipment health summary (monthly or quarterly, for "
   "24/7 connected equipment); new equipment ordered and delivery updates; Upgrade updates; and inspection report "
   "analyses.")
qa("How do I change or stop email notifications?",
   "Open Profile and settings > Email notifications. Turn notifications on or off per topic, choose which equipment or "
   "sites they cover, and save. Notification emails also have a link to adjust your preferences.")
qa("What is the equipment health summary email?",
   "It's a single monthly or quarterly email covering remote monitoring of all your 24/7 connected equipment: units "
   "monitored, early signals flagged, early interventions and predictive maintenance tasks scheduled, and planned "
   "maintenance.")
qa("How do I manage cookie preferences?",
   "Choose Cookie Preferences in Profile and settings or at the bottom of the portal.")

# ============================================================ 13 Customization
qa = section("Customization of elevator screens")
qa("What is Customization in myKONE?",
   "Customization lets you personalize compatible KONE devices in your building: images and content on elevator "
   "screens and call panels, and in some cases car lighting color. It needs compatible devices and the Modify Elevator "
   "Content permission.")
qa("How many images can I add to elevator screens?",
   "You can add up to 10 images per screen in PNG or JPEG format at the size shown. You can add images on top of "
   "existing content (max 10 in total) or override existing content, which replaces all current images permanently.")
qa("How do I publish content to elevator screens?",
   "In Customization, select the elevators or call panels, add and crop your images, reorder them, preview, and "
   "choose Publish. Screens with the same content can be managed together. If publishing fails on some devices, try "
   "again.")
qa("What content rules apply to elevator screens?",
   "What you share is public. Align content with your building guidelines, keep it short and easy to read, be kind and "
   "don't offend, and don't show pictures of individuals or other personal data. KONE may remove content that "
   "violates the Terms of Use.")
qa("Why does Customization say no compatible devices were found?",
   "Your elevators don't have KONE devices that can be customized. For more information, visit kone.com or contact KONE.")

# ============================================================ 14 EU Data Act
qa = section("EU Data Act data requests")
qa("What is the EU Data Act in myKONE?",
   "The EU Data Act is an EU regulation that gives you the right to request data about your equipment from KONE. In "
   "myKONE, EU Data Act lets you request data for connected KONE equipment with an active service contract in EU "
   "countries.")
qa("How do I request EU Data Act data?",
   "Open EU Data Act and choose Request data. Select up to 20 equipment, add up to 5 extra recipient email addresses "
   "if needed, review and send the request. KONE prepares the data, which can take a few days.")
qa("How do I download my EU Data Act data?",
   "You'll get an email with a download link, valid for 5 days. Choose \"Access the data\"; KONE sends a one-time code "
   "to your email, valid for 10 minutes. Enter it to download. If the file is empty, KONE has no EU Data Act data for "
   "the selected equipment. Check your spam folder if the email doesn't arrive.")
qa("My EU Data Act download link doesn't work. What should I do?",
   "The link may have expired after 5 days. The original requester needs to request the data again.")

# ============================================================ 15 Privacy & terms
qa = section("Privacy, terms of use and data")
qa("What personal data does myKONE collect?",
   "myKONE may collect your name, title, user ID, email and other addresses, mobile phone number, information from "
   "KONE systems, the time and date of requests, and analytics on how you use the portal. It's integrated with KONE's "
   "CRM, which is used to identify you.")
qa("Why does KONE process my personal data in myKONE?",
   "KONE processes personal data based on its legitimate interest to make the portal work, analyse how it's used and "
   "fix defects. It isn't shared with third parties except contracted sub-processors. You can review your data and ask "
   "for corrections by contacting KONE. See https://www.kone.com/en/privacy-statement.aspx.")
qa("Is the information in myKONE guaranteed to be accurate?",
   "KONE makes reasonable efforts to ensure information is correct, but per the Terms of Use, information in myKONE is "
   "indicative and based on data available at the time. For contractual or safety-critical decisions, confirm with "
   "your KONE contact.")
qa("Which law governs the myKONE Terms of Use?",
   "The Terms of Use are governed by the laws of the country where the equipment is located. For buildings in the USA, "
   "the laws of Illinois apply; in Canada, the laws of Ontario.")

# ============================================================ 16 Contact & safety
qa = section("Contacting KONE, emergencies and safety")
qa("Someone is trapped in an elevator. What should I do?",
   "Call KONE's 24/7 emergency service line immediately. If you are inside the car, press the alarm button and stay "
   "calm; don't try to open the doors or climb out. Don't use the portal or chat for emergencies.")
qa("How do I contact KONE?",
   "Use the contact details for your country in myKONE (Contact us on the Equipment, Tenders and Reports pages), "
   "contact your KONE contact or Project Manager, or use https://www.kone.com/global/en/contact-us.html.")
qa("Who is my KONE contact?",
   "For deliveries and Upgrades, your KONE Project Manager and team are listed in the project's Contacts. For tenders, "
   "\"Your KONE contact\" is shown on the tender. For service, use the contact details on the Equipment page.")
qa("Can I contact KONE on WhatsApp?",
   "In some countries, tenders and KONE emails include a \"Chat on WhatsApp\" option. Where available, it's shown on "
   "the tender or in the email.")

# ============================================================ 17 Assistant
qa = section("About the myKONE Assistant (chatbot)")
qa("What can the myKONE Assistant help with?",
   "The myKONE Assistant answers questions about using myKONE and what statuses mean, and, where connected, about your "
   "own delivery projects, equipment, tenders, inspection reports and invoices. It can create a request for a KONE "
   "specialist or connect you to one.")
qa("What can't the myKONE Assistant do?",
   "The Assistant can't handle emergencies; call KONE's 24/7 line. It can't approve, sign or reject tenders, pay "
   "invoices or change users for you; it points you to the right myKONE page. It only shows data your myKONE access "
   "allows, and won't guess when unsure.")
qa("How do I talk to a person at KONE through the Assistant?",
   "Type \"talk to KONE\" or \"specialist\". The Assistant asks a few details, creates a request with the conversation, "
   "and connects you to a KONE specialist if one is available; otherwise KONE replies by email.")
qa("How do I go back to the Assistant's main menu?",
   "Type \"start\" at any time to return to the main menu.")
