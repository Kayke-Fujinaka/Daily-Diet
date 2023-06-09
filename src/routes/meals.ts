import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async () => {
    const meals = await knex('meals').select()

    return { meals }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals').select().where('id', id).first()

    return { meal }
  })

  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      isDiet: z.boolean(),
    })

    const { name, description, isDiet } = createMealBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/meals',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      isDiet,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isDiet: z.boolean(),
      })

      const { name, description, isDiet } = updateMealBodySchema.parse(
        request.body,
      )

      let meal = await knex('meals')
        .update({ name, description, isDiet })
        .where('id', id)
        .returning(['id', 'name', 'description', 'isDiet', 'created_at'])

      meal = meal[0]

      return { meal }
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      await knex('meals').del().where('id', id)

      return reply.status(204).send()
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const sessionId = request.cookies.sessionId

      const totalMeals = await knex('meals')
        .count('id as count')
        .where('session_id', sessionId)
        .first()
      const dietMeals = await knex('meals')
        .count('id as count')
        .where('session_id', sessionId)
        .andWhere('isDiet', true)
        .first()
      const nonDietMeals = await knex('meals')
        .count('id as count')
        .where('session_id', sessionId)
        .andWhere('isDiet', false)
        .first()
      const bestDietSequence = await knex('meals')
        .select(
          knex.raw(
            "date(created_at, 'start of day') as date, count(id) as count",
          ),
        )
        .where('session_id', sessionId)
        .andWhere('isDiet', true)
        .groupByRaw("date(created_at, 'start of day')")
        .orderBy('count', 'desc')
        .first()

      const summary = {
        totalMeals: totalMeals?.count || 0,
        dietMeals: dietMeals?.count || 0,
        nonDietMeals: nonDietMeals?.count || 0,
        bestDietSequence: bestDietSequence || { count: 0, created_at: null },
      }

      return {
        summary,
      }
    },
  )
}
