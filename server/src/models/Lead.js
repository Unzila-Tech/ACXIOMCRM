import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 leadCode:String, leadName:{type:String,required:true,trim:true,maxlength:100}, email:{type:String,lowercase:true,trim:true},
 phone:String, companyName:String, source:String,
 status:{type:String,enum:['New','Contacted','Qualified','Unqualified','Converted','Lost'],default:'New'},
 priority:{type:String,enum:['Low','Medium','High'],default:'Medium'}, expectedValue:{type:Number,min:0,default:0},
 assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}, notes:String,
 convertedCustomer:{type:mongoose.Schema.Types.ObjectId,ref:'Customer'}
},{timestamps:true});
export default mongoose.model('Lead',schema);
