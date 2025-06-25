// src/models/UserModel.ts
import {
  prop,
  getModelForClass,
  DocumentType,
  modelOptions,
  mongoose,
} from '@typegoose/typegoose'

export type UserDocument = DocumentType<User>

@modelOptions({
  schemaOptions: {
    collection: 'User',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
})
export class User {

  @prop()
  public username!: string

  @prop()
  public password!: string


  @prop({ default: 0 })
  public balance!: number
}

// export const UserModel = mongoose.models.User ?? getModelForClass(User)
export const UserModel = mongoose.models.User ?? getModelForClass(User, {
  options: { customName: 'User' }
})
