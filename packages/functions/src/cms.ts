import strapiFactory from '@strapi/strapi'
import serverless from '@vendia/serverless-express'


strapiFactory({
    appDir: process.env.LAMBDA_TASK_ROOT,
    serveAdminPanel: false,
    distDir: 'build',
    autoReload: Boolean(process.env.IS_LOCAL)
})

let  strapi = global.strapi

let serve: ReturnType<typeof serverless>;



/**
 * 
 * @param evt 
 * @param ctx 
 * @returns 
 */
export const handler = async (evt: any, ctx: any) => {

    if(!strapi.isLoaded){
        await strapi.load()
        await strapi.postListen()
        await strapi.server.mount()
    }
    

    if(!serve)  {
        serve = serverless({ app: strapi.app })
    }

    return serve(evt, ctx)
}