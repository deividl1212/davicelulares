import { db } from "./firebase.js";
import {
  doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs,
} from "firebase/firestore";

const COLLECTION = "loja-celulares";

function docId(key, shared) {
  return `${shared ? "shared" : "personal"}__${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const ref = doc(db, COLLECTION, docId(key, shared));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { key, value: snap.data().value, shared };
  },

  async set(key, value, shared = false) {
    const ref = doc(db, COLLECTION, docId(key, shared));
    await setDoc(ref, { key, value, shared });
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const ref = doc(db, COLLECTION, docId(key, shared));
    const snap = await getDoc(ref);
    const existed = snap.exists();
    if (existed) await deleteDoc(ref);
    return { key, deleted: existed, shared };
  },

  async list(prefix = "", shared = false) {
    const col = collection(db, COLLECTION);
    const q = query(col, where("shared", "==", shared));
    const snaps = await getDocs(q);
    const keys = [];
    snaps.forEach((s) => {
      const k = s.data().key;
      if (k.startsWith(prefix)) keys.push(k);
    });
    return { keys, prefix, shared };
  },
};