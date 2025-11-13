# Queue Contracts

This directory contains the schemas and contracts that define the structure of messages passed between services via Redis queues.

## Purpose

Contracts ensure that the **TypeScript frontend (Next.js)** and **Java backend (worker)** agree on the exact structure of queue messages. This prevents:

- Serialization/deserialization errors
- Type mismatches
- Missing required fields
- Runtime failures due to schema drift

## Contract Files

### Email Job Contract

**Schema**: [`schemas/email-job.v1.schema.json`](./schemas/email-job.v1.schema.json)

Defines the structure of email jobs sent from Next.js to the Java email worker.

**Implementations**:
- **TypeScript**: `src/lib/email-queue-client.ts` (EmailJob interface)
- **Java**: `java_backend/worker/src/main/java/com/matchbook/worker/model/EmailJob.java`

**Redis Queues**:
- `matchbook:emails:pending` - New jobs waiting to be processed
- `matchbook:emails:processing` - Jobs currently being processed by worker
- `matchbook:emails:failed` - Failed jobs with retry history
- `matchbook:emails:dlq` - Dead letter queue (jobs that exceeded max retries)

## Using Contracts

### As a Developer

1. **Before changing queue structure**: Update the JSON Schema first
2. **After schema changes**: Update both TypeScript and Java implementations
3. **Version bumps**: Use semantic versioning for breaking changes (v1 → v2)

### Schema Reference

All schemas follow [JSON Schema Draft 7](https://json-schema.org/draft-07/schema) specification.

**Key fields explained**:

- `$schema` - JSON Schema version
- `$id` - Unique identifier for this schema
- `required` - Fields that must always be present
- `properties` - Field definitions with types and constraints
- `additionalProperties: false` - Reject unknown fields
- `examples` - Valid example payloads

## Email Job Contract (v1)

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `to` | string (email) | Recipient email address |
| `subject` | string | Email subject line (1-998 chars) |
| `html` | string | HTML email body content |
| `jobId` | string (UUID) | Unique job identifier |
| `enqueuedAt` | integer | Unix timestamp (ms) when enqueued |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `from` | string | Sender email address | `MatchBook Rentals <no-reply@matchbookrentals.com>` |
| `replyTo` | string (email) | Reply-to address | - |
| `metadata` | object | String key-value pairs for tracking | - |
| `attemptNumber` | integer (1-3) | Current attempt number | 1 |

### Example Valid Payload

```json
{
  "to": "customer@example.com",
  "subject": "Welcome to MatchBook!",
  "html": "<h1>Welcome</h1><p>Thank you for signing up!</p>",
  "from": "MatchBook Rentals <no-reply@matchbookrentals.com>",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "enqueuedAt": 1699564800000,
  "attemptNumber": 1,
  "metadata": {
    "userId": "user_123",
    "notificationType": "welcome_email"
  }
}
```

## Retry Behavior

The Java worker processes email jobs with the following retry logic:

1. **Attempt 1**: Immediate processing
2. **Attempt 2**: 2 second delay (if attempt 1 fails)
3. **Attempt 3**: 4 second delay (if attempt 2 fails)
4. **After 3 failures**: Move to dead letter queue (`matchbook:emails:dlq`)

The `attemptNumber` field is updated by the worker between retries.

## Queue Flow

```
┌─────────────┐
│  Next.js    │
│  (Producer) │
└──────┬──────┘
       │ 1. Enqueue EmailJob
       │    (LPUSH to pending queue)
       ▼
┌─────────────────┐
│ Redis Queue     │
│ pending         │◄───┐
└────────┬────────┘    │
         │             │ 2. Poll & Process
         │             │    (RPOPLPUSH)
         │        ┌────┴──────────┐
         │        │  Java Worker  │
         │        │  (Consumer)   │
         │        └────┬──────────┘
         │             │
         │             ├─ Success → Remove from queue
         │             │
         │             ├─ Failure → Retry (increment attemptNumber)
         │             │
         │             └─ Max retries → Move to DLQ
         ▼
┌─────────────────┐
│ Dead Letter     │
│ Queue (DLQ)     │
└─────────────────┘
```

## Validation

Currently, validation is **manual** (developers must ensure implementations match the schema).

**Future enhancements**:
- Runtime validation in TypeScript (using Ajv or Zod)
- Runtime validation in Java (using json-schema-validator)
- Code generation from schema
- Automated tests to verify contract compliance

## Versioning Strategy

### Semantic Versioning

- **Major version (v1 → v2)**: Breaking changes (remove fields, change types)
- **Minor version (v1.1)**: Add optional fields (backward compatible)
- **Patch version (v1.0.1)**: Documentation fixes only

### Breaking Changes

If you need to make a breaking change:

1. Create new schema file: `email-job.v2.schema.json`
2. Update implementations to support both v1 and v2
3. Add version field to payload for runtime routing
4. Deprecate v1 after migration period
5. Remove v1 support after all producers/consumers upgraded

### Non-Breaking Changes

Adding optional fields is safe:

1. Update schema with new optional field
2. Update implementations (consumer can ignore unknown fields)
3. No version bump needed (still v1)

## Contract Testing

To verify implementations match the schema:

### TypeScript

```typescript
import { emailQueueClient } from '@/lib/email-queue-client';

// This should match the schema exactly
await emailQueueClient.enqueue({
  to: 'test@example.com',
  subject: 'Test',
  html: '<h1>Test</h1>',
});
```

### Java

Check that the worker successfully deserializes and processes jobs from the queue.

### Manual Testing

1. Push a test job to Redis:
   ```bash
   redis-cli LPUSH matchbook:emails:pending '{
     "to": "test@example.com",
     "subject": "Test Email",
     "html": "<h1>Test</h1>",
     "jobId": "550e8400-e29b-41d4-a716-446655440000",
     "enqueuedAt": 1699564800000,
     "attemptNumber": 1
   }'
   ```

2. Check worker logs to verify processing

3. Check queue stats: `curl http://localhost:8080/health/queue`

## Future Contracts

As the system grows, add new contracts for:

- Background check processing jobs
- Payment notification events
- Image/file processing jobs
- Webhook event processing
- Batch data synchronization

Follow the same pattern:
1. Create schema in `contracts/schemas/`
2. Document in this README
3. Implement in both TypeScript and Java
4. Add cross-references in code comments

## Resources

- **JSON Schema**: https://json-schema.org
- **Email Queue Setup**: [`/java_backend/EMAIL_QUEUE_SETUP.md`](../java_backend/EMAIL_QUEUE_SETUP.md)
- **Worker README**: [`/java_backend/worker/README.md`](../java_backend/worker/README.md)
- **TypeScript Implementation**: [`/src/lib/email-queue-client.ts`](../src/lib/email-queue-client.ts)
- **Java Implementation**: [`/java_backend/worker/src/main/java/com/matchbook/worker/model/EmailJob.java`](../java_backend/worker/src/main/java/com/matchbook/worker/model/EmailJob.java)
