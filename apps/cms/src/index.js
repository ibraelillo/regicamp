'use strict';

const Config = require('sst/node/config')

const sdk = require('aws-sdk')

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  async register({ strapi }) {
    
    if(process.env.LAMBA_TASK_ROOT && Config.DB_HOST) {
      
      const sm = new sdk.SecretsManager({
        region: process.env.REGION
      })

      const { SecretString } = await sm.getSecretValue({ SecretId: Config.DB_PASS }).promise()

      const { username, password } = JSON.parse(SecretString)

      console.log({ username, password })

      strapi.config.set('database.connection.connection.password', password)

      strapi.config.set('database.connection.connection.database', Config.DB_NAME)

      strapi.config.set('database.connection.connection.host', Config.DB_HOST)

      strapi.config.set('database.connection.connection.user', username)

      console.log(strapi.config.get('database.connection.connection'))
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {},
};
