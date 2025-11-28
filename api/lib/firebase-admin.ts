import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let adminDb: any = null;
let adminAuth: any = null;
let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized && adminDb && adminAuth) return;

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set");
    }

    let app;
    if (getApps().length > 0) {
      app = getApp();
    } else {
      const serviceAccount = JSON.parse(serviceAccountKey);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
    initialized = true;

    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

export function getAdminDb() {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  return adminDb;
}

export function getAdminAuth() {
  if (!adminAuth) {
    initializeFirebaseAdmin();
  }
  return adminAuth;
}

export function isAdminInitialized(): boolean {
  return adminDb !== null && adminAuth !== null;
}
