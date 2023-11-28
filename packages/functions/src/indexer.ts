import { SNSHandler } from 'aws-lambda'
import algolia from 'algoliasearch'

const client = algolia(
    process.env.APP_ID,
    process.env.API_KEY,
)

const indexes = {
    campings: client.initIndex('campings'),
    themes: client.initIndex('themes')
}

export const handler: SNSHandler = (evt) => {

    console.log(evt.Records[0].EventSource)

    evt.Records.map(rec => {

        const data = JSON.parse(rec.EventSource)

        console.log(data)

    })


}