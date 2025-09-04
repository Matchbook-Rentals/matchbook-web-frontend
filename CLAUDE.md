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


## API
Prefer server actions to new api routes

## Coding Style: "Declarative Functional Decomposition"

Break complex functions into small, named steps that read like English.

**Rules:**
1. **Radical Decomposition** - Every logical step gets its own function
2. **Semantic Naming** - Function names ARE the documentation  
3. **Tell, Don't Ask** - `isMapAvailable()` not `mapRef.current !== null`
4. **Vertical Reading** - Main functions read top-to-bottom like prose
5. **No Magic Values** - Extract all constants
6. **10-Line Maximum** - Keep functions short

**Example:**
```typescript
// Main function reads like a story
const renderMarkers = () => {
  if (!isMapAvailable()) return;
  
  removeObsoleteMarkers();
  updateOrCreateMarkers();  
  scheduleStyleVerification();
};

// Each helper does ONE thing
const isMapAvailable = () => mapRef.current !== null;
const removeObsoleteMarkers = () => {...};
```
