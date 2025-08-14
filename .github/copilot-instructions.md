# AI Coding Agent Instructions

## Project Overview
This is a **Next.js 15 customer management system** with SQLite database, featuring both server-side and client-side table browsing patterns. The app demonstrates database initialization, API design, and dual rendering approaches.

## Key Architecture Patterns

### Database Layer (`src/lib/dbUtils.ts`)
- **SQLiteCustomerDB class**: Core database abstraction with connection management
- **Pattern**: Always call `connect()` before operations, `close()` in finally blocks
- **Data types**: Uses generic `getAllRows<T>(tableName)` for flexible table browsing
- **Customer type**: Well-defined TypeScript interface with optional `id` and `created_at`

### Database Initialization (`src/instrumentation.ts` + `src/lib/dbInit.ts`)
- **Auto-initialization**: Database creates and seeds on app startup via `register()` hook
- **Pattern**: Check existing data before seeding (idempotent initialization)
- **File location**: `customer.db` at project root (not in src/)

### Dual Table Browser Pattern
The app implements **identical functionality** in both server and client patterns:

**Server-side** (`src/app/browse/[table]/page.tsx`):
- Direct database access in React Server Component
- URL-based pagination (`?page=1&pageSize=20`)
- Server-side data formatting and type analysis

**Client-side** (`src/app/browse-client/[table]/`):
- API consumption via `/api/tables/[table]` endpoint
- `TableBrowserClient.tsx` component with `useState`/`useEffect`
- Router-based navigation for pagination

### API Design (`src/app/api/`)
- **Table API**: `/api/tables/[table]` with whitelist security (`ALLOWED_TABLES = ['customers']`)
- **Customer API**: `/api/customers` for POST operations with validation
- **Pattern**: Always use `path.join(process.cwd(), 'customer.db')` for database path
- **Response format**: Consistent JSON with pagination metadata

### Column Type Detection
Both server and client implementations use **identical logic**:
```typescript
// Sample-based type detection (first 5 rows)
function analyzeColumnTypes(data): Record<string, 'numeric' | 'datetime' | 'text'>
// Numeric: right-aligned display
// DateTime: ISO 8601 formatting
```

## Development Workflows

### Essential Commands
```bash
npm run dev          # Start with Turbopack (preferred)
npm run build        # Production build 
npm test            # Jest tests
```

### Database Operations
- **Auto-reset**: Delete `customer.db` to trigger fresh initialization
- **Seeding**: 70 fake customers generated with `@faker-js/faker`
- **Connection pattern**: Always handle in try/finally blocks

### Testing Setup
- **Jest config**: `jest.config.js` with ts-jest preset
- **Test files**: `*.spec.ts` pattern (see `src/lib/demo-test.spec.ts`)
- **Environment**: Node.js (not jsdom)

## Project Conventions

### File Organization
- **API routes**: Mirror table names (`/api/tables/[table]`)
- **Page routes**: Dynamic segments for table browsing (`/browse/[table]`)
- **Components**: Place reusable UI in `src/components/`
- **Utilities**: Database and shared logic in `src/lib/`

### Security Patterns
- **Table whitelist**: Always validate against `ALLOWED_TABLES` array
- **SQL injection**: Use parameterized queries in `SQLiteCustomerDB` methods
- **Validation**: Comprehensive input validation in API routes (email format, age ranges, etc.)

### Styling Approach
- **CSS Modules**: `page.module.css` co-located with components
- **Grid layouts**: CSS Grid for table display with dynamic column counts
- **Minimal styling**: Focus on functionality over elaborate design

### Error Handling
- **Database errors**: Graceful degradation with user-friendly messages
- **API responses**: Consistent error format with appropriate HTTP status codes
- **Loading states**: Client components show loading/error states

## Key Integration Points

### Next.js 15 Features
- **App Router**: All routes use new app directory structure
- **Server Components**: Default for pages, explicit `'use client'` for interactivity
- **Instrumentation**: Database initialization via `register()` hook

### Dependencies
- **sqlite + sqlite3**: Direct SQL database access (not ORM)
- **@faker-js/faker**: Realistic test data generation
- **TypeScript**: Strict typing throughout, especially for database schemas

When working with this codebase:
1. **Follow the dual pattern**: Maintain feature parity between server/client browsers
2. **Use the SQLiteCustomerDB class**: Don't write raw SQL elsewhere
3. **Respect the whitelist**: Add tables to `ALLOWED_TABLES` before browsing
4. **Test pagination**: Always verify page size parameter handling
5. **Handle connections**: Database connections must be properly closed
