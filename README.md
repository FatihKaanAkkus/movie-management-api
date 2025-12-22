# Movie Management API

This is a simple Movie Management API built with NestJS. It allows you to perform CRUD operations on movies.

> ⚠️ Please refer to the `DESCRIPTION.md` file for a draft description of the application.

To get started, follow the instructions below to set up the project on your local machine.

## Features

- User authentication with JWT
- Role-based access control (Manager, Customer)
- CRUD operations for movies, movie sessions and tickets
- Database migrations using TypeORM
- In-memory caching for frequently accessed data for movies
- API documentation with Swagger

## Setup Instructions

1. Clone the repository or download the source code.

2. Navigate to the project directory.

   ```bash
   cd movie-management-api
   ```

3. Install the dependencies.

   ```bash
    npm install
   ```

4. Create a `.env` file in the root directory. Use `.env.example` as a template.

   ```bash
   cp .env.example .env
   ```

5. Fill out the necessary environment variables in the `.env` file. See the "Environment Variables" section below for details.

6. Before running migrations, ensure that your postgres database server is running and accessible with the credentials provided in the `.env` file. See the "Postgres Docker Setup" section below for instructions on setting up a local Postgres instance using Docker.

7. Run the following command to migrate the database.

   ```bash
     npm run migration:run
   ```

   This will run the build command first, then execute the migrations by design.

8. Run the dev server:

   ```bash
   npm run start:dev
   ```

9. Access the API documentation at `http://localhost:3000/api` (or the port you specified in the `.env` file).

10. Create a `.env.test.local` file in the root directory. Use `.env.example` as a template.

    ```bash
    cp .env.example .env.test.local
    ```

11. Change the complete database parameters in `.env.test.local` to a separate test database to avoid conflicts with development data. You can just change the database name with your local postgres setup.

12. To run unit tests, use the following command:

    ```bash
    npm run test
    ```

13. To run e2e tests, use the following command:

    ```bash
    npm run test:e2e
    ```

14. For production build, run:

    ```bash
    npm run build
    ```

15. Start the production server:

    ```bash
    npm start
    ```

## Environment Variables

The application requires the following environment variables to be set in a `.env` file:

Below is a list of environment variables with their default values:

| Variable                | Description                                     | Default Value    |
| ----------------------- | ----------------------------------------------- | ---------------- |
| PORT                    | The port number on which the server will run    | 3000             |
| JWT_SECRET              | Secret key for JWT authentication               | dummy-jwt-secret |
| JWT_EXPIRES_IN_SEC      | JWT token expiration time in seconds            | 3600             |
| DB_HOST                 | Database host address                           | localhost        |
| DB_PORT                 | Database port number                            | 5432             |
| DB_USERNAME             | Database username                               | postgres         |
| DB_PASSWORD             | Database password                               | postgres         |
| DB_NAME                 | Database name                                   | postgres         |
| ENABLE_TRACE_LOGS       | Enable or disable trace logs (true/false)       | false            |
| ENABLE_CACHE_TRACE_LOGS | Enable or disable cache trace logs (true/false) | false            |

Example `.env` file:

```
PORT=3000
JWT_SECRET="dummy-jwt-secret"
JWT_EXPIRES_IN_SEC=3600
DB_HOST="localhost"
DB_PORT=5432
DB_USERNAME="postgres"
DB_PASSWORD="postgres"
DB_NAME="postgres"
ENABLE_TRACE_LOGS=false
ENABLE_CACHE_TRACE_LOGS=false
```

## Loading Environment Files

If your deploy environment support OS environment variables (it should anyway), those values will be used as basis, files given below will override any variable.

What does it mean? You can simply define all required/desired variables from OS environment, and leave out any `.env` files mentioned below.

- The **default** fallback  
  The file `.env` in the root directory is used (if exists)
- For **NODE_ENV=development**  
  The file `.env` is looked up in the root directory.
- For **NODE_ENV=test**  
  The files `.env.test` or `.env.test.local` are looked up in the root directory.
- For **NODE_ENV=production**  
  The files `.env.production` or `.env.production.local` are looked up in the root directory.

These are presented in detail due to `@nestjs/config` module did not used for now.

## Postgres Docker Setup

To set up a local Postgres instance using Docker, follow these steps:

1. Ensure you have Docker installed on your machine.

2. Run the following command to start a Postgres container:

   ```bash
   docker run --name postgres-movie-management-api -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 5432:5432 -d postgres:16
   ```

   This command will create a Postgres container with the username `postgres`, password `postgres`, and database name `postgres`. Adjust these values as needed.

3. Verify that the Postgres container is running:

   ```bash
    docker ps
   ```

4. You can connect to the Postgres database using any Postgres client with the following connection details:
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres`
   - Database: `postgres`

5. Your connection string will also be like this:

   ```
   postgres://postgres:postgres@localhost:5432/postgres
   ```

6. To stop and remove the Postgres container, run:

   ```bash
   docker stop postgres-movie-management-api
   docker rm postgres-movie-management-api
   ```

## Migation Files

- The database migrations are managed using TypeORM.
- Migration files are located in the `src/modules/<module-name>/infrastructure/database/migrations` directory for each module.
- To create a new migration, use the following command:

  ```bash
  npx typeorm migration:create ./src/modules/<module-name>/infrastructure/database/migrations/<MigrationName>
  ```

## DTOs and Validation

- Data Transfer Objects (DTOs) are used to define the shape of data for requests and responses.
- Validation is implemented using `class-validator` decorators on DTO properties.

## API Endpoints

The API endpoints are documented using Swagger. Once the server is running, you can access the documentation at:

```
http://localhost:3000/api
```

For overview, here are the main endpoint groups:

**API**

- `GET /`

**Auth**

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`

**Users**

- `GET /v1/users`
- `GET /v1/users/{userId}`
- `GET /v1/users/{userId}/tickets`

**Tickets**

- `GET /v1/tickets`
- `POST /v1/tickets`
- `GET /v1/tickets/me`
- `POST /v1/tickets/{ticketId}/use`
- `DELETE /v1/tickets/{ticketId}`

**Movies**

- `GET /v1/movies`
- `POST /v1/movies`
- `GET /v1/movies/{movieId}`
- `PATCH /v1/movies/{movieId}`
- `DELETE /v1/movies/{movieId}`
- `POST /v1/movies/bulk`
- `DELETE /v1/movies/bulk`
- `GET /v1/movies/{movieId}/sessions`
- `POST /v1/movies/{movieId}/sessions`
- `POST /v1/movies/{movieId}/sessions/bulk`
- `GET /v1/movies/{movieId}/sessions/{sessionId}`

**Movie Sessions**

- `GET /v1/movie-sessions`
- `DELETE /v1/movie-sessions/{sessionId}`
- `DELETE /v1/movie-sessions/bulk`

**Health**

- `GET /v1/health`

**Swagger Documentation UI**

- `GET /v1/api`
- `GET /v1/api-json`

## DTOs and Validation

DTOs define the structure of data for API requests and responses. They are validated using `class-validator` decorators.

**Auth DTOs**

- `RegisterDto`
- `LoginDto`
- `RefreshTokenDto`
- `AuthResponseDto`

**User DTOs**

- `UserResponseDto`

**Movie DTOs**

- `CreateMovieDto`
- `UpdateMovieDto`
- `DeleteMovieDto`
- `QueryMovieDto`
- `MovieResponseDto`

**Movie Session DTOs**

- `CreateMovieSessionDto`
- `DeleteMovieSessionDto`
- `QueryMovieSessionDto`
- `MovieSessionResponseDto`

**Ticket DTOs**

- `BuyTicketDto`
- `GetUserTicketsDto`
- `TicketResponseDto`

**Common DTOs**

- `PaginationMetaDto`

For detailed request and response schemas, see the auto-generated Swagger documentation at `/api` when the server is running.

## How to Contribute

No contributions are accepted for now.

## License

This project is unlicensed. No usage, copying, modification, or distribution is permitted. No license file is included yet.

## Notes on Known Issues/Changes

This section notes some known issues and challenges faced during development:

### 1. Database Migrations

- The TypeORM migrations `data-source.ts` file was problematic due to the use of `path.resolve`. This was replaced with relative paths.
- `SQLite` was removed for deployment on platforms. (Replaced with `PostgreSQL`) The initial service is Supabase free tier.

### 2. Testing with Jest

- Mocking in unit tests for services and other layers should be improved for better coverage and reliability.
- I tried to cover endpoints and services as much as possible, but mocking (alongside Jest's issues with TypeScript) made it harder. I stopped while still working to improve the coverage.
- Testing entities, value objects, and repositories is probably more straightforward, but I couldn't schedule it properly.
- A better NestJS boilerplate for tests would likely be beneficial in the future.

### 3. Environment Configuration

- The `@nestjs/config` module caused some issues during initialization, which are currently resolved with dotenv config.
- This creates complexity for staging environments in development, test, and production. Later, CI/CD pipelines should be updated to use the proper and common NestJS way of handling environments.

### 4. Caching

- The cache strategy is only implemented for Movie module GET endpoints. It should be reconfigured to make it extensible.
- The caching middleware is currently only for GET requests, returning cached responses directly. Invalidations clear the cache on movie mutations.

### 5. Free Tier Limitations

- The Supabase free tier may introduce limitations on database size, request rates, and performance.

## Appendix 1: Folder Structure for More Details

To prevent the messy verbose data above, The auto generated folder structure is as follows:

```bash
movie-management-api/
│
├── src/                            # Main source code
│   ├── app.module.ts               # Root NestJS module
│   ├── main.ts                     # Application entry point
│   ├── data-source.ts              # TypeORM data source config
│   ├── common/                     # Shared code (config, constants, enums, etc.)
│   │   ├── config/                 # Configuration helpers
│   │   ├── constants/              # Constant values
│   │   ├── domain/                 # Shared domain logic
│   │   ├── enums/                  # Shared enums
│   │   ├── infrastructure/         # Shared infrastructure (interceptors, middleware)
│   │   │   ├── interceptors/       # Global or shared interceptors
│   │   │   ├── middleware/         # Global or shared middleware
│   │   ├── presentation/           # Shared presentation layer (interfaces, etc.)
│   ├── modules/                    # Main business modules
│   │   ├── auth/                   # Authentication & authorization
│   │   │   ├── application/        # Application layer (DTOs, services)
│   │   │   │   ├── dto/
│   │   │   │   ├── services/
│   │   │   ├── domain/             # Domain layer (entities, repositories, value-objects)
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   ├── value-objects/
│   │   │   ├── infrastructure/     # Infrastructure (db, guards, persistence, strategies)
│   │   │   │   ├── database/
│   │   │   │   ├── guards/         # Auth guards
│   │   │   │   ├── persistence/
│   │   │   │   ├── strategies/
│   │   │   ├── presentation/       # Presentation (controllers)
│   │   │   │   ├── controllers/
│   │   ├── movie/                  # Movie management
│   │   │   ├── application/
│   │   │   │   ├── dto/
│   │   │   │   ├── exceptions/
│   │   │   │   ├── services/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   ├── infrastructure/
│   │   │   │   ├── database/
│   │   │   │   ├── persistence/
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   ├── ticket/                 # Ticket management
│   │   │   ├── application/
│   │   │   │   ├── dto/
│   │   │   │   ├── exceptions/
│   │   │   │   ├── services/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   ├── infrastructure/
│   │   │   │   ├── database/
│   │   │   │   ├── persistence/
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   ├── user/                   # User management
│   │   │   ├── application/
│   │   │   │   ├── dto/
│   │   │   │   ├── exceptions/
│   │   │   │   ├── services/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   ├── value-objects/
│   │   │   ├── infrastructure/
│   │   │   │   ├── database/
│   │   │   │   ├── persistence/
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   ├── health/                     # Health check endpoints
│
├── test/                           # End-to-end and integration tests
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   ├── movie.e2e-spec.ts
│   ├── ticket.e2e-spec.ts
│   ├── user.e2e-spec.ts
│   ├── global-setup.ts
│   ├── global-teardown.ts
│   ├── jest-e2e.json
│
├── package.json                    # Project dependencies and scripts
├── tsconfig.json                   # TypeScript config
├── tsconfig.build.json             # TypeScript build config
├── nest-cli.json                   # NestJS CLI config
├── README.md                       # Project documentation
├── DESCRIPTION.md                  # Project description draft
├── .env                            # Environment variables file
├── .env.example                    # Example environment variables file
├── .gitignore                      # Git ignore rules
├── eslint.config.mjs               # ESLint config
```
