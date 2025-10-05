# /app/rent/messages Image Upload Investigation

## Summary
- Reports of renters being unable to send image attachments were traced to the REST fallback used when the Socket.IO connection is unavailable.
- The upload itself succeeds (`/api/uploadthing/uploadFiles` returns signed URLs), but saving the message fails when we fall back to `createMessage()` because of a payload shape mismatch.

## What happens today
1. `MessageInputArea` uploads files to UploadThing and stores attachment objects shaped like `{ url, fileName, fileKey, fileType, fileSize }`.
2. `MessageInterface.handleSendMessage()` first attempts to emit the message over Socket.IO. If that succeeds, everything works (which is why the issue is hard to reproduce locally/for admins).
3. When the socket send fails (common for users behind strict firewalls / unreliable networks), we call the REST action `createMessage()` with the same attachment objects.
4. `createMessage()` (`src/app/actions/conversations.ts`) expects each attachment to expose a `fileUrl` property and writes `att.fileUrl` into the Prisma `Attachment.url` column.
5. Because the objects coming from the client only expose `url`, `att.fileUrl` is `undefined`, so Prisma throws `Argument url for data.attachments.createMany.data.0.url must not be undefined`, and the message stays in the "failed" state for affected renters.

## Reproduction path
- Reproduce locally by forcing the Socket.IO send to reject (e.g. stop the Go socket server or temporarily toggle `isConnected` to false). Sending a message with an attachment then triggers the REST fallback and logs the Prisma error above.
- With WebSocket connectivity intact you will not observe the bug, matching the reports that only some renters (those without working socket connections) are affected.

## Recommendation
- Normalize the attachment payload before calling `createMessage()` (map `url` → `fileUrl`, ensure the other fields align) or update `createMessage()` to accept `url` directly.
- Consider adding logging/telemetry around the REST fallback so we can detect similar schema mismatches faster.

## File references
- `src/app/app/rent/messages/message-interface.tsx` – `handleSendMessage` fallback to `createMessage` passes the raw attachment objects.
- `src/app/app/rent/messages/components/MessageInputArea.tsx` – upload handler builds attachment objects with a `url` property.
- `src/app/actions/conversations.ts` – `createMessage` maps `att.fileUrl` into Prisma, which is undefined for the objects received from the client.
