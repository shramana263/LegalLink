# 🗓️ Advocate Appointment Flow – Frontend Integration Guide

### 1. ✅ Advocate Connects Google Calendar

**Route:**
`GET /api/appointment/advocate/calendar/connect`

**Purpose:**
Redirects the advocate to Google OAuth to grant calendar access.

**Redirects back to:**
`GET /api/appointment/advocate/calendar/feed?code=...`
This stores the advocate's calendar tokens in the backend.

---

### 2. 🔍 Fetch Advocate Availability

**Route:**
`GET /api/appointment/availability/:advocate_id`

**Returns:**
Up to 5 upcoming available 30-minute slots (1 hour apart), filtered by:

- Advocate’s working days (e.g., `["MON", "TUE", "WED"]`)
- Working hours (e.g., `10 AM – 5 PM`)
- Google Calendar busy times

**Example Response:**

```json
{
  "slots": [
    {
      "start": "2025-06-18T10:00:00.000Z",
      "end": "2025-06-18T10:30:00.000Z"
    },
    {
      "start": "2025-06-18T11:00:00.000Z",
      "end": "2025-06-18T11:30:00.000Z"
    }
  ]
}
```

---

### 3. 📅 Book an Appointment

**Route:**
`POST /api/appointment/book`

**Request Body:**

```json
{
  "advocate_id": "ADVOCATE_UUID",
  "startTime": "2025-06-18T10:00:00.000Z",
  "endTime": "2025-06-18T10:30:00.000Z",
  "reason": "Need help with property dispute"
}
```

**Returns:**

```json
{
  "success": true,
  "appointment": {
    "id": "APPOINTMENT_UUID",
    "status": "pending",
    "meeting_link": "https://meet.google.com/xyz"
  }
}
```

**Notes:**

- Creates the appointment in DB
- Also creates a Google Calendar event with a Google Meet link
- Appointment will remain `pending` until the advocate confirms

---

### 4. ✅ Advocate Confirms Appointment

**Route:**
`POST /api/appointment/advocate/confirm`

**Request Body:**

```json
{
  "appointment_id": "APPOINTMENT_UUID"
}
```

**Returns:**

```json
{
  "success": true,
  "message": "Appointment confirmed"
}
```

**Note:** Only accessible to the authenticated advocate who owns the appointment.

---

### 5. ❌ Cancel Appointment (Client or Advocate)

**Route:**
`POST /api/appointment/cancel`

**Request Body:**

```json
{
  "appointment_id": "APPOINTMENT_UUID"
}
```

**Returns:**

```json
{
  "success": true,
  "message": "Appointment cancelled"
}
```

**Note:** Either party (client or advocate) can cancel the appointment.

---

## 🔐 Authentication Requirements

| Route                | Requires Login | Role         |
| -------------------- | -------------- | ------------ |
| `/connect` & `/feed` | ✅             | Advocate     |
| `/availability/:id`  | ❌             | Public       |
| `/book`              | ✅             | User         |
| `/confirm`           | ✅             | Advocate     |
| `/cancel`            | ✅             | Either party |

---

## 🖼️ Suggested UI Flow

| Step | Page               | UI Element                           |
| ---- | ------------------ | ------------------------------------ |
| 1    | Advocate Dashboard | “Connect Google Calendar” button     |
| 2    | Advocate Profile   | “Available Time Slots” section       |
| 3    | Booking Modal      | Date picker + slot selector          |
| 4    | Post-booking View  | Status: `pending` + Google Meet link |
| 5    | Advocate Panel     | Confirm / Cancel options             |

---

Let me know if you'd like:

- `.http` test files
- Swagger/OpenAPI docs
- Visual diagram or flowchart

You’re all set to send this to the frontend dev ✅
