# Unread Message Notification Implementation Checklist

This checklist outlines the steps required to implement the feature where users receive a notification for messages that have been unread for more than two minutes.

- [ ] **1. Modify Database Schema (`prisma/schema.prisma`)**
    - [ ] Add `isRead` (Boolean, default: false) field to the `Message` model.
    - [ ] Add `readAt` (DateTime, optional) field to the `Message` model.
    - [ ] Add `notificationSentAt` (DateTime, optional) field to the `Message` model.
    - [ ] Add index `@@index([isRead, notificationSentAt, createdAt])` to the `Message` model.
    - [ ] Review `Notification` model (ensure `type`, `relatedId`, `userId`, `isRead` fields exist).
    - [ ] Review `User` and `Conversation` models for necessary relations (likely already exist).

- [ ] **2. Apply Database Migration**
    - [ ] Run `npx prisma generate` (optional, but good practice after schema changes).
    - [ ] Run `npx prisma migrate dev --name add_message_read_notification_fields` (or a similar descriptive name).
    - [ ] Verify the migration applied successfully to the database.

- [ ] **3. Update Message Reading Logic (`src/app/actions/messages.ts`)**
    - [ ] Modify the `markMessagesAsReadByTimestamp` function.
    - [ ] Remove logic that creates `MessageRead` records within this function (if it exists).
    - [ ] Add logic to perform `prisma.message.updateMany`.
    - [ ] Set `isRead: true` and `readAt: new Date()` for messages matching the criteria (correct conversation, not sender, before timestamp, `isRead: false`).
    - [ ] Ensure all client-side actions that mark messages as read eventually call this updated server action.

- [ ] **4. Implement Backend Cron Job**
    - [ ] Choose implementation method (e.g., Vercel Cron Job, `node-cron`, platform scheduler).
    - [ ] Create the cron job script/API route (e.g., `/app/api/cron/check-unread-messages/route.ts`).
    - [ ] Implement logic within the job:
        - [ ] Calculate the timestamp for "2 minutes ago".
        - [ ] Query `prisma.message.findMany` for messages where `isRead: false`, `notificationSentAt: null`, and `createdAt <= twoMinutesAgo`. Include conversation participants.
        - [ ] Iterate through found messages.
        - [ ] Determine recipient(s) for each message (participants excluding the sender).
        - [ ] Prepare notification data (consider grouping per user/conversation).
        - [ ] Create notification records using `prisma.notification.createMany`.
        - [ ] Update the processed messages using `prisma.message.updateMany` to set `notificationSentAt: new Date()`.
    - [ ] Configure the cron job schedule (e.g., every minute `*/1 * * * *`).
    - [ ] Add logging and error handling to the cron job.
    - [ ] *Optional:* Implement real-time push via WebSocket/Redis if needed.

- [ ] **5. Implement Frontend Notification UI**
    - [ ] Create UI component(s) to display notifications (e.g., notification bell/dropdown).
    - [ ] Fetch notifications for the logged-in user from the `Notification` table.
    - [ ] Implement logic to mark notifications as read (`isRead: true` in the `Notification` table) when the user interacts with them.
    - [ ] *Optional:* If real-time push is implemented, add WebSocket listeners to update the UI instantly.

- [ ] **6. Testing**
    - [ ] Test message reading updates the `isRead` flag in the database.
    - [ ] Manually trigger or wait for the cron job to run and verify notifications are created for old, unread messages.
    - [ ] Verify messages have `notificationSentAt` updated after the cron job runs.
    - [ ] Test the frontend UI displays notifications correctly.
    - [ ] Test marking notifications as read updates the database.
    - [ ] Test edge cases (group chats if applicable, multiple recipients, user offline/online).
