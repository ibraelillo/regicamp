import { describe, it } from 'vitest'
import {api} from './events'

describe('strapi starts on lambda function', () =>{

    it('initializes in cold start', async () => {

        const { handler }= await import('../src/graphql')

        const res= await handler(api.event)

        console.log(res)
    })
})