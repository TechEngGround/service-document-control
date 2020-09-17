FROM node:12 AS builder
COPY . /app/
WORKDIR /app/
RUN cd types && yarn install && yarn build && cd ../service-document-control && yarn install && yarn pkg 

FROM debian:10.5-slim
ENV NODE_ENV=production
WORKDIR /app/
COPY --from=builder /app/service-document-control/document.app /app/document.app
RUN mkdir uploads
RUN mkdir downloads
CMD /app/document.app