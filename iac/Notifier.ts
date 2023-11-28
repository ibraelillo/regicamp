import { Function, Queue, StackContext, Topic } from "sst/constructs";


export const Notifier = ({ app, stack }: StackContext) => {

    // this function will update algolia with the latest content published
    const indexer = new Function(stack, 'indexer', {
        handler: 'packages/functions/src/indexer.handler',
        runtime: 'nodejs18.x'
    })

    // this function will warm up ther page and invalidate cache 
    const warmer = new Function(stack, 'indexer', {
        handler: 'packages/functions/src/warmer.handler',
        runtime: 'nodejs18.x'
    })

    const topic = new Topic(stack, "Topic", {
        cdk: {
            topic: {
                topicName: 'content_update'
            }
        },
        subscribers: {
            indexer,
            warmer,
        },
    });

    stack.addOutputs({
        topic: topic.topicArn
    })


    return {
        topic,
        indexer,
        warmer
    }
}