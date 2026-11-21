import React,{createContext,useContext,useEffect,useState}from'react';import api from'../api';
const C=createContext(null);export const useAuth=()=>useContext(C);
export function AuthProvider({children}){const[user,setUser]=useState(null);const[loading,setLoading]=useState(true);
 useEffect(()=>{if(localStorage.getItem('acxiom_token'))api.get('/auth/me').then(r=>setUser(r.data.user)).catch(()=>localStorage.removeItem('acxiom_token')).finally(()=>setLoading(false));else setLoading(false)},[]);
 const login=async(email,password)=>{const r=await api.post('/auth/login',{email,password});localStorage.setItem('acxiom_token',r.data.token);setUser(r.data.user);};
 const register=async(data)=>{const r=await api.post('/auth/register',data);localStorage.setItem('acxiom_token',r.data.token);setUser(r.data.user);};
 const logout=async()=>{try{await api.post('/auth/logout')}finally{localStorage.removeItem('acxiom_token');setUser(null)}};
 return <C.Provider value={{user,loading,login,register,logout}}>{children}</C.Provider>;
}
