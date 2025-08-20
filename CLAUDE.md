# Claude Instructions for Matchbook Web Frontend

## CRITICAL SAFETY RULES

### DATABASE SAFETY
**NEVER EVER USE `--force-reset` OR ANY DATABASE WIPING COMMANDS**
- This is production data
- Never use `npx prisma db push --force-reset`
- Never use `npx prisma migrate reset`
- Never use any command that wipes/resets the database
- Always use safe read-only commands to inspect data

## Development Commands

### Testing
- Run tests: `npm test`
- Run type checking: `npm run type-check` 
- Run linting: `npm run lint`

### Database
- View database safely: `npx prisma studio`
- Generate Prisma client: `npx prisma generate`
- Apply migrations safely: `npx prisma db push` (without --force-reset)

## Project Structure

This is a Next.js application with:
- PDF editing functionality using pdf-lib
- Document template merging system
- Prisma database with DocumentInstance and PdfTemplate models
- Server actions for document creation