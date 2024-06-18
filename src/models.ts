import mongoose, { Schema, Document } from 'mongoose';

interface IVotes extends Document {
  contestant: string,
  voter: string,
  createdAt: Date;
  isActive: boolean;
}

const votesSchema: Schema = new Schema({
  contestant: { type: String, required: true },
  voter: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export const Votes = mongoose.model<IVotes>('Votes', votesSchema);
