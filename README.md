## System Architecture

```text
      React Frontend
             │
             ▼
      WebSocket (ASGI)
             │
             ▼
      Django Channels
             │
             ▼
     Redis (Seat Lock)
             │
             ▼
      Django Backend
             │
             ▼
     PostgreSQL Database
     (Final Booking Data)
```

### Booking Flow

1. User selects a seat from the React frontend.
2. A WebSocket connection sends the request in real time.
3. Django Channels processes the incoming event.
4. Redis temporarily locks the seat to prevent double booking.
5. Django backend validates the booking request.
6. The booking is stored in PostgreSQL.
7. Updated seat status is broadcast to all connected users instantly.

### Tech Stack

- **Frontend:** React.js
- **Backend:** Django & Django REST Framework
- **Real-Time Communication:** Django Channels
- **Protocol:** WebSocket (ASGI)
- **Cache & Seat Locking:** Redis
- **Database:** PostgreSQL
- **Authentication:** JWT Authentication
- **Task Queue (Optional):** Celery
