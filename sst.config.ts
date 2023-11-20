import { SSTConfig } from "sst";
import { CMS } from "./iac/CMS";
import { isProduction } from "./iac/utils";
import { IAM } from "./iac/Github";

const config = {
    config: (inputs) => ({
        name: 'regicamp',
        region: process.env.AWS_REGION || 'eu-west-3',
        stage: inputs.stage === 'prod' ? undefined  : 'dev'
    }),
    async stacks(app) {
        app.setDefaultFunctionProps({
            runtime: 'nodejs18.x',
            // environment: {
            //     NODE_OPTIONS: "--enable-source-maps",
            // },
            // nodejs: {
            //     sourcemap: true,
            // },
        });

        await app.stack(CMS, {
            description: 'cms stack'
        })

        if(isProduction(app.stage)) {
            await app.stack(IAM, {
                description: 'iam resources to deploy from github'
            })
        }
    },

} satisfies SSTConfig

export default config