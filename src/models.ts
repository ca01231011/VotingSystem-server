import mongoose, { Schema, Document } from 'mongoose';

interface IResult extends Document {
  name: string,
  resultId: string,
  createdAt: Date;
  isActive: boolean;
}

const resultSchema: Schema = new Schema({
  clientId: { type: String, required: true },
  name: { type: String, required: true },
  resultId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export const Result = mongoose.model<IResult>('Result', resultSchema);
