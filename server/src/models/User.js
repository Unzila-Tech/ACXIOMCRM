import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:80},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  passwordHash:{type:String,required:true,select:false},
  role:{type:String,enum:['Admin','Manager','SalesExecutive'],default:'SalesExecutive'},
  isActive:{type:Boolean,default:true},
  failedLoginCount:{type:Number,default:0},
  lockoutUntil:{type:Date,default:null}
},{timestamps:true});
export default mongoose.model('User',userSchema);
