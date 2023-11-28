import strapiFactory from '@strapi/strapi'
import serverless from '@vendia/serverless-express'

strapiFactory({
    appDir: process.env.LAMBDA_TASK_ROOT || '.',
    distDir: process.env.DIST_DIR || undefined,
    serveAdminPanel: false,
    autoReload: false,
}).start()

let strapi = global.strapi

let serve: ReturnType<typeof serverless> = serverless({ app: strapi.app });



/**
 * 
 * @param evt 
 * @param ctx 
 * @returns 
 */
export const handler = async (evt: any, ctx: any, cb: any) => {
    return serve(evt, ctx, cb)
}