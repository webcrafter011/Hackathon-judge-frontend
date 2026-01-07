# Team Join Requests Documentation

This document outlines the API routes for managing join requests to teams within a hackathon.

## Base URL
`/api`

---

## 1. Request to Join a Team
Allows a participant to send a request to join a specific team.

- **URL:** `/teams/:id/request-join`
- **Method:** `POST`
- **Auth Required:** Yes
- **Path Parameters:**
  - `id`: The ID of the team to join.
- **Body Parameters:**
  ```json
  {
    "message": "Optional message to the team leader (max 500 characters)"
  }
  ```
- **Success Response:**
  - **Code:** 201 CREATED
  - **Content:**
    ```json
    {
      "request": {
        "_id": "658a...",
        "teamId": { "_id": "...", "name": "Team Name", "slug": "team-name" },
        "userId": { "_id": "...", "name": "User Name", "email": "user@example.com" },
        "hackathonId": "...",
        "message": "Hello!",
        "status": "pending",
        "createdAt": "..."
      },
      "message": "Join request sent successfully"
    }
    ```
- **Error Responses:**
  - **400 Bad Request:** Registration closed or team is full.
  - **404 Not Found:** Team not found.
  - **409 Conflict:** User already in a team for this hackathon or already has a pending request for this team.

---

## 2. Get Join Requests for a Team
Allows a team leader or admin to view all requests to join their team.

- **URL:** `/teams/:id/requests`
- **Method:** `GET`
- **Auth Required:** Yes (Team Leader or Admin)
- **Path Parameters:**
  - `id`: The ID of the team.
- **Query Parameters:**
  - `status`: Filter by status (`pending`, `approved`, `rejected`, `cancelled`, `all`). Defaults to `pending`.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "requests": [
        {
          "_id": "658a...",
          "userId": { "_id": "...", "name": "Name", "email": "...", "profile": { ... } },
          "status": "pending",
          "message": "...",
          "createdAt": "..."
        }
      ]
    }
    ```

---

## 3. Approve Join Request
Allows a team leader or admin to accept a join request.

- **URL:** `/teams/:id/requests/:requestId/approve`
- **Method:** `POST`
- **Auth Required:** Yes (Team Leader or Admin)
- **Path Parameters:**
  - `id`: The ID of the team.
  - `requestId`: The ID of the join request.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "team": { ...updated team object... },
      "message": "Request approved successfully"
    }
    ```
- **Logic:**
  - Verifies team size constraints.
  - Adds the user to the team members list.
  - Marks the request as `approved`.
  - Automatically cancels all other pending requests from this user for the same hackathon.

---

## 4. Reject Join Request
Allows a team leader or admin to decline a join request.

- **URL:** `/teams/:id/requests/:requestId/reject`
- **Method:** `POST`
- **Auth Required:** Yes (Team Leader or Admin)
- **Path Parameters:**
  - `id`: The ID of the team.
  - `requestId`: The ID of the join request.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "message": "Request rejected successfully"
    }
    ```
- **Logic:**
  - Marks the request as `rejected`.

---

## 5. Cancel Own Join Request
Allows a participant to withdraw their own pending join request.

- **URL:** `/join-requests/:requestId`
- **Method:** `DELETE`
- **Auth Required:** Yes (Owner of the request)
- **Path Parameters:**
  - `requestId`: The ID of the join request.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "message": "Request cancelled successfully"
    }
    ```

---

## 6. Get My Join Requests
Retrieve all requests sent by the current user.

- **URL:** `/me/join-requests`
- **Method:** `GET`
- **Auth Required:** Yes
- **Query Parameters:**
  - `status`: Filter by status (`pending`, `approved`, `rejected`, `cancelled`, `all`).
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "requests": [
        {
          "_id": "...",
          "teamId": { "name": "...", "slug": "..." },
          "hackathonId": { "title": "...", "slug": "..." },
          "status": "...",
          "createdAt": "..."
        }
      ]
    }
    ```
