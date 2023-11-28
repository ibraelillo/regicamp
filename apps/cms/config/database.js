const path = require('path');
//const knexDataApiClient = require('knex-aurora-data-api-client');

module.exports = ({ env }) => {
  const client = process.env.DATABASE_CLIENT || 'dev';

  const connections = {
    // mysql: {
    //   connection: {
    //     connectionString: env('DATABASE_URL'),
    //     host: env('DATABASE_HOST', 'localhost'),
    //     port: env.int('DATABASE_PORT', 3306),
    //     database: env('DATABASE_NAME', 'strapi'),
    //     user: env('DATABASE_USERNAME', 'strapi'),
    //     password: env('DATABASE_PASSWORD', 'strapi'),
    //     ssl: env.bool('DATABASE_SSL', false) && {
    //       key: env('DATABASE_SSL_KEY', undefined),
    //       cert: env('DATABASE_SSL_CERT', undefined),
    //       ca: env('DATABASE_SSL_CA', undefined),
    //       capath: env('DATABASE_SSL_CAPATH', undefined),
    //       cipher: env('DATABASE_SSL_CIPHER', undefined),
    //       rejectUnauthorized: env.bool(
    //         'DATABASE_SSL_REJECT_UNAUTHORIZED',
    //         true
    //       ),
    //     },
    //   },
    //   pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    // },
    // mysql2: {
    //   connection: {
    //     host: env('DATABASE_HOST', 'localhost'),
    //     port: env.int('DATABASE_PORT', 3306),
    //     database: env('DATABASE_NAME', 'strapi'),
    //     user: env('DATABASE_USERNAME', 'strapi'),
    //     password: env('DATABASE_PASSWORD', 'strapi'),
    //     ssl: env.bool('DATABASE_SSL', false) && {
    //       key: env('DATABASE_SSL_KEY', undefined),
    //       cert: env('DATABASE_SSL_CERT', undefined),
    //       ca: env('DATABASE_SSL_CA', undefined),
    //       capath: env('DATABASE_SSL_CAPATH', undefined),
    //       cipher: env('DATABASE_SSL_CIPHER', undefined),
    //       rejectUnauthorized: env.bool(
    //         'DATABASE_SSL_REJECT_UNAUTHORIZED',
    //         true
    //       ),
    //     },
    //   },
    //   pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    // },
    postgres: {
      client: 'postgres',
      connection: {
        connectionString: null,
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT || 5432,
        database: process.env.DATABASE_NAME || 'cms',
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        ssl: Boolean(process.env.DATABASE_SSL) && {
          key: process.env.DATABASE_SSL_KEY,
          cert: process.env.DATABASE_SSL_CERT,
          ca: process.env.DATABASE_SSL_CA,
          capath: process.env.DATABASE_SSL_CAPATH,
          cipher: process.env.DATABASE_SSL_CIPHER,
          rejectUnauthorized: Boolean(
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED
          ),
        },
        schema: process.env.DATABASE_SCHEMA || 'public',
      },
      pool: { 
        min: env.int('DATABASE_POOL_MIN', 2), 
        max: env.int('DATABASE_POOL_MAX', 100) },
        
    },
    dev: {
      client: 'sqlite',
      connection: {
        filename: path.join(
          __dirname,
          '..',
          env('DATABASE_FILENAME', '.tmp/data.db')
        ),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      // debug: true,
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
