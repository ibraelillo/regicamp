import type { Knex } from 'knex';

/**
 * Migration `01_drop_bad_index`
 * @type {import('knex').Knex['migrate']['up']}
 */

export const up = async (knex: Knex) => {

  knex.schema.table('components_contracts_contrat_thematique_items_thematique_links', async (table) => {

    try {
      await table.dropIndex(
        'thematique_id'
      )
    } catch (e) {
      console.error(e)
    }
  })

};
