import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { getDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase.config";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedInUser = result?.user;

      if (loggedInUser) {
        // ✅ Sidha user ka doc check karo (UID se)
        const userDocRef = doc(db, "users", loggedInUser.uid);
        const userSnap = await getDoc(userDocRef);

        const isNewUser = !userSnap.exists();

        if (isNewUser) {
          // 🆕 Naya user — save karo
          await setDoc(userDocRef, {
            uid: loggedInUser.uid,
            name: loggedInUser.displayName || "",
            email: loggedInUser.email,
            photoURL: loggedInUser.photoURL || "",
            createdAt: serverTimestamp(),
            provider: "google",
          });

          Swal.fire({
            title: `Welcome ${loggedInUser.displayName || ""} 🎉`,
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#14213D",
          });
        } else {
          Swal.fire({
            title: "Welcome Back! 🙏",
            text: `Good to see you, ${loggedInUser.displayName || ""}`,
            icon: "success",
            confirmButtonText: "Continue",
            confirmButtonColor: "#14213D",
          });
        }

        navigate("/");
      }
    } catch (error: any) {
      console.error("Google login error:", error.code, error.message);
      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: error.message,
        confirmButtonColor: "#14213D",
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};