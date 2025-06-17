// src/lib/mongoose.ts
import models from '../models'
import mongoose, { FilterQuery, Model, PopulateOptions } from 'mongoose'

const MONGODB_URI = process.env['MONGO_URL']

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  )
}

(global as any).models = models

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function connectMongoDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}


export function mongooseProxy<T extends object> (target: T) {
  return new Proxy(
    target,
    {
      get (target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver)
        if (typeof original === 'function') {
          return async (...args: any[]) => {
            await connectMongoDB()
            return original.apply(target, args)
          }
        }

        return original
      }
    }
  )
}

interface QueryPageParams<T> {
  model: Model<T>
  page: PageParams
  filter?: FilterQuery<T>
  sort?: any
  populate?: string | string[] | PopulateOptions | PopulateOptions[]
}
export async function queryPage<T> (
  {
    model,
    page,
    filter,
    sort,
    populate,
  }: QueryPageParams<T>
) {

  const total = await model.countDocuments(filter).exec()
  const result: PageResult<T> = {
    success: true,
    total,
    current: page.current,
    pageSize: page.pageSize,
    data: undefined
  }

  if (!total) {
    return result
  }

  const query = (
    filter
    ? model.find(filter)
    : model.find()
  )
  if (sort) {
    query.sort(sort)
  }

  const skip = (page.current - 1) * page.pageSize

  query.skip(skip).limit(page.pageSize)

  if (populate) {
    query.populate(populate as any)
  }

  result.data = (await query.lean() as unknown as T[])

  return result
}
