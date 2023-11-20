FROM public.ecr.aws/lambda/nodejs:20

RUN corepack enable

COPY . ${LAMBDA_TASK_ROOT} 

RUN ls ${LAMBDA_TASK_ROOT}

RUN pnpm install --production --no-optional

CMD [ "lambda/index.handler" ]