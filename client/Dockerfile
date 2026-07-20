# Dockerfile này chỉ cần nếu bạn chọn deploy client bằng Render Web Service (Docker).
# Nếu dùng Render Static Site (khuyến nghị, xem hướng dẫn deploy) thì không cần file này,
# Render tự build "npm run build" và host thẳng thư mục dist/.
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
# -s bật chế độ SPA: mọi route không khớp file tĩnh đều trả về index.html
CMD ["serve", "-s", "dist", "-l", "3000"]
