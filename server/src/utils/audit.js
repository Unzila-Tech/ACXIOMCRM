import AuditLog from '../models/AuditLog.js';
export async function writeAudit(req,{action,module,entityName='',recordId='',oldValue='',newValue='',details='',result='Success'}){
 try { await AuditLog.create({userId:req.user?._id,userName:req.user?.name,action,module,entityName,recordId:String(recordId||''),oldValue:JSON.stringify(oldValue||''),newValue:JSON.stringify(newValue||''),details,result,ipAddress:req.ip}); }
 catch(e){ console.error('Audit write failed:',e.message); }
}
