# Shared merchant payment controls

`PaymentActions` displays the server settlement summary in orders and payment
management. It collects exact capture/refund amounts, an owned capture selection
and final-capture choice. It never calculates a new invoice, marks an order paid
or dispatches directly to a provider. Parent native command handlers preserve
request identity and observe their existing durable job.

`payment-amount` parses decimal input into exact safe integer minor units and
owns presentation DTOs only. Current permissions, provider capabilities, account
ownership, immutable receipts and pending reservations remain server decisions.
EN/DE/FR/ES text comes from the shared payment dictionaries; styles inherit the
native Studio theme and collapse into one column at narrow widths.
