# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- serve stage ---
FROM nginx:alpine
# nginx:alpine auto-runs envsubst over /etc/nginx/templates/*.template at startup.
# Only substitute our two vars, leave nginx's $host/$uri intact.
ENV PORT=80 \
    BACKEND_URL=http://backend:8000 \
    NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL)$"
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
