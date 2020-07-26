FROM node:12 AS builder

COPY . /app/
WORKDIR /app/

RUN yarn && yarn pkg

FROM node:12-alpine

USER node
WORKDIR /app/
RUN mkdir /app/uploads
COPY --from=builder /app/documents.app /app/documents.app
COPY index.html /app/index.html

CMD ["./documents.app"]