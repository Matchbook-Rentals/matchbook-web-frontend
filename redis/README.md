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

You can run these commands either from the project root directory (`matchbook-web-frontend/`) or after changing into the `redis/` directory.

**Option 1: Running from the Project Root Directory (Recommended)**

Use the `-f` flag to specify the path to the `docker-compose.yml` file.

1.  **Start the Redis service:**
    Use `docker compose` (with a space) if available:
    ```bash
    docker compose -f redis/docker-compose.yml up -d
    ```
    Or `docker-compose` (with a hyphen) for older installations:
    ```bash
    docker-compose -f redis/docker-compose.yml up -d
    ```
    The `-d` flag runs the container in detached mode.

2.  **Check logs (optional):**
    Use the same command format (space or hyphen) that worked for `up`:
    ```bash
    docker compose -f redis/docker-compose.yml logs -f redis
    # or
    # docker-compose -f redis/docker-compose.yml logs -f redis
    ```

3.  **Stop the Redis service:**
    Use the same command format (space or hyphen) that worked for `up`:
    ```bash
    docker compose -f redis/docker-compose.yml down
    # or
    # docker-compose -f redis/docker-compose.yml down
    ```
    This stops and removes the container but preserves the data in the `redis_data` volume.

4.  **Stop and remove data (use with caution):**
    Use the same command format (space or hyphen) that worked for `up`:
    ```bash
    docker compose -f redis/docker-compose.yml down -v
    # or
    # docker-compose -f redis/docker-compose.yml down -v
    ```
    This stops and removes the container *and* the `redis_data` volume.

**Option 2: Running from the `redis/` Directory**

1.  **Navigate to the `redis` directory:**
    ```bash
    cd redis
    ```

2.  **Start the Redis service:**
    ```bash
    docker compose up -d 
    # or
    # docker-compose up -d
    ```

3.  **Check logs (optional):**
    ```bash
    docker compose logs -f redis
    # or
    # docker-compose logs -f redis
    ```

4.  **Stop the Redis service:**
    ```bash
    docker compose down
    # or
    # docker-compose down
    ```

5.  **Stop and remove data (use with caution):**
    ```bash
    docker compose down -v
    # or
    # docker-compose down -v
    ```

6.  **Return to the project root when finished:**
    ```bash
    cd .. 
    ```

*If neither `docker compose` nor `docker-compose` works, you may need to install Docker Compose V2 (plugin) or the standalone `docker-compose`. See the [Docker Compose installation guide](https://docs.docker.com/compose/install/).*

## Connecting from your Application (Local Development)

When running locally using this Docker Compose setup, your WebSocket server (or any other application) should connect to Redis using:
-   **Host:** `localhost` (or `127.0.0.1`)
-   **Port:** The exposed port (default `6379`, or the value of `REDIS_PORT` if set in your environment before running `docker compose up`).
-   **Password:** Leave empty unless you have uncommented and configured the `REDIS_PASSWORD` environment variable in `docker-compose.yml` (e.g., via a `.env` file).

Set these values in your application's environment variables (e.g., in a root `.env` file):
```dotenv
# Example for local .env
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_password (only if you set one in docker-compose.yml)
```

## Deployment (e.g., on Render)

This Docker Compose setup is intended for **local development**. For deploying to production platforms like Render, Vercel, Fly.io, etc., it is **highly recommended** to use their **managed Redis services**.

**Example using Render:**

1.  **Create a Managed Redis Instance:** In your Render dashboard, create a new "Redis" service. Configure the plan, region, and version.
2.  **Get Connection Details:** Render will provide connection details (Host, Port, Password) for your managed Redis instance.
3.  **Configure Application Environment:** In your WebSocket server's service settings on Render, go to the "Environment" section and set the `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` environment variables using the values provided by Render for your managed Redis instance.
4.  **Deploy:** Redeploy your WebSocket server application on Render. It will automatically connect to the managed Redis instance using the environment variables.

Using a managed service simplifies deployment, maintenance, scaling, and backups compared to managing your own Redis container in production.
