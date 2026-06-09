# Firebase Integration Instructions for BUD-B HR Portal

These instructions convert the current Next.js project from local mock state/supabase placeholder behavior to a Firebase free-plan backend using Firebase Authentication and Firestore.

## 1. Project Summary and What Needs to Change

Current state:
- `src/context/auth-context.tsx` uses localStorage-based mock login and role detection.
- `src/store/hrStore.ts` uses `zustand` with local persistence only.
- `src/lib/supabase.ts` exists but is unused elsewhere in the app.
- Data is rendered from local state and static UI, not from a backend.

Required Firebase-backed flow:
- Use Firebase Authentication for sign in, sign out, and current user state.
- Use Firestore for storing and retrieving employees, projects, timesheets, leave requests, departments, and leave balances.
- Keep UI components working with the same routes and client-side components.
- Replace mock operations with real asynchronous backend operations.

## 2. Firebase Setup (Free Plan)

### 2.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Create a new project, e.g. `bud-b-hr-portal`.
3. Add a web app to the project.
4. Copy the Firebase config values.

### 2.2 Enable Authentication
1. In Firebase Console, Authentication -> Sign-in method.
2. Enable Email/Password.
3. Enable Google provider.

### 2.3 Create Firestore Database
1. In Firebase Console, Firestore Database.
2. Create database in production mode or test mode.
3. Use the free Spark plan.

## 3. Environment Variables

Create or update `.env.local` at project root with the Firebase config values.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> `NEXT_PUBLIC_` prefix is required because this project is client-heavy and Firebase SDK is used in browser components.

## 4. Install Firebase SDK

Run:

```bash
npm install firebase
```

Remove `@supabase/supabase-js` and `@supabase/ssr` from `package.json` if they are no longer needed.

## 5. Add Firebase Client Initialization

Create a new file:

`src/lib/firebase.ts`

```ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 6. Define Firestore Data Schema

Use collections matching the app domain and map the existing store types:

- `users` collection
  - `email` string
  - `name` string
  - `role` string (`hr` or `employee`)
  - `dept` string
  - other profile fields
- `employees` collection
  - `name`, `role`, `dept`, `status`, `email`, `avatar`
- `projects` collection
  - `name`, `client`, `progress`, `members`, `status`, `dueDate`, `color`
- `timesheets` collection
  - `name`, `project`, `task`, `date`, `hours`, `status`
- `leaveRequests` collection
  - `name`, `type`, `start`, `end`, `days`, `status`, `reason`
- `departments` collection
  - `name`, `lead`, `members`, `color`
- Optionally `leaveBalances` collection or embedded inside `employees`
  - `userId`, `type`, `total`, `used`

## 7. Update Auth Context to Use Firebase Authentication

Replace `src/context/auth-context.tsx` with a Firebase-backed auth provider.

### Behavior to implement
- Listen to `onAuthStateChanged`.
- Store user role in context from Firestore profile doc.
- Implement `login`, `logout`, and optionally `register`.
- Protect routes based on the role.

### Suggested high-level implementation
- `login(email, password)` should call `signInWithEmailAndPassword(auth, email, password)`.
- After successful sign in, load `/users/{uid}` profile document and set `role`.
- `logout()` should call `signOut(auth)`.
- For role detection, do not rely on `localStorage`; use Firebase auth state.

## 8. Implement Firestore CRUD Functions

Create a helper file for backend operations:

`src/lib/firebase-services.ts`

This file should export functions like:
- `getUserProfile(uid)`
- `createUserProfile(uid, profileData)`
- `getEmployees()`
- `addEmployee(employeeData)`
- `deactivateEmployee(id)`
- `getTimesheets()`
- `addTimesheet(entry)`
- `approveTimesheet(id)`
- `rejectTimesheet(id)`
- `getLeaveRequests()`
- `requestLeave(request)`
- `approveLeave(id)`
- `rejectLeave(id)`
- `getProjects()`
- `createProject(project)`
- `updateProject(id, updates)`
- `getDepartments()`
- `createDepartment(dept)`

### Use Firestore methods
- `collection(db, 'employees')`
- `doc(db, 'employees', id)`
- `addDoc(collectionRef, data)`
- `getDocs(collectionRef)`
- `getDoc(docRef)`
- `updateDoc(docRef, updates)`
- `deleteDoc(docRef)` (if needed)

### Error handling
Each async function must:
- `try { ... } catch (error) { console.error(error); throw error; }`
- Return empty arrays or null safely where appropriate to keep components from crashing.

## 9. Update `src/store/hrStore.ts` to Sync with Firestore

The store currently only updates local data. Convert it to a client-side store that runs Firestore operations and updates the UI state.

### Recommended pattern
- Keep the same `useHRStore` API surface.
- Within each action, call Firestore functions and update the zustand store with results.
- Load initial data from Firestore on app load or page mount.

### Example pattern for an action
```ts
requestLeave: async (request) => {
  try {
    const docRef = await addDoc(collection(db, 'leaveRequests'), {
      ...request,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    set((state) => ({
      leaves: [{ id: docRef.id, ...request, status: 'pending' }, ...state.leaves]
    }));
  } catch (error) {
    console.error('requestLeave failed', error);
  }
},
```

### Initial data loading
- Add `initializeData` or `fetchAllData` that loads Firestore data into the store.
- Call it from the root dashboard pages or from a `useEffect` when the authenticated user becomes available.

## 10. Connect UI Pages to Firebase Backend

Replace local mock behaviors in these pages with Firebase-backed operations:

- `src/app/page.tsx`
  - Replace the demo `handleLogin` logic with real Firebase auth.
  - Use user profile doc to determine `hr` vs `employee` rather than hardcoded email.
  - On success, redirect based on role.

- `src/app/employees/page.tsx`
  - Fetch employees from Firestore in `useEffect` when role is `hr`.
  - Replace `addEmployee` and `deactivateEmployee` with store actions that update Firestore.

- `src/app/profile/page.tsx`
  - Load profile data from Firestore for the signed-in user.
  - If `role` is `hr`, query HR admin profile data.

- `src/app/dashboard/page.tsx`
  - Load `timesheets`, `leaves`, and `leaveBalances` from Firestore.
  - Replace mock filtering logic only if data is dynamic.

- Other pages such as `projects`, `leaves`, `timesheets`, and `hr/*` should also call Firestore-backed store actions.

## 11. Role Management and Security

Use Firestore user profile documents for role-based access.
- Store `role` in `users/{uid}`.
- Use a `role` field rather than embedding role in the JWT.

Example profile doc:
```json
{
  "name": "John Doe",
  "email": "john@bud-b.com",
  "role": "employee",
  "dept": "Product Design",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Firestore security rules
Start with secure rules that limit access by authenticated user and role.
Example minimal rules:
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if isHR();
    }

    match /timesheets/{timesheetId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /leaveRequests/{leaveId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if isHR();
    }

    match /departments/{deptId} {
      allow read: if request.auth != null;
      allow write: if isHR();
    }

    function isHR() {
      return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'hr';
    }
  }
}
```

## 12. Error Prevention Checklist

Ensure the following to avoid runtime errors:
- All Firebase imports use the modular SDK (`firebase/auth`, `firebase/firestore`) and are only initialized once.
- Any file using Firebase in a client component is either a client component or the import is wrapped safely.
- `auth.currentUser` is checked for `null` before reading profile data.
- `async` operations use `try/catch` and handle rejected promises.
- `useEffect` depends on `auth` or `user` state so data loads only after login.
- Store actions that mutate state also update Firestore, and the UI is updated after success.
- All environment variables are present in `.env.local` and the app is restarted after changes.

## 13. Migration Path from Supabase Placeholder

Since this project currently contains a Supabase utility file that is not actually used in the app, you should:
1. Remove `src/lib/supabase.ts` or keep it only if you plan to use it later.
2. Remove `@supabase/supabase-js` and `@supabase/ssr` from dependencies.
3. Update imports from `src/lib/supabase.ts` to `src/lib/firebase.ts` or `src/lib/firebase-services.ts`.

## 14. Suggested File Changes Summary

- `package.json`:
  - install `firebase`
  - remove supabase packages
- `.env.local`:
  - add Firebase config variables
- `src/lib/firebase.ts`:
  - initialize Firebase app, auth, firestore
- `src/lib/firebase-services.ts`:
  - implement all backend operations for HR data
- `src/context/auth-context.tsx`:
  - switch to Firebase auth state
- `src/store/hrStore.ts`:
  - convert mock actions to Firestore-backed actions
- `src/app/page.tsx`:
  - replace login mocks with actual Firebase auth methods
- `src/app/employees/page.tsx` and other CRUD pages:
  - load backend records instead of local mock records

## 15. Optional: Use Firebase Emulator Locally

If you want safe local testing before publishing, install and configure the Firebase Emulator Suite.
This is optional and not required for the free Firebase Spark plan.

## 16. Testing and Validation

After implementation:
1. Run `npm run dev`.
2. Sign in with a valid Firebase-authenticated user.
3. Verify `employees`, `projects`, `timesheets`, `leaveRequests`, and profile pages load data from Firestore.
4. Test create/update operations for employees, timesheets, and leave requests.
5. Confirm role-based redirects work for `hr` vs `employee`.

---

### Notes for this project
- `src/app/page.tsx` is the login page and must be the first Firebase-connected page.
- `src/context/auth-context.tsx` is the global auth source of truth.
- `src/store/hrStore.ts` is the core data layer that currently manages app state; this is the main place to connect Firestore CRUD.
- The UI components are already client-rendered, so Firebase can be used without additional SSR complexity.

If you want, I can also generate the exact Firebase-backed `src/lib/firebase.ts`, `src/lib/firebase-services.ts`, and updated `auth-context.tsx` code in the same project.