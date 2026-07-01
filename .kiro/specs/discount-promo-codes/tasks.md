# Implementation Plan: Discount & Promo Codes

## Overview

This plan implements a full discount and promotional code system for the Lusso candle store. The implementation follows a bottom-up approach: schema first, then pure logic, then server actions, then UI, and finally integration wiring. TypeScript is used throughout, consistent with the existing codebase patterns (Prisma, Next.js Server Actions, Zustand, Tailwind CSS).

## Tasks

- [x] 1. Database schema and discount service types
  - [x] 1.1 Add DiscountCode and DiscountUsage models to Prisma schema
    - Add `DiscountType` enum (`PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`) to `prisma/schema.prisma`
    - Add `DiscountCode` model with all fields: id, code (unique), type, value, minOrderAmountZAR, maxUsageCount, perUserLimit, maxDiscountAmountZAR, stackable, startDate, endDate, active, applicableProductIds, timestamps
    - Add `DiscountUsage` model with fields: id, discountCodeId (nullable), emailCaptureCode (nullable), userId, orderId, discountAmountZAR, createdAt
    - Add `discountData` Json? field to the existing `Order` model
    - Add indexes on DiscountCode (active, startDate, endDate) and DiscountUsage (discountCodeId, userId, emailCaptureCode)
    - Generate and run migration
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 1.2 Create discount service types and interfaces
    - Create `src/lib/discounts/types.ts` with `DiscountType`, `DiscountCodeData`, `CartItemForDiscount`, `AppliedDiscount`, `ValidationSuccess`, `ValidationError`, `ValidationResult` interfaces
    - Export all types for use across the discount system
    - _Requirements: 1.1, 2.9, 3.1_

- [x] 2. Pure discount calculation and validation logic
  - [x] 2.1 Implement pure discount calculation functions
    - Create `src/lib/discounts/calculate.ts`
    - Implement `calculateApplicableSubtotal(items, applicableProductIds)` — sums price*quantity for applicable items
    - Implement `calculateDiscount(code, applicableSubtotal)` — handles PERCENTAGE (with cap), FIXED_AMOUNT (capped at subtotal), FREE_SHIPPING
    - Implement `calculateTotalDiscount(discounts, cartSubtotal)` — sums discounts capped at cart subtotal
    - Implement `generatePromoCode()` — returns 8-char uppercase alphanumeric string
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 9.7_

  - [x] 2.2 Write property tests for discount calculation (Property 5)
    - **Property 5: Discount Calculation Correctness**
    - Create `src/lib/discounts/__tests__/calculate.property.test.ts`
    - Test PERCENTAGE calculation: `min(Math.round(subtotal * value / 100), maxDiscountAmountZAR ?? Infinity)`
    - Test FIXED_AMOUNT calculation: `min(value, applicableSubtotal)`
    - Test result never exceeds applicable subtotal
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

  - [x] 2.3 Write property test for code generation (Property 14)
    - **Property 14: Code Generation Format**
    - Add to `src/lib/discounts/__tests__/calculate.property.test.ts`
    - Test output is exactly 8 characters, only uppercase A-Z and 0-9
    - **Validates: Requirements 9.7**

  - [x] 2.4 Write property test for multiple discount summation (Property 7)
    - **Property 7: Multiple Discount Summation with Cap**
    - Add to `src/lib/discounts/__tests__/calculate.property.test.ts`
    - Test sum of discounts capped at cart subtotal, order total never negative
    - **Validates: Requirements 4.5, 4.6**

  - [x] 2.5 Implement pure discount validation logic
    - Create `src/lib/discounts/validate.ts`
    - Implement `validateDiscountConditions(code, cartItems, cartSubtotal, currentUsageCount, userUsageCount, now)` with checks in order: active, start date, end date, global usage, per-user usage, minimum order, product restrictions
    - Return specific error messages as defined in requirements
    - Return calculated discount amount on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 2.6 Write property tests for validation pipeline (Property 4)
    - **Property 4: Validation Pipeline Correctness**
    - Create `src/lib/discounts/__tests__/validate.property.test.ts`
    - Test that validation returns success iff ALL conditions pass
    - Test specific error messages for each failing condition
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

  - [x] 2.7 Write property tests for validation input constraints (Property 3)
    - **Property 3: Validation Input Constraints**
    - Add to `src/lib/discounts/__tests__/validate.property.test.ts`
    - Test percentage values accepted in [1, 100], rejected outside; fixed amounts must be positive; startDate must be before endDate
    - **Validates: Requirements 1.5, 1.6, 9.6**

  - [x] 2.8 Implement stacking rules validation
    - Add `validateStackingRules(newCode, existingDiscounts)` to `src/lib/discounts/validate.ts`
    - Enforce: max one non-stackable code, reject stackable if non-stackable applied, reject non-stackable if any code applied
    - Return appropriate error messages per requirement
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.9 Write property tests for stacking rules (Property 6)
    - **Property 6: Stacking Rules Enforcement**
    - Add to `src/lib/discounts/__tests__/validate.property.test.ts`
    - Test non-stackable blocks additional codes, stackable allowed alongside stackable, non-stackable only accepted when no other codes applied
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 3. Checkpoint - Core logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Discount service layer (database-facing)
  - [x] 4.1 Implement discount service with database operations
    - Create `src/lib/discounts/service.ts`
    - Implement `validatePromoCode(codeString, cartItems, userId)` — queries DB for code (case-insensitive), falls back to EmailCapture, delegates to pure validation
    - Implement `validateStackingRules(newCode, existingDiscounts)` — orchestrates stacking check
    - Implement `recordUsage(discountCodeId, userId, orderId, discountAmountZAR)` — creates DiscountUsage record in a transaction with usage count re-check
    - Implement `getDiscountStats(codeId)` — returns total redemptions, total discount given, recent redemptions with user email
    - _Requirements: 2.1, 2.9, 7.1, 7.2, 7.3, 10.3, 10.4_

  - [x] 4.2 Write property test for email capture fallback (Property 10)
    - **Property 10: Email Capture Code Fallback**
    - Add to `src/lib/discounts/__tests__/validate.property.test.ts`
    - Test that codes in EmailCapture but not DiscountCode table are treated as 10% PERCENTAGE, no minimum, no expiration, not stackable, max 1 total redemption
    - **Validates: Requirements 7.1**

  - [x] 4.3 Write property test for email capture single-use (Property 11)
    - **Property 11: Email Capture Single-Use Enforcement**
    - Add to `src/lib/discounts/__tests__/validate.property.test.ts`
    - Test that once an email capture code is redeemed, subsequent attempts are rejected regardless of user
    - **Validates: Requirements 7.3**

  - [x] 4.4 Create barrel export for discount library
    - Create `src/lib/discounts/index.ts` exporting all public functions and types from calculate, validate, service, and types modules
    - _Requirements: N/A (code organization)_

- [x] 5. Customer-facing server actions and cart store
  - [x] 5.1 Create customer-facing discount server actions
    - Create `src/actions/discounts.ts`
    - Implement `applyPromoCode(code, cartItems, existingDiscounts)` — validates code via service, checks stacking, returns ValidationResult
    - Implement `removePromoCode(codeId, existingDiscounts)` — filters out the specified code and returns updated list
    - _Requirements: 2.1, 2.9, 4.1, 4.2, 4.3, 4.4, 5.3, 5.4_

  - [x] 5.2 Extend cart store with discount state
    - Add `appliedDiscounts: AppliedDiscount[]` to the CartStore interface in `src/store/cartStore.ts`
    - Add `addDiscount`, `removeDiscount`, and `clearDiscounts` actions
    - Ensure discounts persist in localStorage via the existing `persist` middleware
    - _Requirements: 5.4, 5.7_

  - [x] 5.3 Write property test for cart store discount persistence (Property 8)
    - **Property 8: Cart Store Discount Persistence Round-Trip**
    - Create `src/store/__tests__/cartStore.property.test.ts`
    - Test that adding a discount, serializing to localStorage, and deserializing preserves codeId, code, type, and discountAmountZAR
    - **Validates: Requirements 5.4, 5.7**

- [x] 6. Checkout integration
  - [x] 6.1 Extend checkout action to handle discounts
    - Modify `src/actions/checkout.ts` `createCheckoutSession` to accept `appliedDiscounts: AppliedDiscount[]` parameter
    - Re-validate each applied code server-side via discount service
    - Calculate reduced `totalAmountZAR` as subtotal minus total discount plus gift wrap
    - Store discount metadata in Order `discountData` JSON field
    - Create DiscountUsage records on successful order creation (inside transaction)
    - If total after discount is zero, skip Peach Payments call, mark order as PAID, return success directly
    - Return specific error if any code fails re-validation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 6.2 Write property test for checkout total calculation (Property 9)
    - **Property 9: Checkout Total Calculation**
    - Create `src/actions/__tests__/checkout-discount.property.test.ts`
    - Test `totalAmountZAR = max(cartSubtotal - totalDiscount, 0) + (giftWrap ? 4900 : 0)`
    - Test zero-total orders skip payment gateway
    - **Validates: Requirements 6.3, 6.7**

- [x] 7. Checkpoint - Backend integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Customer-facing UI
  - [x] 8.1 Build PromoCodeInput component
    - Create `src/components/cart/PromoCodeInput.tsx`
    - Render text input + "Apply" button in the cart drawer order summary section
    - On apply: call `applyPromoCode` server action, show loading state, display error in red text below input
    - On success: display applied code with discount amount and "Remove" button
    - Support multiple applied codes (when stackable)
    - Display original subtotal, discount line item(s) with code and savings, and final total in order summary
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8_

  - [x] 8.2 Write unit tests for PromoCodeInput component
    - Create `src/components/cart/__tests__/PromoCodeInput.test.tsx`
    - Test rendering, loading state, error display, successful application, removal
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9. Admin discount management — server actions
  - [x] 9.1 Create admin discount server actions
    - Create `src/actions/admin/discounts.ts`
    - Implement `createDiscountCode(data)` — validates inputs, checks role, creates in DB, handles duplicate code error
    - Implement `updateDiscountCode(id, data)` — validates inputs, updates in DB
    - Implement `toggleDiscountActive(id, active)` — sets active flag
    - Implement `getDiscountCodes(search?)` — returns all codes with usage stats, sorted by createdAt desc, filterable by code string
    - Implement `getDiscountDetail(id)` — returns code with full usage stats and recent redemptions
    - _Requirements: 8.1, 8.2, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.8, 10.1, 10.2, 10.3, 10.4_

- [x] 10. Admin discount management — UI
  - [x] 10.1 Create admin discount listing page
    - Create `src/app/admin/discounts/page.tsx`
    - Display table of all discount codes with: code, type, value, active status, usage/max, start date, end date, created date, revenue impact
    - Add search input to filter by code string
    - Add "Create Discount" button linking to create form
    - Add status badge (valid/invalid based on active + dates + usage)
    - Add "Edit", "Activate"/"Deactivate" actions per row
    - Render within existing admin shell layout
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.1, 10.2, 10.4, 10.5_

  - [x] 10.2 Create DiscountForm shared component
    - Create `src/components/admin/discounts/DiscountForm.tsx`
    - Include fields: code string, type selection, value, min order amount, max usage count, per-user limit, start date, end date, applicable products multi-select, stackable toggle, max discount cap (shown for percentage type)
    - Add "Generate Code" button that fills code field with random 8-char alphanumeric code
    - Client-side validation: percentage 1-100, positive fixed amount, start before end
    - _Requirements: 9.1, 9.6, 9.7_

  - [x] 10.3 Create admin discount create and edit pages
    - Create `src/app/admin/discounts/new/page.tsx` — renders DiscountForm in create mode, calls `createDiscountCode` on submit
    - Create `src/app/admin/discounts/[id]/edit/page.tsx` — renders DiscountForm pre-populated, calls `updateDiscountCode` on submit
    - Display success/error messages, redirect to listing on success
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.4 Create DiscountDetail component for usage stats
    - Create `src/components/admin/discounts/DiscountDetail.tsx`
    - Display total redemptions, total discount given (formatted in Rands), list of recent redemptions with user email, order ID, discount amount, date
    - Show when admin clicks on a code row in the listing
    - _Requirements: 10.3, 10.4_

  - [x] 10.5 Write property test for status badge computation (Property 12)
    - **Property 12: Code Status Badge Computation**
    - Create `src/components/admin/discounts/__tests__/discountStatus.property.test.ts`
    - Test badge shows "valid" iff active=true AND startDate <= now AND endDate >= now AND usage < maxUsageCount
    - **Validates: Requirements 8.6**

  - [x] 10.6 Write property test for revenue impact summation (Property 13)
    - **Property 13: Revenue Impact Summation**
    - Add to `src/components/admin/discounts/__tests__/discountStatus.property.test.ts`
    - Test total revenue impact equals sum of discountAmountZAR across all usage records for a code
    - **Validates: Requirements 10.4**

- [x] 11. Admin sidebar navigation update
  - [x] 11.1 Add "Discounts" link to the admin sidebar navigation
    - Update `src/components/admin/AdminShell.tsx` to include a "Discounts" nav item pointing to `/admin/discounts`
    - Use a tag/percent icon consistent with the existing sidebar design
    - _Requirements: 8.3_

- [x] 12. Final checkpoint - All tests pass and feature is integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All monetary values are in ZAR cents (integers) consistent with existing codebase
- The discount service uses pure functions for calculation/validation to maximize testability
- The `fast-check` library (v4.7.0) is already available in devDependencies for property tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.5", "2.8"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.6", "2.7", "2.9"] },
    { "id": 3, "tasks": ["4.1", "4.4"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "6.1"] },
    { "id": 6, "tasks": ["6.2", "8.1", "9.1"] },
    { "id": 7, "tasks": ["8.2", "10.1", "10.2"] },
    { "id": 8, "tasks": ["10.3", "10.4", "11.1"] },
    { "id": 9, "tasks": ["10.5", "10.6"] }
  ]
}
```
