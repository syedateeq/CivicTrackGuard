# CivicTrackGuard API Reference

## Authentication

### `POST /api/auth/register`
Register a new user.
- **Body:** `{ "name": "...", "email": "...", "password": "..." }`
- **Response:** User object

### `POST /api/auth/login`
Authenticate a user and get a JWT token.
- **Body:** `{ "email": "...", "password": "..." }`
- **Response:** `{ "token": "..." }`

## Issues

### `POST /api/issues`
Create a new civic issue. Requires JWT authentication.
- **Body (Multipart/form-data):** `title`, `description`, `category` (optional), `location`, `latitude`, `longitude`, `image` (file).
- **Response:** Issue object (enriched with AI data).

### `GET /api/issues`
Get all issues.
- **Response:** Array of Issue objects.

### `GET /api/issues/page?page=0&size=9`
Get paginated issues.

### `GET /api/issues/{id}`
Get a specific issue by ID.

### `PUT /api/issues/{id}/status`
Update issue status (Admin only).
- **Body:** `{ "status": "RESOLVED", "department": "Public Safety" }`

### `DELETE /api/issues/{id}`
Delete an issue (Admin only).

## Engagement

### `POST /api/votes`
Vote on an issue.
- **Body:** `{ "issueId": 1, "voteType": "UPVOTE" }`

### `POST /api/comments`
Add a comment to an issue.
- **Body:** `{ "issueId": 1, "text": "..." }`

### `GET /api/comments/issue/{id}`
Get all comments for an issue.

## Dashboard

### `GET /api/dashboard/stats`
Get high-level statistics for the dashboard.
### `GET /api/dashboard/severity`
Get severity breakdown.
### `GET /api/dashboard/category`
Get category breakdown.
