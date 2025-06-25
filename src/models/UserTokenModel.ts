// src/models/UserTokenModel.ts
import {
  prop,
  getModelForClass,
  DocumentType,
  modelOptions,
  type Ref, // 确保导入 Ref
  mongoose,
} from '@typegoose/typegoose';
import {
  User,
  type UserDocument // 导入 UserDocument 类型
} from './UserModel';

// ✅ 注册 User 模型，必须在使用它作为 ref 之前
// export const UserModel = mongoose.models.User ?? getModelForClass(User)

export type UserTokenDocument = DocumentType<UserToken>;

@modelOptions({
  schemaOptions: {
    collection: 'UserToken',
    timestamps: true, // 添加 timestamps 方便调试创建时间
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
})
export class UserToken {
  @prop({ required: true, unique: true }) // token 应该唯一且必须
  public token!: string;

  // 使用 Ref<User> 来表示 userId 是对 User 模型的引用
  @prop({ ref: () => User, required: true })
  public userId!: Ref<User>; // 这表示 userId 存储的是 User 的 _id

  @prop({ ref: () => 'User', foreignField: '_id', localField: 'userId' })
  public userDetail?: UserDocument

  @prop({ default: Date.now })
  public created?: Date;

  // token 过期时间，并设置 TTL 索引
  // expires: 0 表示文档创建后 expireAt 时间点自动删除
  @prop({ required: true, index: { expires: 0 } })
  public expireAt!: Date;

  // === 虚拟字段定义 ===
  // 这里你原来在 @prop() 里面写了 foreignField/localField，这是错的
  // 虚拟字段需要单独通过 schema.virtual() 来定义
  // 我们将把它移动到模型定义之后
  // public userDetail?: UserDocument; // 仅仅是 TypeScript 声明，Mongoose 不会存储
}

// export const UserTokenModel = mongoose.models.UserToken ?? getModelForClass(UserToken);
export const UserTokenModel = mongoose.models.UserToken ?? getModelForClass(UserToken, {
  options: { customName: 'UserToken' }
})

// === 虚拟字段定义 ===
// UserTokenSchema 还没有导出，所以需要在 getModelForClass 之前定义
// 因为 UserTokenModel 已经通过 mongoose.models.UserToken ?? getModelForClass(UserToken) 赋值
// 所以我们需要在 getModelForClass 之前或者获取到 Schema 实例后添加虚拟字段
// 最好的方法是在类定义后直接获取 Schema 并添加
// const UserTokenSchema = (UserTokenModel as any).schema; // 获取 Mongoose Schema 实例

// UserTokenSchema.virtual('userDetail', {
//   ref: 'User', // 引用 User 模型
//   localField: 'userId', // UserToken 的 userId 字段
//   foreignField: '_id', // User 模型的 _id 字段
//   justOne: true, // 这是一个一对一关联
// });