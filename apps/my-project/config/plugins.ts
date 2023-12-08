export default {
    graphql: {
        enabled: true,
        endpoint: '/api/graphql',
        shadowCRUD: true,
        playgroundAlways: false,
        depthLimit: 7,
        amountLimit: 100,
        apolloServer: {
            tracing: false,
        },
    },
    'google-maps': {
        enabled: true,
    },
    // ...
    // 'regicamp': {
    //     enabled: true,
    //     resolve: './src/plugins/regicamp'
    // },
    // ...
}
