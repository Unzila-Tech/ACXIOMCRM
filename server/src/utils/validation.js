export const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||''));
export const phoneOk = v => /^\+?[0-9]{10,15}$/.test(String(v||'').replace(/[\s-]/g,''));
export const isPastDay = d => new Date(d).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
export function validateCustomer(b){
 const errors=[];
 if(!b.customerName?.trim()) errors.push('Customer Name is required.');
 if(b.customerName?.length>100) errors.push('Customer Name must be at most 100 characters.');
 if(!emailOk(b.email)) errors.push('Enter a valid email address.');
 if(!phoneOk(b.phone)) errors.push('Enter a valid phone number.');
 return errors;
}
