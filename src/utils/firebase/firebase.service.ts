import { Injectable } from '@nestjs/common';
import {initializeApp,App,getApps,cert,getApp} from "firebase-admin/app"
import {getAuth} from "firebase-admin/auth"

@Injectable()
export class FirebaseService {

    private firebaseApp: App;

    onModuleInit() {
    if (!getApps().length) {
      this.firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } else {
      this.firebaseApp = getApp()
    }
  }

  get auth() {
    return getAuth(this.firebaseApp) ;
  }

  async verifyIdToken(idToken: string) {
    return this.auth.verifyIdToken(idToken);
  }

  async createSessionCookie(idToken: string, expiresIn: number) {
    return this.auth.createSessionCookie(idToken, { expiresIn });
  }

  async verifySessionCookie(sessionCookie: string, checkRevoked = true) {
    return this.auth.verifySessionCookie(sessionCookie, checkRevoked);
  }

  async getUser(uid: string) {
    return this.auth.getUser(uid);
  }

    // ✅ Add createUser method
  async createUser(email: string, password: string, displayName?: string) {
    return this.auth.createUser({
      email,
      password,
      displayName,
    });
  }
}



