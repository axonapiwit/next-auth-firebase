import NextAuth, { Session } from "next-auth"
import { FirebaseAdapterConfig, FirestoreAdapter } from "@auth/firebase-adapter"
import { cert } from "firebase-admin/app"
import GoogleProvider from "next-auth/providers/google"

import * as admin from 'firebase-admin'
import { JWT } from "next-auth/jwt"

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
      clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY ? process.env.AUTH_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  })
}

const adapter = FirestoreAdapter({
  credential: cert({
    projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
    clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY
      ? process.env.AUTH_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
  }),
});

const options = {
  // adapter: adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // ...add more providers here
  ],
  // session: {
  //   strategy: 'jwt',
  // },
  callbacks: {
    async signIn(params : any) {
      const { user, account, profile, email, credentials } = params;
      try {
        // ตรวจสอบว่าผู้ใช้มีอยู่ใน Firebase Authentication หรือไม่
        const existingUser = await admin.auth().getUserByEmail(user.email);
    
        // ถ้าผู้ใช้มีอยู่แล้ว ทำการอัพเดทข้อมูลของผู้ใช้
        if (existingUser) {
          await admin.auth().updateUser(existingUser.uid, {
            displayName: user.name,
            photoURL: user.image,
          });
        }
      } catch (error) {
        // ถ้าผู้ใช้ไม่อยู่ใน Firebase Authentication สร้างผู้ใช้ใหม่
        if (error) {
          await admin.auth().createUser({
            uid: user.id,
            email: user.email,
            displayName: user.name,
            photoURL: user.image,
          });
        } else {
          throw error;
        }
      }
      return true;
    },
    
    async session({ session, token }: { session: Session, token: JWT }) {
      // if (token && token.uid) {
      //   const firebaseToken = await admin.auth().createCustomToken(token.uid)
      //   token.firebase = firebaseToken
      // }

      return session
    },
    events: {
      signIn: ({ user, account, profile, isNewUser }: any) => {
        console.log(`isNewUser: ${JSON.stringify(isNewUser)}`);
      },
      // updateUser({ user })
    },
  
    // Enable debug messages in the console if you are having problems
    debug: true,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(options)
