import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL not set. Use the Railway public URL.");
  process.exit(1);
}

const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
const PENDING_QUEUE = "matchbook:emails:pending";
const TO = "tyler.bennett52@gmail.com";
const COUNT = 10;

async function blast() {
  console.log(`Enqueuing ${COUNT} test emails to ${TO}...`);

  for (let i = 1; i <= COUNT; i++) {
    const job = {
      to: TO,
      subject: `[Test ${i}/${COUNT}] Email queue integration test`,
      html: `<h1>Test Email ${i} of ${COUNT}</h1><p>Sent at ${new Date().toISOString()}</p><p>Job queued directly to Redis to verify the Java worker pipeline.</p>`,
      from: "MatchBook Rentals <no-reply@matchbookrentals.com>",
      jobId: uuidv4(),
      enqueuedAt: Date.now(),
      attemptNumber: 1,
    };

    await redis.lpush(PENDING_QUEUE, JSON.stringify(job));
    console.log(`  [${i}/${COUNT}] Enqueued ${job.jobId}`);
  }

  const pending = await redis.llen(PENDING_QUEUE);
  console.log(`\nDone. ${pending} jobs currently in pending queue.`);

  await redis.quit();
}

blast().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
