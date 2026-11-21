import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 userId:{type:mongoose.Schema.Types.ObjectId,ref:'User'}, userName:String, action:{type:String,required:true},
 module:{type:String,required:true}, entityName:String, recordId:String, oldValue:String,newValue:String,
 result:{type:String,default:'Success'}, ipAddress:String, details:String
},{timestamps:true});
schema.index({createdAt:-1});
export default mongoose.model('AuditLog',schema);
