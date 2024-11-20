import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { format } from 'date-fns'

export const vctleRouter = createTRPCRouter({
    getAllPlayers: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.vCTPlayer.findMany({
            include: {
                team: true
            }
        })
    }),

    getDailyPlayer: publicProcedure.query(async ({ ctx }) => {
        const today = format(new Date(), 'dd/MM/yyyy')
        const answer = await ctx.db.vCTLEAnswer.findUnique({
            where: { date: today },
            include: {
                player: {
                    include: {
                        team: true
                    }
                }
            }
        })
        return answer?.player
    }),

    createAnswer: protectedProcedure
        .input(
            z.object({
                playerId: z.string(),
                date: z.string()
            })
        )
        .mutation(async ({ ctx, input }) => {
            const answer = await ctx.db.vCTLEAnswer.create({
                data: {
                    date: input.date,
                    playerId: input.playerId
                }
            })

            return answer
        }),

    getAnswers: publicProcedure
        .input(
            z.object({
                page: z.number().int().positive().default(1),
                limit: z.number().int().positive().max(100).default(20),
                startDate: z.string().optional(),
                endDate: z.string().optional()
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, limit, startDate, endDate } = input
            const skip = (page - 1) * limit

            const where: any = {}
            if (startDate) where.date = { gte: startDate }
            if (endDate) where.date = { ...where.date, lte: endDate }

            const [answers, total] = await Promise.all([
                ctx.db.vCTLEAnswer.findMany({
                    where,
                    include: {
                        player: {
                            include: {
                                team: true
                            }
                        }
                    },
                    orderBy: {
                        date: 'desc'
                    },
                    skip,
                    take: limit
                }),
                ctx.db.vCTLEAnswer.count({ where })
            ])

            return {
                answers,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            }
        }),

    deleteAnswer: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        return ctx.db.vCTLEAnswer.delete({
            where: { id: input.id }
        })
    }),

    updateUserStats: protectedProcedure
        .input(
            z.object({
                gamesPlayed: z.number(),
                gamesWon: z.number()
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { gamesPlayed, gamesWon } = input
            const userId = ctx.userId

            const currentStats = await ctx.db.vCTLEUserStats.findUnique({
                where: { userId }
            })

            if (currentStats) {
                return ctx.db.vCTLEUserStats.update({
                    where: { userId },
                    data: {
                        gamesPlayed: currentStats.gamesPlayed + gamesPlayed,
                        gamesWon: currentStats.gamesWon + gamesWon,
                        currentStreak: gamesWon > 0 ? currentStats.currentStreak + 1 : 0,
                        maxStreak: Math.max(currentStats.maxStreak, gamesWon > 0 ? currentStats.currentStreak + 1 : 0)
                    }
                })
            } else {
                return ctx.db.vCTLEUserStats.create({
                    data: {
                        userId,
                        gamesPlayed,
                        gamesWon,
                        currentStreak: gamesWon,
                        maxStreak: gamesWon
                    }
                })
            }
        })
})
