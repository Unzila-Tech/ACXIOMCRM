import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 activityType:{type:String,enum:['Call','Meeting','Email','Task'],required:true},
 subject:{type:String,required:true,maxlength:150}, description:String, activityDate:{type:Date,default:Date.now},
 customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer'}, leadId:{type:mongoose.Schema.Types.ObjectId,ref:'Lead'},
 assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
 status:{type:String,enum:['Planned','Completed','Cancelled'],default:'Completed'}
},{timestamps:true});
export default mongoose.model('Activity',schema);
