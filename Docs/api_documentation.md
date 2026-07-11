# Campus Gigs & Rentals - API Documentation

The Campus Gigs & Rentals server exposes a modular REST API. JWT authentication is required for protected endpoints, passed as a bearer token.

---

## Authentication Module

### Sign Up / Register
* **Endpoint:** `POST /api/v1/auth/signup`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "name": "Alice Johnson",
    "email": "alice@college.edu",
    "password": "password123",
    "college": "State University"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "user": {
      "id": "603d2e3f538e1b0015b63489",
      "name": "Alice Johnson",
      "email": "alice@college.edu",
      "role": "student",
      "college": "State University",
      "ratingAvg": 0,
      "ratingCount": 0
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
  ```
* **Error Response (400 Bad Request):** If the email does not end with `.edu` or fields are missing.

### Log In
* **Endpoint:** `POST /api/v1/auth/login`
* **Request Body:**
  ```json
  {
    "email": "alice@college.edu",
    "password": "password123"
  }
  ```
* **Success Response (200 OK):** (Same schema as signup response)

### Refresh Tokens
* **Endpoint:** `POST /api/v1/auth/refresh`
* **Request Body:**
  ```json
  {
    "token": "eyJhbGciOi... (refreshToken)"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "accessToken": "new_access_token_jwt",
    "refreshToken": "new_refresh_token_jwt"
  }
  ```

---

## Gigs Module

### Browse Gigs
* **Endpoint:** `GET /api/v1/gigs`
* **Query Parameters (Optional):**
  * `search`: keyword string filter on title/description
  * `category`: Tutoring, Coding & Web, etc.
  * `status`: open, accepted, completed, cancelled (defaults to `open`)
  * `minPrice` / `maxPrice`: number range
* **Success Response (200 OK):** Array of Gig documents.

### Create Gig
* **Endpoint:** `POST /api/v1/gigs` (Protected)
* **Request Body:**
  ```json
  {
    "title": "Need Tutoring for Calculus",
    "description": "Calculus II integrals, 2 hours session.",
    "price": 30,
    "category": "Tutoring"
  }
  ```
* **Success Response (210 Created):** Created Gig document.

### Accept Gig
* **Endpoint:** `POST /api/v1/gigs/:id/accept` (Protected)
* **Success Response (200 OK):**
  ```json
  {
    "gig": { "status": "accepted", "acceptedById": "..." },
    "transaction": { "status": "held_in_escrow", "amount": 30, "type": "gig" }
  }
  ```

### Complete Gig
* **Endpoint:** `POST /api/v1/gigs/:id/complete` (Protected - Poster only)
* **Success Response (200 OK):** Releases escrow funds to the worker.

---

## Rentals Module

### Browse Rentals
* **Endpoint:** `GET /api/v1/rentals`
* **Query Parameters (Optional):** Similar to Gigs.
* **Success Response (200 OK):** Array of Rental listings.

### Rent Item
* **Endpoint:** `POST /api/v1/rentals/:id/rent` (Protected)
* **Request Body:**
  ```json
  {
    "startDate": "2026-06-25",
    "endDate": "2026-06-27"
  }
  ```
* **Success Response (200 OK):** Returns updated rental calendar and created escrow transaction logs.

### Confirm Item Return
* **Endpoint:** `POST /api/v1/rentals/return` (Protected)
* **Request Body:**
  ```json
  {
    "transactionId": "603d2e3f538e1b0015b63489"
  }
  ```
* **Success Response (200 OK):** Closes rental contract, clears calendar blocked dates, and releases escrow funds to owner.

---

## Chat Module

### Send Message
* **Endpoint:** `POST /api/v1/chats` (Protected)
* **Request Body:**
  ```json
  {
    "receiverId": "603d2e3f538e1b0015b63490",
    "body": "Hey, I accepted your tutor gig! When should we meet?"
  }
  ```
* **Success Response (201 Created):** Populate Message object. Broadcasts real-time events via Socket.io.

### Fetch History
* **Endpoint:** `GET /api/v1/chats/history/:partnerId` (Protected)
* **Success Response (200 OK):** Array of Message documents chronological. Marks recipient unreads as read.

---

## Rating Module

### Create Review
* **Endpoint:** `POST /api/v1/ratings` (Protected)
* **Request Body:**
  ```json
  {
    "transactionId": "603d2e3f538e1b0015b63499",
    "stars": 5,
    "comment": "Super helpful!"
  }
  ```

---

## Admin Module

### System metrics
* **Endpoint:** `GET /api/v1/admin/metrics` (Protected - Admin role required)
* **Success Response (200 OK):** Platform usage counters and escrow dollar volume sums.
