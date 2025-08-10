import { auth } from "@/services/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";
import React, {createContext, useContext, useEffect, useState }  from "react";


interface AuthContextType{
    user : User | null ;
}
interface AuthContextProps{
    children : React.ReactNode;
}

const AuthContext = createContext<AuthContextType>({
    user : null,
})

export const AuthProvider = ({children}:AuthContextProps) => {
    const [user, setUser] = useState<User | null>(null);
 
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
        return unsubscribe;
    },[]);

    return (
        <AuthContext.Provider value={{user}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);