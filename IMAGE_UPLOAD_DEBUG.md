# Image Upload Troubleshooting Guide

## What Was Fixed

The image upload wasn't saving the image URL back to Firestore. Here's the complete flow now:

### Upload Process
1. ✅ **Select image file** from your computer
2. ✅ **Upload to Cloud Storage** - File gets uploaded to Firebase Cloud Storage
3. ✅ **Get download URL** - Firebase generates a public URL for the image
4. ✅ **Save URL to Firestore** - Product document is updated with the new image URL
5. ✅ **Refresh product list** - UI shows the updated product with new image

---

## How to Debug Upload Issues

### Step 1: Open Browser Console
1. Press **F12** or right-click → **Inspect**
2. Click **Console** tab
3. Try uploading an image again
4. Watch for error messages

### Step 2: Check for Common Errors

#### Error: "Permission denied"
```
Error: Permission denied. User does not have permission to access 'gs://...'
```
**Solution:**
- Go to [Firebase Console](https://console.firebase.google.com)
- Select "sight-chic-store" project
- Go to **Build** → **Storage** → **Rules**
- Paste these test rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```
- Click **Publish**

#### Error: "User not authenticated"
```
Error: Firebase App not initialized or user not authenticated
```
**Solution:**
- Check `.env.local` exists in project root
- Verify it has Firebase credentials:
```
VITE_FIREBASE_API_KEY=AIzaSyGfGPjM38cg13wvR1Th1EsAo
VITE_FIREBASE_AUTH_DOMAIN=sight-chic-store.firebaseapp.com
etc...
```
- Restart dev server: `npm run dev`

#### Error: "StorageService is undefined"
**Solution:**
- Make sure Firebase config file exists: `src/config/firebase.ts`
- Check it's imported in `src/pages/Admin.tsx`

### Step 3: Check Network Activity

1. Open **Console** → **Network** tab
2. Try uploading an image
3. Look for requests to:
   - `firebasestorage.googleapis.com` (should show 200 OK)
   - `firestore.googleapis.com` (should show 200 OK)

If any show errors (red), click them and check the error message.

### Step 4: Verify Firestore Document

After uploading (or even if it fails):

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "sight-chic-store" project
3. Go to **Build** → **Firestore Database**
4. Click **products** collection
5. Click any product document
6. Verify it has these fields:
   - `image` (string) - Main image URL
   - `images` (array) - Gallery image URLs
   - All other product fields

---

## Detailed Error Messages You Might See

### Storage Upload Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to resolve module specifier` | Import path error | Check `src/config/firebase.ts` exists |
| `Firebase: Error (auth/operation-not-allowed)` | Auth not configured | Use test mode rules (see above) |
| `Firebase: Error (storage/bucket-not-found)` | Storage not initialized | Enable Storage in Firebase Console |
| `Firebase: Error (invalid-argument)` | File size too large | Use image under 5MB |

### Firestore Update Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Permission denied for document` | Rules don't allow writes | Update rules to allow test writes |
| `Could not update document` | Product ID not found | Seed database first: Click "Seed Database" button |
| `Field value is not allowed` | Invalid data structure | Check product has all required fields |

---

## Console Log Messages (What You Should See)

### Successful Upload:
```
Uploading main image for product 1...
Image uploaded successfully: https://firebasestorage.googleapis.com/v0/b/...
Saving main image URL to Firestore...
Product updated successfully
```

### Failed Upload:
```
Uploading main image for product 1...
Full error: Error: Permission denied...
```

---

## Step-by-Step Fix If Nothing Works

### 1. Reset Firebase Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 2. Reset Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Verify `.env.local`
```
VITE_FIREBASE_API_KEY=AIzaSyGfGPjM38cg13wvR1Th1EsAo
VITE_FIREBASE_AUTH_DOMAIN=sight-chic-store.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sight-chic-store
VITE_FIREBASE_STORAGE_BUCKET=sight-chic-store.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=3316904
VITE_FIREBASE_APP_ID=1:331698206304:web:7f6b0ac5e9ed
```

### 4. Restart Everything
```bash
# Stop dev server (Ctrl+C)
# Clear cache
rm -rf .vite
# Restart
npm run dev
```

### 5. Test Seed Database First
- Go to `/admin`
- Click "Seed Database" button
- Wait for success message
- **Then** try uploading an image

---

## What Happens During Upload (Technical)

```typescript
// 1. File selected
const file = e.target.files[0];

// 2. Upload to Cloud Storage
const imageUrl = await uploadProductImage(file, productId, 'main');
// Result: "https://firebasestorage.googleapis.com/v0/b/sight-chic-store.appspot.com/o/product-images%2F..."

// 3. Fetch current product data
const product = products.find(p => p.id === productId);

// 4. Update Firestore document
await updateProduct(productId, {
  ...product,
  image: imageUrl  // This is the key part!
});

// 5. Refresh UI
await refetchProducts();
```

---

## Enabling Google Cloud Debug Logging

For extra debugging:

1. Open Browser DevTools (F12)
2. Go to **Console**
3. Paste:
```javascript
firebase.firestore.enableLogging(true);
```

Now you'll see detailed Firestore logs.

---

## Still Not Working?

**Check these in order:**

1. ✅ Is database seeded? (See "Seed Database" section on admin page)
2. ✅ Are Firebase rules set to allow writes?
3. ✅ Is `.env.local` present with correct credentials?
4. ✅ Does browser console show any errors?**
5. ✅ Did you select an actual image file?
6. ✅ Is the image under 5MB?
7. ✅ Did you wait for the "success" alert?

If still stuck:
- Check browser console (F12) for exact error
- Go to Firebase Console → Firestore → Check a product document exists
- Check Firebase Console → Storage → Look for uploaded images

---

## Firebase Console Quick Links

- [Storage Rules Editor](https://console.firebase.google.com/project/sight-chic-store/storage)
- [Firestore Database](https://console.firebase.google.com/project/sight-chic-store/firestore)
- [Project Settings](https://console.firebase.google.com/project/sight-chic-store/settings/general)

---

## Questions?

1. **Check browser console first** (F12) - Most errors are shown there
2. **Look at error messages** - They tell you exactly what's wrong
3. **Try the step-by-step fix above** - Usually solves 95% of issues
4. **Check Firebase documentation** - https://firebase.google.com/docs/storage

Good luck! 🚀
