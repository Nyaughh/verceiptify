import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { startOfDay } from 'date-fns'

export const skindleRouter = createTRPCRouter({
    getBundles: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.bundle.findMany({
            include: {
                skins: {
                    include: {
                        levels: true
                    }
                }
            }
        })
    }),

    getBundle: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
        return ctx.db.bundle.findUnique({
            where: { slug: input.slug },
            include: {
                skins: {
                    include: {
                        levels: true
                    }
                }
            }
        })
    }),

    getSkins: publicProcedure.input(z.object({ bundleSlug: z.string() })).query(async ({ ctx, input }) => {
        const bundle = await ctx.db.bundle.findUnique({
            where: { slug: input.bundleSlug },
            include: { skins: { include: { levels: true } } }
        })
        return bundle?.skins || []
    }),

    getDailyBundle: publicProcedure
        .input(z.object({ date: z.string() }))
        .query(async ({ ctx, input }) => {
            const date = startOfDay(new Date(input.date))
            const bundlesCount = await ctx.db.bundle.count()
            const randomIndex = Math.floor((date.getTime() / 86400000) % bundlesCount)

            const bundle = await ctx.db.bundle.findFirst({
                skip: randomIndex,
                include: {
                    skins: {
                        select: {
                            displayName: true,
                            levels: {
                                select: {
                                    streamedVideo: true
                                }
                            }
                        }
                    }
                }
            })

            // Flatten the video URLs
            const videoUrls = bundle?.skins.flatMap(skin => 
                skin.levels.map(level => level.streamedVideo).filter(Boolean)
            ) || []

            return {
                ...bundle,
                videoUrls
            }
        }),

    getAllBundles: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.bundle.findMany({
            select: {
                id: true,
                displayName: true
            }
        })
    }),

    getWeapons: publicProcedure.query(async () => {
        const response = await fetch('https://valorant-api.com/v1/weapons')
        const data = await response.json()
        return data.data.map((weapon: any) => ({
            displayName: weapon.displayName,
            uuid: weapon.uuid
        }))
    }),

    getBundleTiers: publicProcedure.query(async () => {
        const response = await fetch('https://valorant-api.com/v1/contenttiers')
        const data = await response.json()
        return data.data.map((tier: any) => ({
            devName: tier.devName,
            uuid: tier.uuid,
            displayIcon: tier.displayIcon
        }))
    }),
})
