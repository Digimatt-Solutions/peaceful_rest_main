# Rebuild fundraising with Paystack auto-split payouts

## Goal

Every fundraiser is tied to a memorial's verified bank account. When a donor pays, Paystack automatically splits the money — a fixed platform fee to Makiwa, the rest settled directly to the memorial's bank account. No manual payouts, no funds sitting with us.

## How this works with Paystack (feasibility)

- **Subaccounts API** (`POST /subaccount`) registers each memorial's bank account with Paystack and returns a `subaccount_code`.
- **Resolve Account API** (`GET /bank/resolve`) validates the account number + bank code before saving — so wrong details are caught up-front.
- **Bank List API** (`GET /bank?country=kenya`) gives us the dropdown of supported banks + their codes.
- On `transaction/initialize`, we pass `subaccount: <code>` and `bearer: "subaccount"` (or `"account"`) plus a `transaction_charge` (our platform fee in kobo/cents). Paystack does the split at charge time and settles funds directly to the memorial's bank on their normal settlement cycle. Our Paystack balance never holds the admin's share.
- Works in KES (already what the app uses). Test mode works immediately; live mode may require Paystack to complete business verification on our main account.

This is a well-supported, battle-tested Paystack pattern — it does not require custom transfer logic on our side.

## Platform fee

- New `platform_settings` row with `platform_fee_percent` (default e.g. **5%**), editable by super_admin in Settings → Payments.
- Passed to Paystack as `transaction_charge` (percentage of the transaction, in minor units) on each initialize call.

## Database changes

New table `memorial_bank_accounts` (one active row per memorial):
- `memorial_id` (FK, unique where `is_active`)
- `account_name`, `account_number`, `bank_code`, `bank_name`, `country` (default `KE`)
- `paystack_subaccount_code`, `paystack_subaccount_id`
- `resolved_account_name` (returned by Paystack's resolve call — shown to admin for confirmation)
- `is_active`, `created_by`, timestamps
- RLS: memorial admins can read/write their own memorial's account; super_admin all; no anon.

New table `platform_settings` (single-row config):
- `platform_fee_percent` (numeric, default 5.00)
- `updated_by`, timestamps
- RLS: read for authenticated; write only for super_admin.

Alter `fundraisers`:
- Add `bank_account_id` (FK → `memorial_bank_accounts`, NOT NULL for new rows).
- Add `status` in `('draft','active','paused','closed')` — replaces implicit "published".

**Migration for existing fundraisers**: set `status = 'draft'` for every existing fundraiser and add an `incomplete_reason = 'missing_bank_account'` flag. UI shows a banner on those until the admin adds bank details, then they can flip to `active`. Public/donor-facing pages hide `draft` fundraisers.

Grants: `authenticated` full CRUD on `memorial_bank_accounts` (RLS-scoped), `service_role` all. `platform_settings` — `select` for authenticated, all for service_role.

## Edge functions

1. **`paystack-banks`** (new, GET) — proxies `GET /bank?country=kenya` and returns `[ { name, code } ]` for the bank dropdown. Cached client-side.
2. **`paystack-resolve-account`** (new, POST) — body: `{ account_number, bank_code }`. Calls Paystack's resolve endpoint and returns the true account name. Used live in the create-bank form so the admin sees "This account belongs to: JANE DOE" before submitting.
3. **`paystack-create-subaccount`** (new, POST) — body: `{ memorial_id, account_number, bank_code, account_name }`. Verifies caller is a memorial admin for that memorial, calls `POST /subaccount` with a percentage_charge of 0 (we handle the fee per-transaction via `transaction_charge`), stores the returned `subaccount_code` + `subaccount_id` in `memorial_bank_accounts`, and returns the row.
4. **`paystack-initialize`** (edit existing) — look up the fundraiser's `bank_account_id → subaccount_code`, read `platform_fee_percent` from `platform_settings`, compute `transaction_charge = round(amount * fee_percent) * 100` (in kobo), pass `subaccount` + `bearer: "account"` + `transaction_charge` to Paystack. Refuse to initialize if the fundraiser has no active bank account or status ≠ `active`.
5. **`paystack-verify`** (edit existing) — unchanged logic for status/`raised_amount`, but also stores the split breakdown returned by Paystack (`split.subaccount`, `split.integration`) on the donation for auditing.

All functions use the `PAYSTACK_SECRET_KEY` we already have configured.

## Frontend flow

**Memorial → Fundraising tab (admin view)**

1. If the memorial has no active `memorial_bank_accounts` row → show "Add payout bank account" card first. Admin cannot create a fundraiser until this is set.
2. Bank account form:
   - Country (locked to Kenya for now)
   - Bank (select, populated from `paystack-banks`)
   - Account number (10-digit numeric)
   - On blur + valid → call `paystack-resolve-account`; show returned account name in a read-only field with a "Confirm this is correct" checkbox
   - Save → calls `paystack-create-subaccount`
3. Once a bank account exists, "Create fundraiser" opens the current form (title, goal amount, description, cover image) with a header strip: "Funds go to: **JANE DOE — KCB ••••3421**".
4. Publish button sets `status = 'active'` (auto-publish, per your choice).
5. Admin can update the bank account later; existing donations already routed remain unaffected.

**Existing fundraisers**: banner "Add payout bank account to reactivate this fundraiser" with a CTA that opens the bank form. On save, `status` flips from `draft` to `active`.

**Donor view**: unchanged — same donate button, same Paystack redirect. New: a small "Payouts go directly to the family's bank via Paystack" note on the donate dialog for trust.

**Super admin → Settings → Payments**: edit `platform_fee_percent`; view a table of all memorials and their linked bank accounts + subaccount codes.

## Files touched

- `supabase/functions/paystack-banks/index.ts` (new)
- `supabase/functions/paystack-resolve-account/index.ts` (new)
- `supabase/functions/paystack-create-subaccount/index.ts` (new)
- `supabase/functions/paystack-initialize/index.ts` (edit — add split fields)
- `supabase/functions/paystack-verify/index.ts` (edit — store split breakdown)
- `src/pages/dashboard/Fundraising.tsx` (major edit)
- `src/components/fundraising/BankAccountForm.tsx` (new)
- `src/components/fundraising/FundraiserForm.tsx` (extract + wire to bank account)
- `src/pages/dashboard/Settings.tsx` (add platform fee section for super_admin)
- One migration: new tables + grants + RLS + alter fundraisers + backfill

## What I need you to know before we build

- **Paystack live-mode subaccount settlement** may require our Makiwa Paystack business verification to be complete. Test mode works immediately. If verification isn't done, I'd suggest we ship this in test mode first and switch keys once verified.
- **Bank account changes** are not retroactive: donations already paid stay in whichever account was active at the time.
- **Refunds**: Paystack refunds pull from your main balance, not the subaccount. If a donor requests a refund after payout, we (Makiwa) would need to recover funds from the memorial admin off-platform. I'd recommend a "no refunds after 24 hours" policy shown at donate time — happy to add that copy.
