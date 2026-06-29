# 🔧 Fix: Emails Not Sending in Production

## 🚨 The Problem
Emails work locally but **NOT in production/deployed version**.

## ✅ Most Common Causes & Fixes

### 1. **Environment Variables Not Set in Production** (MOST COMMON)

**Problem:** Your deployment platform (Vercel/Netlify/etc) doesn't have the EmailJS environment variables configured.

**Fix:**

#### For Vercel:
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these three variables:
   ```
   VITE_EMAILJS_SERVICE_ID=service_mgqmcce
   VITE_EMAILJS_TEMPLATE_ID=template_e1pfsi9
   VITE_EMAILJS_PUBLIC_KEY=YsS0F5IDZ9ny-2_US
   ```
4. Make sure they're set for **Production** environment
5. **Redeploy** your application

#### For Netlify:
1. Go to Site settings → **Environment variables**
2. Add the same three variables
3. Redeploy

#### For Other Platforms:
- Find the "Environment Variables" or "Config Vars" section
- Add all three `VITE_EMAILJS_*` variables
- Redeploy

**Verify:** After redeploying, open browser console in production and you should see:
```
✅ EmailJS configured successfully
Environment: PRODUCTION
```

---

### 2. **EmailJS Domain Restrictions**

**Problem:** EmailJS might be blocking requests from your production domain.

**Fix:**
1. Go to https://dashboard.emailjs.com/
2. Click **Email Services** → Your service (`service_mgqmcce`)
3. Check **"Allowed Domains"** or **"Domain Restrictions"**
4. Add your production domain (e.g., `your-app.vercel.app` or `yourdomain.com`)
5. Save changes

---

### 3. **Template Configuration Issue**

**Problem:** EmailJS template "To Email" field not set correctly.

**Fix:**
1. Go to https://dashboard.emailjs.com/admin/integration
2. Click **Email Templates** → Edit `template_e1pfsi9`
3. Find **"To Email"** field (usually at the top)
4. Set it to: `{{to_email}}` (with curly braces)
5. **Save** the template

---

### 4. **CORS or Network Issues**

**Problem:** Browser blocking EmailJS requests in production.

**Fix:**
- Check browser console for CORS errors
- EmailJS should handle CORS automatically, but if you see errors:
  1. Check if your domain is in EmailJS allowed domains
  2. Try disabling browser extensions that might block requests
  3. Check if your deployment platform has any firewall rules

---

## 🔍 How to Debug

### Step 1: Check Browser Console in Production

1. Open your deployed app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Submit a report
5. Look for email-related logs

**What to look for:**

✅ **Good signs:**
```
✅ EmailJS configured successfully
Environment: PRODUCTION
📧 Attempting to send email: {...}
✅ Email sent successfully!
```

❌ **Bad signs:**
```
❌ EmailJS NOT CONFIGURED - Emails will not be sent!
Missing environment variables:
  - VITE_EMAILJS_SERVICE_ID
  - VITE_EMAILJS_TEMPLATE_ID
  - VITE_EMAILJS_PUBLIC_KEY
```

### Step 2: Check Environment Variables

In production console, run:
```javascript
// Check if environment variables are loaded
console.log('Service ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID);
console.log('Template ID:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
console.log('Public Key:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? 'SET' : 'MISSING');
```

**Expected:** All three should show values (not `undefined`)

### Step 3: Test Email Service Directly

In production console, run:
```javascript
// Get email service diagnostics
import { emailService } from './services/EmailService';
console.log(emailService.getDiagnostics());
```

This will show you exactly what's configured and what's missing.

---

## 📋 Quick Checklist

Before reporting the issue, verify:

- [ ] Environment variables are set in deployment platform
- [ ] Environment variables are set for **Production** (not just Preview/Development)
- [ ] Application has been **redeployed** after adding environment variables
- [ ] EmailJS template "To Email" field is set to `{{to_email}}`
- [ ] Production domain is allowed in EmailJS service settings
- [ ] Browser console shows email configuration logs
- [ ] No CORS errors in browser console

---

## 🆘 Still Not Working?

### Check EmailJS Dashboard
1. Go to https://dashboard.emailjs.com/
2. Check **Usage** tab - are emails being sent?
3. Check **Logs** tab - any error messages?
4. Check **Quota** - have you exceeded free tier (200 emails/month)?

### Check Network Tab
1. Open browser DevTools → **Network** tab
2. Submit a report
3. Look for requests to `api.emailjs.com`
4. Check the response - what error is returned?

### Common Error Messages

**"Recipients address is empty"**
→ Fix: Set "To Email" field in EmailJS template to `{{to_email}}`

**"Service not found" or "Template not found"**
→ Fix: Verify Service ID and Template ID match your EmailJS dashboard

**"Invalid public key"**
→ Fix: Verify Public Key is correct in environment variables

**"Rate limit exceeded"**
→ Fix: You've exceeded EmailJS free tier (200 emails/month). Wait or upgrade.

**"Domain not allowed"**
→ Fix: Add your production domain to EmailJS service allowed domains

---

## 💡 Pro Tips

1. **Always test in production** - Local and production can behave differently
2. **Check console logs** - The improved logging will tell you exactly what's wrong
3. **Environment variables are case-sensitive** - Make sure they match exactly
4. **Redeploy after changes** - Environment variable changes require redeployment
5. **Use browser console** - The diagnostics function will help identify issues

---

## 📞 Need More Help?

If you've checked everything above and it's still not working:

1. **Check browser console** for detailed error messages
2. **Check EmailJS dashboard** for service status and logs
3. **Share the error message** from browser console
4. **Share the diagnostics output** from `emailService.getDiagnostics()`

The improved error logging should now give you much more detailed information about what's failing!



