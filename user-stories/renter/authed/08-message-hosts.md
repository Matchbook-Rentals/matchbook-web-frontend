# Story: Message Hosts

## Description
An authenticated renter can send messages to hosts from the listing detail page or search results, and manage ongoing conversations in a dedicated messages view.

## Acceptance Criteria
- [ ] Renter can click "Message Host" from a listing to open a dialog
- [ ] Sending a message creates a conversation if one doesn't exist
- [ ] Renter can view all conversations at `/app/rent/messages`
- [ ] Messages are displayed in a conversation thread
- [ ] Conversation list shows all active conversations with hosts

## Relevant Files
- `src/components/ui/search-message-host-dialog.tsx`
- `src/app/app/rent/messages/page.tsx`
- `src/app/app/rent/messages/messages-page-client.tsx`
- `src/app/app/rent/messages/message-interface.tsx`
- `src/app/app/rent/messages/components/MessageArea.tsx`
- `src/app/app/rent/messages/components/ConversationList.tsx`
- `src/app/actions/messages.ts`
- `src/app/actions/conversations.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
