import { SSTConfig } from "sst";

const config = {
    config: () => ({
        name: 'regicamp',
        region: process.env.AWS_REGION || 'eu-west-3'
    }),
    async stacks(app) {

    },
} satisfies SSTConfig

export default config