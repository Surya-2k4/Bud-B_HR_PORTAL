import { initializeApp, deleteApp } from 'firebase/app';
import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  User,
  deleteUser,
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

export type UserRole = 'employee' | 'hr';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  dept: string;
  employeeId?: string;
  joinDate: string;
  location: string;
  phone: string;
  avatar: string;
  createdAt: string;
  mustChangePassword?: boolean;
  aadhar?: string;
  pan?: string;
  address?: string;
  dob?: string;
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  name: string;
  project: string;
  task: string;
  date: string;
  hours: number;
  status: 'approved' | 'pending' | 'rejected';
}

export interface LeaveRequest {
  id: string;
  userId: string;
  name: string;
  type: string;
  start: string;
  end: string;
  days: number;
  status: 'approved' | 'pending' | 'rejected';
  reason: string;
  avatar?: string;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  name: string;
  type: string;
  total: number;
  used: number;
  color: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  dept: string;
  status: 'active' | 'on-leave' | 'inactive';
  email: string;
  avatar: string;
  employeeId?: string;
  joinDate?: string;
  phone?: string;
  aadhar?: string;
  pan?: string;
  address?: string;
  dob?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  progress: number;
  members: string[];
  status: 'active' | 'completed' | 'on-hold';
  dueDate: string;
  color: string;
}

export interface Department {
  id: string;
  name: string;
  lead: string;
  members: number;
  color: string;
}

const defaultLeaveBalances = [
  { type: 'Casual Leave', total: 10, used: 0, color: 'bg-indigo-500' },
  { type: 'Sick Leave', total: 8, used: 0, color: 'bg-rose-500' },
  { type: 'Paid Leave', total: 15, used: 0, color: 'bg-emerald-500' },
];

const projectColors = [
  'from-blue-500/20 to-indigo-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-purple-500/20 to-pink-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-slate-500/20 to-gray-500/20',
];

const departmentColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
];

const defaultUserLocation = 'Bangalore, India';
const defaultUserPhone = '+91 98765 43210';

function isBudbEmail(email: string) {
  return email.toLowerCase().endsWith('@budbinnovations.com');
}

function normalizeUserName(email: string) {
  const candidate = email.split('@')[0].replace('.', ' ').replace(/[^a-zA-Z ]/g, ' ');
  const cleaned = candidate
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
  return cleaned || 'Team Member';
}

const HR_EMAILS = new Set([
  'admin@budbinnovations.com',
  'brindhasivalingam@budbinnovations.com',
]);

function normalizeProfileDoc(id: string, data: any): UserProfile {
  const createdAtValue = data.createdAt;
  const createdAt = createdAtValue
    ? typeof createdAtValue.toDate === 'function'
      ? createdAtValue.toDate().toISOString()
      : createdAtValue
    : new Date().toISOString();

  const role = data.role === 'hr' ? 'hr' : 'employee';

  return {
    uid: id,
    email: data.email || '',
    name: data.name || normalizeUserName(data.email || ''),
    role,
    dept: data.dept || (role === 'hr' ? 'Human Resources' : 'Product Design'),
    employeeId: data.employeeId || undefined,
    joinDate: data.joinDate || new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
    location: data.location || defaultUserLocation,
    phone: data.phone || defaultUserPhone,
    avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || normalizeUserName(data.email || ''))}`,
    createdAt,
    mustChangePassword: data.mustChangePassword ?? false,
    aadhar: data.aadhar || undefined,
    pan: data.pan || undefined,
    address: data.address || undefined,
    dob: data.dob || undefined,
  };
}

async function ensureLeaveBalancesForUser(userId: string, name: string) {
  const snapshot = await getDocs(query(collection(db, 'leaveBalances'), where('userId', '==', userId)));
  if (!snapshot.empty) {
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<LeaveBalance, 'id'>),
    }));
  }

  const balancePromises = defaultLeaveBalances.map((balance) =>
    addDoc(collection(db, 'leaveBalances'), {
      userId,
      name,
      type: balance.type,
      total: balance.total,
      used: balance.used,
      color: balance.color,
    })
  );

  const docs = await Promise.all(balancePromises);
  return docs.map((reference, index) => ({
    id: reference.id,
    userId,
    name,
    type: defaultLeaveBalances[index].type,
    total: defaultLeaveBalances[index].total,
    used: defaultLeaveBalances[index].used,
    color: defaultLeaveBalances[index].color,
  }));
}

export async function signInUser(email: string, password: string) {
  if (!isBudbEmail(email)) {
    throw new Error('Only BUD-B Innovations email addresses are allowed.');
  }

  const result = await signInWithEmailAndPassword(auth, email, password);
  let profile = await getUserProfile(result.user.uid);

  if (!profile) {
    if (HR_EMAILS.has(email.toLowerCase())) {
      const name = normalizeUserName(email);
      profile = await createUserProfile(result.user.uid, {
        email: email.toLowerCase(),
        name: name,
        role: 'hr',
        dept: 'Human Resources',
        joinDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        location: defaultUserLocation,
        phone: defaultUserPhone,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date().toISOString(),
        mustChangePassword: false,
      });
    } else {
      await signOut(auth);
      throw new Error('This account is not registered. Please contact HR.');
    }
  }

  return result.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (!user.email || !isBudbEmail(user.email)) {
    try {
      await deleteUser(user);
    } catch (err) {
      console.error('Failed to delete unauthorized Google user from Firebase Auth', err);
    }
    throw new Error('Only BUD-B Innovations email addresses are allowed.');
  }

  let profile = await getUserProfile(user.uid);
  if (!profile) {
    if (user.email && HR_EMAILS.has(user.email.toLowerCase())) {
      const name = user.displayName || normalizeUserName(user.email);
      profile = await createUserProfile(user.uid, {
        email: user.email.toLowerCase(),
        name: name,
        role: 'hr',
        dept: 'Human Resources',
        joinDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        location: defaultUserLocation,
        phone: defaultUserPhone,
        avatar: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date().toISOString(),
        mustChangePassword: false,
      });
    } else {
      try {
        await deleteUser(user);
      } catch (err) {
        console.error('Failed to delete unregistered Google user from Firebase Auth', err);
      }
      throw new Error('This account is not registered. Please contact HR.');
    }
  }

  return user;
}

export async function signOutUser() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid: string) {
  const userDoc = doc(db, 'users', uid);
  const snapshot = await getDoc(userDoc);
  if (!snapshot.exists()) {
    return null;
  }
  return normalizeProfileDoc(snapshot.id, snapshot.data());
}

export async function createUserProfile(uid: string, profile: Omit<UserProfile, 'uid'>) {
  const userDoc = doc(db, 'users', uid);
  await setDoc(userDoc, { ...profile, createdAt: serverTimestamp() }, { merge: true });
  const createdProfile = await getDoc(userDoc);
  if (!createdProfile.exists()) {
    throw new Error('Unable to create user profile');
  }
  return normalizeProfileDoc(createdProfile.id, createdProfile.data());
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const userDoc = doc(db, 'users', uid);
  await updateDoc(userDoc, updates);
  const updated = await getDoc(userDoc);
  if (!updated.exists()) {
    throw new Error('Unable to update user profile');
  }
  return normalizeProfileDoc(updated.id, updated.data());
}

export async function getOrCreateUserProfile(user: User) {
  const uid = user.uid;
  let existing = await getUserProfile(uid);
  if (existing) {
    await ensureLeaveBalancesForUser(uid, existing.name);
    return existing;
  }

  if (user.email && HR_EMAILS.has(user.email.toLowerCase())) {
    const name = user.displayName || normalizeUserName(user.email);
    existing = await createUserProfile(uid, {
      email: user.email.toLowerCase(),
      name: name,
      role: 'hr',
      dept: 'Human Resources',
      joinDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
      location: defaultUserLocation,
      phone: defaultUserPhone,
      avatar: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      mustChangePassword: false,
    });
    await ensureLeaveBalancesForUser(uid, existing.name);
    return existing;
  }

  throw new Error('This account is not registered. Please contact HR.');
}

export async function getEmployees() {
  const snapshot = await getDocs(query(collection(db, 'employees'), orderBy('name', 'asc')));
  const employees = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Omit<Employee, 'id'>;
    return {
      id: docSnap.id,
      name: data.name || 'Unknown',
      role: data.role || 'Employee',
      dept: data.dept || 'Unassigned',
      status: data.status || 'active',
      email: data.email || '',
      avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || 'Unknown')}`,
      employeeId: data.employeeId || undefined,
      joinDate: data.joinDate || undefined,
      phone: data.phone || undefined,
      aadhar: data.aadhar || undefined,
      pan: data.pan || undefined,
      address: data.address || undefined,
      dob: data.dob || undefined,
    };
  });

  if (employees.length > 0) {
    return employees;
  }

  const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('name', 'asc')));
  return usersSnapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as Partial<UserProfile> & Partial<Pick<Employee, 'status'>>;
      return {
        id: docSnap.id,
        name: data.name || normalizeUserName(data.email || ''),
        role: data.role || 'employee',
        dept: data.dept || 'Unassigned',
        status: (data.status as 'active' | 'on-leave' | 'inactive') || 'active',
        email: data.email || '',
        avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || normalizeUserName(data.email || ''))}`,
        employeeId: data.employeeId || undefined,
        joinDate: data.joinDate || undefined,
        phone: data.phone || undefined,
        aadhar: data.aadhar || undefined,
        pan: data.pan || undefined,
        address: data.address || undefined,
        dob: data.dob || undefined,
      };
    })
    .filter((item) => item.role !== 'hr');
}

export async function createEmployeeAuth(email: string, password: string) {
  const tempAppName = `tempApp-${Date.now()}`;
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    await signOut(tempAuth);
    return userCredential.user.uid;
  } finally {
    await deleteApp(tempApp);
  }
}

export async function addEmployee(employee: Omit<Employee, 'id'>, password?: string) {
  if (!password) {
    throw new Error('Initial password is required to create a new employee account.');
  }

  const uid = await createEmployeeAuth(employee.email, password);
  const avatarUrl = employee.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}`;

  // 1. Create a user profile doc in Firestore 'users' collection
  const userProfileRef = doc(db, 'users', uid);
  await setDoc(userProfileRef, {
    email: employee.email,
    name: employee.name,
    role: 'employee',
    dept: employee.dept,
    employeeId: employee.employeeId || '',
    joinDate: employee.joinDate || new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
    location: defaultUserLocation,
    phone: employee.phone || defaultUserPhone,
    avatar: avatarUrl,
    mustChangePassword: true,
    createdAt: serverTimestamp(),
    aadhar: employee.aadhar || '',
    pan: employee.pan || '',
    address: employee.address || '',
    dob: employee.dob || '',
  });

  // 2. Create the employee record doc in Firestore 'employees' collection
  const employeeRef = doc(db, 'employees', uid);
  await setDoc(employeeRef, {
    name: employee.name,
    role: employee.role,
    dept: employee.dept,
    status: employee.status || 'active',
    email: employee.email,
    avatar: avatarUrl,
    employeeId: employee.employeeId || '',
    joinDate: employee.joinDate || '',
    phone: employee.phone || '',
    aadhar: employee.aadhar || '',
    pan: employee.pan || '',
    address: employee.address || '',
    dob: employee.dob || '',
  });

  return { id: uid, ...employee, avatar: avatarUrl };
}

export async function deactivateEmployee(id: string) {
  const employeeRef = doc(db, 'employees', id);
  const userRef = doc(db, 'users', id);
  try {
    await updateDoc(employeeRef, { status: 'inactive' });
  } catch (error) {
    console.error('Failed to deactivate in employees collection', error);
  }
  try {
    await updateDoc(userRef, { status: 'inactive' });
  } catch (error) {
    console.error('Failed to deactivate in users collection', error);
  }
}

export async function activateEmployee(id: string) {
  const employeeRef = doc(db, 'employees', id);
  const userRef = doc(db, 'users', id);
  try {
    await updateDoc(employeeRef, { status: 'active' });
  } catch (error) {
    console.error('Failed to activate in employees collection', error);
  }
  try {
    await updateDoc(userRef, { status: 'active' });
  } catch (error) {
    console.error('Failed to activate in users collection', error);
  }
}

export async function deleteEmployee(id: string) {
  const employeeRef = doc(db, 'employees', id);
  const userRef = doc(db, 'users', id);
  try {
    await deleteDoc(employeeRef);
  } catch (error) {
    console.error('Failed to delete from employees collection', error);
  }
  try {
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Failed to delete from users collection', error);
  }
}

export async function getProjects() {
  const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('name', 'asc')));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Project, 'id'>),
  }));
}

export async function createProject(project: Omit<Project, 'id' | 'progress' | 'members' | 'status' | 'color'> & { members?: string[] }) {
  const payload = {
    ...project,
    progress: 0,
    members: project.members?.length ? project.members : ['AD'],
    status: 'active' as const,
    color: projectColors[Math.floor(Math.random() * projectColors.length)],
  };
  const reference = await addDoc(collection(db, 'projects'), payload);
  return { id: reference.id, ...payload };
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const projectRef = doc(db, 'projects', id);
  await updateDoc(projectRef, updates);
}

export async function archiveProject(id: string) {
  const projectRef = doc(db, 'projects', id);
  await deleteDoc(projectRef);
}

export async function getDepartments() {
  const snapshot = await getDocs(query(collection(db, 'departments'), orderBy('name', 'asc')));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Department, 'id'>),
  }));
}

export async function createDepartment(dept: Omit<Department, 'id' | 'members' | 'color'>) {
  const payload = {
    ...dept,
    members: 0,
    color: departmentColors[Math.floor(Math.random() * departmentColors.length)],
  };
  const reference = await addDoc(collection(db, 'departments'), payload);
  return { id: reference.id, ...payload };
}

export async function updateDepartment(id: string, updates: Partial<Department>) {
  const deptRef = doc(db, 'departments', id);
  await updateDoc(deptRef, updates);
}

export async function deleteDepartment(id: string) {
  const deptRef = doc(db, 'departments', id);
  await deleteDoc(deptRef);
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const employeeRef = doc(db, 'employees', id);
  const userRef = doc(db, 'users', id);
  try {
    await updateDoc(employeeRef, updates);
  } catch (error) {
    console.error('Failed to update in employees collection', error);
  }
  try {
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Failed to update in users collection', error);
  }
}

export async function getNotifications() {
  const snapshot = await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Omit<Notification, 'id'>;
    const createdAtValue = data.createdAt;
    const createdAt = createdAtValue && typeof (createdAtValue as any).toDate === 'function'
      ? (createdAtValue as any).toDate().toISOString()
      : (createdAtValue as string) || new Date().toISOString();
    return {
      id: docSnap.id,
      ...data,
      createdAt,
    };
  });
}

export async function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  const payload = {
    ...notification,
    read: false as const,
    createdAt: serverTimestamp(),
  };
  const reference = await addDoc(collection(db, 'notifications'), payload);
  return { id: reference.id, ...payload };
}

export async function markNotificationRead(id: string) {
  const notificationRef = doc(db, 'notifications', id);
  await updateDoc(notificationRef, { read: true });
}

export async function getTimesheets() {
  const snapshot = await getDocs(query(collection(db, 'timesheets'), orderBy('date', 'desc')));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<TimesheetEntry, 'id'>),
  }));
}

export async function addTimesheet(entry: Omit<TimesheetEntry, 'id' | 'status'>) {
  const payload = {
    ...entry,
    status: 'pending' as const,
  };
  const reference = await addDoc(collection(db, 'timesheets'), payload);
  return { id: reference.id, ...payload };
}

export async function approveTimesheet(id: string) {
  const timesheetRef = doc(db, 'timesheets', id);
  const timesheetSnap = await getDoc(timesheetRef);
  if (!timesheetSnap.exists()) {
    throw new Error('Timesheet entry not found');
  }
  const timesheetData = timesheetSnap.data() as Omit<TimesheetEntry, 'id'>;
  await updateDoc(timesheetRef, { status: 'approved' });
  await addNotification({
    userId: timesheetData.userId,
    message: `Your timesheet entry for ${timesheetData.project} on ${new Date(timesheetData.date).toLocaleDateString('en-US')} is approved.`,
    type: 'success',
  });
}

export async function rejectTimesheet(id: string) {
  const timesheetRef = doc(db, 'timesheets', id);
  const timesheetSnap = await getDoc(timesheetRef);
  if (!timesheetSnap.exists()) {
    throw new Error('Timesheet entry not found');
  }
  const timesheetData = timesheetSnap.data() as Omit<TimesheetEntry, 'id'>;
  await updateDoc(timesheetRef, { status: 'rejected' });
  await addNotification({
    userId: timesheetData.userId,
    message: `Your timesheet entry for ${timesheetData.project} on ${new Date(timesheetData.date).toLocaleDateString('en-US')} was rejected.`,
    type: 'warning',
  });
}

export async function deleteTimesheet(id: string) {
  const timesheetRef = doc(db, 'timesheets', id);
  await deleteDoc(timesheetRef);
}

export async function getLeaveRequests() {
  const snapshot = await getDocs(query(collection(db, 'leaveRequests'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<LeaveRequest, 'id'>),
  }));
}

export async function requestLeave(request: Omit<LeaveRequest, 'id' | 'status'>) {
  const payload = {
    ...request,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
  };
  const reference = await addDoc(collection(db, 'leaveRequests'), payload);
  return { id: reference.id, ...payload };
}

async function getLeaveBalanceDoc(userId: string, type: string) {
  const snapshot = await getDocs(
    query(
      collection(db, 'leaveBalances'),
      where('userId', '==', userId),
      where('type', '==', type)
    )
  );
  return snapshot.docs[0] || null;
}

export async function approveLeave(id: string) {
  const leaveRef = doc(db, 'leaveRequests', id);
  const leaveSnap = await getDoc(leaveRef);
  if (!leaveSnap.exists()) {
    throw new Error('Leave request not found');
  }
  const leaveData = leaveSnap.data() as Omit<LeaveRequest, 'id'>;
  await updateDoc(leaveRef, { status: 'approved' });

  const balanceDoc = await getLeaveBalanceDoc(leaveData.userId, leaveData.type);
  if (balanceDoc) {
    const data = balanceDoc.data();
    const currentUsed = typeof data.used === 'number' ? data.used : 0;
    const total = typeof data.total === 'number' ? data.total : 0;
    await updateDoc(balanceDoc.ref, {
      used: Math.min(total, currentUsed + leaveData.days),
      name: leaveData.name,
    });
  } else {
    await addDoc(collection(db, 'leaveBalances'), {
      userId: leaveData.userId,
      name: leaveData.name,
      type: leaveData.type,
      total: defaultLeaveBalances.find((balance) => balance.type === leaveData.type)?.total ?? 10,
      used: leaveData.days,
      color: defaultLeaveBalances.find((balance) => balance.type === leaveData.type)?.color ?? 'bg-indigo-500',
    });
  }

  await addNotification({
    userId: leaveData.userId,
    message: `Your ${leaveData.type} request for ${leaveData.days} day${leaveData.days === 1 ? '' : 's'} has been approved.`,
    type: 'success',
  });
}

export async function rejectLeave(id: string) {
  const leaveRef = doc(db, 'leaveRequests', id);
  const leaveSnap = await getDoc(leaveRef);
  if (!leaveSnap.exists()) {
    throw new Error('Leave request not found');
  }
  const leaveData = leaveSnap.data() as Omit<LeaveRequest, 'id'>;
  await updateDoc(leaveRef, { status: 'rejected' });
  await addNotification({
    userId: leaveData.userId,
    message: `Your ${leaveData.type} request was rejected.`,
    type: 'warning',
  });
}

export async function getLeaveBalances() {
  const snapshot = await getDocs(query(collection(db, 'leaveBalances'), orderBy('name', 'asc')));
  const balances: Record<string, LeaveBalance[]> = {};
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() as Omit<LeaveBalance, 'id'>;
    if (!balances[data.name]) {
      balances[data.name] = [];
    }
    balances[data.name].push({
      id: docSnap.id,
      ...data,
    });
  });
  return balances;
}
