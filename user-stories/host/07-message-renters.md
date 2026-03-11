# Story: Message Renters

## Description
A host can communicate with renters through the messaging system. Conversations are tied to listings.

## Acceptance Criteria
- [ ] Host can view all conversations at `/app/host/messages`
- [ ] Host can send and receive messages in conversation threads
- [ ] Conversations are associated with specific listings
- [ ] Host can initiate a message to an applicant

## Relevant Files
- `src/app/app/host/messages/page.tsx`
- `src/app/app/host/messages/message-interface.tsx`
- `src/components/ui/message-guest-dialog.tsx`
- `src/app/actions/conversations.ts`
- `src/app/actions/messages.ts`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/host-basics.spec.ts` → "Story 07: Messages"
- **Test Coverage Notes:** Tests host can access messages page.
