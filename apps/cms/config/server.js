module.exports = ({ env }) => {

  const prod = env('NODE_ENV') === 'production'

  return ({
    host: env('STRAPI_HOST', '0.0.0.0'),
    port: env.int('STRAPI_PORT', 1337),
    app: {
      keys: env.array('APP_KEYS'),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
    ...(prod ? {
      url: env('STRAPI_ADMIN_BACKEND_URL', ''),
      admin: {
        serverAdminPanel: false,
        url: '/admin'
      }
    } : {})

  })
};
