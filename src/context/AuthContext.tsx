import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { firebaseAuth } from "@/config/firebase";
import { toTitleCase } from "@/utils/formatString";  // <--- import here

type AuthContextType = {
  user: any;
  isAdmin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      setUser(user);

      const db = getFirestore();

      if (user) {
        // Check if user is admin
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        setIsAdmin(adminDoc.exists());

        // Check if user doc exists in 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          // Normalize name using toTitleCase
          const normalizedName = user.displayName
            ? toTitleCase(user.displayName)
            : "";

          // Create new user doc
          await setDoc(userDocRef, {
            name: normalizedName,
            email: user.email || "",
            createdAt: new Date(),
            requestCounts: {
              pending: 0,
              signed: 0,
              rejected: 0,
            },
          });
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
