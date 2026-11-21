import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 relatedType:{type:String,enum:['Customer','Lead','Opportunity'],required:true},
 relatedId:{type:mongoose.Schema.Types.ObjectId,required:true},
 followUpDate:{type:Date,required:true}, subject:{type:String,required:true,maxlength:150},
 type:{type:String,enum:['Call','Meeting','Email','Task'],default:'Call'},
 status:{type:String,enum:['Planned','Completed','Missed','Cancelled'],default:'Planned'},
 assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}, notes:String
},{timestamps:true});
export default mongoose.model('FollowUp',schema);
