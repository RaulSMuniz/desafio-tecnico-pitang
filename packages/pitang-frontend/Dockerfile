# Estágio de Build
FROM node:20 as build-stage

WORKDIR /app

# Copiar arquivos de configuração do monorepo
COPY package*.json ./
COPY packages/pitang-frontend/package*.json ./packages/pitang-frontend/

# Instalar dependências usando workspaces
RUN npm install

# Copiar o código do frontend
COPY packages/pitang-frontend ./packages/pitang-frontend

# Construir a aplicação
WORKDIR /app/packages/pitang-frontend
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Estágio de Produção (Servindo com Nginx)
FROM nginx:stable-alpine as production-stage

# Copiar os arquivos buildados do estágio anterior
COPY --from=build-stage /app/packages/pitang-frontend/dist /usr/share/nginx/html

# Expor a porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
