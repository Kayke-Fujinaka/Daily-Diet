// eslint-disable-next-line
import { Knex } from "knex"

declare module 'knex/types/tables' {
  export interface Tables {
    transactions: {
      id: string
      name: string
      description: string
      isDiet: boolean
      created_at: string
      session_id?: string
    }
  }
}
