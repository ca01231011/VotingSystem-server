import mongoose, { Schema, Document } from 'mongoose';

interface IVotes extends Document {
  voter: string,
  no: number,
  type: string,
  score: number,
  lottery: string,
  createdAt: Date;
  isActive: boolean;
}
interface IStatus extends Document {
  no: number,
  status: number,
  createdAt: Date;
  isActive: boolean;
}


const votesSchema: Schema = new Schema({
  voter: { type: String, required: true },
  no: { type: Number, required: true },
  type: { type: String, required: true },
  score: { type: Number, required: true },
  lottery: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const statusSchema: Schema = new Schema({
  no: { type: Number, required: true },
  status: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export const Votes = mongoose.model<IVotes>('Votes', votesSchema);
export const Status = mongoose.model<IStatus>('Status', statusSchema);
