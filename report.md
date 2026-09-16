# Amusement Park Workforce Scheduling & Attendance Management System

## 1. Project Overview

The project is a web application designed specifically for managing the **workforce scheduling and attendance of an amusement park**.

The application focuses on two main operational functions:

1. **Weekly workforce scheduling**
2. **Weekly attendance management**

The goal is to replace manual paper/Excel-based organization with a centralized system where management can prepare weekly schedules, assign workers to different working places, manage attendance, export documents, and control schedule modifications through a GRH authorization workflow.

The system is **not intended to be a complete HR platform**. Its main purpose is to manage the park's weekly schedule and attendance while providing the necessary user, working-place, authorization, and historical-data management around those two functions.

---

# 2. Main Objectives

The application should allow the amusement park to:

* Create and manage weekly employee schedules.
* Assign employees to working places using customizable codes.
* Display the complete weekly schedule to workers.
* Define park opening/working hours for each day.
* Manage weekly employee attendance.
* Track four attendance statuses:

  * Present
  * Late
  * Absent
  * Day Off
* Allow management to prepare the following week's schedule.
* Copy a previous schedule to simplify preparation.
* Lock schedules after they are officially sent to GRH.
* Require GRH authorization before a submitted schedule can be modified.
* Automatically lock the schedule again after it is resubmitted.
* Preserve historical schedules and attendance.
* Export schedules and attendance to PDF and Excel.
* Manage employees and their accounts according to their roles.
* Create custom working-place codes.
* Keep historical schedules unchanged when working-place codes are later edited or deleted.

---

# 3. User Roles

The system contains six roles:

1. GRH
2. Manager
3. Admin
4. Supervisor
5. Operator
6. Operator Pilot

The organizational hierarchy is:

**GRH → Manager → Admin → Supervisor → Operator / Operator Pilot**

Manager and Admin have similar operational permissions, but **Manager is higher in the organizational hierarchy**.

---

# 4. GRH

There is exactly **one GRH account**.

GRH's main purpose in the application is to control authorization for modifications to schedules that have already been officially submitted.

## GRH responsibilities

GRH can:

* Log into the system.
* Manage accounts according to the defined hierarchy.
* Create Admin accounts.
* Create Supervisor accounts.
* Suspend Admin accounts.
* Reactivate Admin accounts.
* Delete Admin accounts.
* Suspend Supervisor accounts.
* Reactivate Supervisor accounts.
* Delete Supervisor accounts.
* Authorize requests to reopen submitted schedules for modification.

GRH does **not** need to approve every individual schedule modification.

Instead, GRH authorizes access to the submitted schedule.

For example:

> Supervisor requests modification → GRH authorizes → schedule becomes editable → Admin/Supervisor/Manager makes changes → schedule is submitted again → schedule locks automatically.

GRH does not manage working-place codes.

---

# 5. Manager

Manager is a higher organizational role than Admin.

However, for the main operational functions, Manager and Admin have essentially the same permissions.

Manager can:

* Manage workers.
* Manage Admin accounts.
* Manage Supervisor accounts.
* Manage Operator accounts.
* Manage Operator Pilot accounts.
* Manage schedules.
* Manage attendance.
* Create working-place codes.
* Edit working-place codes.
* Delete working-place codes.
* Change park working hours before submission.
* Request GRH authorization for modifications after submission.
* Export schedules to PDF.
* Export schedules to Excel.
* Export attendance to PDF.
* Export attendance to Excel.

## Important

Manager does **not appear in the weekly schedule**.

The schedule is intended to represent employees who are actually part of the park's operational workforce.

---

# 6. Admin

Admin is an operational management role.

Admin has the same main operational permissions as Manager, although Manager is higher in the organizational hierarchy.

Admin can:

* Manage workers.
* Manage schedules.
* Manage attendance.
* Create working-place codes.
* Edit working-place codes.
* Delete working-place codes.
* Define park working hours.
* Prepare the current schedule.
* Prepare the next week's schedule.
* Copy previous schedules.
* Export schedules.
* Export attendance.
* Request GRH authorization for modifications.
* Manage worker accounts and passwords.

## Admin in the schedule

Unlike Manager, **Admin appears in the weekly schedule**.

Admin does not automatically receive a working-place code.

When necessary, management can assign a suitable code such as:

`RES PARK`

The code is manually selected like other working-place codes.

---

# 7. Supervisor

There can be multiple Supervisor accounts.

All Supervisors have the same permissions.

Supervisor can:

* Manage Operator accounts.
* Manage Operator Pilot accounts.
* Manage worker information.
* Manage schedules.
* Manage attendance.
* Create working-place codes.
* Edit working-place codes.
* Delete working-place codes.
* Define/change park working hours before schedule submission.
* Copy previous schedules.
* Export schedules.
* Export attendance.
* Request GRH authorization for modifications after submission.
* Manage worker passwords.

## Supervisor's role in the park

Supervisor can act as a **Chef de Zone**, but this does not mean that a Supervisor is restricted to one specific working place.

A Supervisor can also work at attractions.

Therefore, the system should **not automatically assign a working place based on the Supervisor role**.

The working place is manually selected in the schedule.

---

# 8. Operator

Operators are normal operational employees.

Operators can:

* Log into the application.
* View the weekly schedule.
* View previous schedules.
* View employee names.
* View employee roles.
* View working-place codes.
* View park working hours.
* Log out.

Operators **cannot**:

* Edit schedules.
* Create schedules.
* Modify attendance.
* Create working-place codes.
* Delete working-place codes.
* Modify park working hours.
* Manage other accounts.

---

# 9. Operator Pilot

Operator Pilot has the same general viewing permissions as Operator.

They can:

* Log in.
* View the complete weekly schedule.
* View employee names.
* View employee roles.
* View working-place assignments.
* View park working hours.
* View previous schedules.
* Log out.

They cannot modify the schedule or attendance.

---

# 10. Login System

There is one common login page.

The user enters their credentials.

The system automatically identifies the user's role and sends them to the appropriate interface.

For example:

```text
Login
  ↓
System identifies role
  ↓
┌───────────────┐
│ GRH           │
│ Manager       │
│ Admin         │
│ Supervisor    │
│ Operator      │
│ OperatorPilot │
└───────────────┘
  ↓
Appropriate interface
```

Every user has a logout function.

The existing project requirement for password management is maintained:

* Management can manage worker passwords.
* The previously discussed password-security redesign is **not applied** to this project specification.

---

# 11. Account Management

The system supports:

* Account creation.
* Account editing.
* Account suspension.
* Account reactivation.
* Account deletion.

However, historical information must remain available even if an employee is removed from active accounts.

For example:

If Operator Ahmed leaves the park:

```text
Ahmed account → inactive/deleted
```

His historical schedules and attendance remain available.

This is important because historical reports must not disappear when an employee leaves the system.

---

# 12. Suspension

Suspension is different from deleting an account.

When an account is suspended:

* The employee cannot log in.
* The employee's historical data remains.
* The account can later be reactivated.

Example:

```text
ACTIVE
   ↓
SUSPENDED
   ↓
REACTIVATED
```

---

# 13. Weekly Schedule

The schedule is the **main page and main function of the application**.

There is no separate dashboard.

After logging in, management users should go directly to the schedule.

The schedule is organized from:

**Monday → Sunday**

The basic layout is:

| Employee | Role | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday |
| -------- | ---- | ------ | ------- | --------- | -------- | ------ | -------- | ------ |

Each employee has one row.

---

# 14. Employees Appearing in the Schedule

The schedule includes:

* Admin
* Supervisor
* Operator
* Operator Pilot

The schedule does **not** include:

* Manager
* GRH

The Manager is deliberately excluded because the Manager is a higher management role rather than part of the operational workforce represented by the schedule.

---

# 15. Full Schedule Visibility

Operators and Operator Pilots do not see only their personal schedule.

They can see the **complete weekly schedule**.

They can see:

* Employee names.
* Employee roles.
* Working-place codes.
* Park working hours.

For example:

| Employee | Role           | Monday   | Tuesday  |
| -------- | -------------- | -------- | -------- |
| Ahmed    | Operator       | RR       | FR       |
| Mohamed  | Operator Pilot | CAR      | RR       |
| Sami     | Supervisor     | CZ       | RR       |
| Ali      | Admin          | RES PARK | RES PARK |

This gives workers a complete picture of who is working where.

---

# 16. Park Working Hours

The system contains one common park working period for each day.

Working hours belong to the **park**, not individual employees.

Different days can have different hours.

Example:

| Day       | Park Hours  |
| --------- | ----------- |
| Monday    | 10:00–18:00 |
| Tuesday   | 10:00–18:00 |
| Wednesday | 12:00–20:00 |
| Thursday  | 10:00–18:00 |
| Friday    | 14:00–22:00 |
| Saturday  | 10:00–22:00 |
| Sunday    | 10:00–20:00 |

Workers can see these hours.

Before the schedule is submitted to GRH:

* Manager can modify them.
* Admin can modify them.
* Supervisor can modify them.

After submission, changing them requires GRH authorization to reopen the schedule.

There is no separate history system specifically for park-hour changes.

---

# 17. Working-Place Codes

Working-place codes are completely customizable.

There is **no fixed predefined list**.

Manager, Admin, and Supervisor can create any code they want.

For example:

```text
RR
FR
CAR
RVR
CZ
RES PARK
OFF
ZONE-A
ZONE-B
```

The system does not need to know the exact meaning of the code.

The code is simply an available scheduling choice.

---

# 18. Creating a Working-Place Code

Manager/Admin/Supervisor selects:

**Create Working-Place Code**

They enter something such as:

```text
RR
```

After saving it:

```text
RR
```

immediately becomes an available choice when creating or editing a schedule.

For example:

```text
Monday → [RR ▼]
```

The dropdown can contain all currently available codes.

There is no requirement to create a description or full name for the code.

---

# 19. Duplicate Codes

The system should not impose complicated restrictions on the meaning of codes.

Management is allowed to create whatever code they want.

The system therefore should not attempt to decide whether a code "makes sense."

---

# 20. Multiple Codes in One Schedule Cell

A schedule cell can contain multiple working-place codes.

Example:

```text
RR/FR
```

So the schedule can contain:

| Employee | Monday | Tuesday |
| -------- | ------ | ------- |
| Ahmed    | RR     | RR/FR   |

This allows management to represent situations where an employee has multiple assignments or responsibilities.

---

# 21. Editing Working-Place Codes

Suppose the existing code is:

```text
RR
```

Management changes it to:

```text
RVR
```

The new code is available for future/new schedules.

However, historical schedules keep:

```text
RR
```

They must not automatically change to `RVR`.

This protects historical accuracy.

---

# 22. Deleting Working-Place Codes

If management deletes:

```text
RR
```

then:

* `RR` disappears from the list of choices for new schedules.
* Existing historical schedules that used `RR` continue displaying `RR`.

Therefore, deleting a code does not destroy historical information.

---

# 23. Current, Previous and Next Weeks

The system uses real calendar weeks.

Each week is:

**Monday → Sunday**

The schedule interface provides:

* Previous Week
* Current Week
* Next Week

Example:

```text
Previous:
7 September → 13 September

Current:
14 September → 20 September

Next:
21 September → 27 September
```

Users cannot access schedules further into the future.

---

# 24. Previous Week

Previous weeks are:

**Read-only.**

Nobody can modify them through the normal interface.

They remain available for:

* Consultation.
* Historical reference.
* PDF export.
* Excel export.
* Attendance reference.

---

# 25. Current Week

The current week is the active operational schedule.

Before submission to GRH, authorized management users can modify it.

They can change:

* Employees' working-place assignments.
* Codes.
* Park hours.
* Other schedule information.

Once officially submitted to GRH, the schedule becomes locked.

---

# 26. Next Week

The next week can be prepared in advance.

Management can:

* Create the next week's schedule.
* Modify it.
* Assign working places.
* Define working hours.
* Copy the previous week's schedule.

The next week is editable because it is being prepared.

---

# 27. Further Future Weeks

Users cannot prepare schedules indefinitely into the future.

The system only exposes:

```text
Previous
Current
Next
```

Further future weeks are not accessible through the schedule system.

This keeps the system simple and focused on operational planning.

---

# 28. Copy Previous Week

The system provides a:

**Copy Previous Week**

function.

For example:

```text
Week 37
↓
Copy
↓
Week 38
```

The system copies the previous schedule structure into the new week.

Management can then modify the differences instead of rebuilding the entire schedule.

This is especially useful when employees frequently keep similar assignments from one week to another.

---

# 29. Automatic Week Transition

The system automatically understands which week is current.

When the new week begins, the previous next-week schedule becomes the current week's schedule.

Example:

Before Monday:

```text
Current → 14–20 September
Next → 21–27 September
```

When Monday 21 September arrives:

```text
Previous → 14–20 September
Current → 21–27 September
```

The new current week follows the normal workflow.

---

# 30. Schedule Editing Permissions

Before submission:

### Manager

Can edit.

### Admin

Can edit.

### Supervisor

Can edit.

### Operator

Read-only.

### Operator Pilot

Read-only.

### GRH

Authorization role.

---

# 31. Schedule Submission to GRH

When the schedule is finished, management can select:

**Send to GRH**

The schedule then becomes officially submitted.

Its status becomes:

```text
SUBMITTED / LOCKED
```

After that:

* Manager cannot edit.
* Admin cannot edit.
* Supervisor cannot edit.
* Operators remain read-only.
* Operator Pilots remain read-only.

---

# 32. Modification After Submission

If a change is necessary after the schedule has been submitted, management cannot directly edit it.

Instead:

```text
Manager/Admin/Supervisor
        ↓
Request Modification
        ↓
GRH
        ↓
Authorize
        ↓
Schedule becomes editable
```

GRH is authorizing the **opening of the schedule for modification**, not approving every individual modification.

---

# 33. Modification Authorization

Once GRH authorizes the modification:

```text
LOCKED
   ↓
GRH AUTHORIZED
   ↓
EDITABLE
```

Manager/Admin/Supervisor can then make the necessary changes.

They can modify any necessary part of the schedule, including:

* Employee assignments.
* Working-place codes.
* Park hours.
* Other schedule information.

---

# 34. Resubmission

Once the changes are complete:

**Send to GRH**

is used again.

The schedule automatically becomes:

```text
LOCKED
```

again.

Therefore, the complete workflow is:

```text
DRAFT
   ↓
EDIT
   ↓
SEND TO GRH
   ↓
LOCKED
   ↓
IF CHANGE IS REQUIRED
   ↓
REQUEST MODIFICATION
   ↓
GRH AUTHORIZES
   ↓
EDITABLE
   ↓
MAKE CHANGES
   ↓
SEND TO GRH
   ↓
LOCKED AGAIN
```

---

# 35. Modification History

The system keeps a basic history for modification authorization.

It can record:

* Who requested modification.
* Date/time of request.
* Who authorized it.
* Date/time of authorization.
* Status.

The system does not need to create a separate detailed history for every park-hour modification.

---

# 36. Attendance Module

Attendance is the second major module.

Attendance is also organized by:

**Monday → Sunday**

The attendance table uses the same employees managed by the system.

Example:

| Employee | Role           | Monday  | Tuesday | Wednesday |
| -------- | -------------- | ------- | ------- | --------- |
| Ahmed    | Operator       | Present | Late    | Day Off   |
| Mohamed  | Operator Pilot | Present | Present | Absent    |
| Sami     | Supervisor     | Present | Present | Present   |
| Ali      | Admin          | Present | Day Off | Present   |

---

# 37. Attendance Statuses

There are exactly four attendance statuses:

### Present

The employee worked normally.

### Late

The employee worked but was marked late.

No arrival time is required.

### Absent

The employee was scheduled to work but did not attend.

### Day Off

The employee was not required to work.

---

# 38. Attendance Management

Attendance can be managed by:

* Manager
* Admin
* Supervisor

Operators and Operator Pilots do not manage attendance.

They do not have access to modify attendance.

---

# 39. Attendance and Schedule Relationship

Attendance is linked to the weekly schedule.

The schedule determines whether an employee is expected to work.

Recommended behavior:

```text
Scheduled working assignment
        ↓
Attendance required
```

If the schedule contains:

```text
OFF
```

then the attendance status automatically becomes:

```text
Day Off
```

Example:

| Employee | Schedule | Attendance |
| -------- | -------- | ---------- |
| Ahmed    | RR       | Present    |
| Mohamed  | FR       | Late       |
| Ali      | OFF      | Day Off    |

---

# 40. OFF Code

`OFF` can be created by management like any other working-place code.

It is not a mandatory system code.

For example, management can create:

```text
OFF
```

and then use it in the schedule.

If `OFF` is used, the corresponding attendance can automatically be:

**Day Off**.

---

# 41. Attendance Does Not Automatically Mean Absent

An employee should not automatically be marked absent simply because they are not working.

The schedule determines whether they were expected to work.

For example:

```text
Schedule = OFF
→ Day Off
```

Whereas:

```text
Schedule = RR
→ employee is expected to work
→ Present / Late / Absent
```

This prevents false absence records.

---

# 42. Attendance Historical Data

Historical attendance remains available.

If an employee is later:

* Suspended
* Deactivated
* Deleted

their previous attendance records remain.

This is important for historical reports.

---

# 43. Schedule Export

Management can export schedules in:

### PDF

Useful for:

* Printing.
* Sending to GRH.
* Sharing the official weekly schedule.

### Excel (.xlsx)

Useful for:

* Further analysis.
* Archiving.
* Editing externally when necessary.
* Administrative use.

---

# 44. Attendance Export

Attendance can also be exported in:

### PDF

and

### Excel (.xlsx)

This allows management to generate weekly attendance reports.

---

# 45. No Separate Dashboard

The application does **not** need a traditional dashboard.

After login, management users should arrive directly at the schedule.

The schedule is the central interface.

Navigation can contain:

```text
Schedule
Attendance
Employees / Accounts
Working-Place Codes
Exports
Logout
```

The exact navigation shown depends on the user's role.

---

# 46. Suggested Management Interface

For Manager/Admin/Supervisor:

```text
┌─────────────────────────────────────────────┐
│ Amusement Park System              Logout   │
├─────────────────────────────────────────────┤
│                                             │
│ Schedule                                    │
│                                             │
│ [Previous Week] [Current Week] [Next Week] │
│                                             │
│ 14 Sep → 20 Sep 2026                       │
│                                             │
│ Employee | Role | Mon | Tue | Wed | ...    │
│                                             │
│ Ahmed    | OP   | RR  | FR  | OFF | ...    │
│ Mohamed  | OP   | CAR | RR  | FR  | ...    │
│ Sami     | SUP  | CZ  | RR  | CAR | ...    │
│ Ali      | ADM  | RES | RES | RR  | ...    │
│                                             │
│ Park Hours:                                 │
│ Mon 10:00–18:00                             │
│ Tue 10:00–18:00                             │
│ ...                                         │
│                                             │
│ [Copy Previous Week]                        │
│ [Send to GRH]                               │
│ [Export PDF] [Export Excel]                 │
└─────────────────────────────────────────────┘
```

---

# 47. Operator Interface

Operators have a simpler read-only interface.

Example:

```text
Schedule
──────────────

Current Week
14 → 20 September

Employee | Role | Mon | Tue | Wed | ...
Ahmed    | OP   | RR  | FR  | OFF
Mohamed  | OP   | CAR | RR  | FR
Sami     | SUP  | CZ  | RR  | CAR
Ali      | ADM  | RES | RES | RR

Park Hours
Mon: 10:00–18:00
Tue: 10:00–18:00
...
```

No edit controls are shown.

---

# 48. Working-Place Code Management Interface

Management can have a simple code-management page:

```text
Working-Place Codes

[+ Create Code]

Code
────────────
RR       [Edit] [Delete]
FR       [Edit] [Delete]
CAR      [Edit] [Delete]
RVR      [Edit] [Delete]
RES PARK [Edit] [Delete]
OFF      [Edit] [Delete]
```

When a new code is created, it immediately becomes selectable in the schedule.

---

# 49. Core Database Concepts

The application will need several main entities.

### Users

Stores:

* User ID
* Name
* Username/email
* Password
* Role
* Account status
* Creation date
* Other necessary account information

### Working Place Codes

Stores:

* Code ID
* Code
* Status
* Creation date
* Modification date

### Weekly Schedules

Stores:

* Schedule ID
* Week start date
* Week end date
* Status
* Submission information
* Modification authorization information

### Schedule Assignments

Stores:

* Schedule ID
* Employee ID
* Day
* Working-place assignment

The assignment can contain multiple codes such as:

`RR/FR`

### Attendance

Stores:

* Employee ID
* Week
* Day
* Attendance status

### Modification Requests

Stores:

* Request ID
* Schedule ID
* Requested by
* Request date
* Authorization status
* Authorized by
* Authorization date

---

# 50. Important Historical Data Rule

The system must preserve historical information.

For example:

September schedule:

```text
Ahmed → RR
```

Later:

```text
RR → RVR
```

October schedule:

```text
Ahmed → RVR
```

September must still show:

```text
Ahmed → RR
```

Likewise, if `RR` is deleted, September still displays `RR`.

This principle applies to:

* Employees.
* Schedules.
* Attendance.
* Working-place codes.

Historical records should remain understandable even after current data changes.

---

# 51. Final Permission Structure

## GRH

**Account/authorization role**

* Manage Admins.
* Manage Supervisors.
* Manage accounts according to hierarchy.
* Authorize schedule modification access.

## Manager

**Highest operational management role**

* Manage Admins.
* Manage Supervisors.
* Manage Operators.
* Manage Operator Pilots.
* Manage schedules.
* Manage attendance.
* Manage working-place codes.
* Manage park hours.
* Export documents.
* Request modification authorization.

## Admin

**Operational management**

* Manage schedules.
* Manage attendance.
* Manage workers.
* Manage working-place codes.
* Manage park hours.
* Export documents.
* Request modification authorization.
* Manage worker passwords.

## Supervisor

**Operational management**

* Manage schedules.
* Manage attendance.
* Manage Operators/Operator Pilots.
* Manage working-place codes.
* Manage park hours.
* Export documents.
* Request modification authorization.
* Manage worker passwords.

## Operator

**Read-only worker**

* View schedule.
* View previous schedules.
* View roles.
* View working places.
* View park hours.

## Operator Pilot

**Read-only worker**

* View schedule.
* View previous schedules.
* View roles.
* View working places.
* View park hours.

---

# 52. Complete Workflow Example

Imagine the park is preparing next week's schedule.

### Step 1 — Create codes

Supervisor creates:

```text
RR
FR
CAR
OFF
RES PARK
```

They immediately become schedule choices.

### Step 2 — Prepare schedule

Admin opens next week.

They copy the previous week.

They modify assignments:

```text
Ahmed → RR
Mohamed → FR
Ali → RES PARK
Sami → CAR
```

### Step 3 — Define park hours

For example:

```text
Monday    10:00–18:00
Tuesday   10:00–18:00
Wednesday 12:00–20:00
Thursday  10:00–18:00
Friday    14:00–22:00
```

### Step 4 — Review

Supervisor checks the schedule.

### Step 5 — Submit

Management sends the schedule to GRH.

The schedule becomes:

**LOCKED**

### Step 6 — Modification required

They discover that Ahmed needs to work at another attraction.

They cannot directly edit the submitted schedule.

They request modification authorization.

### Step 7 — GRH authorization

GRH authorizes the modification.

The schedule becomes editable.

### Step 8 — Change

Management changes:

```text
Ahmed
RR → FR
```

### Step 9 — Resubmit

Management sends the schedule again.

The system automatically locks it.

### Step 10 — Attendance

During the week:

```text
Ahmed → Present
Mohamed → Late
Ali → Day Off
Sami → Absent
```

Attendance is recorded.

### Step 11 — Export

At the end of the week, management can export:

* Weekly schedule PDF.
* Weekly schedule Excel.
* Attendance PDF.
* Attendance Excel.

---

# 53. Final MVP Scope

To keep the project realistic and avoid turning it into a huge HR platform, the first version should focus on:

### Module 1 — Authentication & Accounts

* Login.
* Role detection.
* Logout.
* Account management.
* Suspension/reactivation.
* Password management.

### Module 2 — Weekly Schedule

* Monday–Sunday schedule.
* Employees.
* Roles.
* Working-place codes.
* Park hours.
* Current/previous/next week.
* Copy previous week.
* Editing.
* Locking.
* GRH modification authorization.
* Resubmission.
* Historical schedules.
* PDF export.
* Excel export.

### Module 3 — Attendance

* Monday–Sunday attendance.
* Present.
* Late.
* Absent.
* Day Off.
* Link with schedule.
* Historical attendance.
* PDF export.
* Excel export.

### Module 4 — Working-Place Codes

* Create any code.
* Edit code.
* Delete code.
* Use codes in schedules.
* Multiple codes in one cell.
* Preserve old codes in historical schedules.

---

# 54. Central Concept of the Application

The entire application can be summarized as:

**Manage who works, where they work, when the park operates, whether they attended, and who is authorized to modify the official schedule.**

The two central modules remain:

```text
              AMUSEMENT PARK
                    │
          ┌─────────┴─────────┐
          │                   │
      SCHEDULE            ATTENDANCE
          │                   │
          │                   │
   Who works where?     Who attended?
   Monday → Sunday      Monday → Sunday
          │                   │
   Working-place codes   4 statuses
   Park hours            Present
   Copy week             Late
   GRH locking           Absent
   Modification          Day Off
   PDF / Excel           PDF / Excel
```

The rest of the system exists to support these two functions without turning the application into a general-purpose HR management platform.
