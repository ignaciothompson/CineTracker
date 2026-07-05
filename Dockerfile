FROM node:20-alpine AS frontend-build

WORKDIR /build
COPY web/package.json ./
RUN npm install
COPY web/ ./
RUN npm run build

FROM alpine:latest

ARG PB_VERSION=0.39.5

RUN apk add --no-cache unzip ca-certificates wget

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
COPY --from=frontend-build /build/dist /pb/pb_public

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data"]
