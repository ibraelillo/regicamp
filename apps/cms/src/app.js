const serverless = require("@vendia/serverless-express");
const Strapi = require("@strapi/strapi").default;

let serve;

const startStrapi = async () => {

    console.info("Cold starting Strapi");

    let workingDir = process.cwd();

    if (process.env.LAMBDA_TASK_ROOT && process.env.IS_OFFLINE !== "true") {
        workingDir = process.env.LAMBDA_TASK_ROOT;
    }

    Strapi({ serveAdminPanel: false, appDir: workingDir });

    try {
        if (!global.strapi.isLoaded) {
            await global.strapi.load();
        }

        await global.strapi.postListen();

        await global.strapi.server.mount();


    } catch (error) {
        return global.strapi.stopWithError(error);
    }

    serve = serverless({ app: global.strapi.app, })

    return serve
};


/**
 * 
 * @param {*} event 
 * @param {*} context 
 * @returns 
 */
module.exports.strapiHandler = async (event, context) => {

    if (!serve || !global.strapi.isLoaded) {
        serve = await startStrapi();
    }

    return serve(event, context);
}