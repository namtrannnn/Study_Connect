FROM node:18

WORKDIR /app

COPY package*.json ./

# Install system dependencies for sharp (image processing)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install

COPY . .

EXPOSE 5000
EXPOSE 9229

CMD ["npm", "start"]