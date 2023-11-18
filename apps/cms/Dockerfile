ARG FUNCTION_DIR="/function"
ARG NODE_ENV=development

FROM node:20-alpine as base
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git

ENV NODE_ENV=${NODE_ENV}
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy function code
RUN mkdir -p ${FUNCTION_DIR}
COPY . ${FUNCTION_DIR}

WORKDIR ${FUNCTION_DIR}

# install node modules
RUN pnpm install

#s install  lambda runtime
RUN  pnpm install aws-lambda-ric

# build the lambda function
RUN pnpm run build:lambda


FROM base as RUNTIME

# Required for Node runtimes which use npm@8.6.0+ because
# by default npm writes logs under /home/.npm and Lambda fs is read-only
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Set working directory to function root directory
WORKDIR ${FUNCTION_DIR}

# Copy in the built dependencies
COPY --from=base ${FUNCTION_DIR} ${FUNCTION_DIR}


RUN pnpm install -g aws-lambda-ric
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /opt/app/dist/* ./
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --no-optional
ENTRYPOINT ["/usr/local/bin/pnpx", "aws-lambda-ric"]
CMD ["index.handler"]