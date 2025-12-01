# User Status Restrictions Implementation Plan

## Overview
**STATUS SYSTEM**:
- **ACTIVE**: Normal active user (can login, full access)
- **INACTIVE**: User self-deleted (cannot login, `isDeleted: true`, can re-register with same email)
- **BLOCKED**: Admin blocked (can login but restricted, `isDeleted: false`, cannot re-register)
- **DELETED**: Admin deactivated (cannot login, `isDeleted: true`, cannot re-register)

**Current Phase (Temporary)**:
- **INACTIVE**: Cannot login (user self-deleted, can re-register)
- **DELETED**: Cannot login (admin deactivated, cannot re-register)
- **BLOCKED**: Cannot login (different error message)

**Future Phase (To be implemented later)**:
- **INACTIVE**: Cannot login (user self-deleted, can re-register)
- **DELETED**: Cannot login (admin deactivated, cannot re-register)
- **BLOCKED**: Can login but restricted (no profile updates, no password changes, no new quotes, existing quotes paused but can pay/negotiate)

## Backend Changes (Temporary Implementation)

### 1. Domain Layer - User Entity
**File**: `src/domain/entities/user.entity.ts`
- Update `canLogin()` to return false for INACTIVE and DELETED, true for ACTIVE and BLOCKED
- Add `isInactive()` method (for future use)
- **SKIP FOR NOW**: `canCreateQuotes()`, `canUpdateProfile()`, `canChangePassword()` methods (will add later)

### 2. Constants - Error Messages
**File**: `src/shared/constants/index.ts`
- Add `ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.'`
- Add `ACCOUNT_BLOCKED: 'Your account has been blocked. Please contact support.'`
- Add error codes: `ACCOUNT_INACTIVE`, `ACCOUNT_BLOCKED`
- **SKIP FOR NOW**: Other error messages (will add later when implementing full restrictions)

### 3. Authentication - Login Use Case
**File**: `src/application/use-cases/implementation/auth/login_user.use-case.ts`
- Update login check to differentiate INACTIVE, DELETED, and BLOCKED with specific error messages
- For INACTIVE: throw error with `ACCOUNT_INACTIVE` message and code
- For DELETED: throw error with `ACCOUNT_DELETED` message and code
- For BLOCKED: throw error with `ACCOUNT_BLOCKED` message and code
- All three statuses prevent login (keep current behavior until future phase)

### 4-10. Other Use Cases and Quote Logic
**SKIP FOR NOW** - Will implement later when allowing BLOCKED users to login:
- Profile update restrictions for BLOCKED users
- Password change restrictions for BLOCKED users
- Quote creation restrictions for BLOCKED users
- Quote cancellation/pausing logic for BLOCKED users
- Driver assignment filtering for BLOCKED users

## Frontend Changes (Temporary Implementation)

### 11. Types - User Status
**File**: `client/src/types/users/admin_user.ts`
- Already has UserStatus enum, no changes needed

### 12. Confirmation Modal - Status Change
**File**: `client/src/components/users/details/account_info_bento_card.tsx`
- Update confirmation modal messages:
  - For DELETED: "User will not be able to login. Their account will be deactivated and cannot re-register."
  - For BLOCKED: "User will not be able to login. Their account will be blocked."
  - Note: Admin cannot set status to INACTIVE (only users can self-delete to INACTIVE)

### 13-16. Other Frontend Restrictions
**SKIP FOR NOW** - Will implement later when allowing BLOCKED users to login:
- Dashboard notifications for BLOCKED users
- Quote creation button disabling for BLOCKED users
- Profile update form disabling for BLOCKED users
- Password change form disabling for BLOCKED users

### 17. Login Error Messages
**File**: Need to find login form/error handling
- Update error handling to show specific messages based on error code:
  - For `ACCOUNT_INACTIVE`: "Your account is inactive. Please contact support."
  - For `ACCOUNT_BLOCKED`: "Your account has been blocked. Please contact support."
  - For other errors: keep existing messages

## Implementation Order (Temporary Phase)

1. **Backend Domain Layer** (Add `isInactive()` method)
2. **Backend Constants** (Add INACTIVE/BLOCKED error messages and codes)
3. **Backend Login Use Case** (Differentiate INACTIVE vs BLOCKED with specific errors)
4. **Frontend Confirmation Modal** (Update messages to reflect both cannot login)
5. **Frontend Login Error Handling** (Show specific messages based on error code)

## Future Implementation (When Allowing BLOCKED Users to Login)

1. **Backend Domain Layer** (Update `canLogin()` to allow BLOCKED users)
2. **Backend Use Cases** (Add restrictions to profile, password, quotes for BLOCKED users)
3. **Backend Status Change Logic** (Quote pausing for BLOCKED users)
4. **Backend Driver Assignment** (Skip BLOCKED users' quotes)
5. **Frontend Restrictions** (Disable buttons, show toasts for BLOCKED users)
6. **Frontend Notifications** (Dashboard banner for BLOCKED users)

## Testing Checklist (Temporary Phase)

- [ ] INACTIVE user cannot login (shows specific error message)
- [ ] DELETED user cannot login (shows specific error message)
- [ ] BLOCKED user cannot login (shows specific error message)
- [ ] Error messages are different for INACTIVE, DELETED, and BLOCKED
- [ ] INACTIVE user can re-register with same email (reactivates account)
- [ ] DELETED user cannot re-register with same email (shows error)
- [ ] Admin cannot set status to INACTIVE (validation prevents it)
- [ ] Admin can set status to ACTIVE, BLOCKED, or DELETED
- [ ] User self-delete sets status to INACTIVE (not DELETED)
- [ ] Frontend confirmation modal shows correct messages for all statuses
- [ ] Frontend login form shows appropriate error messages based on status

## Future Testing Checklist (When Allowing BLOCKED Users to Login)

- [ ] BLOCKED user can login
- [ ] BLOCKED user cannot create quotes
- [ ] BLOCKED user cannot update profile
- [ ] BLOCKED user cannot change password
- [ ] BLOCKED user can view existing quotes
- [ ] BLOCKED user can pay for submitted quotes
- [ ] BLOCKED user can negotiate on existing quotes
- [ ] BLOCKED user's draft quotes are paused when status changes
- [ ] Driver assignment skips BLOCKED users' quotes
- [ ] Reactivation restores quotes properly
- [ ] INACTIVE user still cannot login (unchanged)
- [ ] DELETED user still cannot login (unchanged)
- [ ] Frontend shows proper notifications for BLOCKED users
- [ ] Frontend disables buttons correctly for BLOCKED users

