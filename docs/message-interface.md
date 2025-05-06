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
-   [ ] Update `MessageInterface.tsx` to use this hook, removing the extracted logic.

## Phase 2: Integration Testing for WebSocket Connection

-   [ ] Create a separate suite of integration tests (e.g., `src/hooks/useWebSocketManager.integration.test.ts`).
-   [ ] Configure the test environment to run against a real (dev/test) instance of the WebSocket server.
-   [ ] Write tests to verify:
    -   Basic connection establishment.
    -   Sending a message and confirming server receipt (e.g., via echo or server-side check).
    -   Receiving a message broadcast from the server.
-   [ ] Note: These tests will focus on the client-server interaction and may not cover all resilience edge cases testable via mocks.

## Phase 3: Extract Conversation State and Logic into a Custom Hook

-   [ ] Create `src/hooks/useConversationManager.ts` (or similar path).
-   [ ] Move conversation-related state (`allConversations`, `selectedConversationId`, `typingUsers`, `unreadHostMessages`, `unreadTenantMessages`, `tabs`) into this hook.
-   [ ] Move logic for handling incoming WebSocket events (previously in `handleWebSocketMessage`) into handlers within this hook, triggered by callbacks from `useWebSocketManager`.
-   [ ] Move logic for sending messages (`handleSendMessage`), selecting conversations (`handleSelectConversation`), sending typing status (`sendTypingStatus`), creating/deleting conversations, and changing tabs into functions exposed by this hook.
-   [ ] Inject dependencies: `initialConversations`, `user`, server actions (`createMessage`, etc.), and the `useWebSocketManager` hook's outputs/callbacks.
-   [ ] Define the hook's interface:
    -   Outputs: `filteredConversations`, `selectedConversation`, `messages`, `isOtherUserTyping`, `unreadCounts`, `activeTab`.
    -   Action handlers: `selectConversation`, `sendMessage`, `createConversation`, `deleteConversation`, `sendTypingStatus`, `changeTab`.
-   [ ] Update `MessageInterface.tsx` to use this hook, removing the extracted state and logic.

## Phase 3: Move Utilities and Minor Components

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

