# Stakeholder interview notes — "ShiftSwap" (internal shift-scheduling tool)

Date: rough notes from 3 calls + a shadow session. Unstructured, cleaned up a little.

## Call 1 — Ops Manager (Priya)
- Problem: retail store managers spend ~6 hrs/week building staff schedules in spreadsheets and then handling swap requests over WhatsApp/text. Messy, errors, people show up wrong shifts.
- ~120 stores, 8-25 staff each. Managers are NOT technical. Half are on mobile only.
- Wants: managers create a weekly schedule, publish it, staff can request to swap shifts, manager approves/denies. Auto-check that the swap doesn't break coverage or overtime rules.
- "If it saves me even 2 hours a week I'll fight to get budget for it."

## Call 2 — Store staff (Marcus, part-timer)
- Just wants to see his schedule on his phone, get notified when it changes, and swap a shift with a coworker without texting the manager.
- Pain: finds out about schedule changes too late. Once drove in on his day off.

## Call 3 — Regional Director (Sam) — the budget owner
- Cares about: labor cost control, overtime compliance, and visibility across stores.
- Constraints he stated: must work on mobile, launch in the US first, no biometric/KYC stuff, budget is tight (early stage), wants something live in ~2 months for a pilot of 10 stores.
- Integrations he mentioned: they already use BambooHR for employees, and they'd love it to eventually push approved hours to their payroll (ADP) but that's "phase 2, not a blocker."
- Auth: company emails exist but a lot of part-timers don't check email. Maybe phone-based login.

## Shadow session notes (watching Priya build a schedule)
- Copies last week's spreadsheet, edits names into time slots.
- Tracks who's available in a separate WhatsApp group.
- Manually checks nobody goes over 40 hrs.
- Swap requests come in as texts; she edits the sheet and re-sends a screenshot.
- Biggest frustration: no record of who agreed to what. Disputes later.

## Misc / open questions
- Do we need manager approval on every swap or auto-approve if rules pass? (Priya: approval, at least at first.)
- Reporting? Sam wants a weekly labor-cost summary per store.
- Tech: team is one full-stack dev + me (PM). Want to keep it simple. Probably web app, mobile-friendly.
- No hard deadline beyond Sam's "2 months for a pilot."
