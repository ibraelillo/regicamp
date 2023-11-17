import { Api, Bucket, BucketProps, Function, StaticSite, toCdkDuration } from 'sst/constructs'
import { StackContext } from "sst/constructs/FunctionalStack";
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as assets from 'aws-cdk-lib/aws-s3-assets'
import { RemovalPolicy, Fn, SymlinkFollowMode } from 'aws-cdk-lib'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { resolve } from 'path'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import {readdirSync} from 'node:fs'

export const CMS = async ({ stack, app }: StackContext) => {

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

    const api = new Function(stack, 'api', {
        handler: "./apps/cms/",
        bind: [uploads],
        permissions: [uploads],
        url: true,
        runtime: 'container',
        // copyFiles: ['config', 'src', '.tmp', 'node_modules'].map(folder => ({ from: `apps/cms/${folder}`, to: folder })),
        // nodejs: {
        //     install: ['pg', '@strapi/strapi', 'mysql', 'knex', '@vendia/serverless-express'],
        //     esbuild: { external: ['aws-sdk'] },
        //     sourcemap: true
        // },
        environment: {
            NODE_OPTIONS: '--enable-source-maps'
        },
        
    })

    const staticBehavior = (pathPattern: string, ttl = 0) => ({

        pathPattern,
        compress: true,
        defaultTtl: toCdkDuration(`${ttl} seconds`),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods:
            cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS

    })


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
                replace: api.url!,
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
            PUBLIC_ADMIN_URL: '/dashboard'
        },
    })








    stack.addOutputs({
        adminUrl: admin.customDomainUrl || admin.url,
        apiUrl: `${admin.customDomainUrl || admin.url}/api`,
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
