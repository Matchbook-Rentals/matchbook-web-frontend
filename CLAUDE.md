# Claude Instructions for Matchbook Web Frontend

## CRITICAL SAFETY RULES

### DATABASE SAFETY
**NEVER EVER USE `--force-reset` OR ANY DATABASE WIPING COMMANDS**
- This is production data
- Never use `npx prisma db push --force-reset`
- Never use `npx prisma migrate reset`
- Never use any command that wipes/resets the database
- Always use safe read-only commands to inspect data

### Database
- View database safely: `npx prisma studio`
- Generate Prisma client: `npx prisma generate`
- Apply migrations safely: `npx prisma db push` (without --force-reset)

### Git
- Never include `Co-Authored-By` or any Claude/AI signature in commit messages
- Never run `npm run build` unless explicitly told to
