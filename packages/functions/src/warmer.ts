import { SNSHandler } from 'aws-lambda'

export const handler: SNSHandler = (evt) => {

    console.log(evt.Records[0].EventSource)

}