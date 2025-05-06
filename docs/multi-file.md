# Multi-File Attachment Implementation Checklist (TDD Approach)

**Core Principle: All "Test Cases" outlined below require writing and passing corresponding automated tests. The TDD cycle (Red-Green-Refactor) should be followed.**

## Phase 1: Updating Data Structures and Core Sending Logic

### Test Case Group 1: `MessageData` and `HookMessageData` Structure (`message-interface.tsx`)
- [x] **Test 1.1:** `MessageData` has an optional `attachments` field (array of `MessageFile`).
- [x] **Test 1.2:** `MessageData` no longer has top-level `imgUrl`, `fileName`, `fileKey`, `fileType`.
- [x] **(Assumption):** `HookMessageData` mirrors this structure.

### Test Case Group 2: `createOptimisticMessage` (`message-interface.tsx`)
- [x] **Test 2.1:** Given content and an array of `MessageFile` objects, returns message with `content`, `attachments` array, and `type: 'file'`.
- [x] **Test 2.2:** Given content and no files, returns message with `content`, `attachments` as `undefined`/empty, and `type: 'message'`.

### Test Case Group 3: `handleSendMessage` (`message-interface.tsx`)
- [x] **Test 3.1:** With content and `MessageFile[]`, calls `createOptimisticMessage` correctly and constructs `messageData` with `attachments` array and `type: 'file'`.
- [x] **Test 3.2:** With content and no files, calls `createOptimisticMessage` correctly and constructs `messageData` with `attachments` as `undefined`/empty and `type: 'message'`.

## Phase 2: Updating `MessageArea.tsx` for UI and Sending Multiple Messages

### Test Case Group 4: `MessageAreaProps` (`MessageArea.tsx`)
- [x] **Test 4.1:** `onSendMessage` prop accepts optional `files` argument (`MessageFile[]`).

### Test Case Group 5: `handleSend` (`MessageArea.tsx`)
- [x] **Test 5.1:** 1-4 attachments + text: `onSendMessage` called once with text and all attachments.
- [x] **Test 5.2:** 5 attachments (MAX_PER_MESSAGE=4) + text:
    - [x] `onSendMessage` called first with text and first 4 attachments.
    - [x] `onSendMessage` called second with empty text and 5th attachment.
- [x] **Test 5.3:** > `MAX_TOTAL_ATTACHMENTS_TO_SEND` (e.g., 41, limit 40): only first 40 processed and sent in chunks.
- [x] **Test 5.4:** Only text: `onSendMessage` called with text and `undefined`/empty for files.
- [x] **Test 5.5:** After sending: `newMessageInput` and `messageAttachments` cleared; `onTyping(false)` called.

### Test Case Group 6: Rendering in `renderMessageContent` (`MessageArea.tsx`)
- [x] **Test 6.1:** Message with `content` and `attachments` renders content, then each attachment.
- [x] **Test 6.2:** Message with only `attachments` (no content) renders each attachment without extra space for content.

## Phase 3: Backend - Data Model and Server-Side Logic (`ts_server/server.js` & Database)
- [ ] **Update database message model:** Modify the schema (e.g., Prisma model) to support storing an array of attachments per message, replacing single attachment fields. This is a prerequisite for server-side persistence and will impact how messages are saved and retrieved.
- [ ] **(Impact Assessment):** `message` object received by server (e.g., in `socket.on('message', ...)`, `handleDirectMessage`) will now contain an `attachments` array.
- [ ] **(Impact Assessment):** `persistMessage` function in `ts_server/server.js` must be updated to handle the `attachments` array and save multiple attachment records linked to the message.
- [ ] **(External Dependency):** The backend API endpoint (e.g., `/api/messages/save`) called by `persistMessage` must be updated to accept and process the `attachments` array.

## Implementation Steps (based on TDD plan)

### `src/app/platform/messages/message-interface.tsx`
- [x] Update `MessageFile` (if necessary) and `MessageData` interface.
- [x] Update `createOptimisticMessage` function.
- [x] Update `handleSendMessage` function.

### `src/app/platform/messages/MessageArea.tsx`
- [x] Update `MessageAreaProps` interface for `onSendMessage`.
- [x] Update `handleSend` function for chunking and limits.
- [x] Update rendering logic in `renderMessageContent` for multiple attachments.
- [x] Remove old single `message.imgUrl` rendering logic.
