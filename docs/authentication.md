# Authentication & Authorization

This document describes the authentication and authorization system in FlexForms, including JWT-based authentication, multi-tenant organization scoping, and role-based access control.

## Overview

FlexForms uses JWT (JSON Web Tokens) for authentication with the following characteristics:
- **Token Storage**: HTTP-only cookies for security
- **Token Expiration**: 2 hours
- **Multi-tenant**: All requests are scoped to the user's organization
- **Role-based**: Supports `admin`, `editor`, and `viewer` roles

## Server-Side Authentication

### JWT Token Structure

The JWT token contains user information in the following structure:

```typescript
{
  UserInfo: {
    id: string;
    email: string;
    organizationId: string;
    role?: 'admin' | 'editor' | 'viewer';
    name?: string;
  }
}
```

### JWT Auth Guard

All protected endpoints use the `JwtAuthGuard` middleware (`Server/src/nestjs/middlewares/jwt-auth.guard.ts`):

```typescript
@Controller('parents')
@UseGuards(JwtAuthGuard)
export class ParentController {
  // All routes require authentication
}
```

The guard:
1. Extracts the JWT token from cookies (`req.cookies.jwt`) or Authorization header
2. Verifies the token using `ACCESS_TOKEN_SECRET`
3. Attaches user information to `req.user` for use in controllers

### Role-Based Authorization

Use the `RolesGuard` with the `@Roles()` decorator for role-based access:

```typescript
import { Roles } from '../middlewares/roles.decorator';
import { RolesGuard } from '../middlewares/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete(':id')
remove(@Param('id') id: string) {
  // Only admins can access this route
}
```

### Accessing User Information in Controllers

After authentication, user information is available on the request object:

```typescript
@Post()
create(@Body() dto: CreateParentDto, @Req() req: Request) {
  const user = req.user as { organizationId?: string; role?: string };
  
  // Always use organizationId from the token for data isolation
  dto.organizationId = user.organizationId;
  
  return this.service.create(dto);
}
```

## Client-Side Authentication

### Authentication Hook

Use the `useAuth()` hook (`Client/src/hooks/useAuth.ts`) for authentication state:

```tsx
import { useAuth } from "@/hooks/useAuth";

const MyComponent = () => {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return <div>Welcome, {user?.name}</div>;
};
```

### Login Flow

1. User submits credentials via `login()` mutation
2. Server validates credentials and returns JWT token in HTTP-only cookie
3. Client fetches user data via `/auth/user` endpoint
4. User data is cached in React Query with 5-minute stale time

### Protected Routes

Routes are protected using `ProtectedRoute` component:

```tsx
{
  path: "/",
  element: (
    <Layout>
      <ProtectedRoute />
    </Layout>
  ),
  children: [
    // All child routes require authentication
  ]
}
```

The `ProtectedRoute` component:
- Checks authentication status
- Redirects to login if not authenticated
- Renders children if authenticated

### Logout

Logout clears the JWT cookie and resets user state:

```tsx
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // User state is automatically cleared
};
```

## Multi-Tenant Organization Scoping

### Critical Rule: Always Scope by Organization

**All data operations MUST be scoped by `organizationId` from the JWT token.** This ensures complete data isolation between organizations.

### Server-Side Scoping

Controllers should always extract `organizationId` from the authenticated user:

```typescript
@Get()
findAll(@Req() req: Request) {
  const user = req.user as { organizationId?: string };
  if (!user?.organizationId) {
    throw new Error('User organizationId not found');
  }
  return this.service.findAll(user.organizationId);
}
```

### Client-Side Organization Access

Use the `useOrganization()` hook to access the current organization:

```tsx
import { useOrganization } from "@/hooks/useOrganization";

const MyComponent = () => {
  const { organization, isOrganizationFetching } = useOrganization();
  
  if (isOrganizationFetching) return <Loading />;
  
  return <div>{organization?.name}</div>;
};
```

The organization ID is automatically extracted from the authenticated user's token.

## Environment Variables

Required environment variables:

| Variable | Description |
|----------|-------------|
| `ACCESS_TOKEN_SECRET` | Secret key for signing and verifying JWT tokens (server) |
| `MASTER_PASSWORD` | Optional master password for emergency access (server) |

## Security Considerations

1. **HTTP-only Cookies**: Tokens are stored in HTTP-only cookies to prevent XSS attacks
2. **Secure Cookies**: In production, cookies use `secure: true` and `sameSite: 'none'`
3. **Token Expiration**: Tokens expire after 2 hours, requiring re-authentication
4. **Organization Isolation**: Never trust client-provided `organizationId` - always use the one from the JWT token
5. **Role Validation**: Always validate roles on the server side, never trust client-side role checks

## Common Patterns

### Creating a New Protected Endpoint

```typescript
@Controller('my-resource')
@UseGuards(JwtAuthGuard)
export class MyResourceController {
  constructor(private readonly service: MyResourceService) {}

  @Post()
  create(@Body() dto: CreateDto, @Req() req: Request) {
    const user = req.user as { organizationId: string };
    dto.organizationId = user.organizationId; // Always scope by org
    return this.service.create(dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { organizationId: string };
    return this.service.findAll(user.organizationId);
  }
}
```

### Checking Authentication in Components

```tsx
const MyComponent = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Access user.organizationId, user.role, etc.
  return <div>Content for {user?.email}</div>;
};
```

## Troubleshooting

### "Missing token" Error
- Check that cookies are being sent with requests (`withCredentials: true` in axios)
- Verify the JWT cookie exists in browser DevTools

### "Token verification failed" Error
- Token may have expired (2-hour limit)
- Token signature may be invalid
- Check that `ACCESS_TOKEN_SECRET` matches between token creation and verification

### Organization ID Not Found
- Ensure the user has an `organizationId` in the database
- Verify the JWT token includes `organizationId` in `UserInfo`
- Check that the user is properly associated with an organization

