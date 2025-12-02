# API Client Patterns

This document describes the API client architecture, patterns, and best practices for making HTTP requests in FlexForms.

## Overview

FlexForms uses a centralized API client built on Axios with:
- **Base Configuration**: Centralized axios instance with credentials support
- **Factory Pattern**: `createApiService()` for generating typed API services
- **Error Handling**: Standardized error handling across all requests
- **Organization Scoping**: Automatic organization ID injection for multi-tenant requests

## Base API Client

The base API client (`Client/src/api/apiClient.ts`) is configured once:

```typescript
import apiClient from "@/api/apiClient";

// Automatically includes:
// - Base URL from environment
// - withCredentials: true (for JWT cookies)
// - Content-Type: application/json
```

### Environment Configuration

The API base URL is determined by:
1. `VITE_API_BASE_URL` environment variable (if set)
2. Fallback: `http://localhost:3101` (development) or production URL

## API Service Factory

Use `createApiService()` to generate typed API services for resources:

```typescript
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";

const formsApi = createApiService<Form>("/forms");
```

### Standard CRUD Operations

The factory provides these methods:

```typescript
// Fetch all with pagination, sorting, filtering
const response = await formsApi.fetchAll({
  page: 1,
  pageSize: 10,
  sortField: "createdAt",
  sortDirection: "desc",
  search: "query"
});

// Fetch single item
const form = await formsApi.fetch("form-id");

// Create new item
const newForm = await formsApi.create({
  title: "My Form",
  fields: []
});

// Update existing item
const updated = await formsApi.update("form-id", {
  title: "Updated Title"
});

// Delete item
await formsApi.delete("form-id");

// Delete multiple items
await formsApi.deleteMany(["id1", "id2"]);
```

### Custom Routes

Override default routes for special endpoints:

```typescript
const customApi = createApiService<Form>("/forms", {
  customRoutes: {
    fetchAll: () => "/forms/custom-list",
    fetch: (id: string) => ({
      url: `/forms/${id}/details`,
      config: { params: { include: "metadata" } }
    })
  }
});
```

### Organization ID Inclusion

For endpoints that require explicit organization ID:

```typescript
const orgScopedApi = createApiService<Resource>("/resources", {
  includeOrgId: true // Automatically adds organizationId to query params
});
```

## Error Handling

All API methods return a `MutationResponse<T>` type:

```typescript
type MutationResponse<T> = {
  status: number;
  data?: T;
  error?: string;
};
```

### Handling Errors

```typescript
const response = await formsApi.create(formData);

if (response.error) {
  // Handle error
  toast.error(response.error);
  return;
}

// Use response.data
console.log(response.data);
```

### Error Response Structure

Errors are automatically extracted from Axios responses:
- `error.response.data.message` (string or array)
- `error.response.data.error`
- `error.message` (fallback)

## Query Parameters

The `buildQueryParams()` utility handles complex query parameter construction:

```typescript
const params = {
  page: 1,
  pageSize: 10,
  sortField: "name",
  sortDirection: "asc",
  search: "query",
  isActive: true, // Booleans are converted to "true"/"false" strings
  customField: "value"
};

const response = await api.fetchAll(params);
```

### Supported Query Parameters

- `page`, `pageSize`: Pagination
- `sortField`, `sortDirection`: Sorting
- `search`: Full-text search
- Custom fields: Any additional fields are passed as query parameters

## React Query Integration

API services work seamlessly with React Query:

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { formsApi } from "@/api/forms";

// Query
const { data, isLoading } = useQuery({
  queryKey: ["forms"],
  queryFn: async () => {
    const response = await formsApi.fetchAll();
    return response.data || [];
  }
});

// Mutation
const createMutation = useMutation({
  mutationFn: (formData: CreateFormDto) => formsApi.create(formData),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["forms"] });
  }
});
```

## Custom Requests

For endpoints that don't fit the standard CRUD pattern:

```typescript
const response = await api.customRequest<ResponseType>(
  "post",
  "/custom/endpoint",
  {
    data: { /* request body */ },
    params: { /* query params */ },
    headers: { /* custom headers */ },
    rawDataOnly: false // Return full response vs just data
  }
);
```

## Organization ID Utilities

### Getting Organization ID

```typescript
import { getUserOrganizationId } from "@/api/utils/getUserOrganizationId";

const orgId = getUserOrganizationId(); // From localStorage
```

**Note**: Prefer using `useOrganization()` hook in React components for reactive organization data.

## Best Practices

### 1. Use TypeScript Types

Always type your API services:

```typescript
const formsApi = createApiService<Form>("/forms");
// TypeScript will infer types for all methods
```

### 2. Organize by Feature

Group API functions by feature in subfolders:

```
api/
  forms/
    index.ts        # Export formsApi
  users/
    index.ts        # Export usersApi
    fetchUser.ts    # Individual functions if needed
```

### 3. Handle Errors Appropriately

```typescript
const response = await formsApi.create(data);

if (response.error) {
  // User-friendly error message (internationalized)
  toast.error(t("form_creation_failed"), {
    description: response.error
  });
  return;
}

// Success handling
toast.success(t("form_created"));
```

### 4. Use React Query for Data Fetching

Prefer React Query hooks over direct API calls in components:

```typescript
// ✅ Good
const { data } = useQuery({
  queryKey: ["forms"],
  queryFn: () => formsApi.fetchAll().then(r => r.data || [])
});

// ❌ Avoid
const [forms, setForms] = useState([]);
useEffect(() => {
  formsApi.fetchAll().then(r => setForms(r.data || []));
}, []);
```

### 5. Invalidate Queries After Mutations

```typescript
const mutation = useMutation({
  mutationFn: formsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["forms"] });
  }
});
```

## Common Patterns

### Paginated List

```typescript
const [page, setPage] = useState(1);
const [pageSize] = useState(10);

const { data, isLoading } = useQuery({
  queryKey: ["forms", page, pageSize],
  queryFn: async () => {
    const response = await formsApi.fetchAll({ page, pageSize });
    return {
      items: response.data || [],
      totalCount: response.data?.totalCount || 0
    };
  }
});
```

### Search with Debounce

```typescript
import { useDebounce } from "@/hooks/useDebounce";

const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

const { data } = useQuery({
  queryKey: ["forms", debouncedSearch],
  queryFn: () => formsApi.fetchAll({ search: debouncedSearch }),
  enabled: debouncedSearch.length > 2
});
```

### Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: formsApi.update,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ["forms"] });
    const previous = queryClient.getQueryData(["forms"]);
    queryClient.setQueryData(["forms"], (old: Form[]) =>
      old.map(f => f._id === newData._id ? { ...f, ...newData } : f)
    );
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(["forms"], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["forms"] });
  }
});
```

## Troubleshooting

### CORS Issues
- Ensure `withCredentials: true` is set (handled automatically by apiClient)
- Verify server CORS configuration allows credentials

### Organization ID Missing
- Check that user is authenticated
- Verify `getUserOrganizationId()` returns a valid ID
- Ensure organization ID is in localStorage after login

### Type Errors
- Ensure your TypeScript types match the API response structure
- Use `as` assertions sparingly and only when necessary

### Request Not Including Cookies
- Verify `withCredentials: true` in apiClient configuration
- Check browser DevTools Network tab for cookie headers
- Ensure server CORS allows credentials

