# Firebase Authentication Setup Guide

## Setup Firebase Authentication

To enable login functionality for your admin panel, you need to configure Firebase Authentication:

### 1. Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: "invisible-mechanics---2"
3. Navigate to **Authentication** in the left sidebar
4. Click on **Get started** (if first time) or **Sign-in method** tab
5. Enable **Email/Password** provider:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

### 2. Admin Authorization System

This admin panel uses **UID-based authorization**. Only specific user UIDs are granted admin access.

#### Current Authorized Admins:
- **UID:** `Aayx2gnj7yRakyRP0FjzZ78PkKd2` (Primary Admin - Full Access)
- **UID:** `YkPeEILGa0V4KxqGGtpk23td7uh1` (Secondary Admin - No Delete Access)

#### To Add More Admins:
1. Create the user account in Firebase Console → Authentication → Users
2. Copy their UID from the Users list
3. Add the UID to `src/config/adminUsers.ts`:
   ```typescript
   export const AUTHORIZED_ADMINS: Record<string, AdminRole> = {
     'Aayx2gnj7yRakyRP0FjzZ78PkKd2': 'primary',   // Primary Admin - Full access
     'YkPeEILGa0V4KxqGGtpk23td7uh1': 'secondary', // Secondary Admin - No delete access
     'new-admin-uid-here': 'primary',              // Add new admin here
   };
   ```

#### Admin Role Types:
- **Primary Admin:** Full access to all features including delete operations
- **Secondary Admin:** All features except delete operations (create, read, update only)

#### To Remove Admin Access:
1. Remove the UID from `src/config/adminUsers.ts`
2. Optionally delete the user from Firebase Console → Authentication → Users

### 3. Test the Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your admin panel
3. You should see the login screen
4. **Important:** Only the authorized admin UIDs can access the admin panel:
   - Primary Admin (`Aayx2gnj7yRakyRP0FjzZ78PkKd2`) - Full access
   - Secondary Admin (`YkPeEILGa0V4KxqGGtpk23td7uh1`) - No delete access
5. Any other users will see an "Access Denied" screen

### 4. Production Security Recommendations

#### A. Firestore Security Rules
Update your Firestore rules to require authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### B. Firebase Storage Rules
Update your Storage rules to require authentication:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Allow public reads for images
      allow write: if request.auth != null;  // Only authenticated users can upload
    }
  }
}
```

### 5. Environment Variables (Optional)

For additional security, you can set these environment variables in your `.env` file:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=invisible-mechanics---2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=invisible-mechanics---2
VITE_FIREBASE_STORAGE_BUCKET=invisible-mechanics---2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1087911820316
VITE_FIREBASE_APP_ID=1:1087911820316:web:469b8a189be2c005cc33d9
```

### 6. Troubleshooting

#### Common Issues:

1. **"Firebase: Error (auth/operation-not-allowed)"**
   - Make sure Email/Password provider is enabled in Firebase Console

2. **"Firebase: Error (auth/user-not-found)"**
   - The email doesn't exist in your Firebase Auth users
   - Create the user in Firebase Console → Authentication → Users

3. **"Firebase: Error (auth/wrong-password)"**
   - Incorrect password for the email
   - Reset password in Firebase Console or create new user

4. **Login page doesn't appear**
   - Check browser console for errors
   - Ensure Firebase config is correct

### 7. Managing Admin Users

To add/remove admin access:
- **Add admin**: Create user in Firebase Console → Authentication → Users
- **Remove admin**: Delete user from Firebase Console → Authentication → Users
- **Reset password**: In Firebase Console → Authentication → Users → Click user → Reset password

Your admin panel is now protected with Firebase Authentication! Only users you create in Firebase Auth can access the admin dashboard.
