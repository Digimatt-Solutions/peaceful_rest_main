# Fundraiser payouts to the organiser's M-Pesa number

## The constraint (important)

An M-Pesa STK push can only credit the shortcode registered under the platform's Daraja app. Safaricom does not allow a customer STK payment to land directly in a personal M-Pesa number. So donations must land in the platform paybill first, then be paid out.

The workable model is: **collect via STK push → auto-payout to the organiser's M-Pesa number via Daraja B2C.**

```text
Donor  --STK push-->  Makiwa paybill  --B2C--> Organiser's M-Pesa number
                            |
                      payout record + receipt
```

## What gets built

### 1. Fundraiser payout details (KYC)

When a memorial admin creates a fundraiser, they must also provide:
- Full name (as on ID)
- ID number
- M-Pesa phone number (validated Kenyan format)
- Relationship to the deceased
- ID photo upload (stored in the existing media bucket, private access)

Existing death certificate number stays required.

### 2. Approval before going live

- New fundraisers are created as `pending` and are not visible publicly and cannot receive donations.
- Super admin sees a review queue with the KYC details and ID photo, and can approve or reject with a reason.
- Only approved fundraisers appear on the memorial detail page and accept donations.
- The organiser sees the current status on their fundraising page.

### 3. Automated B2C payouts

- A payout is queued when a donation is confirmed paid (M-Pesa or Paystack proceeds tracked separately).
- Payouts run in batches per fundraiser rather than per donation, to reduce transaction fees: an admin-triggered "Release funds" action plus an optional automatic release when a threshold is reached.
- A new backend function calls Daraja B2C to send the money to the organiser's number, and result/timeout callbacks update payout status (queued, processing, paid, failed) with the M-Pesa receipt number.
- Payout history is shown to both the super admin and the organiser, with the M-Pesa confirmation code.

### 4. Admin visibility

- Payouts page: pending, processing, paid, failed, with retry on failure.
- Each fundraiser shows collected vs paid out vs available balance.

## What you need to supply

Daraja B2C is a separate product from STK push and needs Safaricom approval on your production shortcode. Before payouts can run you must provide:
- Initiator name
- Initiator password (or the generated security credential)
- B2C shortcode (if different from the collection shortcode)

Until those exist, the system runs in **manual payout mode**: the payout record is created and an admin marks it paid after sending manually. Everything else (KYC, approval, balances, history) works immediately.

## Technical notes

- Migration: add KYC and status columns to `fundraisers` (`organiser_name`, `organiser_id_number`, `payout_phone`, `relationship`, `id_photo_url`, `status`, `approved_by`, `approved_at`, `rejection_reason`); new `payouts` table with amount, status, mpesa receipt, error, timestamps; RLS so organisers read only their own and super admins manage all; explicit GRANTs.
- RLS/policy update so only approved+active fundraisers are readable by anon.
- New edge functions: `mpesa-b2c-initiate`, `mpesa-b2c-result` (result + timeout URLs, `verify_jwt = false` for callbacks).
- Donation confirmation paths (`mpesa-callback`, `mpesa-status`, `paystack-verify`) increment an available balance used for payouts.
- UI: extend the fundraiser create form, add an approval queue in the admin fundraising view, add payout cards/history.
