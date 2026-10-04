FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run init-schema and seed:pdf gracefully without crashing the container, then start server
CMD ["sh", "-c", "(npm run init-schema || true) && (npm run seed:pdf || true) && npm run dev"]
