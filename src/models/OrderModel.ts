// src/models/OrderModel.ts
import {
  prop,
  getModelForClass,
  DocumentType,
  modelOptions,
  type Ref,
  mongoose,
} from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { User } from './UserModel';
import { OurOrderState } from '../types/user'

export type OrderDocument = DocumentType<Order>;

@modelOptions({
  schemaOptions: {
    collection: 'Order',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
})
export class Order {
  public _id?: Types.ObjectId;

  @prop({ ref: () => User, required: true }) // userId 字段
  public userId!: Ref<User>;

  @prop()
  public channelCode?: string;

  @prop()
  public notifyUrl?: string;

  @prop({ required: true })
  public amount!: number;

  @prop({ required: true })
  public time!: number; // 数据库中保存的时间戳

  /**
   * 我方状态
   * * 0: 等待 (初始状态，或对应对方的 0, 1, 4, 5)
   * * 1: 成功 (对应对方的 2)
   * * 2: 失败 (对应对方的 3)
   */
  @prop({ default: OurOrderState.PENDING, required: true }) // 默认我方状态为等待 (0)
  public state!: number; // 使用我方状态枚举类型

  @prop()
  public notifyInfo?: string; // 用于记录回调或查询的通知信息

  @prop({ default: false }) // 新增字段，标记是否已增加余额
  public isBalanceAdded?: boolean;
}

export const OrderModel = mongoose.models.Order ?? getModelForClass(Order);