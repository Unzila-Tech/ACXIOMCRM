import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Lead from '../models/Lead.js';
import Opportunity from '../models/Opportunity.js';
import FollowUp from '../models/FollowUp.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import {scopeFilter} from '../middleware/auth.js';
import {writeAudit} from '../utils/audit.js';
import {validateCustomer,isPastDay,emailOk,phoneOk} from '../utils/validation.js';
const validId=id=>mongoose.isValidObjectId(id);
const safe=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
function canAccess(req,doc,field='assignedTo'){return req.user.role!=='SalesExecutive'||String(doc?.[field])===String(req.user._id);}
export const listCustomers=safe(async(req,res)=>{
 const q=req.query.search||''; const filter={...scopeFilter(req),...(q?{$or:[{customerName:new RegExp(q,'i')},{email:new RegExp(q,'i')},{phone:new RegExp(q,'i')},{companyName:new RegExp(q,'i')}] }:{})};
 const data=await Customer.find(filter).populate('assignedTo','name email').sort({createdAt:-1});res.json(data);
});
export const createCustomer=safe(async(req,res)=>{
 const errors=validateCustomer(req.body);if(errors.length)return res.status(400).json({message:errors.join(' ')});
 const email=req.body.email.toLowerCase(),phone=req.body.phone.replace(/[\s-]/g,'');
 if(await Customer.exists({$or:[{email},{phone}]}))return res.status(409).json({message:'A customer with this email or phone already exists'});
 const assignedTo=req.user.role==='SalesExecutive'?req.user._id:(req.body.assignedTo||req.user._id);
 const doc=await Customer.create({...req.body,email,phone,assignedTo,createdBy:req.user._id,customerCode:'CUS-'+Date.now()});
 await writeAudit(req,{action:'Create',module:'Customers',entityName:'Customer',recordId:doc._id,newValue:doc.toObject()});res.status(201).json(doc);
});
export const getCustomer=safe(async(req,res)=>{const d=await Customer.findById(req.params.id).populate('assignedTo','name');if(!d)return res.status(404).json({message:'Customer not found'});if(!canAccess(req,d))return res.sendStatus(403);res.json(d);});
export const updateCustomer=safe(async(req,res)=>{
 const d=await Customer.findById(req.params.id);if(!d)return res.sendStatus(404);if(!canAccess(req,d))return res.sendStatus(403);
 const errors=validateCustomer({...d.toObject(),...req.body});if(errors.length)return res.status(400).json({message:errors.join(' ')});
 const old=d.toObject();Object.assign(d,req.body);if(req.user.role==='SalesExecutive')d.assignedTo=req.user._id;
 const duplicate=await Customer.findOne({_id:{$ne:d._id},$or:[{email:d.email.toLowerCase()},{phone:d.phone}]});if(duplicate)return res.status(409).json({message:'Email or phone already exists'});
 await d.save();await writeAudit(req,{action:'Update',module:'Customers',entityName:'Customer',recordId:d._id,oldValue:old,newValue:d.toObject()});res.json(d);
});
export const deleteCustomer=safe(async(req,res)=>{const d=await Customer.findById(req.params.id);if(!d)return res.sendStatus(404);if(!canAccess(req,d))return res.sendStatus(403);d.status='Inactive';await d.save();await writeAudit(req,{action:'Delete/Deactivate',module:'Customers',recordId:d._id});res.json({message:'Customer deactivated'});});

export const listLeads=safe(async(req,res)=>{const q=req.query.search||'';const f={...scopeFilter(req),...(req.query.status?{status:req.query.status}:{}),...(q?{$or:[{leadName:new RegExp(q,'i')},{companyName:new RegExp(q,'i')},{status:new RegExp(q,'i') }]}:{})};res.json(await Lead.find(f).populate('assignedTo','name').sort({createdAt:-1}));});
export const createLead=safe(async(req,res)=>{const b=req.body;if(!b.leadName?.trim())return res.status(400).json({message:'Lead name is required'});if(b.email&&!emailOk(b.email))return res.status(400).json({message:'Enter a valid email address'});if(b.phone&&!phoneOk(b.phone))return res.status(400).json({message:'Enter a valid phone number'});if(b.expectedValue!=null&&Number(b.expectedValue)<0)return res.status(400).json({message:'Expected value cannot be negative'});const d=await Lead.create({...b,assignedTo:req.user.role==='SalesExecutive'?req.user._id:(b.assignedTo||req.user._id),leadCode:'LEAD-'+Date.now()});await writeAudit(req,{action:'Create',module:'Leads',recordId:d._id,newValue:d.toObject()});res.status(201).json(d);});
export const updateLead=safe(async(req,res)=>{const d=await Lead.findById(req.params.id);if(!d)return res.sendStatus(404);if(!canAccess(req,d))return res.sendStatus(403);const allowed=['New','Contacted','Qualified','Unqualified','Converted','Lost'];if(req.body.status&&!allowed.includes(req.body.status))return res.status(400).json({message:'Invalid lead status'});if(req.body.leadName!==undefined&&!req.body.leadName.trim())return res.status(400).json({message:'Lead name is required'});const old=d.toObject();Object.assign(d,req.body);if(req.user.role==='SalesExecutive')d.assignedTo=req.user._id;await d.save();await writeAudit(req,{action:'Update',module:'Leads',recordId:d._id,oldValue:old,newValue:d.toObject()});res.json(d);});
export const deleteLead=safe(async(req,res)=>{const d=await Lead.findById(req.params.id);if(!d)return res.sendStatus(404);if(!canAccess(req,d))return res.sendStatus(403);await d.deleteOne();await writeAudit(req,{action:'Delete',module:'Leads',recordId:d._id});res.json({message:'Lead deleted'});});
export const convertLead=safe(async(req,res)=>{const lead=await Lead.findById(req.params.id);if(!lead)return res.sendStatus(404);if(!canAccess(req,lead))return res.sendStatus(403);if(lead.status!=='Qualified')return res.status(400).json({message:'Only qualified leads can be converted'});const customer=await Customer.create({customerName:lead.leadName,email:lead.email||`${lead._id}@lead.local`,phone:lead.phone||'0000000000',companyName:lead.companyName,status:'Active',assignedTo:lead.assignedTo,createdBy:req.user._id});lead.status='Converted';lead.convertedCustomer=customer._id;await lead.save();await writeAudit(req,{action:'Convert',module:'Leads',recordId:lead._id,newValue:{customerId:customer._id}});res.status(201).json({lead,customer});});

export const listOpportunities=safe(async(req,res)=>{const q=req.query.search||'';const f={...scopeFilter(req,'owner'),...(req.query.stage?{stage:req.query.stage}:{}),...(req.query.status?{status:req.query.status}:{}),...(q?{opportunityName:new RegExp(q,'i')}:{})};res.json(await Opportunity.find(f).populate('customerId','customerName').populate('owner','name').sort({createdAt:-1}));});
export const createOpportunity=safe(async(req,res)=>{const b=req.body;if(!b.opportunityName?.trim())return res.status(400).json({message:'Opportunity name is required'});if(Number(b.amount)<=0)return res.status(400).json({message:'Opportunity Amount must be greater than 0.'});if(Number(b.probability)<0||Number(b.probability)>100)return res.status(400).json({message:'Probability must be between 0 and 100.'});if(!b.expectedCloseDate||isPastDay(b.expectedCloseDate))return res.status(400).json({message:'Expected Close Date cannot be in the past.'});const d=await Opportunity.create({...b,amount:Number(b.amount),probability:Number(b.probability),owner:req.user.role==='SalesExecutive'?req.user._id:(b.owner||req.user._id)});await writeAudit(req,{action:'Create',module:'Opportunities',recordId:d._id,newValue:d.toObject()});res.status(201).json(d);});
export const updateOpportunity=safe(async(req,res)=>{const d=await Opportunity.findById(req.params.id);if(!d)return res.sendStatus(404);if(!canAccess(req,d,'owner'))return res.sendStatus(403);const b={...req.body};if(b.amount!==undefined&&Number(b.amount)<=0)return res.status(400).json({message:'Opportunity Amount must be greater than 0.'});if(b.probability!==undefined&&(Number(b.probability)<0||Number(b.probability)>100))return res.status(400).json({message:'Probability must be between 0 and 100.'});if(b.expectedCloseDate&&d.status==='Open'&&isPastDay(b.expectedCloseDate))return res.status(400).json({message:'Expected Close Date cannot be in the past.'});const old=d.toObject();Object.assign(d,b);await d.save();await writeAudit(req,{action:'Update',module:'Opportunities',recordId:d._id,oldValue:old,newValue:d.toObject()});res.json(d);});
export const deleteOpportunity=safe(async(req,res)=>{const d=await Opportunity.findById(req.params.id);if(!d)return res.sendStatus(404);if(!canAccess(req,d,'owner'))return res.sendStatus(403);await d.deleteOne();await writeAudit(req,{action:'Delete',module:'Opportunities',recordId:d._id});res.json({message:'Opportunity deleted'});});

export const listFollowups=safe(async(req,res)=>{const f={...scopeFilter(req),...(req.query.status?{status:req.query.status}:{}),...(req.query.date?{followUpDate:{$gte:new Date(req.query.date),$lt:new Date(new Date(req.query.date).getTime()+86400000)}}:{})};res.json(await FollowUp.find(f).sort({followUpDate:1}));});
export const createFollowup=safe(async(req,res)=>{const b=req.body;if(!b.subject||!b.relatedType||!b.relatedId||!b.followUpDate)return res.status(400).json({message:'Related record, subject and date are required'});if(b.status==='Planned'&&isPastDay(b.followUpDate))return res.status(400).json({message:'Follow-up date cannot be earlier than today.'});const d=await FollowUp.create({...b,assignedTo:req.user.role==='SalesExecutive'?req.user._id:(b.assignedTo||req.user._id)});await writeAudit(req,{action:'Create',module:'FollowUps',recordId:d._id,newValue:d.toObject()});res.status(201).json(d);});
export const updateFollowupStatus=safe(async(req,res)=>{const d=await FollowUp.findById(req.params.id);if(!d)return res.sendStatus(404);if(!canAccess(req,d))return res.sendStatus(403);const {status,followUpDate}=req.body;if(!['Planned','Completed','Missed','Cancelled'].includes(status))return res.status(400).json({message:'Invalid follow-up status'});if(status==='Planned'&&followUpDate&&isPastDay(followUpDate))return res.status(400).json({message:'Follow-up date cannot be earlier than today.'});const old=d.toObject();d.status=status;if(followUpDate)d.followUpDate=followUpDate;await d.save();await writeAudit(req,{action:'Update Status/Reschedule',module:'FollowUps',recordId:d._id,oldValue:old,newValue:d.toObject()});res.json(d);});

export const listActivities=safe(async(req,res)=>res.json(await Activity.find(scopeFilter(req)).sort({activityDate:-1})));
export const createActivity=safe(async(req,res)=>{const b=req.body;if(!['Call','Meeting','Email','Task'].includes(b.activityType))return res.status(400).json({message:'Invalid activity type'});const d=await Activity.create({...b,assignedTo:req.user.role==='SalesExecutive'?req.user._id:(b.assignedTo||req.user._id)});await writeAudit(req,{action:'Create',module:'Activities',recordId:d._id});res.status(201).json(d);});

export const listUsers=safe(async(req,res)=>res.json(await User.find().select('-passwordHash').sort({createdAt:-1})));
export const updateUser=safe(async(req,res)=>{const d=await User.findById(req.params.id);if(!d)return res.sendStatus(404);const old={role:d.role,isActive:d.isActive};if(req.body.role&&!['Admin','Manager','SalesExecutive'].includes(req.body.role))return res.status(400).json({message:'Invalid role'});if(req.body.role)d.role=req.body.role;if(typeof req.body.isActive==='boolean')d.isActive=req.body.isActive;await d.save();await writeAudit(req,{action:'User/Role Change',module:'Users',recordId:d._id,oldValue:old,newValue:{role:d.role,isActive:d.isActive}});res.json({id:d._id,name:d.name,email:d.email,role:d.role,isActive:d.isActive});});
export const listAudit=safe(async(req,res)=>{const f={};if(req.query.module)f.module=req.query.module;if(req.query.action)f.action=req.query.action;if(req.query.userId)f.userId=req.query.userId;if(req.query.from||req.query.to)f.createdAt={$gte:req.query.from?new Date(req.query.from):new Date(0),$lte:req.query.to?new Date(req.query.to):new Date()};res.json(await AuditLog.find(f).sort({createdAt:-1}).limit(500));});
export const dashboard=safe(async(req,res)=>{
 const c=await Customer.countDocuments(scopeFilter(req)), l=await Lead.find(scopeFilter(req)), o=await Opportunity.find(scopeFilter(req,'owner')), f=await FollowUp.find(scopeFilter(req));
 const openLeads=l.filter(x=>!['Lost','Converted','Unqualified'].includes(x.status)).length;
 const openOpp=o.filter(x=>x.status==='Open'), won=o.filter(x=>x.status==='Won'), lost=o.filter(x=>x.status==='Lost');
 const leadStatus=['New','Contacted','Qualified','Lost','Converted'].map(s=>({label:s,value:l.filter(x=>x.status===s).length}));
 const stages=['Qualification','Proposal','Negotiation','Won','Lost'].map(s=>({label:s,value:o.filter(x=>x.stage===s).length}));
 const monthly=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));return {label:d.toLocaleString('en',{month:'short'}),value:o.filter(x=>new Date(x.createdAt).getMonth()===d.getMonth()&&new Date(x.createdAt).getFullYear()===d.getFullYear()).reduce((a,x)=>a+(x.status==='Won'?x.amount:0),0)};});
 res.json({cards:{totalCustomers:c,totalLeads:l.length,openLeads,totalOpportunities:o.length,openOpportunities:openOpp.length,wonOpportunities:won.length,lostOpportunities:lost.length,totalPipelineValue:openOpp.reduce((a,x)=>a+x.amount,0),pendingFollowups:f.filter(x=>x.status==='Planned').length},leadStatus,stages,monthlySales:monthly});
});
export const report=safe(async(req,res)=>{const type=req.params.type;let data;
 if(type==='customers')data=await Customer.find(scopeFilter(req)).sort({createdAt:-1});
 else if(type==='leads')data=await Lead.find(scopeFilter(req)).sort({createdAt:-1});
 else if(type==='opportunities')data=await Opportunity.find(scopeFilter(req,'owner')).sort({createdAt:-1});
 else if(type==='followups')data=await FollowUp.find(scopeFilter(req)).sort({followUpDate:1});
 else if(type==='pipeline')data=await Opportunity.find(scopeFilter(req,'owner')).select('stage amount probability owner status');
 else if(type==='audit'&&['Admin','Manager'].includes(req.user.role))data=await AuditLog.find().sort({createdAt:-1}).limit(500);
 else return res.status(403).json({message:'Report unavailable for this role or report type'});
 res.json(data);
});
