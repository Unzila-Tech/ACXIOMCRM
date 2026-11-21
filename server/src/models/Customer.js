import mongoose from 'mongoose';
const schema = new mongoose.Schema({
    customerCode: String, customerName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true }, phone: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true, maxlength: 120 }, address: String, city: String, state: String,
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }, assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
schema.index({ email: 1 }, { unique: true }); schema.index({ phone: 1 }, { unique: true });
export default mongoose.model('Customer', schema);
