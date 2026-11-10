FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openscad ca-certificates curl python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=/usr/local/bin sh
WORKDIR /app
COPY package.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate && arduino-cli core update-index && arduino-cli core install arduino:avr
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh","-c","npx prisma db push && node src/index.js"]
