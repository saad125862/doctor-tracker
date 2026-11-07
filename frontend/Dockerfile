FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# The /api rewrite target is resolved at build time
ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=$BACKEND_URL
ARG NEXT_PUBLIC_DEMO_MODE=true
ENV NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
