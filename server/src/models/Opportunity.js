import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 opportunityName:{type:String,required:true,trim:true,maxlength:120},
 customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer'}, leadId:{type:mongoose.Schema.Types.ObjectId,ref:'Lead'},
 amount:{type:Number,required:true,min:0.01}, probability:{type:Number,required:true,min:0,max:100},
 stage:{type:String,enum:['Qualification','Proposal','Negotiation','Won','Lost'],default:'Qualification'},
 status:{type:String,enum:['Open','Won','Lost'],default:'Open'}, expectedCloseDate:{type:Date,required:true},
 source:String, owner:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}, notes:String
},{timestamps:true});
schema.virtual('weightedValue').get(function(){return this.amount*this.probability/100;});
export default mongoose.model('Opportunity',schema);
