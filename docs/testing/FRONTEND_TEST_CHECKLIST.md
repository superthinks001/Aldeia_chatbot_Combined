# Frontend Testing Checklist

## Test Environment
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Test Date: $(date)

---

## Test 1: User Registration

### Steps:
1. Open http://localhost:3000
2. Click **"Register"** or **"Sign Up"** button
3. Fill in registration form:
   - **Email**: `yourname@example.com`
   - **Password**: `YourPass123!` (must have uppercase, lowercase, number, special char)
   - **Name**: `Your Name`
   - **County**: `LA County` (or your county)
4. Click **"Register"** or **"Sign Up"**

### Expected Result:
- ✅ Registration successful
- ✅ Automatically logged in
- ✅ Redirected to chat interface
- ✅ See welcome message or empty chat

---

## Test 2: User Login

### Steps:
1. If logged in, log out first
2. Click **"Login"** or **"Sign In"** button
3. Enter credentials:
   - **Email**: Email from Test 1
   - **Password**: Password from Test 1
4. Click **"Login"** or **"Sign In"**

### Expected Result:
- ✅ Login successful
- ✅ Redirected to chat interface
- ✅ See previous chat history (if any)

---

## Test 3: Chat - Basic Greeting

### Steps:
1. Ensure you're logged in
2. Type in chat input: `Hello`
3. Press **Enter** or click **Send**

### Expected Result:
- ✅ Message appears in chat
- ✅ Bot responds with greeting
- ✅ Response appears within 2-3 seconds
- ✅ Chat history saved

---

## Test 4: Chat - Knowledge Query

### Steps:
1. In the chat, type: `How do I apply for debris removal?`
2. Press **Enter** or click **Send**

### Expected Result:
- ✅ Message appears in chat
- ✅ Bot responds with relevant information
- ✅ Response includes helpful details
- ✅ If ChromaDB not running, may get a fallback response

---

## Test 5: Chat - Follow-up Question

### Steps:
1. Type: `What documents do I need?`
2. Press **Enter** or click **Send**

### Expected Result:
- ✅ Bot understands context from previous question
- ✅ Provides document requirements
- ✅ Maintains conversation flow

---

## Test 6: Profile/Settings Access

### Steps:
1. Look for **Profile**, **Settings**, or user menu (usually top-right)
2. Click on it

### Expected Result:
- ✅ Can see user profile information
- ✅ Display shows: name, email, role
- ✅ Can navigate back to chat

---

## Test 7: Logout

### Steps:
1. Click **Logout** or **Sign Out** button
2. Confirm logout if prompted

### Expected Result:
- ✅ Successfully logged out
- ✅ Redirected to login page
- ✅ Cannot access chat without logging in

---

## Test 8: Session Persistence

### Steps:
1. Log in again
2. Close browser tab (not entire browser)
3. Reopen http://localhost:3000

### Expected Result:
- ✅ Still logged in (session maintained)
- ✅ Chat history preserved
- ✅ No need to log in again

---

## Test 9: Invalid Login

### Steps:
1. Log out
2. Try to log in with wrong credentials:
   - Email: `wrong@example.com`
   - Password: `WrongPass123!`
3. Click **Login**

### Expected Result:
- ✅ Login fails
- ✅ Error message displayed: "Invalid credentials" or similar
- ✅ Remains on login page

---

## Test 10: Password Validation

### Steps:
1. Go to registration page
2. Try to register with weak password:
   - Email: `test2@example.com`
   - Password: `123` (weak password)
3. Click **Register**

### Expected Result:
- ✅ Registration fails
- ✅ Error message: "Password must be at least 8 characters" or similar
- ✅ Shows password requirements

---

## Test 11: UI Responsiveness

### Steps:
1. Open browser developer tools (F12 or Cmd+Option+I)
2. Click device toolbar (mobile view)
3. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

### Expected Result:
- ✅ UI adapts to different screen sizes
- ✅ All buttons accessible
- ✅ Text readable on all screens
- ✅ Chat interface functional on mobile

---

## Test 12: Browser Console Check

### Steps:
1. Open browser developer tools (F12)
2. Go to **Console** tab
3. Use the application normally

### Expected Result:
- ✅ No critical errors (red messages)
- ✅ Minor warnings are acceptable
- ✅ No CORS errors
- ✅ API calls successful (check Network tab)

---

## Test 13: Network Performance

### Steps:
1. Open browser developer tools (F12)
2. Go to **Network** tab
3. Clear network log
4. Send a chat message
5. Watch network requests

### Expected Result:
- ✅ POST request to `/api/chat` succeeds (200 status)
- ✅ Response time < 5 seconds
- ✅ No failed requests (4xx, 5xx errors)

---

## Test 14: Multi-language Support (if implemented)

### Steps:
1. Look for language selector (usually top-right)
2. Change language to Spanish or another supported language
3. Observe UI changes

### Expected Result:
- ✅ UI text changes to selected language
- ✅ Chat interface translated
- ✅ Bot can respond in selected language

---

## Test 15: Accessibility

### Steps:
1. Press **Tab** key repeatedly
2. Navigate through interface using only keyboard
3. Press **Enter** to activate buttons

### Expected Result:
- ✅ Can navigate entire UI with keyboard
- ✅ Focus indicators visible
- ✅ Can send chat messages with Enter key
- ✅ Can submit forms with keyboard

---

## Summary Checklist

Mark each test as you complete it:

- [ ] Test 1: User Registration
- [ ] Test 2: User Login
- [ ] Test 3: Chat - Basic Greeting
- [ ] Test 4: Chat - Knowledge Query
- [ ] Test 5: Chat - Follow-up Question
- [ ] Test 6: Profile/Settings Access
- [ ] Test 7: Logout
- [ ] Test 8: Session Persistence
- [ ] Test 9: Invalid Login
- [ ] Test 10: Password Validation
- [ ] Test 11: UI Responsiveness
- [ ] Test 12: Browser Console Check
- [ ] Test 13: Network Performance
- [ ] Test 14: Multi-language Support
- [ ] Test 15: Accessibility

---

## Notes

**Record any issues found:**

| Test # | Issue Description | Severity | Screenshot/Details |
|--------|------------------|----------|-------------------|
| | | | |

---

## Overall Assessment

**Pass Criteria**: At least 12/15 tests should pass for production readiness

**Result**: _____ / 15 tests passed

**Production Ready?**: [ ] Yes [ ] No

**Additional Comments**:
