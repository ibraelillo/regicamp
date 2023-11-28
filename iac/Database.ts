import { Config, StackContext } from "sst/constructs";
import * as rds from 'aws-cdk-lib/aws-rds'
import { Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { RemovalPolicy } from "aws-cdk-lib";
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import { isProduction } from "./utils";

export const Database = ({ stack }: StackContext) => {

    const credentials = rds.Credentials.fromGeneratedSecret('strapi', {
        secretName: 'strapi-cms-db-secret',
    })

    const db = new Config.Parameter(stack, 'DB_NAME', {
        value: `cms${stack.stage}`
    })

    const dbPort = new Config.Parameter(stack, 'DB_PORT', {
        value: '5432'
    })

    const vpc = new Vpc(stack, 'vpc-db', {
        vpcName: `vpc-db-cms-${stack.stage}` ,
    })


    const dbConnectionGroup = new SecurityGroup(stack, 'Proxy to DB Connection', {
        vpc,
        allowAllOutbound: true,
    });

    // tcp port
    const port = Port.tcp(parseInt(dbPort.value, 10))


    const writer = rds.ClusterInstance.serverlessV2('writer');
    const reader = rds.ClusterInstance.serverlessV2('reader1', {
        scaleWithWriter: true,
    })

    const cluster = new rds.DatabaseCluster(stack, 'Cluster', {
        removalPolicy: isProduction(stack.stage) ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_15_3 }),
        port: parseInt(dbPort.value, 10),
        // capacity applies to all serverless instances in the cluster
        serverlessV2MaxCapacity: 1,
        serverlessV2MinCapacity: 0.5,
        credentials,
        writer,
        vpc,
        securityGroups: [dbConnectionGroup],
        defaultDatabaseName: db.value,
        readers: [
            // puts it in promition tier 0-1
            reader,

        ]
    });

    // Add alarm for high CPU
    new cloudwatch.Alarm(stack, 'HighCPU', {
        metric: cluster.metricCPUUtilization(),
        threshold: 90,
        evaluationPeriods: 1,
    });

    // rds proxy
    const proxy = cluster.addProxy(stack.stage + '-proxy', {
        secrets: [cluster.secret!],
        debugLogging: true,
        vpc,
        securityGroups: [dbConnectionGroup],
        dbProxyName: `rds-proxy-${stack.stage}`,
        requireTLS: false,
    });

    stack.addOutputs({
        proxy: proxy.endpoint,
        port: port.toString()
    })

    return {
        proxy,
        credentials,
        cluster,
        dbConnectionGroup,
        vpc,
        db,
        port
    }
}