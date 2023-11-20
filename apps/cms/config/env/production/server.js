module.exports = ({ env }) => {

  return ({
    host: process.env.STRAPI_HOST || '0.0.0.0',
    port: process.env.STRAPI_PORT||1337,
    app: {
      keys: JSON.parse(process.env.APP_KEYS || '[]'),
    },
    webhooks: {
      populateRelations: true,
    },

    url: process.env.STRAPI_ADMIN_BACKEND_URL||'',
    admin: {
      serveAdminPanel: false,
      url: '/'
    },
    cron: {
      enabled: Boolean(JSON.parse(process.env.CRON_ENABLED) || false),
    },
  })
};
