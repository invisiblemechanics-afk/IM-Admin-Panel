import {
  addDoc, collection, serverTimestamp, doc, setDoc, getDoc,
  getDocs, updateDoc, deleteDoc, writeBatch, query, orderBy
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { TestMeta, TestItem } from '../../../types';

const testsCol = () => collection(db, 'Tests');

export async function createTest(meta: Omit<TestMeta,'id'|'createdAt'|'updatedAt'|'createdBy'>, uid: string) {
  const now = serverTimestamp();
  const ref = await addDoc(testsCol(), {
    ...meta,
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
    version: 1,
  } as Partial<TestMeta>);
  return ref.id;
}

export async function updateTest(id: string, patch: Partial<TestMeta>) {
  await updateDoc(doc(db, 'Tests', id), { ...patch, updatedAt: serverTimestamp() });
}

export async function getTest(id: string): Promise<TestMeta> {
  const snap = await getDoc(doc(db, 'Tests', id));
  if (!snap.exists()) {
    throw new Error('Test not found');
  }
  return { id: snap.id, ...(snap.data() as TestMeta) };
}

export async function listTests(): Promise<TestMeta[]> {
  const snap = await getDocs(query(testsCol(), orderBy('updatedAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as TestMeta) }));
}

export async function deleteTest(id: string) {
  // delete meta + questions subcollection
  const qCol = collection(db, 'Tests', id, 'Questions');
  const qSnap = await getDocs(qCol);
  const batch = writeBatch(db);
  qSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'Tests', id));
  await batch.commit();
}

export async function upsertTestItems(testId: string, items: TestItem[]) {
  const qCol = collection(db, 'Tests', testId, 'Questions');
  
  // Clear existing questions first
  const existing = await getDocs(qCol);
  const batch = writeBatch(db);
  existing.docs.forEach(d => batch.delete(d.ref));
  
  // Add new questions
  items.forEach((item, i) => {
    const ref = doc(qCol);
    batch.set(ref, { ...item, order: i });
  });
  
  await batch.commit();
}

export async function getTestItems(testId: string): Promise<TestItem[]> {
  const qCol = collection(db, 'Tests', testId, 'Questions');
  const snap = await getDocs(query(qCol, orderBy('order', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as TestItem) }));
}




