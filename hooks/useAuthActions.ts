import { auth, db } from "@/services/firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";

export const useAuthActions = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);

    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, "users", userCredentials.user.uid), { name, email });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("logged in");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async ()=>{
    setLoading(true)
    try{
        await signOut(auth);
        alert("logged out successfully");
    }catch(error:any){
        alert(error.message);
    }finally{
        setLoading(false);
    }
  }

  return { signUp , login , logout , loading }
};
