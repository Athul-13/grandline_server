# Admin Quote Management & Pricing Config Implementation Plan

## Overview

This document outlines the implementation plan for admin quote management and pricing configuration features. The implementation is split into logical phases with proper git commit structure following Clean Architecture principles.

## Current State

- User quote management is fully implemented
- Quote pricing uses `averageDriverPerHourRate` from pricing config (estimate pricing)
- Admin authentication exists via `requireAdmin` middleware
- Pricing config repository and entity exist but no admin endpoints

## Implementation Goals

### Phase 1: Foundation (Quote Entity Updates)
- Add `QUOTED` status to QuoteStatus enum
- Add placeholder fields to Quote entity for future driver assignment
- Update MongoDB schema

### Phase 2: Admin Quote Management
- Admin endpoints to view all quotes with filtering, sorting, pagination
- Admin endpoints to view quote details with user information
- Admin endpoint to change quote status (to PAID and back)
- Support for viewing deleted quotes

### Phase 3: Pricing Config Management
- Admin endpoints to view active pricing config
- Admin endpoints to create new pricing config versions
- Admin endpoints to view pricing config history
- Admin endpoint to activate pricing config

---

## Implementation Phases & Git Commits

### **Commit 1: Add QUOTED status and placeholder fields to Quote entity**

**Files Changed:**
- `src/shared/constants/index.ts` - Add `QUOTED` to `QuoteStatus` enum
- `src/domain/entities/quote.entity.ts` - Add placeholder fields interface
- `src/infrastructure/database/mongodb/schemas/quote.schema.ts` - Add fields to schema
- `src/infrastructure/database/mongodb/models/quote.model.ts` - Update model interface

**Changes:**
- Add `QUOTED = 'quoted'` to `QuoteStatus` enum
- Add to Quote entity:
  - `assignedDriverId?: string`
  - `actualDriverRate?: number`
  - `pricingLastUpdatedAt?: Date`
- Update MongoDB schema with optional fields
- Update TypeScript model interface

**Commit Message:**
```
feat(quotes): add QUOTED status and driver assignment placeholder fields

- Add QUOTED status to QuoteStatus enum for quotes with actual driver pricing
- Add assignedDriverId, actualDriverRate, pricingLastUpdatedAt fields to Quote entity
- Update MongoDB schema to support future driver assignment feature
- Fields are optional and will be used when driver assignment is implemented
```

---

### **Commit 2: Create admin quote DTOs and interfaces**

**Files Changed:**
- `src/application/dtos/quote.dto.ts` - Add admin-specific DTOs
- `src/application/use-cases/interface/admin/get_admin_quotes_list_use_case.interface.ts` - New file
- `src/application/use-cases/interface/admin/get_admin_quote_use_case.interface.ts` - New file
- `src/application/use-cases/interface/admin/update_quote_status_use_case.interface.ts` - New file

**Changes:**
- Create `AdminQuoteListItemResponse` DTO (includes user info)
- Create `AdminQuoteResponse` DTO (full quote with user details)
- Create `UpdateQuoteStatusRequest` DTO
- Create `AdminQuotesListResponse` DTO
- Create use case interfaces for admin operations

**DTO Structure:**
```typescript
// AdminQuoteListItemResponse extends QuoteListItemResponse with:
- user: { userId, fullName, email, phoneNumber }

// AdminQuoteResponse extends QuoteResponse with:
- user: { userId, fullName, email, phoneNumber }

// UpdateQuoteStatusRequest:
- status: QuoteStatus (validated to only allow PAID and back)
```

**Commit Message:**
```
feat(admin): add DTOs and interfaces for admin quote management

- Create AdminQuoteListItemResponse with user information
- Create AdminQuoteResponse with full user details
- Create UpdateQuoteStatusRequest for status changes
- Create use case interfaces for admin quote operations
- Admin can only change status to PAID and back for now
```

---

### **Commit 3: Implement admin quote list use case**

**Files Changed:**
- `src/application/use-cases/implementation/admin/get_admin_quotes_list.use-case.ts` - New file
- `src/domain/repositories/quote_repository.interface.ts` - Add admin query methods if needed

**Changes:**
- Implement `GetAdminQuotesListUseCase`
- Support filtering by:
  - Status (single or multiple)
  - User (by userId, name, or email)
  - Deleted quotes (includeDeleted query param)
- Support sorting by: createdAt, updatedAt, status, totalPrice, tripName
- Support pagination (page, limit)
- Default: show only non-deleted quotes
- When includeDeleted=true, show deleted quotes in same list
- Fetch user information for each quote

**Repository Methods (if needed):**
- `findAllForAdmin(filters, pagination)` - Get all quotes with filters
- `findByUserEmail(email)` - Find quotes by user email
- `findByUserName(name)` - Find quotes by user name

**Commit Message:**
```
feat(admin): implement admin quote list use case with filtering and sorting

- Add GetAdminQuotesListUseCase with comprehensive filtering
- Support filtering by status, user (name/email), and deleted quotes
- Support sorting by createdAt, updatedAt, status, totalPrice, tripName
- Include user information (name, email, phone) in response
- Default to non-deleted quotes, optional includeDeleted parameter
- Add pagination support
```

---

### **Commit 4: Implement admin quote details use case**

**Files Changed:**
- `src/application/use-cases/implementation/admin/get_admin_quote.use-case.ts` - New file
- `src/application/mapper/quote.mapper.ts` - Add admin mapping method

**Changes:**
- Implement `GetAdminQuoteUseCase`
- Fetch quote by ID (no ownership check for admin)
- Fetch user information (name, email, phone)
- Fetch itinerary and passengers
- Return `AdminQuoteResponse` with full user details

**Commit Message:**
```
feat(admin): implement admin quote details use case

- Add GetAdminQuoteUseCase to fetch quote details for admin
- Include user information (name, email, phone) in response
- No ownership validation (admin can view any quote)
- Returns full quote data with itinerary and passengers
```

---

### **Commit 5: Implement update quote status use case**

**Files Changed:**
- `src/application/use-cases/implementation/admin/update_quote_status.use-case.ts` - New file

**Changes:**
- Implement `UpdateQuoteStatusUseCase`
- Validate status transition:
  - Can change to `PAID` from any status
  - Can change `PAID` back to previous status (store previous status)
- Validate quote exists
- Update quote status
- Return updated quote

**Status Transition Logic:**
- When changing to PAID: Store previous status in a temporary field or log
- When changing from PAID: Restore to previous status if available, or allow admin to specify

**Commit Message:**
```
feat(admin): implement update quote status use case

- Add UpdateQuoteStatusUseCase for admin status management
- Allow changing to PAID from any status
- Allow changing PAID back to previous status
- Validate status transitions and quote existence
- Return updated quote with new status
```

---

### **Commit 6: Create admin quote controller**

**Files Changed:**
- `src/presentation/controllers/admin/admin_quote.controller.ts` - New file
- `src/infrastructure/di/tokens/controllers.tokens.ts` - Add controller token

**Changes:**
- Create `AdminQuoteController`
- Implement methods:
  - `getQuotesList(req, res)` - Handle GET /api/v1/admin/quotes
  - `getQuote(req, res)` - Handle GET /api/v1/admin/quotes/:id
  - `updateQuoteStatus(req, res)` - Handle PUT /api/v1/admin/quotes/:id/status
- Extract query parameters (filters, sort, pagination)
- Call appropriate use cases
- Handle errors and return responses

**Commit Message:**
```
feat(admin): create admin quote controller

- Add AdminQuoteController with list, details, and status update endpoints
- Extract and validate query parameters for filtering and sorting
- Handle pagination and deleted quotes filter
- Return standardized success/error responses
```

---

### **Commit 7: Create admin quote routes**

**Files Changed:**
- `src/presentation/routes/admin/admin_quote_routes.ts` - New file
- `src/presentation/routes/index.ts` - Register admin routes

**Changes:**
- Create admin quote routes:
  - `GET /api/v1/admin/quotes` - List quotes (with filters, sort, pagination)
  - `GET /api/v1/admin/quotes/:id` - Get quote details
  - `PUT /api/v1/admin/quotes/:id/status` - Update quote status
- Apply `authenticate` and `requireAdmin` middleware
- Apply validation middleware for request DTOs
- Register routes in main router

**Route Structure:**
```
/api/v1/admin/quotes
  GET / - List all quotes (admin)
  GET /:id - Get quote details (admin)
  PUT /:id/status - Update quote status (admin)
```

**Commit Message:**
```
feat(admin): create admin quote routes with authentication

- Add admin quote routes under /api/v1/admin/quotes
- Apply authenticate and requireAdmin middleware
- Add validation for request DTOs
- Register routes in main application router
```

---

### **Commit 8: Create pricing config DTOs and interfaces**

**Files Changed:**
- `src/application/dtos/pricing_config.dto.ts` - New file
- `src/application/use-cases/interface/admin/get_pricing_config_use_case.interface.ts` - New file
- `src/application/use-cases/interface/admin/create_pricing_config_use_case.interface.ts` - New file
- `src/application/use-cases/interface/admin/get_pricing_config_history_use_case.interface.ts` - New file
- `src/application/use-cases/interface/admin/activate_pricing_config_use_case.interface.ts` - New file

**Changes:**
- Create `CreatePricingConfigRequest` DTO with validation:
  - `fuelPrice` (number, min 0)
  - `averageDriverPerHourRate` (number, min 0)
  - `stayingChargePerDay` (number, min 0)
  - `taxPercentage` (number, min 0, max 100)
  - `nightChargePerNight` (number, min 0)
- Create `PricingConfigResponse` DTO
- Create `PricingConfigHistoryResponse` DTO
- Create use case interfaces

**Commit Message:**
```
feat(admin): add DTOs and interfaces for pricing config management

- Create CreatePricingConfigRequest with validation
- Create PricingConfigResponse for active config
- Create PricingConfigHistoryResponse for version history
- Add use case interfaces for pricing config operations
- Validate all numeric fields are positive, tax 0-100
```

---

### **Commit 9: Implement get active pricing config use case**

**Files Changed:**
- `src/application/use-cases/implementation/admin/get_pricing_config.use-case.ts` - New file

**Changes:**
- Implement `GetPricingConfigUseCase`
- Fetch active pricing config using `pricingConfigRepository.findActive()`
- Return error if no active config exists
- Map to `PricingConfigResponse` DTO

**Commit Message:**
```
feat(admin): implement get active pricing config use case

- Add GetPricingConfigUseCase to fetch current active pricing config
- Return error if no active config exists
- Map entity to response DTO
```

---

### **Commit 10: Implement create pricing config use case**

**Files Changed:**
- `src/application/use-cases/implementation/admin/create_pricing_config.use-case.ts` - New file

**Changes:**
- Implement `CreatePricingConfigUseCase`
- Get latest version number using `pricingConfigRepository.findLatestVersion()`
- Increment version (latest + 1)
- Create new pricing config with:
  - Auto-incremented version
  - `isActive: false` (admin must activate separately)
  - `createdBy: adminUserId` (from authenticated user)
- Save to repository
- Return created config

**Validation:**
- All numeric fields must be positive
- Tax percentage must be 0-100
- No empty strings or spaces in any field

**Commit Message:**
```
feat(admin): implement create pricing config use case

- Add CreatePricingConfigUseCase to create new pricing config versions
- Auto-increment version number from latest version
- Set isActive to false (requires separate activation)
- Store createdBy admin user ID
- Validate all fields (positive numbers, tax 0-100)
```

---

### **Commit 11: Implement get pricing config history use case**

**Files Changed:**
- `src/application/use-cases/implementation/admin/get_pricing_config_history.use-case.ts` - New file

**Changes:**
- Implement `GetPricingConfigHistoryUseCase`
- Fetch all pricing configs ordered by version (descending)
- Map to `PricingConfigHistoryResponse[]` DTO
- Return list of all versions

**Commit Message:**
```
feat(admin): implement get pricing config history use case

- Add GetPricingConfigHistoryUseCase to fetch all pricing config versions
- Return configs ordered by version (newest first)
- Include active status for each version
```

---

### **Commit 12: Implement activate pricing config use case**

**Files Changed:**
- `src/application/use-cases/implementation/admin/activate_pricing_config.use-case.ts` - New file

**Changes:**
- Implement `ActivatePricingConfigUseCase`
- Validate pricing config exists
- Use `pricingConfigRepository.activate(pricingConfigId)`
  - This deactivates all configs first
  - Then activates the specified one
- Return activated config
- Handle error if config doesn't exist

**Commit Message:**
```
feat(admin): implement activate pricing config use case

- Add ActivatePricingConfigUseCase to activate a pricing config version
- Deactivate all existing configs before activating new one
- Ensure only one active config at a time
- Validate config exists before activation
```

---

### **Commit 13: Create admin pricing config controller**

**Files Changed:**
- `src/presentation/controllers/admin/admin_pricing_config.controller.ts` - New file
- `src/infrastructure/di/tokens/controllers.tokens.ts` - Add controller token

**Changes:**
- Create `AdminPricingConfigController`
- Implement methods:
  - `getActiveConfig(req, res)` - Handle GET /api/v1/admin/pricing-config
  - `createConfig(req, res)` - Handle POST /api/v1/admin/pricing-config
  - `getHistory(req, res)` - Handle GET /api/v1/admin/pricing-config/history
  - `activateConfig(req, res)` - Handle PUT /api/v1/admin/pricing-config/:id/activate
- Extract request data
- Call appropriate use cases
- Handle errors and return responses

**Commit Message:**
```
feat(admin): create admin pricing config controller

- Add AdminPricingConfigController with CRUD operations
- Handle get active, create, history, and activate endpoints
- Extract and validate request data
- Return standardized success/error responses
```

---

### **Commit 14: Create admin pricing config routes**

**Files Changed:**
- `src/presentation/routes/admin/admin_pricing_config_routes.ts` - New file
- `src/presentation/routes/index.ts` - Register admin pricing config routes

**Changes:**
- Create admin pricing config routes:
  - `GET /api/v1/admin/pricing-config` - Get active config
  - `POST /api/v1/admin/pricing-config` - Create new config
  - `GET /api/v1/admin/pricing-config/history` - Get version history
  - `PUT /api/v1/admin/pricing-config/:id/activate` - Activate config
- Apply `authenticate` and `requireAdmin` middleware
- Apply validation middleware for request DTOs
- Register routes in main router

**Route Structure:**
```
/api/v1/admin/pricing-config
  GET / - Get active pricing config
  POST / - Create new pricing config version
  GET /history - Get all pricing config versions
  PUT /:id/activate - Activate a pricing config version
```

**Commit Message:**
```
feat(admin): create admin pricing config routes with authentication

- Add admin pricing config routes under /api/v1/admin/pricing-config
- Apply authenticate and requireAdmin middleware
- Add validation for request DTOs
- Register routes in main application router
```

---

### **Commit 15: Register admin routes and controllers in DI container**

**Files Changed:**
- `src/infrastructure/di/container.ts` - Register admin controllers
- `src/presentation/routes/index.ts` - Register admin routes

**Changes:**
- Register `AdminQuoteController` in DI container
- Register `AdminPricingConfigController` in DI container
- Register admin routes in main router
- Ensure proper dependency injection setup

**Commit Message:**
```
feat(admin): register admin controllers and routes in DI container

- Register AdminQuoteController in dependency injection container
- Register AdminPricingConfigController in dependency injection container
- Wire up admin routes in main application router
- Ensure proper dependency resolution
```

---

## File Structure

```
src/
├── application/
│   ├── dtos/
│   │   ├── quote.dto.ts (add admin DTOs)
│   │   └── pricing_config.dto.ts (new)
│   ├── use-cases/
│   │   ├── interface/
│   │   │   └── admin/
│   │   │       ├── get_admin_quotes_list_use_case.interface.ts (new)
│   │   │       ├── get_admin_quote_use_case.interface.ts (new)
│   │   │       ├── update_quote_status_use_case.interface.ts (new)
│   │   │       ├── get_pricing_config_use_case.interface.ts (new)
│   │   │       ├── create_pricing_config_use_case.interface.ts (new)
│   │   │       ├── get_pricing_config_history_use_case.interface.ts (new)
│   │   │       └── activate_pricing_config_use_case.interface.ts (new)
│   │   └── implementation/
│   │       └── admin/
│   │           ├── get_admin_quotes_list.use-case.ts (new)
│   │           ├── get_admin_quote.use-case.ts (new)
│   │           ├── update_quote_status.use-case.ts (new)
│   │           ├── get_pricing_config.use-case.ts (new)
│   │           ├── create_pricing_config.use-case.ts (new)
│   │           ├── get_pricing_config_history.use-case.ts (new)
│   │           └── activate_pricing_config.use-case.ts (new)
│   └── mapper/
│       └── quote.mapper.ts (add admin mapping methods)
├── domain/
│   ├── entities/
│   │   └── quote.entity.ts (add placeholder fields)
│   └── repositories/
│       └── quote_repository.interface.ts (add admin query methods if needed)
├── infrastructure/
│   ├── database/
│   │   └── mongodb/
│   │       ├── schemas/
│   │       │   └── quote.schema.ts (add fields)
│   │       └── models/
│   │           └── quote.model.ts (update interface)
│   └── di/
│       └── tokens/
│           └── controllers.tokens.ts (add admin controller tokens)
├── presentation/
│   ├── controllers/
│   │   └── admin/
│   │       ├── admin_quote.controller.ts (new)
│   │       └── admin_pricing_config.controller.ts (new)
│   └── routes/
│       ├── admin/
│       │   ├── admin_quote_routes.ts (new)
│       │   └── admin_pricing_config_routes.ts (new)
│       └── index.ts (register admin routes)
└── shared/
    └── constants/
        └── index.ts (add QUOTED status)
```

---

## API Endpoints Summary

### Admin Quote Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/admin/quotes` | List all quotes with filters | Admin |
| GET | `/api/v1/admin/quotes/:id` | Get quote details with user info | Admin |
| PUT | `/api/v1/admin/quotes/:id/status` | Update quote status | Admin |

**Query Parameters for GET /api/v1/admin/quotes:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string or array, optional)
- `userId` (string, optional)
- `userEmail` (string, optional)
- `userName` (string, optional)
- `includeDeleted` (boolean, default: false)
- `sortBy` (string: createdAt, updatedAt, status, totalPrice, tripName)
- `sortOrder` (string: asc, desc, default: asc)

### Admin Pricing Config Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/admin/pricing-config` | Get active pricing config | Admin |
| POST | `/api/v1/admin/pricing-config` | Create new pricing config version | Admin |
| GET | `/api/v1/admin/pricing-config/history` | Get all pricing config versions | Admin |
| PUT | `/api/v1/admin/pricing-config/:id/activate` | Activate a pricing config | Admin |

---

## Database Changes

### Quote Collection Schema Updates

Add optional fields:
```typescript
{
  assignedDriverId?: string,
  actualDriverRate?: number,
  pricingLastUpdatedAt?: Date
}
```

### Pricing Config Collection

No schema changes needed (already exists).

---

## Response DTOs

### AdminQuoteListItemResponse
```typescript
{
  quoteId: string;
  tripName?: string;
  tripType: TripType;
  status: QuoteStatus;
  currentStep?: number;
  totalPrice?: number;
  createdAt: Date;
  user: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
}
```

### AdminQuoteResponse
```typescript
{
  // All fields from QuoteResponse
  // Plus:
  user: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
}
```

### PricingConfigResponse
```typescript
{
  pricingConfigId: string;
  version: number;
  fuelPrice: number;
  averageDriverPerHourRate: number;
  stayingChargePerDay: number;
  taxPercentage: number;
  nightChargePerNight: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Handling

All endpoints should return standardized error responses:
```typescript
{
  success: false,
  message: "Error message",
  code?: "ERROR_CODE"
}
```

Common error scenarios:
- `PRICING_CONFIG_NOT_FOUND` - No active pricing config exists
- `QUOTE_NOT_FOUND` - Quote doesn't exist
- `INVALID_STATUS_TRANSITION` - Invalid status change
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Not admin user

---

## Testing Considerations

### Unit Tests
- Use case logic validation
- DTO validation
- Status transition validation
- Pricing config version increment logic

### Integration Tests
- Admin quote list with filters
- Admin quote details with user info
- Status update flow
- Pricing config creation and activation
- Only one active config at a time

---

## Future Enhancements (Not in Current Scope)

1. Driver assignment feature
2. Pricing override by admin
3. Email sending on status changes
4. Quote expiration dates
5. Bulk operations
6. Advanced analytics
7. Pricing recalculation on config change

---

## Notes

- All admin endpoints require `authenticate` and `requireAdmin` middleware
- Status changes are restricted to PAID and back for now
- Pricing config versions are immutable (no updates, only new versions)
- Only one pricing config can be active at a time
- Deleted quotes are excluded by default, can be included with `includeDeleted=true`
- User information is fetched from User repository using `quote.userId`
- All numeric validations ensure positive values
- Tax percentage must be between 0-100

---

**Last Updated:** Based on requirements discussion
**Implementation Status:** Planning phase

