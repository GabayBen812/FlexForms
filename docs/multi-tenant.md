# Multi-Tenant Architecture

This document describes how FlexForms implements multi-tenancy with complete data isolation between organizations.

## Overview

FlexForms is a multi-tenant application where:
- Each organization has completely isolated data
- Users belong to one organization
- All data operations are automatically scoped by `organizationId`
- No organization can access another organization's data

## Core Principle

**All data MUST be scoped by `organizationId` from the authenticated user's JWT token. Never trust client-provided organization IDs.**

## Data Model

### Organization Schema

Every organization has:
- Unique `_id` (MongoDB ObjectId)
- `owner`: Reference to the User who owns the organization
- `featureFlagIds`: Array of feature flags enabled for this organization
- Custom configuration (payment providers, invoicing, etc.)

### User-Organization Relationship

Users have an `organizationId` field that links them to their organization:

```typescript
{
  _id: string;
  email: string;
  organizationId: string; // Links user to organization
  role: 'admin' | 'editor' | 'viewer';
}
```

## Server-Side Implementation

### Extracting Organization ID

Always extract `organizationId` from the authenticated user's JWT token:

```typescript
@Controller('parents')
@UseGuards(JwtAuthGuard)
export class ParentController {
  @Post()
  create(@Body() dto: CreateParentDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    
    // CRITICAL: Always use organizationId from token, never from DTO
    if (!user?.organizationId) {
      throw new Error('User organizationId not found');
    }
    
    dto.organizationId = user.organizationId;
    return this.service.create(dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user?.organizationId) {
      throw new Error('User organizationId not found');
    }
    
    // Always filter by organizationId
    return this.service.findAll(user.organizationId);
  }
}
```

### Service Layer Scoping

Services should always filter by `organizationId`:

```typescript
@Injectable()
export class ParentService {
  async findAll(organizationId: string) {
    return this.model.find({ organizationId }).exec();
  }

  async findOne(id: string, organizationId: string) {
    return this.model.findOne({ 
      _id: id, 
      organizationId // Ensure the resource belongs to the organization
    }).exec();
  }
}
```

### Schema-Level Scoping

All schemas should include `organizationId`:

```typescript
@Schema({ timestamps: true })
export class Parent {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;
  
  // ... other fields
}
```

## Client-Side Implementation

### Getting Current Organization

Use the `useOrganization()` hook:

```tsx
import { useOrganization } from "@/hooks/useOrganization";

const MyComponent = () => {
  const { organization, isOrganizationFetching } = useOrganization();
  
  if (isOrganizationFetching) return <Loading />;
  
  return <div>Current Organization: {organization?.name}</div>;
};
```

### Organization ID in API Calls

The API client automatically includes `organizationId` when needed:

```typescript
// Option 1: Automatic inclusion (if includeOrgId: true)
const api = createApiService<Resource>("/resources", {
  includeOrgId: true
});

// Option 2: Manual inclusion
const orgId = getUserOrganizationId();
const response = await api.fetchAll({}, false, orgId);
```

### Organization Switching

Users can switch between organizations (if they belong to multiple):

```typescript
import { switchOrganization } from "@/api/auth/switchOrganization";

const handleSwitchOrg = async (newOrgId: string) => {
  await switchOrganization(newOrgId);
  // User's token is updated with new organizationId
  // All subsequent requests use the new organization
};
```

## Data Isolation Rules

### 1. Never Trust Client-Provided Organization ID

```typescript
// ❌ WRONG - Never do this
@Post()
create(@Body() dto: CreateDto) {
  // dto.organizationId could be manipulated by client
  return this.service.create(dto);
}

// ✅ CORRECT - Always use token organizationId
@Post()
create(@Body() dto: CreateDto, @Req() req: Request) {
  const user = req.user as { organizationId: string };
  dto.organizationId = user.organizationId; // From token, not client
  return this.service.create(dto);
}
```

### 2. Always Filter by Organization ID

```typescript
// ❌ WRONG
async findAll() {
  return this.model.find().exec(); // Returns ALL organizations' data
}

// ✅ CORRECT
async findAll(organizationId: string) {
  return this.model.find({ organizationId }).exec();
}
```

### 3. Verify Ownership on Updates/Deletes

```typescript
async update(id: string, data: UpdateDto, organizationId: string) {
  // Verify the resource belongs to the organization
  const resource = await this.model.findOne({ 
    _id: id, 
    organizationId 
  });
  
  if (!resource) {
    throw new NotFoundException('Resource not found or access denied');
  }
  
  return this.model.findByIdAndUpdate(id, data, { new: true });
}
```

## Feature Flags per Organization

Organizations can have different feature flags enabled:

```typescript
// Organization schema includes featureFlagIds
{
  _id: "org123",
  name: "My Organization",
  featureFlagIds: ["ff1", "ff2", "ff3"]
}

// Check if feature is enabled for organization
const isEnabled = await featureFlagService.isFeatureEnabled(
  "advanced_forms",
  organizationId
);
```

## Common Patterns

### Creating a New Multi-Tenant Resource

```typescript
// 1. Controller
@Controller('my-resource')
@UseGuards(JwtAuthGuard)
export class MyResourceController {
  @Post()
  create(@Body() dto: CreateDto, @Req() req: Request) {
    const user = req.user as { organizationId: string };
    dto.organizationId = user.organizationId;
    return this.service.create(dto);
  }
}

// 2. Service
@Injectable()
export class MyResourceService {
  async create(dto: CreateDto) {
    return this.model.create(dto);
  }

  async findAll(organizationId: string) {
    return this.model.find({ organizationId }).exec();
  }
}

// 3. Schema
@Schema({ timestamps: true })
export class MyResource {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;
  
  // ... other fields
}
```

### Cross-Organization Queries (Admin Only)

If you need to query across organizations (admin functionality):

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin/all')
findAllOrganizations(@Req() req: Request) {
  // Only admins can access all organizations
  return this.service.findAllAcrossOrgs();
}
```

## Testing Multi-Tenancy

### Verify Data Isolation

```typescript
// Test that organization A cannot access organization B's data
const orgA = await createOrganization("Org A");
const orgB = await createOrganization("Org B");

const userA = await createUser(orgA._id);
const userB = await createUser(orgB._id);

const resourceA = await createResource(userA, { name: "Resource A" });
const resourceB = await createResource(userB, { name: "Resource B" });

// User A should only see their resource
const resourcesA = await getResources(userA);
expect(resourcesA).toHaveLength(1);
expect(resourcesA[0].name).toBe("Resource A");

// User B should only see their resource
const resourcesB = await getResources(userB);
expect(resourcesB).toHaveLength(1);
expect(resourcesB[0].name).toBe("Resource B");
```

## Security Checklist

When implementing a new feature, ensure:

- [ ] Controller extracts `organizationId` from `req.user` (JWT token)
- [ ] Service methods accept `organizationId` as a parameter
- [ ] Database queries filter by `organizationId`
- [ ] Schema includes `organizationId` as a required field
- [ ] Update/delete operations verify resource ownership
- [ ] No client-provided `organizationId` is trusted
- [ ] Admin-only endpoints are properly guarded with `@Roles('admin')`

## Troubleshooting

### "User organizationId not found"
- User may not be properly authenticated
- JWT token may not include `organizationId`
- User may not be associated with an organization in the database

### Data Leakage Between Organizations
- Verify all queries include `organizationId` filter
- Check that controllers extract `organizationId` from token, not DTO
- Ensure services always receive `organizationId` parameter

### Organization Not Found
- Verify organization exists in database
- Check that user's `organizationId` matches an existing organization
- Ensure organization lookup uses the correct ID format (ObjectId)

