# Hackathon Judge - Backend API Context Document

> **Purpose**: This document provides complete backend context for building the React frontend. Feed this to an AI assistant to start a new session for frontend development.

---

## Project Overview

**Hackathon Judge** is a platform for organizing hackathons, managing teams, accepting project submissions, and allowing judges to evaluate and score submissions. The backend is built with Node.js, Express.js, and MongoDB.

### User Roles
| Role | Description |
|------|-------------|
| `admin` | Full system access, can manage all resources |
| `organizer` | Creates and manages hackathons, assigns judges |
| `judge` | Evaluates submissions, provides scores |
| `participant` | Joins teams, submits projects |

---

## Authentication

### JWT-Based Auth
- Token returned on login/register
- Include in header: `Authorization: Bearer <token>`
- Token expires in 7 days
- Decode payload: `{ sub: "userId", role: "participant" }`

### Auth Endpoints

```
POST /api/register
Body: { name, email, password }
Response: { user: { id, name, email, role }, token }

POST /api/login
Body: { email, password }
Response: { user: { id, name, email, role }, token }

POST /api/logout
Response: { message: "Logged out" }

GET /api/me
Headers: Authorization: Bearer <token>
Response: { user: { id, name, email, role, profile, avatar } }

PUT /api/me
Body: { name?, profile?: { bio, organization, skills[], socialLinks } }
Response: { user }

PUT /api/me/password
Body: { currentPassword, newPassword }
Response: { message }

POST /api/forgot-password
Body: { email }
Response: { message }

POST /api/reset-password
Body: { token, password }
Response: { message }
```

### Invite Flow (Admin/Organizer invites users)
```
POST /api/invite
Body: { email, role }
Response: { message: "Invite sent" }

POST /api/accept-invite
Body: { token, name, password }
Response: { user, token }
```

---

## Data Models

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  role: "admin" | "organizer" | "judge" | "participant",
  avatar: String (URL),
  avatarAssetId: ObjectId,
  profile: {
    bio: String,
    organization: String,
    skills: [String],
    socialLinks: { github, linkedin, twitter, website }
  },
  meta: { isActive: Boolean, lastLoginAt: Date },
  createdAt, updatedAt
}
```

### Hackathon
```javascript
{
  _id: ObjectId,
  title: String,
  slug: String (unique, URL-friendly),
  description: String,
  organizerId: ObjectId (ref: User),
  status: "draft" | "open" | "running" | "closed" | "archived",
  visibility: "public" | "private" | "unlisted",
  startAt: Date,
  endAt: Date,
  submissionDeadline: Date,
  bannerAssetId: ObjectId (ref: Asset),
  assets: [ObjectId],
  rules: String (markdown),
  prizes: [{ rank: Number, title: String, description: String, value: String }],
  tags: [String],
  judges: [ObjectId (ref: User)],
  teamConstraints: { minSize: Number, maxSize: Number, allowSolo: Boolean },
  scoringConfig: { totalScoreMax: Number },
  contactEmail: String,
  createdAt, updatedAt
}
// Virtual: teamCount (computed)
```

### Team
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  hackathonId: ObjectId (ref: Hackathon),
  members: [{
    userId: ObjectId (ref: User),
    role: "leader" | "member",
    joinedAt: Date
  }],
  inviteCode: String (unique),
  isLocked: Boolean,
  createdAt, updatedAt
}
```

### JoinRequest
```javascript
{
  _id: ObjectId,
  teamId: ObjectId (ref: Team),
  userId: ObjectId (ref: User),
  hackathonId: ObjectId (ref: Hackathon),
  status: "pending" | "approved" | "rejected" | "cancelled",
  message: String,
  respondedBy: ObjectId (ref: User),
  respondedAt: Date,
  createdAt, updatedAt
}
```

### Submission
```javascript
{
  _id: ObjectId,
  hackathonId: ObjectId (ref: Hackathon),
  teamId: ObjectId (ref: Team),
  title: String,
  description: String,
  repoUrl: String,
  demoUrl: String,
  videoUrl: String,
  assets: [ObjectId (ref: Asset)],
  tags: [String],
  isFinal: Boolean,
  submittedAt: Date,
  submittedBy: ObjectId (ref: User),
  createdAt, updatedAt
}
// One submission per team per hackathon
```

### Criteria
```javascript
{
  _id: ObjectId,
  hackathonId: ObjectId (ref: Hackathon),
  items: [{
    key: String (e.g., "innovation"),
    label: String (e.g., "Innovation & Creativity"),
    maxScore: Number (1-100),
    weight: Number (0.1-10),
    description: String
  }],
  createdBy: ObjectId (ref: User),
  createdAt, updatedAt
}
// One criteria document per hackathon
```

### Evaluation
```javascript
{
  _id: ObjectId,
  submissionId: ObjectId (ref: Submission),
  hackathonId: ObjectId (ref: Hackathon),
  judgeId: ObjectId (ref: User),
  scores: [{
    key: String,
    score: Number,
    comment: String
  }],
  totalScore: Number (weighted average),
  status: "draft" | "submitted" | "rejected",
  locked: Boolean,
  submittedAt: Date,
  createdAt, updatedAt
}
// Unique index on [submissionId, judgeId]
```

### Assignment
```javascript
{
  _id: ObjectId,
  hackathonId: ObjectId (ref: Hackathon),
  judgeId: ObjectId (ref: User),
  teamIds: [ObjectId (ref: Team)],
  role: "primary" | "secondary",
  assignedAt: Date
}
```

### Asset
```javascript
{
  _id: ObjectId,
  filename: String,
  mimeType: String,
  sizeBytes: Number,
  storageKey: String,
  storageUrl: String,
  storageMode: "local" | "s3",
  category: "image" | "document" | "video" | "archive" | "code" | "other",
  purpose: String,
  entityType: "Hackathon" | "Submission" | "Team" | "User",
  entityId: ObjectId,
  uploadedBy: ObjectId (ref: User),
  uploadedAt: Date
}
// Virtuals: extension, sizeFormatted
```

---

## API Endpoints

### Hackathons

```
GET /api/hackathons
Query: ?page=1&limit=10&status=open&visibility=public&search=keyword&tag=ai
Response: { hackathons[], pagination: { page, limit, total, pages } }

POST /api/hackathons
Auth: organizer, admin
Body: { title, description, startAt, endAt, visibility?, rules?, prizes?, tags?, teamConstraints?, scoringConfig? }
Response: { hackathon }

GET /api/hackathons/:id
Response: { hackathon }

GET /api/hackathons/slug/:slug
Response: { hackathon }

PUT /api/hackathons/:id
Auth: organizer (owner), admin
Body: { title?, description?, ... }
Response: { hackathon }

DELETE /api/hackathons/:id
Auth: organizer (owner), admin
Response: { message }

PATCH /api/hackathons/:id/status
Auth: organizer (owner), admin
Body: { status }
Valid transitions: draft→open→running→closed→archived
Response: { hackathon }

POST /api/hackathons/:id/judges
Auth: organizer, admin
Body: { judgeIds: [userId, ...] }
Response: { hackathon }

DELETE /api/hackathons/:id/judges/:judgeId
Auth: organizer, admin
Response: { hackathon }

GET /api/hackathons/:id/teams
Response: { teams[] }

GET /api/hackathons/:id/submissions
Response: { submissions[] }

GET /api/my/hackathons
Auth: required
Query: ?role=organizer|participant|judge
Response: { hackathons[] }
```

### Teams

```
GET /api/hackathons/:hackathonId/teams
Response: { teams[] }

POST /api/hackathons/:hackathonId/teams
Auth: participant
Body: { name }
Response: { team }

GET /api/teams/:id
Response: { team }

PUT /api/teams/:id
Auth: team leader
Body: { name? }
Response: { team }

DELETE /api/teams/:id
Auth: team leader, admin
Response: { message }

POST /api/teams/:id/request-join
Auth: participant
Body: { message? }
Response: { joinRequest }

GET /api/teams/:id/join-requests
Auth: team leader
Response: { requests[] }

POST /api/teams/:id/join-requests/:requestId/approve
Auth: team leader
Response: { team, message }

POST /api/teams/:id/join-requests/:requestId/reject
Auth: team leader
Response: { message }

DELETE /api/teams/:id/members/:userId
Auth: team leader (remove), or self (leave)
Response: { team }

POST /api/teams/join-by-code
Auth: participant
Body: { inviteCode }
Response: { team }

GET /api/teams/:id/regenerate-code
Auth: team leader
Response: { inviteCode }

GET /api/my/teams
Auth: required
Response: { teams[] }

GET /api/my/join-requests
Auth: required
Response: { requests[] }

DELETE /api/join-requests/:id/cancel
Auth: request owner
Response: { message }
```

### Submissions

```
GET /api/hackathons/:hackathonId/submissions
Response: { submissions[] }

POST /api/submissions
Auth: team member
Body: { hackathonId, teamId, title, description, repoUrl?, demoUrl?, videoUrl?, tags? }
Response: { submission }

GET /api/submissions/:id
Response: { submission }

PUT /api/submissions/:id
Auth: team member
Body: { title?, description?, ... }
Response: { submission }

DELETE /api/submissions/:id
Auth: team leader, admin
Response: { message }

PATCH /api/submissions/:id/finalize
Auth: team member
Response: { submission }

GET /api/my/submissions
Auth: required
Response: { submissions[] }
```

### Criteria

```
POST /api/hackathons/:hackathonId/criteria
Auth: organizer, admin
Body: { items: [{ key, label, maxScore, weight?, description? }] }
Response: { criteria }

GET /api/hackathons/:hackathonId/criteria
Response: { criteria }

DELETE /api/hackathons/:hackathonId/criteria
Auth: organizer, admin
Response: { message }
```

### Evaluations

```
POST /api/evaluations
Auth: judge, admin
Body: { submissionId, scores: [{ key, score, comment? }], status?: "draft"|"submitted" }
Response: { evaluation }

GET /api/evaluations/:id
Auth: judge (owner), organizer, admin
Response: { evaluation }

GET /api/evaluations/submission/:submissionId/mine
Auth: judge
Response: { evaluation }

GET /api/evaluations/submission/:submissionId
Auth: organizer, admin
Response: { evaluations[] }

GET /api/evaluations/hackathon/:hackathonId/mine
Auth: judge
Query: ?status=draft|submitted
Response: { evaluations[] }

GET /api/evaluations/hackathon/:hackathonId/assigned
Auth: judge
Response: { submissions[], stats: { total, evaluated, pending } }

GET /api/evaluations/hackathon/:hackathonId/leaderboard
Auth: optional (required if not closed)
Response: { leaderboard: [{ rank, submission, team, avgScore, evaluationCount }] }

PATCH /api/evaluations/:id/submit
Auth: judge (owner)
Response: { evaluation }

PATCH /api/evaluations/:id/lock
Auth: organizer, admin
Response: { evaluation }

DELETE /api/evaluations/:id
Auth: judge (owner, draft only), admin
Response: { message }
```

### Assignments (Judge-Team)

```
POST /api/hackathons/:hackathonId/assignments
Auth: organizer, admin
Body: { judgeId, teamIds?, role? }
Response: { assignment }

POST /api/hackathons/:hackathonId/assignments/bulk
Auth: organizer, admin
Body: { assignments: [{ judgeId, teamIds?, role? }] }
Response: { assignments[], errors[] }

POST /api/hackathons/:hackathonId/assignments/auto
Auth: organizer, admin
Body: { judgesPerTeam?: 2 }
Response: { assignments[], stats }

GET /api/hackathons/:hackathonId/assignments
Auth: organizer, admin
Response: { assignments[] } (with workload stats)

GET /api/hackathons/:hackathonId/assignments/mine
Auth: judge
Response: { assignment, teams[], stats }

GET /api/hackathons/:hackathonId/assignments/workload
Auth: organizer, admin
Response: { summary[], overallStats }

PATCH /api/hackathons/:hackathonId/assignments/:judgeId/teams
Auth: organizer, admin
Body: { teamIds, action: "add"|"remove"|"set" }
Response: { assignment }

DELETE /api/hackathons/:hackathonId/assignments/:judgeId
Auth: organizer, admin
Response: { message }
```

### Assets (File Upload)

```
POST /api/assets/upload
Auth: required
Body: FormData { file, purpose?, entityType?, entityId? }
Response: { asset }

POST /api/assets/upload/multiple
Auth: required
Body: FormData { files[], purpose?, entityType?, entityId? }
Response: { assets[], count }

POST /api/assets/hackathons/:hackathonId/banner
Auth: organizer, admin
Body: FormData { banner }
Response: { asset }

POST /api/assets/submissions/:submissionId/assets
Auth: team member
Body: FormData { files[] }
Response: { assets[], count }

POST /api/assets/avatar
Auth: required
Body: FormData { avatar }
Response: { asset }

GET /api/assets/my
Query: ?page=1&limit=20&purpose=&category=
Response: { assets[], pagination }

GET /api/assets/entity/:entityType/:entityId
Response: { assets[] }

GET /api/assets/:id
Response: { asset }

GET /api/assets/:id/download
Response: File stream or redirect

DELETE /api/assets/:id
Auth: owner, admin
Response: { message }

# Static files served at:
GET /uploads/:year/:month/:filename
```

### Audit Logs

```
GET /api/audit/my
Auth: required
Response: { logs[], pagination }

GET /api/audit
Auth: admin
Query: ?page&limit&category&action&actorId&entityType&entityId&status&startDate&endDate
Response: { logs[], pagination }

GET /api/audit/stats
Auth: admin
Query: ?days=7
Response: { byCategory, byStatus, byDay, topActions, topUsers, failedActions }

GET /api/audit/search
Auth: admin
Query: ?q=search_term
Response: { logs[], pagination }

GET /api/audit/export
Auth: admin
Query: ?format=json|csv&startDate&endDate&category&limit
Response: File download

GET /api/audit/entity/:entityType/:entityId
Auth: admin
Response: { logs[], pagination }

GET /api/audit/actor/:actorId
Auth: admin
Response: { logs[], pagination }
```

---

## Key Workflows

### 1. Hackathon Lifecycle
```
Organizer creates hackathon (status: draft)
    ↓
Organizer sets up criteria, rules, prizes
    ↓
Organizer changes status to "open"
    ↓
Participants register, create/join teams
    ↓
Organizer changes status to "running"
    ↓
Teams work and submit projects
    ↓
Submission deadline passes
    ↓
Organizer changes status to "closed"
    ↓
Judges evaluate submissions
    ↓
Leaderboard becomes public
    ↓
Organizer archives hackathon
```

### 2. Team Join Flow
```
Participant creates team (becomes leader)
    OR
Participant requests to join existing team
    ↓
Team leader sees pending requests
    ↓
Leader approves/rejects request
    ↓
If approved: participant added to team
    ↓
Alternative: Join via invite code (instant join)
```

### 3. Submission Flow
```
Team creates submission (draft)
    ↓
Team updates submission with details
    ↓
Team uploads assets (screenshots, docs)
    ↓
Team finalizes submission (isFinal: true)
    ↓
Cannot edit after hackathon closes
```

### 4. Evaluation Flow
```
Judge sees assigned submissions
    ↓
Judge creates evaluation (draft)
    ↓
Judge scores each criteria
    ↓
Judge submits evaluation
    ↓
Organizer can lock evaluations
    ↓
Scores aggregate to leaderboard
```

---

## Frontend Pages Needed

### Public Pages
- [ ] Landing page
- [ ] Hackathon listing (with filters)
- [ ] Hackathon detail page
- [ ] Login page
- [ ] Register page
- [ ] Forgot password
- [ ] Reset password
- [ ] Accept invite page

### Participant Pages
- [ ] Dashboard (my hackathons, teams, submissions)
- [ ] My profile / settings
- [ ] Browse hackathons
- [ ] Hackathon detail (with join team option)
- [ ] Team detail page
- [ ] Create team
- [ ] My team management
- [ ] Join requests (sent by me)
- [ ] Create/edit submission
- [ ] View leaderboard

### Judge Pages
- [ ] Judge dashboard
- [ ] Assigned submissions list
- [ ] Evaluation form
- [ ] My evaluations

### Organizer Pages
- [ ] Organizer dashboard
- [ ] Create hackathon
- [ ] Edit hackathon
- [ ] Manage hackathon (status, settings)
- [ ] Setup criteria
- [ ] Manage judges
- [ ] Judge assignments
- [ ] View all submissions
- [ ] View all evaluations
- [ ] Workload dashboard
- [ ] Leaderboard management

### Admin Pages
- [ ] Admin dashboard
- [ ] User management
- [ ] All hackathons
- [ ] Audit logs viewer
- [ ] System stats

---

## Frontend Tech Recommendations

```
React 18+ with Vite
React Router v6 for routing
TanStack Query (React Query) for API state
Zustand or Context for auth state
Axios for HTTP client
React Hook Form + Zod for forms
Tailwind CSS for styling
Shadcn/UI or Radix for components
React Dropzone for file uploads
Recharts for analytics charts
Date-fns for date handling
```

---

## Environment Variables (Frontend)

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Hackathon Judge
```

---

## API Error Format

```javascript
// Validation errors
{ errors: [{ path: "email", msg: "Invalid email" }] }

// General errors
{ message: "Error description" }

// With status codes
400 - Bad Request (validation)
401 - Unauthorized (not logged in)
403 - Forbidden (no permission)
404 - Not Found
409 - Conflict (duplicate)
500 - Server Error
```

---

## Starting Frontend Development

Recommended order:
1. **Setup** - Project structure, routing, auth context
2. **Auth** - Login, register, forgot password
3. **Layout** - Navbar, sidebar, protected routes
4. **Hackathons** - List, detail, create (organizer)
5. **Teams** - Create, join, manage
6. **Submissions** - Create, edit, upload files
7. **Criteria & Evaluation** - Judge scoring
8. **Dashboards** - Role-specific views
9. **Admin** - User management, audit logs

---

## Quick Reference - HTTP Methods

| Action | Method | Auth |
|--------|--------|------|
| List items | GET | Varies |
| Get single | GET | Varies |
| Create | POST | Required |
| Update | PUT/PATCH | Owner/Admin |
| Delete | DELETE | Owner/Admin |
| Action (finalize, submit) | PATCH | Required |

---

*Document generated: January 4, 2026*
*Backend server: http://localhost:3000*
