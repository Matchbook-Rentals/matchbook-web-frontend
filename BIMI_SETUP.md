# BIMI (Brand Indicators for Message Identification) Setup Guide

## Overview
BIMI allows your MatchBook logo to appear in Gmail instead of the default yellow "M" avatar. This improves brand recognition and email trustworthiness.

## What We've Done
✅ Created a BIMI-compliant SVG logo at `public/bimi-logo.svg`
- Size: 96x96 pixels (meets BIMI minimum)
- Format: SVG (required by BIMI)
- File size: <32KB (well within BIMI limits)
- Public URL: `https://matchbookrentals.com/bimi-logo.svg`

## Prerequisites
Before BIMI will work, your domain MUST have proper email authentication:

### 1. SPF (Sender Policy Framework)
Check if you have an SPF record:
```bash
dig TXT matchbookrentals.com | grep spf
```

Expected format:
```
v=spf1 include:_spf.google.com ~all
```

### 2. DKIM (DomainKeys Identified Mail)
Your email service (likely Resend, SendGrid, or Google Workspace) should have set this up.

### 3. DMARC (Required for BIMI)
Check if you have a DMARC record:
```bash
dig TXT _dmarc.matchbookrentals.com
```

**CRITICAL**: DMARC policy must be set to `quarantine` or `reject` (not `none`)

Example DMARC record:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@matchbookrentals.com; pct=100; adkim=s; aspf=s
```

If you don't have DMARC or it's set to `p=none`, you'll need to update it first.

## DNS Configuration

### Add BIMI TXT Record

Add this DNS TXT record to your domain registrar (e.g., Cloudflare, GoDaddy, Route53):

**Record Type:** `TXT`
**Name/Host:** `default._bimi.matchbookrentals.com` OR `default._bimi` (depending on your DNS provider)
**Value/Content:**
```
v=BIMI1; l=https://matchbookrentals.com/bimi-logo.svg;
```

**TTL:** 3600 (or your provider's default)

### DNS Provider-Specific Instructions

#### Cloudflare
1. Go to DNS settings for matchbookrentals.com
2. Click "Add record"
3. Type: TXT
4. Name: `default._bimi`
5. Content: `v=BIMI1; l=https://matchbookrentals.com/bimi-logo.svg;`
6. Save

#### GoDaddy
1. Go to DNS Management
2. Click "Add" under Records
3. Type: TXT
4. Name: `default._bimi.matchbookrentals.com`
5. Value: `v=BIMI1; l=https://matchbookrentals.com/bimi-logo.svg;`
6. Save

#### AWS Route53
1. Go to Hosted Zones
2. Select matchbookrentals.com
3. Create Record
4. Record name: `default._bimi.matchbookrentals.com`
5. Record type: TXT
6. Value: `"v=BIMI1; l=https://matchbookrentals.com/bimi-logo.svg;"`
7. Create records

## Verification

### 1. Check DNS Propagation (wait 1-24 hours after adding record)
```bash
dig TXT default._bimi.matchbookrentals.com
```

Expected output should contain:
```
v=BIMI1; l=https://matchbookrentals.com/bimi-logo.svg;
```

### 2. Test BIMI Setup
Use one of these validators:
- **Valimail BIMI Inspector**: https://bimigroup.org/bimi-generator/
- **Google Postmaster Tools**: https://postmaster.google.com/
- **MXToolbox BIMI Lookup**: https://mxtoolbox.com/bimi.aspx

### 3. Send Test Email
After DNS propagates (24-48 hours), send a test email to a Gmail address and check if your logo appears.

## Timeline
- **DNS Propagation**: 1-24 hours
- **Gmail Recognition**: 24-48 hours after DNS propagates
- **Full Rollout**: Up to 72 hours total

## Troubleshooting

### Logo Not Appearing?

1. **Check DMARC Policy**
   ```bash
   dig TXT _dmarc.matchbookrentals.com
   ```
   Must have `p=quarantine` or `p=reject` (NOT `p=none`)

2. **Verify Logo URL is Accessible**
   Visit: https://matchbookrentals.com/bimi-logo.svg
   Should display your logo

3. **Check SPF/DKIM Alignment**
   Your emails must pass both SPF and DKIM authentication

4. **Verify BIMI Record Format**
   ```bash
   dig TXT default._bimi.matchbookrentals.com
   ```
   Should return: `v=BIMI1; l=https://matchbookrentals.com/bimi-logo.svg;`

5. **Check Email Headers**
   In Gmail, open an email → Show original → Look for:
   ```
   spf=pass
   dkim=pass
   dmarc=pass
   ```

### Common Issues

**Issue**: Logo shows on some emails but not others
- **Cause**: Inconsistent SPF/DKIM/DMARC passing
- **Fix**: Review your email sending service configuration

**Issue**: Logo doesn't appear after 48 hours
- **Cause**: DMARC policy might be set to `none`
- **Fix**: Update DMARC to `quarantine` or `reject`

**Issue**: Different logo appears
- **Cause**: Cached old BIMI record or Google profile image
- **Fix**: Wait for cache to expire (up to 7 days)

## Advanced: Getting the Verified Checkmark

To get a blue checkmark next to your logo (like verified brands), you need:

### Option 1: VMC (Verified Mark Certificate)
- Requires registered trademark with USPTO or international equivalent
- Certificate costs ~$1,500-$2,500/year
- Providers: DigiCert, Entrust

### Option 2: CMC (Common Mark Certificate)
- No trademark required (newer, easier option as of 2024)
- Shows logo without checkmark
- More affordable than VMC

For most companies, basic BIMI (without certificate) is sufficient and free.

## Support

If you need help:
1. Check your current email authentication: https://mxtoolbox.com/SuperTool.aspx
2. Validate BIMI setup: https://bimigroup.org/bimi-generator/
3. Contact your email service provider (Resend, SendGrid, etc.) for DMARC help

## Resources
- BIMI Group: https://bimigroup.org/
- Google BIMI Documentation: https://support.google.com/a/answer/10911320
- DMARC Setup Guide: https://dmarc.org/
