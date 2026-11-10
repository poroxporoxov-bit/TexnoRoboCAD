FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openscad ca-certificates curl python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh","-c","npx prisma db push && node src/index.js"]
