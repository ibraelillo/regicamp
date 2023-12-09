import { Table, Api, Bucket, BucketProps, Function, RDS, StaticSite, toCdkDuration, Config, attachPermissionsToRole, Stack, StaticSiteProps, StaticSiteCdkDistributionProps, NextjsSite, NextjsSiteProps, Topic } from 'sst/constructs'
import { StackContext, use } from "sst/constructs";
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { RemovalPolicy, Fn, SymlinkFollowMode, Arn, Token, AssetHashType } from 'aws-cdk-lib'
import * as rds from 'aws-cdk-lib/aws-rds'
import { Vpc, SecurityGroup, Port } from 'aws-cdk-lib/aws-ec2';
import { isProduction, keys, } from './utils'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import { exec, execSync } from 'child_process';
import { mkdirSync, mkdtempSync, readdirSync } from 'fs';
import * as os from 'node:os'
import * as path from 'node:path'
import * as apprunner from '@aws-cdk/aws-apprunner-alpha'
import { CfnObservabilityConfiguration, } from 'aws-cdk-lib/aws-apprunner'
import * as assets from 'aws-cdk-lib/aws-ecr-assets';



/**
 * DEploy cms stack
 * 
 * @param param0 
 * @returns 
 */
export const Main = async ({ stack, app }: StackContext) => {

    const port = 5432
    const databaseName = `cms_${stack.stage}`
    const appPath = 'apps/my-project'

    const prod = isProduction(stack.stage)

    const { admin, vpc, cmsKeys, credentials, db, dbGroup, dbPort, lambdaGroup } = createConfig({
        stack,
        databaseName,
        port
    })

    const { proxy, cluster } = await createDatabase({
        stack,
        credentials,
        databaseName,
        groups: [dbGroup],
        vpc,
        port
    })


    const { cors, originAccessIdentity } = createBucketsConfiguration({ stack })


    // ----------------- uploads -----------------------
    const { uploads, statics, sources } = createBuckets({
        cors,
        stack,
        originAccessIdentity
    })
    // -------------- end uploads -------------------


    // -------------- layer -------------------------
    // const { layer } = await createServerLayer({
    //     stack,
    //     cmsPath: 'apps/cms',
    //     layerDescription: 'Layer containing strapi packages and database drivers',
    //     layerName: 'strapi-' + stack.account
    // })
    // ------------- end layer --------------------------


    // ------------- cms lambda -------------------------

    const requiredDeps = [
        'pg',
        'lodash',
        '@aws-sdk/client-secrets-manager',
        '@strapi/strapi'
    ]

    const external = [
        'pg',
        'mysql',
        'tedious',
        'mysql2',
        'oracledb',
        'sqlite3',
        'redis',
        'sequelize',
        'mongoose',
        'react',
        'react-dom',
        'graphql',
        'esbuild'
    ]

    const { api } = createBackofficeService({
        stack,
        appPath,
        vpc,
        securityGroups: [dbGroup, lambdaGroup],
        environment: {
            PORT: '8080',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
            NODE_OPTIONS: "--enable-source-maps",
            DATABASE_CLIENT: 'postgres',
            DATABASE_HOST: proxy.endpoint,
            DATABASE_PORT: port.toString(),
            DATABASE_NAME: databaseName,
            DATABASE_USERNAME: credentials.username!,
            //DATABASE_PASSWORD: credentials.secret?.secretValueFromJson('password').toString()!,
            REGION: stack.region,
            STRAPI_DISABLE_EE: '1',
            AUDIT_LOGS_ENABLED: '1',
            WEBHOOKS_POPULATE_RELATIONS: '1',
            STRAPI_TELEMETRY_DISABLED: '0',
            INIT_ADMIN: '1',
            DIST_DIR: 'dist',
            ...keys
        }
    })

    api.node.addDependency(cluster)
    api.node.addDependency(proxy)

    credentials.secret?.grantRead(api);

    api.addSecret('DATABASE_PASSWORD', apprunner.Secret.fromSecretsManager(
        cluster.secret!,
        'password'
    ))

    // allow cms to upload files to the bucket
    uploads.cdk.bucket.grantReadWrite(api)

    // const cms = new Function(stack, 'CMS-Server', {
    //     handler: appPath, //`${appPath}/lambda.handler`,
    //     runtime: 'container',
    //     container: {
    //         file: 'Dockerfile'
    //     },
    //     securityGroups: [lambdaGroup],
    //     vpc,
    //     // layers: [layer],
    //     permissions: [uploads],
    //     memorySize: '1 GB',
    //     tracing: 'active',
    //     //runtimeManagementMode: lambda.RuntimeManagementMode.AUTO,
    //     environment: {
    //         AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
    //         NODE_OPTIONS: "--enable-source-maps",
    //         DATABASE_CLIENT: 'postgres',
    //         DATABASE_HOST: proxy.endpoint,
    //         DATABASE_PORT: port.toString(),
    //         DATABASE_NAME: db.value,
    //         DATABASE_USERNAME: credentials.username!,
    //         DATABASE_PASSWORD: credentials.secret?.secretValueFromJson('password').toString()!,
    //         REGION: stack.region,
    //         STRAPI_DISABLE_EE: '1',
    //         AUDIT_LOGS_ENABLED: '1',
    //         WEBHOOKS_POPULATE_RELATIONS: '1',
    //         STRAPI_TELEMETRY_DISABLED: '0',
    //         INIT_ADMIN: '1',
    //         DIST_DIR: 'dist',
    //         ...keys
    //     },
    //     bind: [uploads, admin],
    //     //copyFiles: ['dist/src', 'dist/config', 'package.json'].map(folder => ({ from: `${appPath}/${folder}` })),
    //     url: true,
    //     // hooks: {

    //     //     afterBuild: async (props, out) => {
    //     //         console.log(
    //     //             'hello'
    //     //         )

    //     //         // execSync(`pnpm install --ignore-workspace --ignore-scripts --production --no-optional ${requiredDeps.join(' ')}`, {
    //     //         //     cwd: out,
    //     //         //     stdio: 'inherit'
    //     //         // })

    //     //         // execSync(`pnpm prune --ignore-workspace --prod --no-optional`, {
    //     //         //     cwd: out,
    //     //         //     stdio: 'inherit'
    //     //         // })
    //     //     }
    //     // },

    //     // nodejs: {
    //     //     sourcemap: true,
    //     //     splitting: false,
    //     //     minify: false,
    //     //     format: 'cjs',
    //     //     install: ['@strapi/strapi', '@strapi/plugin-i18n', '@strapi/plugin-graphql'],
    //     //     esbuild: {
    //     //         //bundle: false,
    //     //         platform: 'node',
    //     //         external,
    //     //         treeShaking: true,
    //     //         legalComments: 'none',


    //     //         // alias: {
    //     //         //     'lodash': 'lodash-es'
    //     //         // },
    //     //         // plugins: [
    //     //         //     lodashTransformer({
    //     //         //         outLodashPackage: 'lodash-es'
    //     //         //     })
    //     //         // ]
    //     //     }
    //     // }
    // })

    proxy.grantConnect(api)
    // -------------- end cms lambda ----------------

    // -------------- backoffice --------------------
    const { backoffice } = createBackofficeSite({
        stack,
        cmsPath: appPath,
        env: {
            ...keys
        },
        api,
        statics,
        sources,
    })
    // ------------- end backoffice -----------------

    stack.addOutputs({
        adminUrl: backoffice.customDomainUrl || backoffice.url,
        apiUrl: api.serviceUrl!,
        bucket: statics.bucketName,
        uploads: uploads.bucketName
    })

    return {
        uploads,
        backoffice,
        api
    }
}

type CreateAsyncPlugQueue = {
    stack: Stack
}

const createAsyncPlugQueue = ({ stack }: CreateAsyncPlugQueue) => {

    const indexer = new Function(stack, 'indexer', {
        handler: 'packages/functions/src/indexer.handler'
    })


    const warmer = new Function(stack, 'warmer', {
        handler: 'packages/functions/src/warmer.handler'
    })

    const topic = new Topic(stack, 'cms-updates', {
        subscribers: {
            indexer,
            warmer
        }
    })

    return {
        topic,
        warmer,
        indexer
    }

}



type CreateFrontendSite = {
    stack: Stack,
    prod: boolean,
    env: NextjsSiteProps['environment']
}

/**
 * Create frontend site
 * 
 * @param param0 
 * @returns 
 */
const createFrontendSite = ({ stack, prod, env }: CreateFrontendSite) => {

    const table = new Table(stack, 'frontdb', {
        primaryIndex: { partitionKey: 'id', sortKey: 'type' }
    })

    const site = new NextjsSite(stack, 'campingfrance', {
        bind: [table],
        permissions: [table],
        edge: prod,
        warm: prod ? 10 : 1,
        logging: 'per-route',
        path: 'apps/campingfrance',
        environment: {
            ...env,
            Table: table.tableName
        },
        experimental: {
            streaming: true,
        },
        invalidation: {
            wait: prod
        }
    })

    return {
        site,
        table
    }
}



type CreateBackendSite = {
    stack: Stack,
    cmsPath: string,
    env: StaticSiteProps['environment'],
    distribution?: StaticSiteCdkDistributionProps,
    statics: Bucket,
    sources: {
        site: origins.S3Origin,
        uploads: origins.S3Origin,
    }
    api: apprunner.Service
}

/**
 * 
 * Create backoffice static site
 * 
 * @param param0 
 * @returns 
 */
const createBackofficeSite = ({ stack, cmsPath, env, api, statics, sources }: CreateBackendSite) => {

    const apiOriginUrl = Fn.parseDomainName(api.serviceUrl!)

    const apiOrigin = new origins.HttpOrigin(apiOriginUrl, {
        originId: 'lambda',
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY
    })


    const backoffice = new StaticSite(stack, 'backoffice-frontend', {
        cdk: {
            // bucket: statics,
            distribution: {
                priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
                httpVersion: cloudfront.HttpVersion.HTTP3,
                comment: 'Distribution for cms backoffice',
                defaultRootObject: 'index.html',
                sslSupportMethod: cloudfront.SSLMethod.SNI,
                minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.SSL_V3,
                additionalBehaviors: {
                    "/api/*": {
                        origin: apiOrigin,
                        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        compress: true,
                    },
                    '/uploads/*': {
                        origin: sources.uploads,
                        compress: true,
                        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        allowedMethods:
                            cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS
                    }
                }
            }
        },
        path: cmsPath,
        environment: env,
        buildCommand: 'pnpm run build',
        buildOutput: 'dist/build',
        replaceValues: [
            {
                files: '*.js',
                search: '{{ADMIN_PATH}}',
                replace: '',
            },
            {
                files: '*.js',
                search: '{{STRAPI_ADMIN_BACKEND_URL}}',
                replace: ''
            },
            {
                files: '*.js',
                search: '{{PUBLIC_ADMIN_URL}}',
                replace: ''
            }
        ]
    })



    return { backoffice }
}


type CreateBackofficeService = {
    stack: Stack,
    appPath: string
    environment: Record<string, string>,
    vpc: Vpc,
    securityGroups: SecurityGroup[]
}

/**
 * 
 * @param param0 
 */
const createBackofficeService = ({ stack, environment, appPath, vpc, securityGroups }: CreateBackofficeService) => {

    const imageAsset = new assets.DockerImageAsset(stack, 'ImageAssets', {
        directory: appPath,
    });

    const api = new apprunner.Service(stack, 'cms', {
        source: apprunner.Source.fromAsset({
            asset: imageAsset,
            imageConfiguration: {
                port: 80,
                environmentVariables: environment,
            }
        }),
        vpcConnector: new apprunner.VpcConnector(stack, 'connector', {
            vpc,
            securityGroups,
            vpcConnectorName: 'cms-connect-db-aurora-' + stack.stage
        }),
        serviceName: 'backend-' + stack.stage,
        autoDeploymentsEnabled: true,
        healthCheck: apprunner.HealthCheck.http({
            healthyThreshold: 2,
            interval: toCdkDuration('10 seconds'),
            path: '/_health',
            timeout: toCdkDuration('10 seconds'),
            unhealthyThreshold: 2,
        }),
        memory: apprunner.Memory.ONE_GB,
        cpu: apprunner.Cpu.HALF_VCPU,
    })

    api.applyRemovalPolicy(RemovalPolicy.DESTROY)

    const observer = new CfnObservabilityConfiguration(stack, 'ob', {
        observabilityConfigurationName: 'xray-tracing',
        traceConfiguration: {
            vendor: 'AWSXRAY'
        }
    })

    


    return { api }

}

type CreateServerLayer = {
    stack: Stack,
    cmsPath: string,
    layerName: string,
    layerDescription: string
}

/**
 * Create layer with all the packages from node_modules folder from cms
 * 
 * 
 * @param param0 
 * @returns 
 */
const createServerLayer = async ({ stack, cmsPath, layerDescription, layerName }: CreateServerLayer) => {
    const tmpdir = mkdtempSync(path.join(os.tmpdir(), 'apps_cms'))

    const zipPath = path.join(tmpdir, 'nodejs')

    console.log(`=> Creating temp folder for layer at %s`, zipPath)

    mkdirSync(path.join(zipPath, 'node_modules'), { recursive: true })

    const requiredDeps = [
        /*...Object.keys(dependencies).filter(dep => /strapi/.test(dep)), 'lodash',*/
        'pg',
        'graphql',
        'lodash',
        '@strapi/strapi',
        '@strapi/plugin-i18n',
        '@strapi/plugin-graphql'
    ]

    const installCommand = `pnpm install ${requiredDeps.join(' ')}`
    const pruneCommand = `pnpm prune --prod --no-optional`

    console.log('=> Installing modules on layer %s', requiredDeps.join(' '))
    console.log('=> %s', installCommand)
    execSync(installCommand, {
        cwd: zipPath,
        env: process.env,
        stdio: 'inherit'
    })

    console.log('=> Pruning modules on layer')
    console.log('=> %s', pruneCommand)
    execSync(pruneCommand, {
        cwd: zipPath,
        env: process.env,
        stdio: 'inherit'
    })

    execSync(`du -sh`, {
        cwd: zipPath,
        env: process.env,
        stdio: 'inherit'
    })

    const code = lambda.Code.fromAsset(path.dirname(zipPath))

    const layer = new lambda.LayerVersion(stack, 'layer-cms-server', {
        code,
        compatibleRuntimes: [lambda.Runtime.NODEJS_18_X, lambda.Runtime.NODEJS_16_X],
        compatibleArchitectures: [lambda.Architecture.X86_64, lambda.Architecture.ARM_64],
        layerVersionName: layerName,
        description: layerDescription,
        removalPolicy: RemovalPolicy.DESTROY
    })

    stack.addOutputs({
        layerArn: layer.layerVersionArn,
        code: code.path,
    })

    return { layer }
}


type CreateUploadsBucket = {
    stack: Stack,
    cors: BucketProps['cors']
    originAccessIdentity: cloudfront.OriginAccessIdentity
}
/**
 * Create bucket for uploads
 * 
 * @param param0 
 * @returns 
 */
const createBuckets = ({ cors, originAccessIdentity, stack }: CreateUploadsBucket) => {
    // uploads bucket
    const uploads = new Bucket(stack, 'uploads', {
        cdk: {
            bucket: {
                //bucketName: `regicamp-uploads-${stack.stage}-${stack.stackId}`,
                removalPolicy: isProduction(stack.stage) ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
                publicReadAccess: false,
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
            }
        },
        cors
    })

    const statics = new Bucket(stack, 'statics', {
        cdk: {
            bucket: {
                //bucketName: `regicamp-statics-${stack.stage}-${stack.stackId}`,
                removalPolicy: isProduction(stack.stage) ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
                publicReadAccess: false,
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
            }
        },
        cors
    })

    uploads.cdk.bucket.grantRead(originAccessIdentity)

    const sources = {
        uploads: new origins.S3Origin(uploads.cdk.bucket, {
            originId: 'uploads',
            originAccessIdentity
        }),
        site: new origins.S3Origin(statics.cdk.bucket, {
            originId: 'statics',
            originAccessIdentity,
        })
    }

    return { uploads, statics, sources }
}



type CreateBucketsConfiguration = {
    stack: Stack
}

/**
 * Create buckets configuration
 * 
 * @param param0 
 * @returns 
 */
const createBucketsConfiguration = ({ stack }: CreateBucketsConfiguration) => {

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
        stack,
        "cloudfrontOAI",
        {
            comment: `Allows CloudFront access to S3 bucket`,
        }
    );

    const cors: BucketProps['cors'] = [
        {
            allowedOrigins: ["*"],
            allowedMethods: [s3.HttpMethods.GET],
            maxAge: `365 days`,
        },
    ]

    return {
        cors,
        originAccessIdentity
    }

}



type CreateConfigParams = {
    databaseName: string,
    port: number,
    stack: Stack
}

/**
 * Create all configuration values
 * 
 * @param param0 
 * @returns 
 */
const createConfig = ({ stack, databaseName, port }: CreateConfigParams) => {

    // @see https://market.strapi.io/plugins/strapi-plugin-init-admin-user
    const admin = new Config.Secret(stack, 'ADMIN')

    const cmsKeys = new Config.Parameter(stack, 'CMS_Keys', {
        value: JSON.stringify(keys)
    })

    const credentials = rds.Credentials.fromGeneratedSecret('strapi', {
        secretName: 'strapi-cms-db-secret-' + stack.stage,
    })

    const db = new Config.Parameter(stack, 'DB_NAME', {
        value: databaseName
    })

    const dbPort = new Config.Parameter(stack, 'DB_PORT', {
        value: port.toString()
    })

    const vpc = new Vpc(stack, 'vpc-db', {
        vpcName: `vpc-db-cms-${stack.stage}`,
    })


    const dbGroup = new SecurityGroup(stack, 'Proxy to DB Connection', {
        vpc,
        allowAllOutbound: true,
        description: 'Security group for proxy rds'
    });

    const lambdaGroup = new SecurityGroup(stack, 'CMS-SecurityGroup', {
        vpc,
        description: 'Security group for lambda server',
        securityGroupName: 'cms-server-group'
    })

    dbGroup.addIngressRule(lambdaGroup, Port.tcp(port), 'Allow connection from lambda group')

    return {
        admin,
        cmsKeys,
        credentials,
        db,
        dbPort,
        dbGroup,
        lambdaGroup,
        vpc
    }

}


type CreateDatabaseParams = {
    stack: Stack
    credentials: rds.Credentials,
    groups: SecurityGroup[],
    port?: number,
    vpc: Vpc,
    databaseName: string
}

/**
 * Create the database
 * 
 * @param param0 
 */
const createDatabase = async ({ credentials, groups, port, stack, databaseName, vpc }: CreateDatabaseParams) => {

    const writer = rds.ClusterInstance.serverlessV2('writer', {
        autoMinorVersionUpgrade: true,
        allowMajorVersionUpgrade: true
    });

    const reader = rds.ClusterInstance.serverlessV2('reader1', {
        scaleWithWriter: true,
        autoMinorVersionUpgrade: true,
        allowMajorVersionUpgrade: true,
    })

    let clusterProps: rds.DatabaseClusterProps = {
        removalPolicy: isProduction(stack.stage) ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_15_3 }),
        port: port,
        deletionProtection: isProduction(stack.stage),


        // capacity applies to all serverless instances in the cluster
        serverlessV2MaxCapacity: 1,
        serverlessV2MinCapacity: 0.5,
        credentials,
        writer,
        vpc,
        securityGroups: groups,
        defaultDatabaseName: databaseName,
        readers: [
            // puts it in promition tier 0-1
            reader,

        ]
    }

    if (isProduction(stack.stage)) {

        // create exports to s3
        const s3ExportBucket = new Bucket(stack, 'exports', {
            cdk: {
                bucket: {
                    removalPolicy: RemovalPolicy.RETAIN
                }
            }
        })

        // increase readers by default
        const readers = new Array(3).fill(0).map(
            (_, index) => rds.ClusterInstance.serverlessV2('reader' + (index + 1), {
                scaleWithWriter: index % 2 === 0, // scale 1,3,5,7
                autoMinorVersionUpgrade: true,
                allowMajorVersionUpgrade: true,
            })
        )

        clusterProps = {
            ...clusterProps,
            readers,
            serverlessV2MaxCapacity: 16,
            serverlessV2MinCapacity: 1,
            deletionProtection: true,
            backup: {
                retention: toCdkDuration('10 days'),
                preferredWindow: '03:00-04:00'
            },
            removalPolicy: RemovalPolicy.RETAIN,
            s3ExportBuckets: [s3ExportBucket.cdk.bucket],
        }
    }

    const cluster = new rds.DatabaseCluster(stack, 'Cluster', clusterProps);

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
        securityGroups: groups,
        dbProxyName: `rds-proxy-${stack.stage}`,
        requireTLS: false,
    });

    new cloudwatch.Metric(cluster.metricACUUtilization())
    new cloudwatch.Metric(cluster.metricServerlessDatabaseCapacity())

    stack.addOutputs({
        proxy: proxy.endpoint,
        port: port!.toString()
    })

    return {
        proxy,
        cluster
    }
}