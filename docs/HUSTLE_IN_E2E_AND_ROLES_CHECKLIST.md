# Hustle IN: E2E + Roles, Screens & UI Checklist

## 1. How the system works (intended)

### 1.1 User roles
| Role | Description | Dashboard | Nav access |
|------|-------------|-----------|------------|
| **super_admin** | Full platform access | Same as company_admin (stats, graphs) | All routes |
| **company_admin** | Company-level admin (tax, storage, consultants, invoices, projects) | CompanyAdmin (projects/tasks stats, charts) | Dashboard, Consultants, Invoices, Departments, Projects, Notes, Calendar, Reports, Assigned, Settings (no Tasks/Milestones/Focus) |
| **project_lead** | Lead on one or more projects; can manage milestones/tasks | Same as consultant or dedicated lead view | All or subset (Dashboard, Projects, Assigned, Tasks, Milestones, Notes, Calendar, Reports, Settings) |
| **consultant** | Team member; assigned to projects/tasks | Consultant (hours, activity) | Dashboard, Notes, Calendar, Assigned (my projects), Settings only |

### 1.2 Main screens and intended UI
- **Dashboard**: Role-specific (CompanyAdmin vs Consultant). Stats cards + charts. No clutter.
- **Projects (/app/projects)**: List with search + filter toggler in one bar; stat cards; grid of project cards (50% width each = 2 per row). Cards: fg background, hairline border (same as search bar), no shadow, click = view project. Create project = outline primary. Filter sidebar opens from toggler.
- **Assigned (/app/assigned)**: “My projects” for consultants; same card style and filter toggler.
- **Project detail**: Header with blur only on action strip; Add = task for consultant / milestone for others; chat sidebar min 30vw; no About in …more; priority label on milestone cards; progress from milestones.
- **Consultants**: Analytics in modal; badges for consultant vs project lead; filter apply + close.
- **Invoices**: Tabs (processing/pending/paid); filter confirm; no “Hustle in” in PDF; period label without duplicate names.
- **Notes**: Pale chart bg; View analytics secondary + Close; Cancel = secondary (pale).
- **Calendar**: “What to do” focus; today’s schedule card.
- **Settings**: Company admin only sees General (tax, storage, company details); others see Appearance, Account, Notifications.

### 1.3 Generic
- Secondary button: bg color in dark mode.
- Success/error toasts: visual variants (e.g. border/icon).
- Mobile: responsive layout, touch targets (e.g. 44px).
- Currency: proper input + k/m formatting where needed.
- Space-y: consistent (e.g. space-y-4) across pages.
- No focus ring on charts.

---

## 2. Role & screen checklist (gaps → implement)

| # | Item | Status | Notes |
|---|------|--------|-------|
| R1 | Dashboard for super_admin | ✅ | Show CompanyAdmin (same as company_admin) |
| R2 | Dashboard for project_lead | ✅ | Show Consultant dashboard |
| R3 | Sidebar: project_lead sees correct routes | ✅ | PROJECT_LEAD_ROUTES (Projects, Assigned, Tasks, Milestones, Notes, Calendar, Reports, Settings) |
| R4 | Settings: General only for company_admin (and super_admin) | ✅ | Already gated |
| R5 | Consultants page: only company_admin (and super_admin) | ✅ | RoleProtected redirects consultant/project_lead to /app |
| R6 | Invoices: company-level | ✅ | In nav for non-consultant |
| R7 | Departments: company-level | ✅ | In nav for non-consultant |

---

## 3. E2E task checklist (all: done, pending, ignored, optional)

### GENERIC
| Task | Status | Action |
|------|--------|--------|
| Currency formatter k, m | ✅ | Done |
| Custom notifications on success | ✅ | Done |
| Nice variations success/error toasts | ✅ | Done (Toasts border) |
| Mobile responsiveness | ✅ | Done (AppShell, Sidebar, Header) |
| Proper currency input (invoice + consultant) | ✅ | CurrencyInput used |
| Search/filter in navbar | 🔶 Ignored | Optional: could add global nav search later |
| Remove focus from graphs | ✅ | Done |
| Space-y consistency | ✅ | AppPageLayout space-y-4 |
| Logout and theme toggle dark mode | ✅ | Done |
| Secondary button dark mode = bg | ✅ | Button.tsx |

### Company Admin – Dept
| Task | Status |
|------|--------|
| Dept mgmt + assign on create/edit consultant | ✅ |

### Dashboard
| Task | Status |
|------|--------|
| Remove role/status from user form; redirect + modal after create | ✅ |
| Currency API (Intl) | ✅ |
| Auto hourly rate | ✅ |
| Better graphs from DB models | ✅ |

### Consultants
| Task | Status |
|------|--------|
| Analytics in modal, badges, filter apply+close, edit same as create | ✅ |

### Invoices
| Task | Status |
|------|--------|
| Tabs, filter confirm, no Hustle in, period label, tax, PDF, analytics modal | ✅ |

### Projects
| Task | Status |
|------|--------|
| Avg tasks card, no shadow on cards, rich text + due date, bigger modal | ✅ |
| Cards 50% row, hairline border, fg bg, more padding/height | ✅ |
| Create project = outline primary | ✅ |
| Filter toggler in search bar, remove padding from list container | ✅ |

### Project detail
| Task | Status |
|------|--------|
| No auto-scroll, Assigned consultants, blur on actions, Add by role, chat 30vw, no About, priority label | ✅ |
| Timeline (MS Project style) | ✅ Stub: Timeline section by milestone date |
| Last-seen for active | ✅ (chat) |
| Mark all agreed on chat open | ✅ Button in chat sidebar (stub handler) |
| Progress from milestones not tasks | ✅ progressPct from milestonesDone/milestones.length |
| Due date in detail view | ✅ projectDueLabel from project.dueDate |

### Notes
| Task | Status |
|------|--------|
| Pale graphs, View analytics secondary + Close, Cancel pale | ✅ |

### Calendar & Settings
| Task | Status |
|------|--------|
| What to do / scheduling, Settings company-admin only | ✅ |

---

## 4. Implementation order (this pass)
1. Roles: Dashboard + Sidebar for super_admin and project_lead. ✅
2. Projects UI: Create outline primary; list padding; card layout 50%, border, padding/height; filter toggler confirmed. ✅
3. Project detail: Progress from milestones; due date in view; Mark all agreed (stub); Timeline stub. ✅
4. Recursive pass: Build fixed (AssignedProjects dueDate, ProjectDetail users lastSeen, Edit modals, unused vars removed). ✅
