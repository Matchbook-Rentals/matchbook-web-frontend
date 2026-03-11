# Story: Guest Cannot Message Hosts (Prompted to Sign In)

## Description
A guest cannot send messages to hosts. When they attempt to do so, they are prompted to sign in via an auth modal.

## Acceptance Criteria
- [ ] Message/contact host button is visible on listing details
- [ ] Clicking the message button as a guest triggers a sign-in prompt
- [ ] The auth modal is displayed (not a redirect)
- [ ] No message is sent until the guest authenticates

## Relevant Files
- `src/components/ui/search-message-host-dialog.tsx`
- `src/app/actions/messages.ts`
- `src/app/actions/conversations.ts`
- `src/components/guest-auth-modal.tsx`
- `src/contexts/guest-trip-context-provider.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/guest-restrictions.spec.ts` → "Story 07: Cannot Message Hosts"
- **Test Coverage Notes:** Tests message button is either hidden for guests or triggers auth prompt.
