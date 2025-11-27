import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK only once
let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminAuth: ReturnType<typeof getAuth> | null = null;
let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) return;

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT_KEY not set. Admin operations disabled.",
      );
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
    initialized = true;

    console.log("Firebase Admin SDK initialized securely");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

export function getAdminDb() {
  if (!adminDb) {
    throw new Error(
      "Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT_KEY env var.",
    );
  }
  return adminDb;
}

export function getAdminAuth() {
  if (!adminAuth) {
    throw new Error(
      "Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT_KEY env var.",
    );
  }
  return adminAuth;
}

export class FirebaseAdminService {
  // Verify admin status
  static async verifyAdmin(idToken: string): Promise<string> {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      throw new Error("Unauthorized: Not an admin");
    }

    return decodedToken.uid;
  }

  // Get user data
  static async getUser(userId: string) {
    const db = getAdminDb();
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  // Ban user (secure)
  static async banUser(
    adminUid: string,
    userId: string,
    reason: string,
    durationDays: number,
  ) {
    const db = getAdminDb();

    // Verify target is not admin
    const targetUser = await this.getUser(userId);
    if (!targetUser) throw new Error("User not found");
    if (targetUser.isAdmin) throw new Error("Cannot ban admin users");

    // Create ban record
    const banData = {
      userId,
      reason,
      bannedBy: adminUid,
      bannedAt: Timestamp.now(),
      durationDays,
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      ),
    };

    const banRef = await db.collection("bans").add(banData);

    console.log(
      `[ADMIN_ACTION] ${adminUid} banned user ${userId}. Reason: ${reason}`,
    );

    return banRef.id;
  }

  // Get all users
  static async getAllUsers() {
    const db = getAdminDb();
    const snapshot = await db.collection("users").get();
    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName,
      isAdmin: doc.data().isAdmin,
      plan: doc.data().plan,
      createdAt: doc.data().createdAt,
    }));
  }

  // Create license
  static async createLicense(
    adminUid: string,
    plan: string,
    validityDays: number,
  ) {
    const db = getAdminDb();

    // Generate unique license key
    const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const licenseData = {
      key: licenseKey,
      plan,
      validityDays,
      createdBy: adminUid,
      createdAt: Timestamp.now(),
      used: false,
      usedBy: null,
      usedAt: null,
    };

    await db.collection("licenses").doc(licenseKey).set(licenseData);

    console.log(`[ADMIN_ACTION] ${adminUid} created license ${licenseKey}`);

    return licenseKey;
  }

  // Record IP ban
  static async banIP(
    adminUid: string,
    ipAddress: string,
    reason: string,
    durationDays: number,
  ) {
    const db = getAdminDb();

    const banData = {
      ipAddress,
      reason,
      bannedBy: adminUid,
      bannedAt: Timestamp.now(),
      durationDays,
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      ),
    };

    const banRef = await db.collection("ip_bans").add(banData);

    console.log(
      `[ADMIN_ACTION] ${adminUid} banned IP ${ipAddress}. Reason: ${reason}`,
    );

    return banRef.id;
  }

  // Delete user data
  static async deleteUser(adminUid: string, userId: string) {
    const db = getAdminDb();
    const auth = getAdminAuth();

    // Verify user is not admin
    const user = await this.getUser(userId);
    if (user?.isAdmin) throw new Error("Cannot delete admin users");

    // Delete from Firestore
    await db.collection("users").doc(userId).delete();

    // Delete from Authentication
    try {
      await auth.deleteUser(userId);
    } catch (error) {
      console.error("Failed to delete auth user:", error);
    }

    console.log(`[ADMIN_ACTION] ${adminUid} deleted user ${userId}`);
  }
}
