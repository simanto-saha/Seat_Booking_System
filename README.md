## System Architecture

```text
Frontend (React / Django Templates)
                │
                ▼
        WebSocket (ASGI)
                │
                ▼
        Django Channels
                │
                ▼
Redis (Booking Lock)
                │
                ▼
    PostgreSQL Database
      (Final Booking Data)
```

### Flow

1. User selects a seat from the Frontend.
2. The request is sent through WebSocket (ASGI).
3. Django Channels handles real-time communication.
4. Redis temporarily locks the selected seat and manages shared state.
5. Once booking is confirmed, the data is saved in the PostgreSQL database.
6. Booking updates are instantly broadcast to all connected users.

### Tech Stack

- **Frontend:** React.js
- **Backend:** Django
- **Real-time Communication:** Django Channels
- **Protocol:** WebSocket (ASGI)
- **Cache & Locking:** Redis
- **Database:** PostgreSQL
- **Task Queue (Optional):** Celery
```
