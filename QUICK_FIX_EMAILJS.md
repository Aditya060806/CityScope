# Quick Fix: EmailJS "Recipients address is empty" Error

## 🚨 The Problem
Your code is sending the email correctly (`to_email: 'aditya060806@gmail.com'`), but EmailJS template is not configured to receive it.

## ✅ The Solution (Takes 2 minutes)

### Step 1: Go to EmailJS Dashboard
1. Visit: https://dashboard.emailjs.com/admin/integration
2. Login with your EmailJS account
3. Click **"Email Templates"** in the left sidebar
4. Find and click on template: **`template_9zwrkz7`**

### Step 2: Configure the "To Email" Field ⚠️ MOST IMPORTANT
1. Look at the template editor
2. Find the **"To Email"** input field (usually near the top)
3. **Currently it's probably empty or has a static email**
4. **Change it to:** `{{to_email}}`
5. This tells EmailJS to use the `to_email` parameter we're sending

### Step 3: Verify Template Variables
In the email body, you can use any of these:
- `{{to_name}}` - User's name
- `{{report_id}}` - Report ID
- `{{report_title}}` - Report title
- `{{report_category}}` - Category
- etc.

### Step 4: Save and Test
1. Click **"Save"** in EmailJS
2. Go back to your app
3. Submit a test report
4. Check console - should see: `✅ Email sent successfully`
5. Check your email: `aditya060806@gmail.com`

## 📸 Visual Guide

Your EmailJS template should look like this:

```
┌─────────────────────────────────────┐
│ Email Template Editor               │
├─────────────────────────────────────┤
│ From Name: [CityScope]              │
│ From Email: [your-email@domain.com] │
│ To Email: [{{to_email}}]  ← SET THIS│
│ Subject: [Report - {{report_id}}]  │
├─────────────────────────────────────┤
│ Email Body:                         │
│ Hello {{to_name}},                  │
│                                     │
│ Report ID: {{report_id}}            │
│ ...                                 │
└─────────────────────────────────────┘
```

## 🔍 How to Verify It's Fixed

**Before Fix:**
- "To Email" field: (empty) or `admin@example.com` ❌
- Error: "The recipients address is empty"

**After Fix:**
- "To Email" field: `{{to_email}}` ✅
- Console: `✅ Email sent successfully`
- Email received in inbox!

## ⚠️ Common Mistakes

❌ **Wrong:** Setting "To Email" to a static address like `admin@example.com`
❌ **Wrong:** Leaving "To Email" empty
❌ **Wrong:** Only putting `{{to_email}}` in the email body (not in settings)
✅ **Correct:** Setting "To Email" in template SETTINGS to `{{to_email}}`

## 🆘 Still Not Working?

1. **Double-check the field name:**
   - Some EmailJS versions call it "To Email Address"
   - Some call it "Recipient Email"
   - Look for any field that controls where the email is sent

2. **Check EmailJS Service Settings:**
   - Go to Email Services → Your service
   - Make sure dynamic recipients are allowed
   - Some email services restrict dynamic recipients

3. **Verify the variable name:**
   - In your template, hover over the "To Email" field
   - It might show you available variables
   - Make sure `to_email` is one of them

4. **Test with a simple template:**
   - Create a new test template
   - Set "To Email" to `{{to_email}}`
   - Body: `Test email for {{to_name}}`
   - Try sending with just these two variables

The issue is 100% in the EmailJS template configuration, not in your code!
