import { SSTConfig } from "sst";
import { Main } from "./iac/Main";
import { isProduction } from "./iac/utils";
import { IAM } from "./iac/Github";

const config = {
    config: (inputs) => ({
        name: 'regicamp',
        region: process.env.AWS_REGION || 'eu-west-3',
        stage: inputs.stage === 'prod' ? undefined : 'dev'
    }),
    async stacks(app) {

        app.setDefaultFunctionProps({
            runtime: 'nodejs18.x',
        });

        await app.stack(Main, {
            description: 'main stack',
        })

        //await app.stack(CampingFrance, {description: 'public website' })

        if (isProduction(app.stage)) {
            await app.stack(IAM, {
                description: 'iam resources to deploy from github'
            })
        }
    },

} satisfies SSTConfig

export default config