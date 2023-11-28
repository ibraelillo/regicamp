const gen = require('@genql/cli')
const { resolve } = require('path')

const config = {
    endpoint: process.env.API_URL,
    token: process.env.API_TOKEN,
    dev: process.env.NODE_ENV === 'development'
}

console.log(JSON.stringify(config, null, 2))

const run = async () => {

    if (!config.endpoint) throw new Error('Endpoint is not fulfilled')

    if (!config.token) throw new Error('Token not fulfilled')

    await gen.generate({
        endpoint: config.endpoint,
        headers: {
            Authorization: `Bearer ${config.token}`
        },
        output: resolve(__dirname, '..', 'dist')
    })


    console.log('☑ Generation completed')
}

module.exports = { run }

if (!config.dev)
    run()