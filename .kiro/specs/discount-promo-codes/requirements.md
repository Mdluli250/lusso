# Requirements Document

## Introduction

The Discount & Promo Codes feature adds a comprehensive coupon and promotional code system to the Lusso candle e-commerce store. Admins can create, manage, and deactivate discount codes through a dedicated admin interface at `/admin/discounts`. Customers can apply promo codes during checkout to receive percentage-off, fixed-amount (ZAR), or free-shipping discounts on their orders.

The system integrates with the existing checkout flow (`src/actions/checkout.ts`) where discounts reduce the `totalAmountZAR` sent to Peach Payments. It also bridges with the existing `EmailCapture` model, which already generates unique discount codes for email sign-ups but currently has no redemption mechanism. Stacking rules determine whether multiple codes can combine on a single order.

All monetary values are stored as integers in ZAR cents, consistent with the existing `Order.totalAmountZAR` and `Product.price` fields.

## Glossary

- **Discount_Code**: A promotional code record stored in the database, containing the code string, discount type, value, conditions, and usage tracking.
- **Discount_Service**: The server-side module responsible for creating, validating, applying, and tracking Discount_Codes.
- **Discount_Admin_UI**: The admin interface at `/admin/discounts` for managing Discount_Codes.
- **Promo_Input**: The customer-facing input field in the cart drawer or checkout page where users enter a promo code.
- **Cart_Store**: The Zustand store (`src/store/cartStore.ts`) that manages cart state on the client.
- **Checkout_Action**: The server action at `src/actions/checkout.ts` that creates orders and initiates Peach Payments sessions.
- **Admin**: An authenticated user with the `ADMIN` role.
- **Customer**: An authenticated user with the `CUSTOMER` role.
- **Discount_Type**: One of `PERCENTAGE`, `FIXED_AMOUNT`, or `FREE_SHIPPING`.
- **Usage_Record**: A record tracking each redemption of a Discount_Code by a specific user on a specific order.
- **Stacking_Policy**: The rule that determines whether multiple Discount_Codes can be applied to a single order.

## Requirements

---

### Requirement 1: Discount Code Database Schema

**User Story:** As an admin, I want discount codes stored in the database with all relevant configuration, so that the system can validate and apply them automatically.

#### Acceptance Criteria

1. THE Discount_Service SHALL store each Discount_Code as a database row with: a unique code string, a Discount_Type (`PERCENTAGE`, `FIXED_AMOUNT`, or `FREE_SHIPPING`), a discount value in ZAR cents (for `FIXED_AMOUNT`) or percentage points (for `PERCENTAGE`), a minimum order amount in ZAR cents, a maximum usage count (total redemptions allowed), a per-user usage limit, a start date, an end date, an active/inactive flag, and timestamps for creation and last update.
2. THE Discount_Service SHALL enforce uniqueness on the code string at the database level using a case-insensitive constraint.
3. THE Discount_Service SHALL store a Usage_Record for each redemption linking the Discount_Code ID, the user ID, and the order ID.
4. THE Discount_Service SHALL support an optional list of applicable product IDs on each Discount_Code to restrict the discount to specific products.
5. WHEN a Discount_Code has Discount_Type `PERCENTAGE`, THE Discount_Service SHALL store the percentage value as an integer between 1 and 100 inclusive.
6. WHEN a Discount_Code has Discount_Type `FIXED_AMOUNT`, THE Discount_Service SHALL store the value as a positive integer representing ZAR cents.
7. THE Discount_Service SHALL support an optional `maxDiscountAmountZAR` field on percentage-type codes to cap the maximum discount in ZAR cents.
8. THE Discount_Service SHALL store a boolean `stackable` field on each Discount_Code indicating whether the code can be combined with other codes.

---

### Requirement 2: Discount Code Validation

**User Story:** As a customer, I want the system to validate my promo code against all applicable conditions, so that I receive clear feedback on whether the code can be applied.

#### Acceptance Criteria

1. WHEN a Customer submits a code via the Promo_Input, THE Discount_Service SHALL verify that the code exists in the database (case-insensitive lookup).
2. WHEN a Discount_Code exists but the `active` flag is false, THE Discount_Service SHALL reject the code with the message "This code is no longer active."
3. WHEN the current date is before the Discount_Code start date, THE Discount_Service SHALL reject the code with the message "This code is not yet valid."
4. WHEN the current date is after the Discount_Code end date, THE Discount_Service SHALL reject the code with the message "This code has expired."
5. WHEN the total number of Usage_Records for a Discount_Code equals or exceeds the maximum usage count, THE Discount_Service SHALL reject the code with the message "This code has reached its usage limit."
6. WHEN the number of Usage_Records for the current Customer on a Discount_Code equals or exceeds the per-user usage limit, THE Discount_Service SHALL reject the code with the message "You have already used this code."
7. WHEN the cart subtotal (before discount) is less than the Discount_Code minimum order amount, THE Discount_Service SHALL reject the code with the message "Minimum order of R{amount} required for this code." where `{amount}` is the minimum formatted in Rands.
8. WHEN a Discount_Code has a restricted product list and none of the cart items match the listed product IDs, THE Discount_Service SHALL reject the code with the message "This code does not apply to items in your cart."
9. WHEN all validation checks pass, THE Discount_Service SHALL return the validated Discount_Code details and the calculated discount amount in ZAR cents.

---

### Requirement 3: Discount Calculation

**User Story:** As a customer, I want my discount calculated correctly based on the code type, so that the price reduction I see matches what I expect.

#### Acceptance Criteria

1. WHEN a validated Discount_Code has Discount_Type `PERCENTAGE`, THE Discount_Service SHALL calculate the discount as `Math.round(applicableSubtotal * percentage / 100)` in ZAR cents.
2. WHEN a percentage Discount_Code has a `maxDiscountAmountZAR` value, THE Discount_Service SHALL cap the calculated discount at the `maxDiscountAmountZAR` value.
3. WHEN a validated Discount_Code has Discount_Type `FIXED_AMOUNT`, THE Discount_Service SHALL apply the stored value directly as the discount in ZAR cents.
4. WHEN a `FIXED_AMOUNT` discount exceeds the applicable subtotal, THE Discount_Service SHALL cap the discount at the applicable subtotal so the order total does not go below zero.
5. WHEN a validated Discount_Code has Discount_Type `FREE_SHIPPING`, THE Discount_Service SHALL set the shipping cost to zero for the order.
6. WHEN a Discount_Code has a restricted product list, THE Discount_Service SHALL calculate the applicable subtotal using only the cart items that match the listed product IDs.
7. WHEN a Discount_Code has no restricted product list, THE Discount_Service SHALL calculate the applicable subtotal using all cart items.

---

### Requirement 4: Stacking Rules

**User Story:** As a store owner, I want control over whether customers can combine multiple codes, so that I can prevent excessive discounting.

#### Acceptance Criteria

1. THE Discount_Service SHALL allow a maximum of one non-stackable code per order.
2. WHEN a Customer attempts to apply a non-stackable code while another non-stackable code is already applied, THE Discount_Service SHALL reject the new code with the message "This code cannot be combined with other discounts. Remove the existing code first."
3. WHEN a Discount_Code has `stackable` set to true, THE Discount_Service SHALL allow the code to be applied alongside other stackable codes.
4. WHEN a Customer attempts to apply a stackable code while a non-stackable code is already applied, THE Discount_Service SHALL reject the new code with the message "Cannot add more codes when a non-stackable discount is applied."
5. WHEN multiple stackable codes are applied, THE Discount_Service SHALL calculate each discount sequentially based on the original subtotal and sum the individual discounts.
6. WHEN the sum of all applied discounts exceeds the cart subtotal, THE Discount_Service SHALL cap the total discount at the cart subtotal so the order total does not go below zero.

---

### Requirement 5: Customer-Facing Promo Code Input

**User Story:** As a customer, I want to enter a promo code in my cart or at checkout, so that I can receive the advertised discount.

#### Acceptance Criteria

1. THE Promo_Input SHALL be displayed in the cart drawer order summary section above the total amount.
2. THE Promo_Input SHALL consist of a text input field and an "Apply" button.
3. WHEN a Customer clicks "Apply" with a valid code, THE Promo_Input SHALL display the applied code with the discount amount and a "Remove" button.
4. WHEN a Customer clicks "Remove" on an applied code, THE Cart_Store SHALL remove the discount and recalculate the total.
5. IF the Discount_Service returns a validation error, THEN THE Promo_Input SHALL display the error message below the input field in red text.
6. WHILE a code validation request is in progress, THE Promo_Input SHALL disable the "Apply" button and show a loading indicator.
7. THE Cart_Store SHALL persist applied discount codes in the cart state so they survive page navigation.
8. WHEN a discount is applied, THE order summary SHALL display the original subtotal, the discount line item showing the code and savings amount, and the final total.

---

### Requirement 6: Checkout Integration

**User Story:** As a customer, I want my discount applied to the final payment amount, so that I am charged the reduced price via Peach Payments.

#### Acceptance Criteria

1. WHEN the Checkout_Action receives cart items with applied discount codes, THE Checkout_Action SHALL re-validate each code on the server before creating the order.
2. IF any applied code fails server-side validation during checkout, THEN THE Checkout_Action SHALL return an error indicating which code is invalid and the reason.
3. WHEN all codes are valid, THE Checkout_Action SHALL calculate `totalAmountZAR` as the cart subtotal minus the total discount amount (plus any gift wrap cost if enabled).
4. THE Checkout_Action SHALL store the applied discount code(s) and discount amount in the Order record for audit purposes.
5. WHEN the order is created successfully, THE Discount_Service SHALL create a Usage_Record for each applied Discount_Code linking the code, user, and order.
6. THE Checkout_Action SHALL send the reduced `totalAmountZAR` to Peach Payments as the payment amount.
7. IF the total after discount is zero, THEN THE Checkout_Action SHALL skip the Peach Payments call, mark the order as `PAID`, and return success directly.

---

### Requirement 7: Email Capture Code Integration

**User Story:** As a store owner, I want the existing email sign-up discount codes to be redeemable through the new promo code system, so that customers who signed up can use their codes.

#### Acceptance Criteria

1. WHEN a Customer enters a code that matches an `EmailCapture.discountCode` but does not exist in the Discount_Code table, THE Discount_Service SHALL treat the email capture code as a valid single-use, 10% percentage discount with no minimum order and no expiration.
2. WHEN an email capture code is redeemed, THE Discount_Service SHALL create a Usage_Record to prevent re-use.
3. WHEN the Discount_Service checks usage for an email capture code, THE Discount_Service SHALL allow exactly one redemption per code regardless of which user redeems it.
4. THE Discount_Service SHALL NOT require admins to manually create Discount_Code records for email capture codes.

---

### Requirement 8: Admin Discount Management — Listing

**User Story:** As an admin, I want to see all discount codes on a dedicated page, so that I can monitor and manage promotions.

#### Acceptance Criteria

1. WHEN an authenticated Admin navigates to `/admin/discounts`, THE Discount_Admin_UI SHALL display a table of all Discount_Codes sorted by creation date descending.
2. THE Discount_Admin_UI SHALL display each code's: code string, Discount_Type, value, active status, usage count versus maximum usage, start date, end date, and creation date.
3. THE Discount_Admin_UI SHALL render within the existing admin shell layout and sidebar navigation.
4. THE Discount_Admin_UI SHALL provide a search input to filter codes by code string.
5. IF an unauthenticated or non-Admin user requests `/admin/discounts`, THEN the existing admin layout role guard SHALL redirect the user to the sign-in page.
6. THE Discount_Admin_UI SHALL display a visual badge indicating whether each code is currently valid (active, within date range, under usage limit) or invalid (inactive, expired, or exhausted).

---

### Requirement 9: Admin Discount Management — Create and Edit

**User Story:** As an admin, I want to create and edit discount codes through a form, so that I can launch new promotions and adjust existing ones.

#### Acceptance Criteria

1. WHEN an Admin clicks "Create Discount" on the listing page, THE Discount_Admin_UI SHALL display a form with fields for: code string, Discount_Type selection, discount value, minimum order amount, maximum usage count, per-user usage limit, start date, end date, applicable products (multi-select), stackable toggle, and max discount cap (for percentage type).
2. WHEN an Admin submits the create form with valid data, THE Discount_Service SHALL create the Discount_Code in the database and redirect to the listing page with a success message.
3. WHEN an Admin clicks "Edit" on an existing code, THE Discount_Admin_UI SHALL display the same form pre-populated with the code's current values.
4. WHEN an Admin submits the edit form with valid data, THE Discount_Service SHALL update the Discount_Code in the database.
5. IF the code string already exists in the database (case-insensitive), THEN THE Discount_Service SHALL reject the creation with the message "A code with this name already exists."
6. THE Discount_Service SHALL validate that percentage values are between 1 and 100, fixed amounts are positive integers, and start date is before end date when both are provided.
7. THE Discount_Admin_UI SHALL provide a "Generate Code" button that auto-fills the code string field with a random 8-character alphanumeric code.
8. WHEN an Admin submits the form, THE Discount_Service SHALL verify that the caller has the `ADMIN` role before writing to the database.

---

### Requirement 10: Admin Discount Management — Deactivate and Usage Stats

**User Story:** As an admin, I want to deactivate codes and view usage statistics, so that I can end promotions and understand their impact.

#### Acceptance Criteria

1. WHEN an Admin clicks "Deactivate" on an active Discount_Code, THE Discount_Service SHALL set the `active` flag to false.
2. WHEN an Admin clicks "Activate" on an inactive Discount_Code, THE Discount_Service SHALL set the `active` flag to true.
3. WHEN an Admin clicks on a Discount_Code row, THE Discount_Admin_UI SHALL display a detail panel showing: total redemptions, total discount amount given (sum of all Usage_Record discount values in ZAR), list of recent redemptions with user email, order ID, discount amount, and date.
4. THE Discount_Admin_UI SHALL display the total revenue impact (sum of discounts) for each code on the listing table.
5. WHEN an Admin deactivates or activates a code, THE Discount_Admin_UI SHALL update the listing immediately without a full page reload.
