#FROM node:20 AS build

#WORKDIR /app

#COPY package*.json pnpm-lock.yaml ./

#RUN npm install -g pnpm
#RUN pnpm install

#COPY . .

#RUN pnpm build

#FROM node:20 AS prod 

#WORKDIR /app

#COPY --from=build /app/.next/standalone ./
#COPY --from=build /app/.next/static ./.next/static
#COPY --from=build /app/public ./public

#EXPOSE 3000

#CMD [ "node", "server.js" ]

# Single-stage Dockerfile for dev
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the code
COPY . .

# Expose the dev port
EXPOSE 3000

# Run Next.js in development mode
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

