FROM node:12 AS builder

COPY . /app/
WORKDIR /app/

RUN cd types && yarn install && yarn build && cd ../service-document-control && yarn && yarn pkg 

FROM debian:10.5-slim
ENV NODE_ENV=production
WORKDIR /app/
COPY --from=builder /app/service-document-control/document.app /app/document.app

CMD /app/document.app