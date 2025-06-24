// src/types/common.d.ts
interface PageParams {
  current: number
  pageSize: number
}

interface SearchParams extends PageParams {
  search?: string
}

interface PageResult<T = any> {
  /** 页码数据 */
  data?: T[]
  /** 总条数 */
  total: number
  /** 当前页码 */
  current: number
  /** 每页条数 */
  pageSize: number
  success: boolean
}
