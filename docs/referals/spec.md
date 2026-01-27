1. Core User Stories 

Referring User (Host or Non-Host) 

I can share a personal referral link to bring new hosts onto MatchBook. 

When a referred host gets their first booking, they earn $50. 

If I’m not a host, I can still securely provide payout information to receive my reward. This should probably be handled with a notification that leads to a place for them to give stripe payout information. 

I don’t need to manually claim rewards. MatchBook handles tracking and quarterly payouts. 

Referred Host 

I can sign up through a referral link without entering any codes. 

My referrer automatically receives credit when I get my first booking. 

I do not receive any financial reward or credit from the program. 

Admin  

I can view and manage all referrals, including status, earnings, and payout eligibility. 

I can process payouts quarterly and export records for accounting. 

I can detect and prevent fraudulent or self-referrals. 

 

2. Program Rules 

Rule 

Description 

Reward Amount 

$50 cash per qualified referral 

Who Gets Paid 

Only the referrer  

Trigger 

Referred host’s first booking is complete 

Payout Frequency 

Quarterly (Jan 15, Apr 15, Jul 15, Oct 15) 

Eligibility - Referrer 

Must have valid payout info on file 

Cap 

Unlimited referrals per user 

Expiration 

Referral links never expire 

Self-Referral Prevention 

Block identical emails, accounts, or IPs 

Visibility 

Admin dashboard only (no user-facing tracker) 

 

3. Referral Flow 

Step 1: Link Creation 

Every registered user receives a unique referral link at signup. 

Users can access this link using this interface Link 
Example: https://matchbookrentals.com/ref/{code} 

The system stores the code and associates it with the user’s ID. 

Step 2: Signup via Referral 

When a new host signs up through that link, the system tags them with the referrer’s ID. 

No manual entry or approval required. 

Step 3: Referral Qualification 

Once the referred host’s first booking is complete, the referral is marked as Qualified. 

A $50 reward is queued for the referrer’s next quarterly payout. 

Step 4: Payout 

MatchBook pays out the referrer on a quarterly schedule, after admin review. 

 

5. Non-Host Payout Collection 

Purpose 

Allow users who are not hosts (e.g., partners or users referring hosts) to securely receive referral payouts. 

Trigger 

When a non-host earns their first referral reward, they are prompted to add payout info. 

User Flow 

Notification: 
“You’ve earned $50! Add your payout details to receive your reward.” 

Payout Setup Options: 

Stripe Connect Express (preferred): 

Securely collects bank details, handles KYC, and returns an account ID to MatchBook. 

Confirmation Message: 
“Thanks! Your payout will be included in the next quarterly batch.” 

 

6. Admin Dashboard Requirements 

Dashboard Summary 

Columns: 

Referrer name & email 

Total referrals 

Qualified referrals 

Total earned 

Payout quarter 

Payout status (Pending / Qualified / Paid) 

Referral Detail View 

Shows: 

Referred host name and signup date 

First booking date 

Referral status 

Referrer payout info status (Complete / Missing) 

Admin Actions 

Filter by payout quarter, status, or referrer 

Mark referrals as “Paid” 

Export to CSV for accounting 

Trigger payout batch 

Flag suspicious or duplicate referrals 

 

7. Payout Process 

End of Quarter: Admin filters all Qualified referrals. 

Validation: Ensure referrer has complete payout info. 

Processing: 

 Stripe Connect API, or Bill.com 

Reconciliation: Update all completed payouts to “Paid.” 

Audit: Log payment details, date, and admin responsible. 

 

8. Edge Cases & Safeguards 

Duplicate Referrals: First link clicked receives credit. 

Self-Referral: Automatically blocked if referrer and referred share key identifiers (email, payout info, IP). 

Missing Payout Info: Reward held until referrer submits valid details. 

Manual Overrides: Admin can edit or void a referral record if needed. 

 

 
