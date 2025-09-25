FROM node:latest AS build

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm build

FROM node:alpine AS prod 

WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./
COPY --from=build /app/public ./

EXPOSE 3000

CMD [ "node", "server.js" ]
