# Capture and refund management

Veyndo keeps the original order amount fixed and records confirmed captures
separately. A EUR 100 authorization can be captured as EUR 40 followed by EUR 60.
Each capture has its own refundable balance. Every financial operation uses the
same native job, current permission and verified receipt path.

## Configure when payment is collected

Open **Settings → Payment methods** and choose an installed provider method.
For methods that support authorization, **When to collect payment** offers the
provider default, immediate capture, or authorization followed by capture from
the order. The setting belongs to the existing revisioned shop/channel settings
and their release controls. Changes apply to new checkouts. Existing payments
retain their original method, account, environment, version and intent.

The Shopware Payments contract 1.3.0 declares partial/multiple capture for its
methods that support authorization. An operator must configure that version of
the private service before the package is upgraded. Keep historical versions
available for existing payments. Installing a contract does not configure the
service or enable methods.

## Work on a payment

Open the order's payment section. The same controls appear in payment management.

1. Check **Captured**, **Refunded** and **Still authorized**.
2. Enter an exact amount and choose **Capture amount**. Partial capture requires a
   method with `multi_capture`, confirmed authorization and an available balance.
3. Select **Close authorization after this capture** only when the remaining
   authorization should no longer be used. Captured funds remain refundable.
4. To refund a payment with several captures, select the capture and enter the
   amount. The system checks both that capture's balance and the overall balance.
5. Use **Void authorization** to close an unused remainder. Already captured funds
   and sold inventory are retained; a whole-order cancellation is not implied.

Only members with `payments.manage` can issue these commands. Read access uses
`payments.read`. HTTP, MCP, app actions and Flows enqueue the same durable jobs.
The controls observe the original job instead of issuing repeated financial
commands while its outcome is pending. Decimal input is converted exactly to
minor units, including zero-decimal currencies; excess precision is rejected.

## Recovery and state

`partially_captured` records funds below the invoice amount. It does not label the
whole invoice paid, unlock paid downloads or complete the order. A refund of all
captured funds is terminal only when the capture is closed. An open authorization
can still collect its remaining amount after refunding an earlier capture.

Uncertain or pending captures reserve their requested amount. Another capture is
refused until the outcome is resolved. A verified provider observation can bind a
capture to its original native request and complete that job. Replaying a receipt
cannot add money again or change its immutable amount. Browser callbacks cannot
supply capture amounts or select captures. They request native reconciliation;
merchant commands own collection and refund allocation.

## Implementation and acceptance

The Core uses existing attempt JSON, job rows and receipt claims; no parallel
financial ledger or per-payment table is introduced. The private Rust provider
and its simulation use the same versioned receipt contract. The small capture
budget and state transition decisions are extracted to Lean. SQL, network calls
and provider behavior remain outside those proofs.

Actual native services with local provider fixtures cover dropped capture/refund
responses, two captures, per-capture refunds, pending capture recovery, voiding
the remainder and historical versions. Independent malformed-provider fixtures
check duplicate/changed receipts, currencies and unknown native jobs. These
checks do not establish external PayPal account acceptance or complete original
Shopware feature parity. External account testing was deferred by the owner on
3 November 2026. [Current acceptance](shopware-payments-acceptance.md).
