#!/usr/bin/env bash

#https://medium.com/coinmonks/connecting-aws-lambda-node-js-to-redshift-or-postgresql-try-aws-lambda-layers-78e60c27f39b

#Note the name of the folder *must* be nodejs, see explanation here:
#https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html
layer=$(mktemp -d 2>/dev/null || mktemp -d -t 'nodejs')
mkdir -p $layer/nodejs
#cp $PWD/apps/cms/package.json $layer/nodejs


echo $layer

#cat $layer/package.json
cd $layer/nodejs
npm init -y
pnpm install pg @strapi/plugin-graphql @strapi/plugin-users-permissions @strapi/plugin-i18n @vendia/serverless-express --prod

cd ..
du -hc nodejs
#cd ..
zip -r "nodejs.zip" nodejs

ls $layer

aws lambda publish-layer-version --layer-name strapi-layer --description "My strapi layer" --license-info "MIT" --zip-file "fileb://$layer/nodejs.zip" --compatible-runtimes  nodejs --compatible-architectures arm64,x86_64

#rm -rf $layer