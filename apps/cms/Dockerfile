FROM node:18-alpine as base
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /opt/
COPY package.json ./
RUN npm i -g pnpm node-gyp
#RUN yarn config set network-timeout 600000 -g && yarn install
RUN pnpm install --no-optional
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .
RUN chown -R node:node /opt/app
USER node
#RUN ["pnpm","run", "build"]
RUN pnpm run build:lambda
#EXPOSE 1337
#CMD ["pnpm", "run", "develop"]


FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --no-optional

FROM base AS builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --no-optional
WORKDIR /opt/app
RUN pnpm run build:lambda

FROM public.ecr.aws/lambda/nodejs:18
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /opt/app/dist/* ./
CMD ["index.handler"]