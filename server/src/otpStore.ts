import mongoose, { Schema, Document } from 'mongoose';
import { connectToDb } from './db.js';

export interface OTPDocument extends Document {
    email: string;
    code: string;
    expiry: number;
}

const OTPSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true },
    expiry: { type: Number, required: true, index: true } // TTL index for auto-deletion
});

// Create TTL index to automatically delete expired OTPs
OTPSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

const OTPModel = mongoose.model<OTPDocument>('OTP', OTPSchema);

export const otpStore = {
    async set(email: string, code: string, expiry: number): Promise<void> {
        await connectToDb();
        await OTPModel.findOneAndUpdate(
            { email },
            { email, code, expiry: new Date(expiry) },
            { upsert: true, new: true }
        );
    },

    async get(email: string): Promise<{ code: string; expiry: number } | null> {
        await connectToDb();
        const otp = await OTPModel.findOne({ email });
        if (!otp) return null;

        const expiryTimestamp = new Date(otp.expiry).getTime();
        if (expiryTimestamp < Date.now()) {
            await this.delete(email);
            return null;
        }

        return {
            code: otp.code,
            expiry: expiryTimestamp
        };
    },

    async delete(email: string): Promise<void> {
        await connectToDb();
        await OTPModel.deleteOne({ email });
    }
};
