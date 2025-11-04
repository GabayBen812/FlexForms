# Backend Guidelines (NestJS + MongoDB)

- Always use **NestJS** with **TypeScript**.
- Use **Mongoose** for database operations (no Prisma).
- Follow the NestJS structure: `modules → controllers → services`.
- Do not put business logic in controllers.
- Each service should handle errors using `try/catch` and return meaningful responses.
- Use **DTOs** for data validation and request schemas.
- Never use `any` or `var`.
- Organize reusable logic in a `common/` folder (pipes, guards, interceptors).
- Use async/await consistently.
