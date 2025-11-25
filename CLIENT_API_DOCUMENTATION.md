
### REST API Authentication
- **Method**: JWT token in HTTP cookies
- **Cookie Name**: `accessToken` (set by server after login)
- All requests must include credentials: `credentials: 'include'` in fetch requests

### Socket.io Authentication
- **Primary Method**: JWT token from cookies (automatically sent)
- **Fallback Method**: JWT token in connection handshake:
  - Query parameter: `?token=YOUR_JWT_TOKEN`
  - Or in auth object: `{ auth: { token: 'YOUR_JWT_TOKEN' } }`


### Chat Endpoints

#### 1. Create Chat
**POST** `/chats`

Creates a new chat conversation.

**Request Body:**
```json
{
  "contextType": "quote",
  "contextId": "quote_123",
  "participantType": "admin_user",
  "participants": [
    {
      "userId": "user_123",
      "participantType": "admin_user"
    },
    {
      "userId": "admin_456",
      "participantType": "admin_user"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "chatId": "chat_789",
  "contextType": "quote",
  "contextId": "quote_123",
  "participantType": "admin_user",
  "participants": [
    {
      "userId": "user_123",
      "participantType": "admin_user"
    },
    {
      "userId": "admin_456",
      "participantType": "admin_user"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User doesn't have permission
- `409 Conflict` - Chat already exists for this context

---

#### 2. Get User Chats
**GET** `/chats`

Retrieves all chats for the authenticated user.

**Query Parameters:** None

**Response:** `200 OK`
```json
{
  "chats": [
    {
      "chatId": "chat_789",
      "contextType": "quote",
      "contextId": "quote_123",
      "participantType": "admin_user",
      "participants": [
        {
          "userId": "user_123",
          "participantType": "admin_user"
        },
        {
          "userId": "admin_456",
          "participantType": "admin_user"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

#### 3. Get Chat by Context
**GET** `/chats/by-context`

Retrieves a chat based on context type and context ID.

**Query Parameters:**
- `contextType` (required) - Type of context (e.g., "quote")
- `contextId` (required) - ID of the context (e.g., quote ID)

**Example:** `/chats/by-context?contextType=quote&contextId=quote_123`

**Response:** `200 OK`
```json
{
  "chat": {
    "chatId": "chat_789",
    "contextType": "quote",
    "contextId": "quote_123",
    "participantType": "admin_user",
    "participants": [
      {
        "userId": "user_123",
        "participantType": "admin_user"
      },
      {
        "userId": "admin_456",
        "participantType": "admin_user"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (No Chat Found):** `200 OK`
```json
{
  "chat": null
}
```

**Error Responses:**
- `400 Bad Request` - Missing query parameters
- `401 Unauthorized` - Missing or invalid token

---

### Message Endpoints

#### 1. Send Message
**POST** `/messages`

Sends a message in a chat.

**Request Body:**
```json
{
  "chatId": "chat_789",
  "content": "Hello, I have a question about my quote."
}
```

**Response:** `201 Created`
```json
{
  "messageId": "msg_456",
  "chatId": "chat_789",
  "senderId": "user_123",
  "content": "Hello, I have a question about my quote.",
  "deliveryStatus": "sent",
  "createdAt": "2024-01-15T10:35:00.000Z",
  "readAt": null,
  "readBy": null
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data or message too long (max 5000 characters)
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User is not a participant in this chat
- `404 Not Found` - Chat not found

---

#### 2. Get Chat Messages
**GET** `/messages/chat/:chatId`

Retrieves messages for a specific chat with pagination.

**URL Parameters:**
- `chatId` (required) - The chat ID

**Query Parameters:**
- `page` (optional) - Page number (default: 1, min: 1)
- `limit` (optional) - Messages per page (default: 20, min: 1, max: 100)

**Example:** `/messages/chat/chat_789?page=1&limit=20`

**Response:** `200 OK`
```json
{
  "messages": [
    {
      "messageId": "msg_456",
      "chatId": "chat_789",
      "senderId": "user_123",
      "content": "Hello, I have a question about my quote.",
      "deliveryStatus": "read",
      "createdAt": "2024-01-15T10:35:00.000Z",
      "readAt": "2024-01-15T10:36:00.000Z",
      "readBy": "admin_456"
    },
    {
      "messageId": "msg_457",
      "chatId": "chat_789",
      "senderId": "admin_456",
      "content": "Sure, how can I help you?",
      "deliveryStatus": "read",
      "createdAt": "2024-01-15T10:36:30.000Z",
      "readAt": "2024-01-15T10:37:00.000Z",
      "readBy": "user_123"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

**Error Responses:**
- `400 Bad Request` - Invalid pagination parameters
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User is not a participant in this chat
- `404 Not Found` - Chat not found

---

#### 3. Mark Messages as Read
**POST** `/messages/chat/:chatId/mark-read`

Marks all unread messages in a chat as read for the authenticated user.

**URL Parameters:**
- `chatId` (required) - The chat ID

**Request Body:** None

**Response:** `200 OK`
```json
{
  "message": "Messages marked as read",
  "unreadCount": 0
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User is not a participant in this chat
- `404 Not Found` - Chat not found

---

#### 4. Get Unread Message Count for Chat
**GET** `/messages/chat/:chatId/unread-count`

Gets the unread message count for a specific chat.

**URL Parameters:**
- `chatId` (required) - The chat ID

**Response:** `200 OK`
```json
{
  "chatId": "chat_789",
  "unreadCount": 5
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User is not a participant in this chat
- `404 Not Found` - Chat not found

---

#### 5. Get Total Unread Message Count
**GET** `/messages/unread-count`

Gets the total unread message count across all chats for the authenticated user.

**Response:** `200 OK`
```json
{
  "totalUnreadCount": 12
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

### Notification Endpoints

#### 1. Create Notification
**POST** `/notifications`

Creates a new notification (typically used by system/admin).

**Request Body:**
```json
{
  "userId": "user_123",
  "type": "chat_message",
  "title": "New Message",
  "message": "You have a new message in your chat",
  "data": {
    "chatId": "chat_789",
    "messageId": "msg_456"
  }
}
```

**Response:** `201 Created`
```json
{
  "notificationId": "notif_789",
  "userId": "user_123",
  "type": "chat_message",
  "title": "New Message",
  "message": "You have a new message in your chat",
  "data": {
    "chatId": "chat_789",
    "messageId": "msg_456"
  },
  "isRead": false,
  "createdAt": "2024-01-15T10:40:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token

---

#### 2. Get User Notifications
**GET** `/notifications`

Retrieves notifications for the authenticated user with pagination and filtering.

**Query Parameters:**
- `page` (optional) - Page number (default: 1, min: 1)
- `limit` (optional) - Notifications per page (default: 20, min: 1, max: 100)
- `unreadOnly` (optional) - Filter only unread notifications (default: false)
- `type` (optional) - Filter by notification type (e.g., "chat_message")

**Example:** `/notifications?page=1&limit=20&unreadOnly=true&type=chat_message`

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "notificationId": "notif_789",
      "userId": "user_123",
      "type": "chat_message",
      "title": "New Message",
      "message": "You have a new message in your chat",
      "data": {
        "chatId": "chat_789",
        "messageId": "msg_456"
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:40:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "hasMore": false,
  "unreadCount": 1
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid token

---

#### 3. Mark Notification as Read
**POST** `/notifications/:notificationId/mark-read`

Marks a specific notification as read.

**URL Parameters:**
- `notificationId` (required) - The notification ID

**Request Body:** None

**Response:** `200 OK`
```json
{
  "message": "Notification marked as read",
  "notification": {
    "notificationId": "notif_789",
    "userId": "user_123",
    "type": "chat_message",
    "title": "New Message",
    "message": "You have a new message in your chat",
    "data": {
      "chatId": "chat_789",
      "messageId": "msg_456"
    },
    "isRead": true,
    "createdAt": "2024-01-15T10:40:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Notification not found

---

#### 4. Mark All Notifications as Read
**POST** `/notifications/mark-all-read`

Marks all notifications as read for the authenticated user.

**Request Body:** None

**Response:** `200 OK`
```json
{
  "message": "All notifications marked as read",
  "markedCount": 5
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

#### 5. Get Unread Notification Count
**GET** `/notifications/unread-count`

Gets the unread notification count for the authenticated user.

**Response:** `200 OK`
```json
{
  "unreadCount": 3
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

## Socket.io Events

### Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:YOUR_PORT', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});
```

### Chat Socket Events

#### Client → Server Events

##### `join-chat`
Join a chat room to receive real-time updates.

**Payload:**
```typescript
{
  chatId: string;
}
```

**Example:**
```typescript
socket.emit('join-chat', { chatId: 'chat_789' });
```

**Server Response Events:**
- `chat-joined` - Successfully joined
- `error` - Failed to join (with error message)

---

##### `leave-chat`
Leave a chat room.

**Payload:**
```typescript
{
  chatId: string;
}
```

**Example:**
```typescript
socket.emit('leave-chat', { chatId: 'chat_789' });
```

**Server Response Events:**
- `chat-left` - Successfully left
- `error` - Error occurred

---

#### Server → Client Events

##### `chat-joined`
Emitted when successfully joined a chat room.

**Payload:**
```typescript
{
  chatId: string;
}
```

**Example Handler:**
```typescript
socket.on('chat-joined', (data: { chatId: string }) => {
  console.log(`Joined chat: ${data.chatId}`);
});
```

---

##### `chat-left`
Emitted when successfully left a chat room.

**Payload:**
```typescript
{
  chatId: string;
}
```

**Example Handler:**
```typescript
socket.on('chat-left', (data: { chatId: string }) => {
  console.log(`Left chat: ${data.chatId}`);
});
```

---

##### `chat-created`
Emitted when a chat is created.

**Payload:**
```typescript
{
  chatId: string;
  contextType: string;
  contextId: string;
  participantType: ParticipantType;
  participants: Array<{
    userId: string;
    participantType: ParticipantType;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

**Example Handler:**
```typescript
socket.on('chat-created', (chat) => {
  console.log('Chat created:', chat);
});
```

---

##### `user-online`
Emitted to other participants when a user joins a chat (for double gray tick).

**Payload:**
```typescript
{
  userId: string;
  chatId: string;
}
```

**Example Handler:**
```typescript
socket.on('user-online', (data: { userId: string; chatId: string }) => {
  console.log(`User ${data.userId} is now online in chat ${data.chatId}`);
  // Update message delivery status to DELIVERED (double gray tick)
});
```

---

##### `error` (Chat)
Emitted when a chat-related error occurs.

**Payload:**
```typescript
{
  message: string;
  code?: string;
}
```

**Example Handler:**
```typescript
socket.on('error', (error: { message: string; code?: string }) => {
  console.error('Chat error:', error);
});
```

---

### Message Socket Events

> **Note**: Message mutations (send, mark as read) are now handled via REST API. Socket events are automatically emitted by the server after successful REST operations for real-time notifications. Socket events are only used for real-time-only features like typing indicators.

#### Client → Server Events (Real-time Only)

##### `typing-start`
Indicate that the user is typing in a chat.

**Payload:**
```typescript
{
  chatId: string;
}
```

**Example:**
```typescript
socket.emit('typing-start', { chatId: 'chat_789' });
```

**Note:** Typing indicator automatically stops after 3 seconds of inactivity, or you can manually emit `typing-stop`.

---

##### `typing-stop`
Stop the typing indicator.

**Payload:**
```typescript
{
  chatId: string;
}
```

**Example:**
```typescript
socket.emit('typing-stop', { chatId: 'chat_789' });
```

---

#### Server → Client Events

> **Note**: These events are automatically emitted by the server after successful REST API operations (POST /messages, POST /messages/chat/:chatId/mark-read, POST /chats). You don't need to send these events from the client.

##### `message-sent`
Emitted when a message is successfully sent.

**Payload:**
```typescript
{
  messageId: string;
  chatId: string;
  senderId: string;
  content: string;
  deliveryStatus: 'sent';
  createdAt: string;
  readAt: null;
  readBy: null;
}
```

**Example Handler:**
```typescript
socket.on('message-sent', (message) => {
  console.log('Message sent:', message);
  // Display message with single tick (SENT status)
});
```

---

##### `message-delivered`
Emitted when a message is delivered to an online recipient (double gray tick).

**Payload:**
```typescript
{
  messageId: string;
  chatId: string;
}
```

**Example Handler:**
```typescript
socket.on('message-delivered', (data: { messageId: string; chatId: string }) => {
  console.log(`Message ${data.messageId} delivered in chat ${data.chatId}`);
  // Update message delivery status to DELIVERED (double gray tick)
});
```

---

##### `message-read`
Emitted when messages in a chat are marked as read (double blue tick).

**Payload:**
```typescript
{
  messageId: string;
  chatId: string;
  readBy: string;
}
```

**Example Handler:**
```typescript
socket.on('message-read', (data: { messageId: string; chatId: string; readBy: string }) => {
  console.log(`Message ${data.messageId} read by ${data.readBy}`);
  // Update message delivery status to READ (double blue tick)
});
```

---

##### `typing`
Emitted when another user is typing in a chat.

**Payload:**
```typescript
{
  chatId: string;
  userId: string;
}
```

**Example Handler:**
```typescript
socket.on('typing', (data: { chatId: string; userId: string }) => {
  console.log(`User ${data.userId} is typing in chat ${data.chatId}`);
  // Show typing indicator
});
```

---

##### `typing-stopped`
Emitted when a user stops typing.

**Payload:**
```typescript
{
  chatId: string;
  userId: string;
}
```

**Example Handler:**
```typescript
socket.on('typing-stopped', (data: { chatId: string; userId: string }) => {
  console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`);
  // Hide typing indicator
});
```

---

##### `error` (Message)
Emitted when a message-related error occurs.

**Payload:**
```typescript
{
  message: string;
  code?: string;
}
```

**Example Handler:**
```typescript
socket.on('error', (error: { message: string; code?: string }) => {
  console.error('Message error:', error);
});
```

---

### Notification Socket Events

#### Client → Server Events

##### `get-unread-count`
Request the current unread notification count.

**Payload:** None (empty object)

**Example:**
```typescript
socket.emit('get-unread-count', {});
```

**Server Response Events:**
- `unread-count-updated` - Unread count received

---

#### Server → Client Events

##### `notification-received`
Emitted when a new notification is received.

**Payload:**
```typescript
{
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
```

**Example Handler:**
```typescript
socket.on('notification-received', (notification) => {
  console.log('New notification:', notification);
  // Show notification badge, play sound, etc.
});
```

---

##### `unread-count-updated`
Emitted when the unread notification count is updated.

**Payload:**
```typescript
{
  unreadCount: number;
}
```

**Example Handler:**
```typescript
socket.on('unread-count-updated', (data: { unreadCount: number }) => {
  console.log(`Unread notifications: ${data.unreadCount}`);
  // Update notification badge count
});
```

---

##### `error` (Notification)
Emitted when a notification-related error occurs.

**Payload:**
```typescript
{
  message: string;
  code?: string;
}
```

**Example Handler:**
```typescript
socket.on('error', (error: { message: string; code?: string }) => {
  console.error('Notification error:', error);
});
```

---

## Data Types and Enums

### ParticipantType
```typescript
enum ParticipantType {
  ADMIN_USER = 'admin_user',      // Chat between admin and user
  ADMIN_DRIVER = 'admin_driver',  // Chat between admin and driver
  DRIVER_USER = 'driver_user'     // Chat between driver and user
}
```

### MessageDeliveryStatus
```typescript
enum MessageDeliveryStatus {
  SENT = 'sent',        // Message saved to database (single tick)
  DELIVERED = 'delivered',  // Recipient is online (double gray tick)
  READ = 'read'         // Recipient actively viewing chat (double blue tick)
}
```

### NotificationType
```typescript
enum NotificationType {
  CHAT_MESSAGE = 'chat_message'  // New chat message notification
}
```

### Context Types
- `'quote'` - Chat associated with a quote

---

## Error Handling

### REST API Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "message": "Error message here",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

### Common Error Codes

- `INVALID_QUOTE_ID` - Invalid quote ID format
- `INVALID_USER_ID` - Invalid user ID format
- `INVALID_CHAT_ID` - Invalid chat ID format
- `QUOTE_NOT_FOUND` - Quote not found
- `CHAT_NOT_FOUND` - Chat not found
- `FORBIDDEN` - User doesn't have permission
- `BAD_REQUEST` - Invalid request data
- `UNAUTHORIZED` - Missing or invalid authentication token

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., chat already exists)
- `500 Internal Server Error` - Server error

### Socket.io Error Format

Socket errors are emitted with this structure:

```typescript
{
  message: string;  // Error message
  code?: string;    // Optional error code
}
```

---

## Message Delivery Status

The system uses three delivery statuses to indicate message state:

### 1. SENT (Single Tick)
- **Status**: `'sent'`
- **Meaning**: Message has been saved to the database, but recipient is NOT online
- **When**: Message is sent and recipient is offline (not connected to Socket.io)
- **Display**: Single gray tick
- **Event**: `message-sent` is emitted

### 2. DELIVERED (Double Gray Tick)
- **Status**: `'delivered'`
- **Meaning**: Recipient is online (globally connected to Socket.io)
- **When**: Message is sent and recipient is online (has active socket connection)
- **Display**: Double gray tick
- **Event**: `message-delivered` is emitted
- **Note**: This happens automatically when recipient is online, regardless of whether they've opened the chat

### 3. READ (Double Blue Tick)
- **Status**: `'read'`
- **Meaning**: Recipient is online AND has opened/joined the chat room
- **When**: Recipient joins the chat room via `join-chat` socket event (automatic)
- **Display**: Double blue tick
- **Event**: `message-read` is emitted
- **Note**: Messages are automatically marked as read when user joins the chat room - no manual API call needed

### Status Flow Example

```typescript
// 1. User A sends message via REST API
fetch('/api/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ chatId: 'chat_789', content: 'Hello' })
});

// Server checks if User B (recipient) is globally online
// If User B is offline:
//   - Status: SENT (single tick) ✓
//   - Server emits 'message-sent' event

// If User B is online (connected to socket):
//   - Status: DELIVERED (double gray tick) ✓
//   - Server automatically emits 'message-delivered' event

// 2. User B opens chat (joins chat room)
socket.emit('join-chat', { chatId: 'chat_789' });

// Server automatically marks all unread messages as read
// Status: READ (double blue tick) ✓
// Server automatically emits 'message-read' event to all participants
```

---

## Integration Notes

### Architecture Overview
- **REST API**: All mutations (send message, mark as read, create chat) are handled via REST endpoints
- **Socket.io**: Used only for real-time notifications and features:
  - Real-time message notifications (emitted automatically after REST operations)
  - Typing indicators
  - Presence management (join/leave chat)
- **Real-time Updates**: After successful REST operations, the server automatically emits socket events to connected clients for real-time UI updates

### Quote Integration
- Chat becomes available when quote status is `SUBMITTED` or later
- Check `chatAvailable` and `chatId` fields in quote response
- Use `contextType: 'quote'` and `contextId: <quoteId>` when creating chats via REST API

### CORS Configuration
- Ensure `credentials: true` is set in Socket.io client options
- REST API requests must include `credentials: 'include'` in fetch options

### Reconnection Handling
Socket.io automatically handles reconnection. Listen to connection events:

```typescript
socket.on('connect', () => {
  // Rejoin chat rooms if needed
  socket.emit('join-chat', { chatId: 'chat_789' });
});

socket.on('disconnect', () => {
  // Handle disconnection
});
```

### Typing Indicator Timeout
- Typing indicator automatically stops after 3 seconds of inactivity
- Manually emit `typing-stop` when user stops typing or sends a message

---

