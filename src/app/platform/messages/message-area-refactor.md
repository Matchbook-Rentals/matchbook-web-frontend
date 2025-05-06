# Refactoring Checklist for MessageArea.tsx (TDD Approach)

The main goal is to break down the large `MessageArea.tsx` component into smaller, more manageable, and testable sub-components. This will improve readability, maintainability, and allow for isolated testing of each part.

## 1. Setup & Analysis:
- [ ] Ensure your testing environment (e.g., Vitest, jsdom, React Testing Library) is correctly configured for testing React components and hooks.
- [ ] Thoroughly analyze `MessageArea.tsx`:
    - Identify its core responsibilities (e.g., displaying a list of messages, handling message input, managing file attachments, WebSocket interactions via hooks).
    - Pinpoint distinct UI sections and logic blocks that can be extracted into separate components or custom hooks.

## 2. Iterative Component Extraction (Repeat for each new component):

### `MessageList` Component (Displays the list of messages):
- [ ] **Define API:** Determine props (e.g., `messages: WebSocketMessageData[]`, `currentUser: User`, `onRetrySendMessage: (messageId: string) => void`).
- [ ] **Write Tests (TDD):**
    - [ ] Renders correctly with a list of messages.
    - [ ] Renders an empty state/placeholder when there are no messages.
    - [ ] Correctly passes necessary props to child `MessageItem` components.
    - [ ] Handles scrolling behavior (e.g., auto-scroll to bottom for new messages).
- [ ] **Implement:** Create `MessageList.tsx` and implement the component to make tests pass.
- [ ] **Integrate:** Replace the message listing logic in `MessageArea.tsx` with the new `<MessageList />` component.

### `MessageItem` Component (Displays an individual message):
- [ ] **Define API:** Determine props (e.g., `message: WebSocketMessageData`, `isCurrentUser: boolean`, `onDownloadAttachment: (url: string, fileName: string) => void`, `onRetry: () => void`).
- [ ] **Write Tests (TDD):**
    - [ ] Renders message content (text, timestamp, sender).
    - [ ] Differentiates styling for messages from the current user vs. other users.
    - [ ] Displays file attachments (if any) with download links/buttons.
    - [ ] Calls `onDownloadAttachment` when an attachment download is triggered.
    - [ ] Shows status indicators (e.g., sending, sent, failed) and retry options for failed messages.
- [ ] **Implement:** Create `MessageItem.tsx` and implement the component to make tests pass.
- [ ] **Integrate:** Use `<MessageItem />` within the `MessageList` component.

### `MessageInputArea` Component (Handles text input, send button, attachments):
- [ ] **Define API:** Determine props (e.g., `onSendMessage: (text: string, attachments: File[]) => void`, `onSendTyping: () => void`, `disabled: boolean`).
- [ ] **Write Tests (TDD):**
    - [ ] Renders text input, send button, and attachment button.
    - [ ] Calls `onSendMessage` with text and attachments when the send button is clicked or Enter is pressed.
    - [ ] Calls `onSendTyping` when the input value changes.
    - [ ] Handles file selection via the attachment button.
    - [ ] Displays previews for selected attachments (consider an `AttachmentPreview` sub-component if complex).
    - [ ] Clears input and attachment previews after a message is sent.
    - [ ] Disables input/buttons when `disabled` prop is true.
- [ ] **Implement:** Create `MessageInputArea.tsx` and implement the component to make tests pass.
- [ ] **Integrate:** Replace the input logic in `MessageArea.tsx` with the new `<MessageInputArea />` component.

### (Optional) `AttachmentPreviewItem` Component (Displays a single selected attachment before sending):
- [ ] **Define API:** Props like `file: File`, `onRemove: (file: File) => void`.
- [ ] **Write Tests (TDD):**
    - [ ] Renders file name, size, and a remove button.
    - [ ] Calls `onRemove` when the remove button is clicked.
- [ ] **Implement:** Create `AttachmentPreviewItem.tsx`.
- [ ] **Integrate:** Use within `MessageInputArea.tsx`.

## 3. Hook Refinement (If necessary):
- [ ] Review `useWebSocketManager` and any other custom hooks directly used or heavily influencing `MessageArea.tsx`.
- [ ] **Write Tests (TDD) for Hooks:** Ensure hooks are testable in isolation (e.g., using `@testing-library/react-hooks`).
    - Test state transitions, function calls, and effects.
- [ ] **Refactor Hooks:**
    - Ensure hooks have a single, clear responsibility.
    - Break down overly complex hooks if possible.
    - Optimize dependencies to prevent unnecessary re-renders or re-executions.

## 4. Update `MessageArea.tsx` (The Orchestrator):
- [ ] `MessageArea.tsx` will now primarily orchestrate the new sub-components.
- [ ] Manage state that needs to be shared between the new components (lift state up if necessary).
- [ ] Pass down props and callbacks to the sub-components.
- [ ] **Write/Update Integration Tests for `MessageArea.tsx`:**
    - Test the interaction between the sub-components.
    - Ensure data flows correctly (e.g., sending a message updates the `MessageList`).
    - Verify overall functionality remains intact.

## 5. Styling:
- [ ] Ensure styles are correctly migrated or applied to the new components.
- [ ] Maintain consistency in styling (e.g., using CSS Modules, Tailwind CSS, styled-components). Co-locate styles with their components where appropriate.

## 6. Final Review and Cleanup:
- [ ] Remove any dead code from the original `MessageArea.tsx` and any new files.
- [ ] Ensure consistent code formatting and adherence to project linting rules.
- [ ] Perform a final manual test of all messaging functionalities.
- [ ] Review for any performance regressions or opportunities for optimization.
