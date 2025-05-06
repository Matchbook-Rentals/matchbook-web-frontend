# Message Interface Refactoring Plan

This document outlines the steps to refactor the `src/app/platform/messages/message-interface.tsx` component for improved maintainability, readability, and separation of concerns.

## Phase 1: Extract WebSocket Logic into a Custom Hook

-   [X] Create `src/hooks/useWebSocketManager.ts` (or similar path).
-   [X] Create TDD test file `src/hooks/useWebSocketManager.test.ts`.
-   [X] Implement the basic hook structure in `useWebSocketManager.ts` to resolve the import error.
    -   *Status: Tests now fail with `ReferenceError: jest is not defined`.*
-   [X] Convert Jest mocking syntax (`jest.mock`, `jest.fn`, `jest.clearAllMocks`, etc.) to Vitest syntax (`vi.mock`, `vi.fn`, `vi.clearAllMocks`, etc.) in `src/hooks/useWebSocketManager.test.ts`.
-   [x] Implement hook logic incrementally to make tests pass (Connection, State, Resilience, Interface).
-   [x] Define and implement the hook's interface driven by tests:
    -   Inputs: `userId`, `socketUrl`.
    -   Outputs: `isConnected`, `circuitOpen`, `sendMessage`, `sendTyping`, `sendReadReceipt`, `retryConnection`.
    -   Callbacks as props: `onMessageReceived`, `onTypingReceived`, `onReadReceiptReceived`, `onConnectionStatusChange`.
-   [x] Ensure all tests in `src/hooks/useWebSocketManager.test.ts` pass.
-   [x] Update `MessageInterface.tsx` to use this hook, removing the extracted logic.

## Phase 2: Integration Testing for WebSocket Connection

-   [x] Create a separate suite of integration tests (e.g., `src/hooks/useWebSocketManager.integration.test.ts`).
-   [x] Configure the test environment to run against a real (dev/test) instance of the WebSocket server.
-   [x] Write tests to verify:
    -   [x] Basic connection establishment.
    -   [x] Sending a message and confirming server receipt (e.g., via echo or server-side check).
    -   [x] Receiving a message broadcast from the server.
-   [ ] Note: These tests will focus on the client-server interaction and may not cover all resilience edge cases testable via mocks.

## Phase 3: Extract Conversation State and Logic into a Custom Hook

-   [x] Create `src/hooks/useConversationManager.ts` (or similar path).
-   [x] Create TDD test file `src/hooks/useConversationManager.test.ts`.
-   [x] Implement the basic hook structure in `useConversationManager.ts` to resolve import errors in the test file.
-   [x] Move conversation-related state (`allConversations`, `selectedConversationId`, `typingUsers`, `unreadHostMessages`, `unreadTenantMessages`, `tabs`) into this hook, driven by tests.
-   [x] Move logic for handling incoming WebSocket events (e.g., processing received messages, typing indicators, read receipts) into handlers within this hook (e.g., `onMessageReceived`, `onTypingReceived`, `onReadReceiptReceived`), driven by TDD.
-   [x] Move logic for selecting conversations (previously `handleSelectConversation`) into a function exposed by this hook (e.g., `selectConversation`), driven by TDD.
-   [x] Inject dependencies: `initialConversations`, `currentUser`, and relevant server actions/callbacks (like `sendReadReceiptAction`, `persistMessagesAsReadAction`), driven by TDD.
-   [x] Define and implement the hook's interface for its state outputs (like `selectedConversationId`, `allConversations`, `typingUsers`, `unreadHostMessages`, `unreadTenantMessages`, `tabs`) and exposed action handlers (like `selectConversation`), driven by tests for incoming logic.
-   [x] Ensure all tests for *incoming* logic in `src/hooks/useConversationManager.test.ts` pass.
-   [x] Move logic for *sending* messages (previously `handleSendMessage`), including optimistic updates and fallback mechanisms, into a function exposed by `useConversationManager` (e.g., `sendMessage`), driven by TDD.
    -   [x] Inject necessary dependencies for sending messages (e.g., `createMessage` server action, `useWebSocketManager.sendMessage`).
    -   [x] Write tests for `sendMessage` in `useConversationManager.test.ts`, covering optimistic UI, WebSocket success, WebSocket failure with REST fallback, and REST failure.
-   [x] Move logic for *sending* typing status (previously `sendTypingStatus`) into a function exposed by `useConversationManager` (e.g., `sendTyping`), driven by TDD.
    -   [x] Inject `useWebSocketManager.sendTyping` as a dependency.
    -   [x] Write tests for `sendTyping` in `useConversationManager.test.ts`.
-   [x] Move logic for creating conversations (previously `handleCreateConversation`) into a function exposed by `useConversationManager` (e.g., `createConversation`), driven by TDD.
    -   [x] Inject `createConversation` server action as a dependency.
    -   [x] Write tests for `createConversation` in `useConversationManager.test.ts`.
-   [x] Move logic for deleting conversations (previously `handleDeleteAllConversations` or similar for single deletion if applicable) into functions exposed by `useConversationManager` (e.g., `deleteConversation`), driven by TDD.
    -   [x] Inject `deleteConversation` server action as a dependency.
    -   [x] Write tests for `deleteConversation` in `useConversationManager.test.ts`.
-   [ ] Move logic for changing tabs (previously `setTabs`) into a function exposed by `useConversationManager` (e.g., `changeTab`), and update the `tabs` state within the hook, driven by TDD.
    -   [ ] Write tests for `changeTab` in `useConversationManager.test.ts`.
-   [ ] Ensure all tests (incoming and outgoing logic) in `src/hooks/useConversationManager.test.ts` pass.
-   [ ] Update `MessageInterface.tsx` to use the fully-featured `useConversationManager` hook, removing all extracted state and logic (both incoming and outgoing).
-   [ ] Refine the hook's output interface if necessary (e.g., derived state like `filteredConversations`, `selectedConversation`, `messagesForSelectedConversation`, `isOtherUserTypingInSelected`).

## Phase 4: Move Utilities and Minor Components

-   [ ] Create `src/app/platform/messages/utils/conversationUtils.ts` (or similar).
-   [ ] Move pure utility functions (`conversationHasUnreadMessages`, `addMessageToConversation`, `updateMessageInConversation`, `markMessagesAsRead`, `updateMessagesReadTimestamp`, `filterConversationsByRole`, `createOptimisticMessage`) into `conversationUtils.ts`. Update imports.
-   [ ] Move `useMobileDetect` hook to a shared location (e.g., `src/hooks/useMobileDetect.ts`). Update imports.
-   [ ] Create `src/app/platform/messages/components/ConnectionStatusIndicator.tsx`.
-   [ ] Move the connection status display logic and UI from `MessageInterface.tsx` into `ConnectionStatusIndicator.tsx`.
-   [ ] Update `MessageInterface.tsx` to use the new `ConnectionStatusIndicator` component.

## Phase 5: Simplify the Main `MessageInterface` Component

-   [ ] Review `MessageInterface.tsx`.
-   [ ] Ensure it primarily orchestrates the hooks and renders child components.
-   [ ] Remove any remaining complex logic that should belong in the hooks or utility files.
-   [ ] Manage only essential UI state (like `sidebarVisible`).
-   [ ] Pass props (state and handlers) from the hooks down to `ConversationList`, `MessageArea`, `ConnectionStatusIndicator`, etc.
-   [ ] Verify the `convo` search parameter logic is handled correctly (likely within `useConversationManager` initialization).

