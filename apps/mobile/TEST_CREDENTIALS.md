# Test Credentials for App Review

**CRITICAL**: Both Apple App Store and Google Play Store **REQUIRE** test account credentials for apps that need login.

## 🚨 Why This Is Important

- **Apple** will reject your app if login is required and no test account is provided
- **Google** requires credentials to test full functionality
- Reviewers need to access all features to verify your app works correctly
- Missing credentials = **Automatic rejection** = **Delayed launch**

---

## 📱 Test Account Setup Instructions

### Step 1: Create a Dedicated Test Account in Your System

**DO NOT use a real user account!**

Create a new organization and test user specifically for app reviewers with the following characteristics:

1. **Organization Setup**:
   - Organization Name: "App Review Test Organization"
   - Has sample data (employees, courses, kids, etc.)
   - All features enabled
   - No real/sensitive information

2. **Test User Setup**:
   - Username/Email: Create a dedicated email (e.g., `appreview@paradize.com` or similar)
   - Password: Simple but secure (no special requirements)
   - Role: Admin or full-access role to test all features
   - Does NOT expire or require password changes
   - Not subject to 2FA/MFA (unless reviewers can bypass)

3. **Sample Data**:
   - At least 3-5 sample employees
   - At least 2-3 sample courses
   - At least 5-10 sample students/kids
   - Sample attendance records
   - Sample messages/chat history
   - Sample tasks

---

## 📋 Test Credentials Template

Fill this out and use it for both App Store Connect and Google Play Console:

```
==============================================
PARADIZE MOBILE APP - TEST ACCOUNT
==============================================

USERNAME/EMAIL: ___________________________
PASSWORD: ___________________________

ORGANIZATION: ___________________________
ORGANIZATION ID: ___________________________

SPECIAL INSTRUCTIONS:
___________________________
___________________________
___________________________

FEATURES TO TEST:
- [x] Login/Authentication
- [x] Home Dashboard
- [x] Employee Management
- [x] Course Management
- [x] Student/Kids Management
- [x] Attendance Tracking
- [x] Location-based Check-in/Check-out
- [x] Chat/Messages
- [x] Tasks Management
- [x] Financial Dashboard

SAMPLE DATA AVAILABLE:
- Employees: Yes / No (Count: ___)
- Courses: Yes / No (Count: ___)
- Students: Yes / No (Count: ___)
- Attendance Records: Yes / No (Count: ___)
- Messages: Yes / No (Count: ___)

IMPORTANT NOTES:
- Account will not expire
- No 2FA/MFA enabled
- Full admin access
- All features enabled for organization
- Sample data is MOCK data, not real users

==============================================
```

---

## 📍 Where to Submit These Credentials

### Apple App Store Connect

**Location**: App Review Information section

1. Go to https://appstoreconnect.apple.com
2. Select your app → "App Store" tab
3. Scroll to "App Review Information"
4. Fill in:
   - **Sign-in required**: ✅ YES
   - **Username**: Your test email
   - **Password**: Your test password
   - **Notes**: Add any special instructions

**Example Notes to Reviewer**:
```
Thank you for reviewing Paradize!

This app is a multi-tenant ERP/CRM for educational organizations.

TEST ACCOUNT:
Email: appreview@paradize.com
Password: ReviewTest2024

The test organization contains sample employees, courses, and students.
All features are enabled including:
- Attendance tracking (requires location permission)
- Employee check-in/check-out
- Course management
- Chat/messaging

Please grant location permission when prompted to test attendance features.

If you encounter any issues, please contact: [your-email@domain.com]
```

---

### Google Play Console

**Location**: App Access section (in App Content)

1. Go to https://play.google.com/console
2. Select your app → "App content"
3. Click "App access"
4. Select: "All or some functionality is restricted"
5. Provide:
   - **Instructions**: How to access restricted content
   - **Credentials**: Username and password
   - **Other info**: Any additional details

**Example Instructions**:
```
App requires login to access all features.

CREDENTIALS:
Username: appreview@paradize.com
Password: ReviewTest2024

INSTRUCTIONS:
1. Open the app
2. Enter the credentials above
3. Tap "Login"
4. You will see the main dashboard with sample data

The test account has full access to all features including:
- Dashboard with statistics
- Employee management and attendance
- Course scheduling and management
- Student/kids profiles
- Chat and messaging
- Location-based check-in (grant location permission when prompted)

The organization contains sample/mock data for testing purposes.
```

---

## 🔒 Security Best Practices

### DO:
- ✅ Create a unique test account separate from production users
- ✅ Use a strong but memorable password
- ✅ Disable account expiration policies for this account
- ✅ Populate with realistic sample data
- ✅ Test the credentials yourself before submitting
- ✅ Monitor this account for unusual activity
- ✅ Disable the account after approval (or keep for future updates)

### DON'T:
- ❌ Use a real user's account
- ❌ Include real personal information in sample data
- ❌ Require 2FA/MFA (reviewers can't access it)
- ❌ Set password expiration
- ❌ Use overly complex passwords (reviewers might mistype)
- ❌ Leave fields empty in review forms
- ❌ Forget to test the credentials before submitting

---

## 🧪 Testing Your Test Account

**Before submitting to stores, verify:**

1. [ ] Open the app in a fresh state (not logged in)
2. [ ] Enter test credentials exactly as written
3. [ ] Successfully log in
4. [ ] Navigate to all major features:
   - [ ] Home/Dashboard
   - [ ] Employees page
   - [ ] Courses page
   - [ ] Kids/Students page
   - [ ] Attendance tracking
   - [ ] Chat/Messages
   - [ ] Tasks
   - [ ] Finance page
5. [ ] Verify sample data is visible
6. [ ] Test location-based features (check-in/check-out)
7. [ ] Log out and log back in
8. [ ] Confirm no errors or crashes

---

## 📧 Communication Template

If reviewers have issues accessing your app, they'll contact you. Have this template ready:

```
Subject: Paradize App Review - Test Credentials

Hello [Reviewer Name],

Thank you for reviewing our app!

Here are the test credentials:

Email: appreview@paradize.com
Password: ReviewTest2024

Please follow these steps:
1. Open the app
2. Enter the email and password above
3. Tap "Login"

You should see a dashboard with sample data for an educational organization.

For testing attendance features, please grant location permission when prompted.

If you encounter any issues, please let me know and I'll assist immediately.

Best regards,
[Your Name]
[Your Email]
[Your Phone - optional]
```

---

## 🔄 For App Updates

**Important**: Keep the same test credentials for updates!

- Reviewers appreciate consistency
- Saves time for both you and reviewers
- Less chance of rejection due to credential issues

When submitting updates:
1. Verify test account still works
2. Update sample data if needed (new features)
3. Use the same credentials in review forms

---

## ❓ FAQ

### Q: Can I use a temporary email service?
**A**: No, avoid services like TempMail. Use a real email you control.

### Q: What if my app requires organization-specific setup?
**A**: Explain clearly in the notes. Provide step-by-step instructions.

### Q: Should I enable all features for the test account?
**A**: Yes! Reviewers need to test everything.

### Q: What if I use OAuth (Google, Apple Sign-In)?
**A**: Still provide a regular email/password option for reviewers. They prefer not to use personal OAuth accounts.

### Q: How long should I keep the test account active?
**A**: Keep it active at least 2 weeks after submission, and whenever you submit updates.

### Q: What if the app needs special hardware?
**A**: Explain in notes what can't be tested without hardware. Provide video demo if possible.

---

## 🎯 Checklist Before Submission

- [ ] Test account created in your system
- [ ] Account has admin/full access
- [ ] Sample data populated
- [ ] No 2FA/MFA enabled
- [ ] Account won't expire
- [ ] Credentials tested and working
- [ ] Written down clearly (no typos!)
- [ ] Special instructions prepared
- [ ] Added to App Store Connect review info
- [ ] Added to Google Play Console app access
- [ ] Support email ready to respond quickly

---

## 🚨 Red Flags That Will Cause Rejection

- ❌ No credentials provided
- ❌ Credentials don't work
- ❌ Account expired during review
- ❌ Requires 2FA that reviewers can't access
- ❌ Incomplete sample data (empty screens)
- ❌ Instructions unclear or missing
- ❌ Account requires credit card or payment
- ❌ Real user data visible (privacy violation!)

---

## 📞 Need Help?

If you're unsure about anything:
1. Review Apple's guidelines on test accounts
2. Check Google's documentation on app access
3. Ask in Expo Discord/Forums for advice
4. Test everything yourself first!

**Remember**: Clear, working test credentials are the #1 factor for smooth app approval! 🎯

---

## 📝 YOUR TEST CREDENTIALS (Fill this out now!)

```
USERNAME/EMAIL: _________________________________

PASSWORD: _________________________________

ORGANIZATION: _________________________________

SPECIAL NOTES FOR REVIEWERS:
_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________
```

**Date Created**: _______________

**Last Tested**: _______________

**Submitted to Apple**: _______________

**Submitted to Google**: _______________

---

**✅ Once you've filled this out, you're ready for the review process!**

