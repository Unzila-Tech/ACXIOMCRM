import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {writeAudit} from '../utils/audit.js';
const publicUser=u=>({id:u._id,name:u.name,email:u.email,role:u.role,isActive:u.isActive,lockoutUntil:u.lockoutUntil});
const tokenFor=u=>jwt.sign({id:u._id,role:u.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'8h'});
export async function register(req,res){
 const {name,email,password}=req.body;
 if(!name?.trim()||!email||!password) return res.status(400).json({message:'Name, email and password are required'});
 if(password.length<8||!/[A-Z]/.test(password)||!/[0-9]/.test(password)) return res.status(400).json({message:'Password must be at least 8 characters and include an uppercase letter and a number'});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({message:'Enter a valid email'});
 if(await User.exists({email:email.toLowerCase()})) return res.status(409).json({message:'Email already registered'});
 const user=await User.create({name,email,passwordHash:await bcrypt.hash(password,12),role:'SalesExecutive'});
 const token=tokenFor(user); req.user=user; await writeAudit(req,{action:'Register',module:'Authentication',recordId:user._id});
 res.status(201).json({token,user:publicUser(user)});
}
export async function login(req,res){
 const {email,password}=req.body; const user=await User.findOne({email:String(email||'').toLowerCase()}).select('+passwordHash');
 if(!user) return res.status(401).json({message:'Invalid email or password'});
 if(!user.isActive) return res.status(403).json({message:'Account is inactive'});
 if(user.lockoutUntil && user.lockoutUntil>Date.now()) return res.status(423).json({message:'Account temporarily locked. Try again later.'});
 if(!password || !(await bcrypt.compare(password,user.passwordHash))){
  user.failedLoginCount+=1;
  if(user.failedLoginCount>=5){user.lockoutUntil=new Date(Date.now()+15*60*1000);user.failedLoginCount=0;}
  await user.save(); req.user=user; await writeAudit(req,{action:'Failed Login',module:'Authentication',result:'Failure'});
  return res.status(401).json({message:user.lockoutUntil?'Too many attempts. Account locked for 15 minutes.':'Invalid email or password'});
 }
 user.failedLoginCount=0; user.lockoutUntil=null; await user.save(); req.user=user;
 await writeAudit(req,{action:'Login',module:'Authentication',recordId:user._id});
 res.json({token:tokenFor(user),user:publicUser(user)});
}
export async function me(req,res){res.json({user:publicUser(req.user)});}
export async function logout(req,res){await writeAudit(req,{action:'Logout',module:'Authentication'});res.json({message:'Logged out. Discard the bearer token on the client.'});}
