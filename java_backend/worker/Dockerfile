# Multi-stage build for optimal image size
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN echo "========================================" && \
    echo "Building Email Worker v1.1" && \
    echo "Configuration:" && \
    echo "  Rate Limit: 1.67 emails/sec" && \
    echo "  Interval: 1 email per 600ms" && \
    echo "  Strategy: Single-threaded with blocking rate limiter" && \
    echo "  Retry: Exponential backoff (1s, 2s, 4s)" && \
    echo "  Max Attempts: 3 before DLQ" && \
    echo "  Build Date: $(date '+%Y-%m-%d %H:%M:%S')" && \
    echo "========================================" && \
    mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy jar from builder
COPY --from=builder /app/target/matchbook-worker-*.jar app.jar

# Create non-root user
RUN addgroup -g 1001 -S worker && \
    adduser -S worker -u 1001 -G worker

USER worker

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]