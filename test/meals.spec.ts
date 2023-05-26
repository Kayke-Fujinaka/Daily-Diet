import { execSync } from 'node:child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { app } from '../src/app'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback -all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    await request(app.server)
      .post('/meals')
      .send({
        name: 'Café da Manhã',
        description: 'Comi uma tapioca e tomei um copo de whey',
        isDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Almoço',
        description: 'Comi um hambúrguer com uma coca-cola de 2l',
        isDiet: false,
      })
      .expect(201)
  })
})
