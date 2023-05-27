import { execSync } from 'node:child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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

  it('should be able to list all meals', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Café da Manhã',
        description: 'Comi uma tapioca e tomei um copo de whey',
        isDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Café da Manhã',
        description: 'Comi uma tapioca e tomei um copo de whey',
        isDiet: 1,
      }),
    ])
  })

  it('should be able to get specific meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Café da Manhã',
        description: 'Comi uma tapioca e tomei um copo de whey',
        isDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const id = listMealsResponse.body.meals[0].id

    const getMealResponse = await request(app.server)
      .get(`/meals/${id}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Café da Manhã',
        description: 'Comi uma tapioca e tomei um copo de whey',
        isDiet: 1,
      }),
    )
  })

  it('should be able to edit meal attributes', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Café da Manhã',
        description: 'Comi uma tapioca e tomei um copo de whey',
        isDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const id = listMealsResponse.body.meals[0].id

    const updateMealResponse = await request(app.server)
      .put(`/meals/${id}`)
      .set('Cookie', cookies)
      .send({
        name: 'Lanche da Tarde',
        description: 'Comi um sorvete de chocolate com coca-cola',
        isDiet: false,
      })
      .expect(200)

    expect(updateMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Lanche da Tarde',
        description: 'Comi um sorvete de chocolate com coca-cola',
        isDiet: 0,
      }),
    )
  })

  it('should be able to delete a meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Café da Manhã',
        description: 'Comi uma tapioca e tomei um copo de whey',
        isDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    let listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const id = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${id}`)
      .set('Cookie', cookies)
      .expect(204)

    listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([])
  })

  it.only('should be able to delete a meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Café da Manhã',
        description: 'Comi uma tapioca e tomei um copo de whey',
        isDiet: true,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    const summaryResponse = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual(
      expect.objectContaining({
        totalMeals: 1,
        dietMeals: 1,
        nonDietMeals: 0,
        bestDietSequence: {
          date: expect.any(String),
          count: 1,
        },
      }),
    )
  })
})
