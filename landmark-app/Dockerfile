# 1. Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# 2. Production stage
FROM nginx:alpine
# 빌드된 파일들을 Nginx 경로로 복사
COPY --from=build /app/build /usr/share/nginx/html
# 위에서 만든 설정 파일을 Nginx 설정 경로로 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
