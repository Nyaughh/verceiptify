import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { format } from 'date-fns'

export const mapRouter = createTRPCRouter({
    createMap: protectedProcedure
        .input(
            z.object({
                name: z.string(),
                imageUrl: z.string().url(),
                splashUrl: z.string().url().optional()
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.map.create({
                data: input
            })
        }),

    addLocation: protectedProcedure
        .input(
            z.object({
                mapId: z.string(),
                name: z.string(),
                imageUrl: z.string().url(),
                xCoord: z.number(),
                yCoord: z.number()
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.location.create({
                data: input
            })
        }),

    getMaps: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.map.findMany({
            orderBy: { name: 'asc' },
            include: { locations: true }
        })
    }),

    getMap: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        return ctx.db.map.findUnique({
            where: { id: input.id },
            include: { locations: true }
        })
    }),

    updateMap: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string(),
                imageUrl: z.string().url(),
                splashUrl: z.string().url().optional()
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...updateData } = input
            return ctx.db.map.update({
                where: { id },
                data: updateData
            })
        }),

    deleteMap: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        await ctx.db.location.deleteMany({
            where: { mapId: input.id }
        })

        await ctx.db.mapdleAnswer.deleteMany({
            where: { mapId: input.id }
        })

        return ctx.db.map.delete({
            where: { id: input.id }
        })
    }),

    updateLocation: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string(),
                imageUrl: z.string().url(),
                xCoord: z.number().int(),
                yCoord: z.number().int()
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.location.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    imageUrl: input.imageUrl,
                    xCoord: input.xCoord,
                    yCoord: input.yCoord
                }
            })
        }),

    deleteLocation: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        // Delete associated MapdleAnswers first
        await ctx.db.mapdleAnswer.deleteMany({
            where: { locationId: input.id }
        })

        // Then delete the location
        return ctx.db.location.delete({
            where: { id: input.id }
        })
    }),

    createLocation: protectedProcedure
        .input(
            z.object({
                mapId: z.string(),
                name: z.string(),
                imageUrl: z.string().url(),
                xCoord: z.number(),
                yCoord: z.number()
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.location.create({
                data: input
            })
        }),

    createAnswer: protectedProcedure
        .input(
            z.object({
                mapId: z.string(),
                locationId: z.string(),
                date: z.string()
            })
        )
        .mutation(async ({ ctx, input }) => {
            const answer = await ctx.db.mapdleAnswer.create({
                data: {
                    date: input.date,
                    mapId: input.mapId,
                    locationId: input.locationId
                }
            })

            return answer
        }),

    getAnswers: publicProcedure
        .input(
            z.object({
                page: z.number().int().positive().default(1),
                limit: z.number().int().positive().max(100).default(20),
                mapId: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional()
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, limit, mapId, startDate, endDate } = input
            const skip = (page - 1) * limit

            const where: any = {}
            if (mapId) where.mapId = mapId
            if (startDate) where.date = { gte: startDate }
            if (endDate) where.date = { ...where.date, lte: endDate }

            const [answers, total] = await Promise.all([
                ctx.db.mapdleAnswer.findMany({
                    where,
                    include: {
                        map: true,
                        location: true
                    },
                    orderBy: {
                        date: 'desc'
                    },
                    skip,
                    take: limit
                }),
                ctx.db.mapdleAnswer.count({ where })
            ])

            return {
                answers,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            }
        }),

    getAnswerForDate: publicProcedure.query(async ({ ctx }) => {
        const today = format(new Date(), 'dd/MM/yyyy')
        return ctx.db.mapdleAnswer.findUnique({
            where: {
                date: today
            },
            include: {
                map: true,
                location: true
            }
        })
    }),

    getLocations: publicProcedure.input(z.object({ mapId: z.string() })).query(async ({ ctx, input }) => {
        return ctx.db.location.findMany({
            where: { mapId: input.mapId }
        })
    }),

    deleteAnswer: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        return ctx.db.mapdleAnswer.delete({
            where: { id: input.id }
        })
    })
})
