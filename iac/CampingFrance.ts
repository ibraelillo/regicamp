import { NextjsSite, StackContext, use } from "sst/constructs";
import { isProduction, keys } from "./utils";
import { Main } from "./Main";

export const CampingFrance = ({ stack, app }: StackContext) => {

    //const {api, uploads} = use(CMS)

    const site = new NextjsSite(stack, 'campingfrance-site', {
        path: 'apps/campingfrance',
        experimental: {
            streaming: true,
        },
        edge: isProduction(stack.stage),
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
            //API_URL: api.loadBalancer.loadBalancerDnsName,
            ...keys
        },
        dev: {
            deploy: true
        },
        invalidation: {
            wait: isProduction(stack.stage)
        },
        runtime: 'nodejs18.x',
        imageOptimization: { memorySize: 512 },
        logging: 'combined',
        //bind: [uploads]
    })

    stack.addOutputs({
        site: site.customDomainUrl || site.url
    })

    return {
        site
    }
}