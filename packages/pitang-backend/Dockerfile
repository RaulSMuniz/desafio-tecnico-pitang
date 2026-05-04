FROM node:20-slim

# Instalar dependências necessárias para o Prisma e PG
RUN apt-get update && apt-get install -y openssl libssl-dev

WORKDIR /app

# Copiar arquivos de configuração do monorepo
COPY package*.json ./
COPY packages/pitang-backend/package*.json ./packages/pitang-backend/

# Instalar todas as dependências usando workspaces
RUN npm install

# Copiar o código do backend
COPY packages/pitang-backend ./packages/pitang-backend

# Gerar o Prisma Client
WORKDIR /app/packages/pitang-backend
RUN npx prisma generate

# Expor a porta do backend
EXPOSE 3333

# Comando para rodar a aplicação
CMD ["npm", "run", "dev"]
