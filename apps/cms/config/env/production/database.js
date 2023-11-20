const Config = require('sst/node/config')

module.exports = ({ env }) => {
  
  const config= {
    connection: {
      client: 'postgres',
      ...{
        connection: {
          connectionString: env('DATABASE_URL'),
          host: Config.DB_URL,
          port: parseInt(Config.DB_PORT),
          database: Config.DB_NAME,
          user: Config.DB_USER,
          password: Config.DB_PASS,
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
        pool: { min: process.env.DATABASE_POOL_MIN || 2, max: process.env.DATABASE_POOL_MAX|| 10 },
      }
    },
    pool: { min: process.env.DATABASE_POOL_MIN || 2, max: process.env.DATABASE_POOL_MAX || 10 },
  }

  console.log(config)

  return config;
};
