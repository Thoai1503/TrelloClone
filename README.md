# TrelloClone

A full-featured project management and team collaboration platform inspired by Trello, built with Next.js, TypeScript, Prisma, and MySQL. The application is designed to help individuals and teams organize tasks, manage workspaces, track priorities, and collaborate in a clean and flexible Kanban workflow.

This project is not only a clone of a familiar productivity tool—it is a practical product-oriented application that demonstrates modern full-stack implementation, secure authentication, board and card management, role-based access control, and scalable architecture for real-world usage.

> Placeholder for project preview or UI screenshots: this section is intentionally left blank for future portfolio/demo updates.

## Why this project matters

TrelloClone was built to solve real workflow problems that teams and individuals face every day:

- Work becomes disorganized when tasks are scattered across notes, messages, and spreadsheets.
- Team collaboration is harder when everyone works on different tools and there is no single source of truth.
- Tracking progress, due dates, responsibilities, and blockers is often inefficient.
- Productive planning requires a visual workflow that is easy to understand and manage.

This project gives users a structured system to:

- organize work into boards, lists, and cards;
- visualize status and priorities clearly;
- assign ownership and responsibilities;
- improve communication through comments and activity tracking;
- reduce context switching across tools;
- support both individual and team workflows.

From a portfolio perspective, this project showcases:

- a production-style full-stack architecture;
- secure authentication and authorization patterns;
- database modeling and relational design;
- modern React + Next.js development; and
- practical UX decisions for real business workflows.

---

## Project overview

TrelloClone is a Kanban-style project management app where users can create workspaces, add boards, manage lists, and organize cards with drag-and-drop interactions. It mimics the familiar Trello workflow while incorporating custom logic and architecture patterns suitable for a modern SaaS-style web application.

The product is intended for:

- personal task management;
- team project planning;
- sprint planning and progress tracking;
- product and marketing workflows;
- content planning and campaign tracking;
- internal team operations and project execution.

The application supports a clear separation of responsibilities between product features and technical architecture, which makes it a strong example of maintainable software design.

---

## Key benefits

### 1. Better task organization
Users can structure work into clear categories using boards and lists, making it easier to track what needs to be done, what is in progress, and what has been completed.

### 2. Improved team collaboration
Board members can be assigned, tasks can be managed by responsible parties, and activity history helps everyone stay aligned on progress and decisions.

### 3. Clear visibility into priorities
With priority levels, due dates, start dates, comments, and completion status, teams can quickly understand what matters most and what needs attention next.

### 4. Flexible workflows for many use cases
The system is flexible enough for project planning, content planning, issue tracking, hiring pipelines, engineering tasks, and general operational work.

### 5. Real-world engineering practice
The app uses real application patterns such as:

- authentication and session management;
- secure server-side data access;
- encrypted resource identifiers;
- database relations and transactional consistency;
- UI state synchronization after mutation;
- role-based board and workspace access rules.

### 6. Strong portfolio value
This project demonstrates technical depth, not just UI creation. It shows the ability to implement a system that contains user flows, backend logic, database design, security principles, and modern frontend patterns in one cohesive product.

---

## Core features

### Workspace management
- Create and manage workspaces for different teams or projects.
- Organize related boards under a workspace.
- Support multiple users within the same workspace.
- Define user roles and workspace-level access.

### Board management
- Create boards inside workspaces.
- Assign board colors and backgrounds.
- Keep boards organized by project or team area.
- Support board sharing and member management.
- Maintain board visibility and access control.

### Lists and columns
- Create multiple lists representing stages or statuses such as To do, In progress, Review, Done.
- Reorder lists to reflect workflow changes.
- Maintain list ordering and structure with reliable state updates.

### Card management
- Create card-based tasks with title, description, and metadata.
- Move cards between lists.
- Drag and drop cards for a more natural Kanban experience.
- Reorder cards within a list or across lists.
- Set card priorities: Low, Medium, High, Urgent.
- Mark cards as completed or incomplete.

### Due dates and scheduling
- Assign start dates and due dates.
- Group work by urgency and deadlines.
- Visualize tasks that require attention soon.
- Improve time planning for personal and team commitments.

### Comments and activity tracking
- Add comments to cards.
- Track updates such as status changes, assignment changes, and date updates.
- Maintain a transparent activity timeline for accountability.

### User assignments and collaboration
- Add members to boards and workspaces.
- Assign card members by email or user identity.
- Manage permissions for board admins and non-admin members.
- Improve accountability and reduce coordination gaps.

### Attachment support
- Upload and store task-related attachments securely.
- Access media through verified permission checks.
- Support rich project documentation directly on cards.

### Authentication and security
- Email/password login using secure password hashing.
- NextAuth-based session management.
- Google OAuth option when configured.
- Encrypted identifiers for resource URLs.
- Protected server-side actions for accessing workspace and board data.

### Modern UI/UX
- Responsive interface for desktop and larger screens.
- Clear hierarchy and intuitive workflow navigation.
- Card hover controls and quick editing interactions.
- Visual cues for tasks, members, completion, and urgency.

### Data resilience and consistency
- Prisma integration with MySQL for structured data persistence.
- Transactional updates when reordering and moving tasks.
- Relationship integrity across workspaces, boards, lists, and cards.
- Error handling and explicit loading states for better user experience.

---

## Technical stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Backend and data layer
- Next.js App Router
- Prisma ORM
- MySQL database
- Server actions for secure mutation logic

### Authentication and session handling
- NextAuth
- Credentials-based login
- Google OAuth support

### Productivity and interaction libraries
- @dnd-kit for drag-and-drop interactions
- Formik for form handling
- TanStack React Query for client-side data synchronization

### Cloud and media
- Cloudinary for attachment/media handling

---

## Architecture overview

The project follows a clean layered structure aligned with modern full-stack application conventions:

- `app/` — route pages, layouts, providers, server actions, and App Router features.
- `app/components/` — atomic UI components split into atoms, molecules, organisms, and templates.
- `app/features/` — feature orchestration and route-level logic.
- `app/actions/` — domain-specific server actions for workspaces, boards, and lists.
- `app/types/` — domain contracts and serializable data models.
- `lib/` — shared infrastructure such as Prisma client configuration.
- `utils/` — reusable helpers, validation logic, and encrypted ID utilities.
- `prisma/` — database schema and migrations.
- `docs/` — architecture and project-state documentation.

This structure separates UI concerns, business logic, and persistence boundaries while keeping the system maintainable and scalable.

---

## Project flow

Typical user flow in the application:

1. User registers or logs in.
2. User creates or enters a workspace.
3. User creates a board for a project or initiative.
4. User adds lists to represent workflow stages.
5. User creates cards to represent tasks.
6. User assigns members, comments, and due dates.
7. User moves cards across lists as work progresses.
8. Team members collaborate using the same board and activity feed.

This flow mirrors common Kanban-based productivity systems and is familiar to many users, which helps the app feel natural and intuitive.

---

## Security and reliability considerations

This project was designed with real-world application concerns in mind:

- sensitive identifiers are encrypted and treated as opaque references;
- access checks are performed on the server before data reads or mutations;
- database access is kept on server-side boundaries;
- authentication secrets are maintained in environment variables; and
- data-loading failures are surfaced explicitly instead of silently turning into empty states.

These practices are important for building trustworthy applications and are highly relevant for professional software work.

---

## Demo and portfolio fit

This repository is suitable for:

- a portfolio project demonstrating full-stack engineering skills;
- a functional product demo for interviews or technical presentations;
- a learning project for understanding modern Next.js and Prisma architecture;
- a base for future product enhancement or SaaS feature expansion.

The project is especially strong from a portfolio standpoint because it combines:

- user-facing product thinking;
- technical architecture quality;
- backend and data modeling depth;
- secure and scalable patterns;
- polished UX patterns common in modern productivity products.

---

## Project screenshots

> Add your project screenshots here. This section is intentionally left empty for future updates.
>
> Recommended layout:
>
> - Landing page
> - Login / authentication screen
> - Workspace overview
> - Board detail screen
> - Card details / comments panel
> - Team collaboration / member management view

### Screenshot placeholder 1

![Project screenshot placeholder 1](#)

### Screenshot placeholder 2

![Project screenshot placeholder 2](#)

### Screenshot placeholder 3

![Project screenshot placeholder 3](#)

---

## Getting started

### Prerequisites

Before running this project, make sure you have:

- Node.js 18+ or a compatible version
- npm or another package manager
- MySQL running locally or in a managed environment
- environment variables configured for local development

### Install dependencies

```bash
npm install
```

### Environment configuration

Create a `.env` file based on your local setup and configure the required environment variables, including:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (for local development if needed)
- `WORKSPACE_ID_ENCRYPTION_KEY`
- Google OAuth variables when using Google sign-in

Example:

```bash
DATABASE_URL="mysql://user:password@localhost:3306/trello_clone"
NEXTAUTH_SECRET="your_secret_here"
NEXTAUTH_URL="http://localhost:3000"
WORKSPACE_ID_ENCRYPTION_KEY="your_64_hex_character_key"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

> Keep secrets out of version control and never commit sensitive environment values.

### Generate Prisma client

```bash
npm run db:generate
```

### Run database migrations

```bash
npx prisma migrate dev
```

### Start the app

```bash
npm run dev
```

Open `http://localhost:3000` in the browser to view the application.

---

## Useful project commands

```bash
npm run dev
npm run build
npm run lint -- app
npx tsc --noEmit
npx prisma validate
npm run db:generate
```

---

## Roadmap and future improvements

This project already includes a solid core product experience, and there are many opportunities to extend it further:

- advanced search and filtering across boards and cards;
- activity dashboard and analytics;
- card labels and custom tags;
- team notifications and reminders;
- calendar and schedule view;
- board templates for recurring workflows;
- export/import of tasks and project data;
- more role-based permission settings;
- improved mobile optimization;
- real-time collaboration with live updates.

These enhancements would continue to evolve the project from a strong MVP into a more complete SaaS-style product.

---

## Summary

TrelloClone is a full-stack project management application inspired by Trello, built to demonstrate practical software engineering, collaboration workflows, and modern web development. It combines productivity features, secure architecture patterns, and realistic data modeling into a single, portfolio-friendly product.

The project is suitable for:

- demonstrating software engineering ability;
- showcasing full-stack development skills;
- proving product and UX thinking in a practical context;
- presenting a complete workflow-driven application in a portfolio or demo.

---

## Author note

This project is designed as a usable, production-style board and task management app with strong portfolio value. It can be expanded into a more advanced collaborative product while maintaining the same clean architecture and business logic model.

If you want, this README can later be adapted into:

- a more polished English portfolio version;
- a concise GitHub project landing page version;
- a Vietnamese-only version for local presentation; or
- a startup-style product pitch README for investor/demo storytelling.
