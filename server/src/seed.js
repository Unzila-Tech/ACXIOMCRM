import dotenv from 'dotenv';dotenv.config();
import {connectDB} from './config/db.js';import User from './models/User.js';import bcrypt from 'bcryptjs';
await connectDB();
const demos=[['Acxiom Admin','admin@acxiom.local','Admin@12345','Admin'],['Sales Manager','manager@acxiom.local','Manager@12345','Manager'],['Sales Executive','sales@acxiom.local','Sales@12345','SalesExecutive']];
for(const [name,email,password,role] of demos){if(!await User.exists({email}))await User.create({name,email,passwordHash:await bcrypt.hash(password,12),role});}
console.log('Seed complete. Demo passwords are for local testing only.');process.exit(0);
