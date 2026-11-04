FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY --chown=node:node backend ./backend
COPY --chown=node:node frontend ./frontend
USER node
EXPOSE 8080
# Cloud Run proporciona variables de entorno y secretos. No se carga .env.
CMD ["node", "backend/server.js"]
