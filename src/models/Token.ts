import { Schema, model, Document } from 'mongoose';

export interface IToken extends Document {
  refreshToken: string;
  user: Schema.Types.ObjectId;
}

const TokenSchema = new Schema<IToken>({
  refreshToken: {type: String, required: true},
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true},
})

export default model<IToken>('Token', TokenSchema);