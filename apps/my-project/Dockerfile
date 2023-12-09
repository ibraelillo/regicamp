FROM node:lts-bullseye-slim AS base

#enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /app
WORKDIR /app


FROM base AS build
#RUN apt update
#RUN apt install -y g++ make cmake unzip libcurl4-openssl-dev autoconf libtool python3
#RUN pnpm install --save aws-lambda-ric
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile
RUN pnpm run build

FROM build AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --no-optional --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm prune --prod --no-optional


FROM node:lts-bullseye-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g pnpm


COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package.json
WORKDIR /app

ENV PORT 80
ENV HOST "0.0.0.0"
ENV NODE_ENV production

CMD ["/usr/local/bin/pnpm", "run", "start"]