import { SSTConfig } from "sst";
import { CMS } from "./iac/CMS";

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

        app.stack(CMS)
    },

} satisfies SSTConfig

export default config