# Fix: Template Works in EmailJS but Not in App

## The Problem
Your template test works in EmailJS Dashboard, but the app still fails. This means:
- The template you configured is correct
- But your app is calling a **different** template ID

## Solution: Verify Template ID Matches

### Step 1: Find the Correct Template ID
1. In EmailJS Dashboard, go to the template you just configured
2. Look for the Template ID (usually at the top or in the URL)
3. It should look like: `template_9zwrkz7` or similar
4. **Write it down or copy it**

### Step 2: Check Your .env File
1. Open your `.env` file in the project root
2. Find the line: `VITE_EMAILJS_TEMPLATE_ID=template_9zwrkz7`
3. **Make sure it matches the Template ID from Step 1**
4. If it doesn't match, update it!

### Step 3: Restart Dev Server
**IMPORTANT:** Environment variables are only loaded when the server starts!

1. Stop your dev server: Press `Ctrl + C`
2. Start it again: `npm run dev`
3. Check the browser console for:
   ```
   ✅ EmailJS configured successfully
   Service ID: service_mgqmcce
   Template ID: template_9zwrkz7  ← Does this match your template?
   ```

### Step 4: Test Again
Submit a report and check if it works now.

## Alternative: Create a Brand New Template

If the IDs match and it still doesn't work, create a fresh template:

### Step 1: Create New Template
1. Go to EmailJS Dashboard → Email Templates
2. Click "Create New Template"
3. Choose "Order Confirmation" or "Auto-Reply"
4. Configure:
   - To Email: `{{to_email}}`
   - From Name: `CityScope`
   - Subject: `Report {{report_id}}`
   - Body: `Hello {{to_name}}, Report ID: {{report_id}}`
5. **SAVE** the template
6. Copy the new Template ID (e.g., `template_xyz789`)

### Step 2: Update .env
```env
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
```
(Replace with your new template ID)

### Step 3: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 4: Test
Submit a report - it should work now!

## Check: Are You Editing the Right Template?

You mentioned template `template_9zwrkz7` but:
1. Go to EmailJS Dashboard
2. Click "Email Templates"
3. Do you see `template_9zwrkz7` in the list?
4. Click on it - is this the template you just configured with `{{to_email}}`?
5. If not, find the correct template and note its ID

## Debug Checklist

- [ ] Template test works in EmailJS Dashboard
- [ ] Template ID in EmailJS matches Template ID in `.env`
- [ ] Dev server was restarted after changing `.env`
- [ ] Browser console shows correct Template ID
- [ ] "To Email" field is set to `{{to_email}}` (not `{to_email}` with single braces)

## Still Not Working?

Try this test:
1. In your `.env`, temporarily change to a simple email:
   ```env
   # Test only - revert after
   # Comment out the template line and add this:
   # VITE_EMAILJS_TEMPLATE_ID=template_NEW_ID
   ```
2. Create a super simple template with just:
   - To Email: `{{to_email}}`
   - Body: `Test {{to_name}}`
3. Use that new template ID
4. Test

If the simple template works, the issue is with the old template configuration.

