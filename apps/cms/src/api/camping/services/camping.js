'use strict';

/**
 * camping service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::camping.camping');
