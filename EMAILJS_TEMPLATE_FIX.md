# EmailJS Template Fix - "Recipients address is empty" Error

## The Problem
Error: **"The recipients address is empty"**

This means your EmailJS template is not configured to use the email address parameter.

## The Solution

You need to set the recipient email in your EmailJS template settings, not just in the template body.

### Step 1: Go to EmailJS Dashboard
1. Visit https://dashboard.emailjs.com/
2. Go to **Email Templates**
3. Click on your template: `template_9zwrkz7`

### Step 2: Configure the "To Email" Field

**THIS IS THE MOST IMPORTANT STEP:**

1. Look for the **"To Email"** field in the template settings
2. It should be set to: **`{{to_email}}`** (not a static email!)
3. The field should look like this:

```
To Email: {{to_email}}
```

### Step 3: Alternative Field Names

If `{{to_email}}` doesn't work, try these common alternatives:
- `{{user_email}}`
- `{{reply_to}}`
- `{{email}}`

**Check which one your EmailJS service expects!**

### Step 4: Verify Template Settings

Make sure your EmailJS template has:

**From Name:** (your name or service name)
**From Email:** (your verified sender email)
**To Email:** `{{to_email}}` ← **This must be set!**
**Subject:** `Report Submitted Successfully - {{report_id}}`

### Step 5: Template Body Example

Your email body can include any of these variables:

```
Hello {{to_name}},

Your report has been submitted successfully!

Report ID: {{report_id}}
Title: {{report_title}}
Category: {{report_category}}
Location: {{report_location}}
Status: {{report_status}}
Submitted: {{submitted_date}}

{{message}}

Thank you!
```

### Important Notes:

1. **The "To Email" field is NOT the same as the email body!**
   - The "To Email" field tells EmailJS WHERE to send the email
   - The email body is just the content

2. **You cannot set recipient dynamically without using the template variable**
   - If "To Email" is empty or set to a static address, you'll get this error
   - It MUST be set to `{{to_email}}` or similar variable

3. **Double-check the variable name**
   - In your EmailJS template settings, look at what variables are available
   - Use the exact variable name that EmailJS expects

## Quick Test

After updating the template:
1. Save the template
2. Submit a test report
3. Check console - should see: `✅ Email sent successfully`
4. Check your email inbox (and spam folder)

## Still Not Working?

If you're still getting the error:
1. Check the console log - it shows what email address is being sent: `recipientEmail: ...`
2. Verify that email is valid (contains @)
3. Check EmailJS Dashboard → Email Logs for delivery status
4. Make sure your EmailJS service allows dynamic recipient addresses (some services restrict this)

## Common Mistakes:

❌ **Wrong:** "To Email" field is empty
❌ **Wrong:** "To Email" field is set to a static email like "admin@example.com"
✅ **Correct:** "To Email" field is set to `{{to_email}}`

❌ **Wrong:** Only setting email in the template body text
✅ **Correct:** Setting email in the template SETTINGS "To Email" field

The recipient email must be configured in the template settings, not just passed as a parameter!
