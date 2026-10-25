import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  serverTimestamp
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import config from "../../firebase-applet-config.json";

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(config) : getApp();

// CRITICAL: Pass databaseId when firestoreDatabaseId is defined in config
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface ChatMessage {
  id?: string;
  text: string;
  sender: "user" | "priya";
  timestamp: any;
  sessionId?: string;
}

export interface UserSettings {
  fitMode?: "contain" | "cover";
  updatedAt?: any;
}

export interface UserProfile {
  name: string;
  email?: string;
  uid?: string;
  photoURL?: string;
  role?: string;
}

// Test Connection helper (safe check)
export async function testConnection() {
  try {
    const testDoc = doc(db, "test", "connection");
    await getDoc(testDoc);
  } catch (error) {
    // Suppress background offline or closing/hidden connection warnings
  }
}

// Auth Helpers
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      const displayName = user.displayName || user.email?.split("@")[0] || "Movie Foli";
      await saveUserProfile(displayName, user.email || "", user.uid, user.photoURL || "", "Owner");
      return { success: true, user, name: displayName };
    }
  } catch (error: any) {
    console.error("Google Auth error:", error);
    return { success: false, error: error?.message || String(error) };
  }
  return { success: false, error: "No user returned" };
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Signout error:", err);
  }
}

export function subscribeToAuth(onUserChanged: (user: User | null) => void) {
  return onAuthStateChanged(auth, onUserChanged);
}

// User Profile Storage (Firestore + LocalStorage)
export async function saveUserProfile(
  name: string,
  email: string = "madanbudhamagar79@gmail.com",
  uid: string = "",
  photoURL: string = "",
  role: string = "Owner"
) {
  try {
    const cleanName = name.trim() || "Movie Foli";

    // Fast local persistence
    localStorage.setItem("priya_user_name", cleanName);
    localStorage.setItem("priya_user_role", role);
    if (email) localStorage.setItem("priya_user_email", email);

    const docId = uid ? uid : "default_profile";
    const profileDoc = doc(db, "user_profiles", docId);

    const payload = {
      name: cleanName,
      email,
      uid,
      photoURL,
      role,
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString()
    };

    await setDoc(profileDoc, payload, { merge: true });

    // Also mirror to default_profile so app reopens automatically find the last active user name
    if (uid) {
      const defaultDoc = doc(db, "user_profiles", "default_profile");
      await setDoc(defaultDoc, payload, { merge: true });
    }
  } catch (err: any) {
    console.warn("Firestore user profile save notice:", err?.message || err);
  }
}

export async function loadUserProfile(
  uid?: string
): Promise<UserProfile> {
  const localName = localStorage.getItem("priya_user_name");
  const localEmail = localStorage.getItem("priya_user_email") || "madanbudhamagar79@gmail.com";
  const localRole = localStorage.getItem("priya_user_role") || "Owner";

  try {
    const docId = uid ? uid : "default_profile";
    const profileDoc = doc(db, "user_profiles", docId);
    const snapshot = await getDoc(profileDoc);

    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.name) {
        localStorage.setItem("priya_user_name", data.name);
        if (data.role) localStorage.setItem("priya_user_role", data.role);
        return {
          name: data.name,
          email: data.email || localEmail,
          uid: data.uid || "",
          photoURL: data.photoURL || "",
          role: data.role || "Owner"
        };
      }
    }
  } catch (err: any) {
    console.warn("Firestore user profile load notice:", err?.message || err);
  }

  // If local storage exists and has a name, use it; otherwise default to owner Movie Foli
  const defaultOwnerName = localName || "Movie Foli";
  localStorage.setItem("priya_user_name", defaultOwnerName);
  localStorage.setItem("priya_user_role", localRole);

  const defaultProfile: UserProfile = {
    name: defaultOwnerName,
    email: localEmail,
    role: localRole
  };

  return defaultProfile;
}

export function subscribeToUserProfile(
  uid: string | undefined,
  onUpdate: (profile: UserProfile | null) => void
) {
  try {
    const docId = uid ? uid : "default_profile";
    const profileDoc = doc(db, "user_profiles", docId);

    return onSnapshot(
      profileDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.name) {
            localStorage.setItem("priya_user_name", data.name);
            onUpdate({
              name: data.name,
              email: data.email || "",
              uid: data.uid || "",
              photoURL: data.photoURL || ""
            });
          }
        }
      },
      (err) => {
        if (err?.message?.includes("closing") || err?.message?.includes("hidden") || err?.code === "cancelled") {
          return;
        }
        console.warn("Firestore profile snapshot warning:", err);
      }
    );
  } catch (err) {
    console.error("Error setting up profile snapshot:", err);
    return () => {};
  }
}

// Chat Message Storage (Firestore Realtime)
export async function saveChatMessage(
  text: string,
  sender: "user" | "priya",
  sessionId: string
) {
  try {
    const chatRef = collection(db, "chat_messages");
    await addDoc(chatRef, {
      text,
      sender,
      sessionId,
      timestamp: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error saving chat message to Firestore:", err);
  }
}

export function subscribeToChatMessages(
  sessionId: string,
  onUpdate: (messages: ChatMessage[]) => void
) {
  try {
    const chatRef = collection(db, "chat_messages");
    const q = query(chatRef, orderBy("timestamp", "asc"), limit(100));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            text: data.text || "",
            sender: data.sender || "user",
            timestamp: data.timestamp,
            sessionId: data.sessionId
          };
        });
        onUpdate(messages);
      },
      (error) => {
        if (error?.message?.includes("closing") || error?.message?.includes("hidden") || error?.code === "cancelled") {
          return;
        }
        console.warn("Firestore chat snapshot error:", error);
      }
    );
  } catch (err) {
    console.error("Error setting up real-time chat listener:", err);
    return () => {};
  }
}

export async function saveUserSettings(settings: UserSettings) {
  try {
    const settingsDoc = doc(db, "user_settings", "default_profile");
    await setDoc(
      settingsDoc,
      {
        ...settings,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Error saving user settings to Firestore:", err);
  }
}

export async function loadUserSettings(): Promise<UserSettings | null> {
  try {
    const settingsDoc = doc(db, "user_settings", "default_profile");
    const snapshot = await getDoc(settingsDoc);
    if (snapshot.exists()) {
      return snapshot.data() as UserSettings;
    }
  } catch (err) {
    console.error("Error loading user settings from Firestore:", err);
  }
  return null;
}
