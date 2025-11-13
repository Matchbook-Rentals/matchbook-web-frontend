import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";

/**
 * Email job structure matching Java worker EmailJob model
 *
 * @see /contracts/schemas/email-job.v1.schema.json - Contract schema (source of truth)
 * @see java_backend/worker/src/main/java/com/matchbook/worker/model/EmailJob.java - Java implementation
 */
export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  metadata?: Record<string, string>;
  jobId: string;
  enqueuedAt: number;
  attemptNumber?: number; // Optional - Java worker defaults to 1 if not provided
}

/**
 * Email queue client for enqueuing emails to Redis
 */
class EmailQueueClient {
  private redis: Redis | null = null;
  private readonly PENDING_QUEUE = "matchbook:emails:pending";

  /**
   * Get or create Redis connection
   */
  private getRedis(): Redis {
    if (!this.redis) {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        throw new Error("REDIS_URL environment variable not set");
      }

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      // Handle connection errors
      this.redis.on("error", (err) => {
        console.error("[EmailQueue] Redis connection error:", err);
      });

      this.redis.on("connect", () => {
        console.log("[EmailQueue] Connected to Redis");
      });
    }

    return this.redis;
  }

  /**
   * Enqueue an email job to Redis for processing by Java worker
   *
   * @param emailData Email data to enqueue
   * @returns Job ID
   */
  async enqueue(emailData: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    try {
      const job: EmailJob = {
        ...emailData,
        jobId: uuidv4(),
        enqueuedAt: Date.now(),
        attemptNumber: 1,
      };

      const redis = this.getRedis();

      // Ensure connection is established
      if (redis.status !== "ready" && redis.status !== "connect") {
        await redis.connect();
      }

      // Push to Redis list (left push for FIFO with right pop in worker)
      await redis.lpush(this.PENDING_QUEUE, JSON.stringify(job));

      console.log(`[EmailQueue] Enqueued email job ${job.jobId} to ${emailData.to}`);

      return job.jobId;
    } catch (error) {
      console.error("[EmailQueue] Failed to enqueue email:", error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    dlq: number;
  }> {
    try {
      const redis = this.getRedis();

      if (redis.status !== "ready" && redis.status !== "connect") {
        await redis.connect();
      }

      const [pending, processing, failed, dlq] = await Promise.all([
        redis.llen("matchbook:emails:pending"),
        redis.llen("matchbook:emails:processing"),
        redis.llen("matchbook:emails:failed"),
        redis.llen("matchbook:emails:dlq"),
      ]);

      return { pending, processing, failed, dlq };
    } catch (error) {
      console.error("[EmailQueue] Failed to get queue stats:", error);
      throw error;
    }
  }

  /**
   * Close Redis connection (for graceful shutdown)
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

// Export singleton instance
export const emailQueueClient = new EmailQueueClient();
