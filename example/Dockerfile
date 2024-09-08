FROM node:20-alpine

WORKDIR /app

# Relevant project folder imports
RUN mkdir -p /app/backend /app/shared
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/


# Monorepo imports
COPY package*.json ./
COPY tsconfig.json ./
COPY lerna.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

# Finish relevant project folder imports
COPY backend ./backend
COPY shared ./shared

# Execute
RUN yarn build

WORKDIR /app/backend

EXPOSE 8080
CMD ["yarn", "start"]
