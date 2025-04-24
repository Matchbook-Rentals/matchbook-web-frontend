# Redis Setup using Docker Compose

This directory contains the configuration to run a Redis instance using Docker Compose, suitable for local development and potentially as a base for deployment.

## Prerequisites

-   [Docker](https://docs.docker.com/get-docker/) installed.
-   [Docker Compose](https://docs.docker.com/compose/install/) installed (often included with Docker Desktop).

## Configuration

-   **`docker-compose.yml`**: Defines the Redis service.
    -   Uses the official `redis:7-alpine` image.
    -   Exposes port `6379` by default. You can override this by setting the `REDIS_PORT` environment variable before running `docker-compose up` (e.g., `export REDIS_PORT=6380`).
    -   Persists data to a Docker named volume called `redis_data`.
    -   Includes commented-out sections for mounting a custom `redis.conf` file and setting a password via an environment variable (`REDIS_PASSWORD`).
-   **`redis.conf` (Optional)**: If you need custom Redis configurations (e.g., memory limits, persistence settings, password), create this file and uncomment the corresponding lines in `docker-compose.yml`. Refer to the [Redis configuration documentation](https://redis.io/docs/management/config/).
-   **`.env` (Optional)**: If you uncomment the `REDIS_PASSWORD` line in `docker-compose.yml`, create a `.env` file in this directory and add `REDIS_PASSWORD=your_secure_password`. **Do not commit `.env` files containing secrets to Git.** Add `.env` to your `.gitignore` file.

## Usage

1.  **Navigate to this directory:**
    ```bash
    cd redis
    ```

2.  **Start the Redis service:**
    ```bash
    docker-compose up -d
    ```
    The `-d` flag runs the container in detached mode (in the background).

3.  **Check logs (optional):**
    ```bash
    docker-compose logs -f redis
    ```

4.  **Stop the Redis service:**
    ```bash
    docker-compose down
    ```
    This stops and removes the container but preserves the data in the `redis_data` volume.

5.  **Stop and remove data (use with caution):**
    ```bash
    docker-compose down -v
    ```
    This stops and removes the container *and* the `redis_data` volume, deleting all persisted data.

## Connecting from your Application

Your WebSocket server (or any other application) should connect to Redis using the host `localhost` (or `127.0.0.1`) and the exposed port (default `6379`, or the value of `REDIS_PORT` if set). If you set a password, ensure your application provides it during connection.
