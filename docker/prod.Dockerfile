FROM node:12 AS builder

COPY . /app/
WORKDIR /app/

RUN cd ../types && yarn install && yarn build && cd ../service-document-control && yarn && yarn pkg 

FROM node:12

USER node
WORKDIR /app/
COPY --from=builder /app/document.app /app/document.app

CMD ["./document.app"]