import { Api, Bucket, BucketProps, Function, RDS, StaticSite, toCdkDuration, RDS, Config } from 'sst/constructs'
import { StackContext } from "sst/constructs/FunctionalStack";
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as assets from 'aws-cdk-lib/aws-s3-assets'
import { RemovalPolicy, Fn, SymlinkFollowMode } from 'aws-cdk-lib'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { resolve } from 'path'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { readdirSync } from 'node:fs'
import { Vpc, SecurityGroup, Port } from 'aws-cdk-lib/aws-ec2';

export const CMS = async ({ stack, app }: StackContext) => {

    const credentials = rds.Credentials.fromGeneratedSecret('strapi', {
        secretName: 'strapi-cms-db-secret'
    })

    const db = new Config.Parameter(stack, 'DB_NAME', {
        value: `cms${stack.stage}`
    })

    const dbPort = new Config.Parameter(stack, 'DB_PORT', {
        value: '5432'
    })

    const vpc = new Vpc(stack, 'vpc-db', {
        vpcName: `vpc-db-cms-${stack.stage}`
    })


    const dbConnectionGroup = new SecurityGroup(stack, 'Proxy to DB Connection', {
        vpc
    });


    const lambdaSecurityGroup = new SecurityGroup(stack, 'lambda-security-group', {
        vpc
    });

    // tcp port
    const port = Port.tcp(parseInt(dbPort.value, 10))

    dbConnectionGroup.addIngressRule(dbConnectionGroup, port, 'allow db connection');
    dbConnectionGroup.addIngressRule(lambdaSecurityGroup, port, 'allow lambda connection');

    const cluster = new rds.DatabaseCluster(stack, 'Cluster', {
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_15_3 }),
        port: parseInt(dbPort.value, 10),
        // capacity applies to all serverless instances in the cluster
        serverlessV2MaxCapacity: 1,
        serverlessV2MinCapacity: 0.5,
        credentials,
        writer: rds.ClusterInstance.serverlessV2('writer'),
        vpc,
        securityGroups: [dbConnectionGroup],
        defaultDatabaseName: db.value,
        readers: [
            // puts it in promition tier 0-1
            rds.ClusterInstance.serverlessV2('reader1', { scaleWithWriter: true }),
            //ClusterInstance.serverlessV2('reader2'),
            //ClusterInstance.serverlessV2('reader3'),
            // illustrating how it might be possible to add support for groups in the future.
            // currently not supported by CFN
            //ClusterInstance.fromReaderGroup('analytics', { ...readerProps }),
        ]
    });

    const proxy = cluster.addProxy(stack.stage+'-proxy', {
        secrets: [cluster.secret!],
        debugLogging: true,
        vpc,
        securityGroups: [dbConnectionGroup],
        dbProxyName: `proxy-${stack.stage}`
    });



    const cors: BucketProps['cors'] = [
        {
            allowedOrigins: ["*"],
            allowedMethods: [s3.HttpMethods.GET],
            maxAge: `365 days`,
        },
    ]


    const OAI = new cloudfront.OriginAccessIdentity(
        stack,
        "cloudfrontOAI",
        {
            comment: `Allows CloudFront access to S3 bucket`,
        }
    );

    // uploads bucket
    const uploads = new Bucket(stack, 'uploads', {
        cdk: {
            bucket: {
                removalPolicy: RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
                publicReadAccess: false,
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
            }
        },
        cors
    })

    uploads.cdk.bucket.grantRead(OAI)

    const dbUrl = new Config.Parameter(stack, 'DB_URL', {
        value: proxy.endpoint
    })

    const dbCredentials = new Config.Parameter(stack, 'DB_PASS', {
        value: credentials.secretName!
    })

    const config = [
        db,
        dbUrl,
        dbPort, 
        dbCredentials
    ]

    const api = new Function(stack, 'api', {
        functionName: `cms-${stack.stage}`,
        handler: "./apps/cms/",
        bind: [uploads, ...config],
        permissions: [uploads],
        url: true,
        runtime: 'container',
        description: 'Lambda function to execute cms server',
        tracing: 'active',
        container: {
            cmd: ["lambda/index.handler"],
            file: 'Dockerfile'
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_OPTIONS: '--enable-source-maps',
            DATABASE_CLIENT: cluster.engine?.engineType!,
            STRAPI_DISABLE_EE: '1',
            CRON_ENABLED: '0'
        },
        vpc,
        securityGroups: [lambdaSecurityGroup]

    })
    

    // give permissions to lambda to read the secret
    credentials.secret?.grantRead(api)

    // give permissions to connect to lambda
    proxy.grantConnect(api)

    const apiUrl = Fn.parseDomainName(api.url!)



    const admin = new StaticSite(stack, 'admin', {
        path: 'apps/cms',
        buildOutput: 'build',
        buildCommand: 'npm run build',
        waitForInvalidation: stack.stage === 'prod',
        //errorPage: 'redirect_to_index_page',

        cdk: {
            distribution: {
                priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
                httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
                additionalBehaviors: {
                    "/api/*": {
                        origin: new origins.HttpOrigin(apiUrl, {
                            originId: 'api',
                            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                            httpsPort: 443
                        }),

                        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        compress: true,
                    },
                    '/uploads/*': {
                        origin: new origins.S3Origin(uploads.cdk.bucket, {
                            originId: 'uploads',
                            originAccessIdentity: OAI,

                        }),
                        compress: true,
                        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        allowedMethods:
                            cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS

                    }
                }
            },
        },
        assets: {
            textEncoding: 'utf-8',
            fileOptions: [
                {
                    files: ["**/*.js"],
                    cacheControl: "max-age=31536000,public,immutable",
                    contentType: 'application/javascript',
                },
                {
                    files: ["**/*.css"],
                    cacheControl: "max-age=31536000,public,immutable",
                    contentType: 'text/css'
                },
                {
                    files: ["**/*.html"],
                    cacheControl: "max-age=0,no-cache,no-store,must-revalidate",
                    contentType: 'text/html'
                },
            ]
        },
        replaceValues: [
            {
                files: '**',
                search: '{{ STRAPI_ADMIN_BACKEND_URL }}',
                replace: '/api'//api.url!,
            },
            {
                files: '**',
                search: '/dashboard',
                replace: '',
            }
        ],
        environment: {
            AUDIT_LOGS_ENABLED: "1",
            STRAPI_ADMIN_BACKEND_URL: '{{ STRAPI_ADMIN_BACKEND_URL }}',
            PUBLIC_ADMIN_URL: '/dashboard',
            DATABASE_CLIENT: 'postgres',
            DATABASE_HOST: proxy.endpoint,
            DATABASE_PORT: cluster.clusterEndpoint.port!,
            DATABASE_NAME: 'cms',
            DATABASE_USERNAME: credentials.username,
            DATABASE_PASSWORD: credentials.password!,
            STRAPI_DISABLE_EE: 1
        },
    })








    stack.addOutputs({
        adminUrl: admin.customDomainUrl || admin.url,
        apiUrl: `${admin.customDomainUrl || admin.url}/api`,
        dbUrl: proxy.endpoint,
        strapi: api.url!,
        bucket: admin.cdk?.bucket.bucketName,
        uploads: uploads.bucketName
    })

    return {
        uploads,
        api,
        site: admin
    }
}
