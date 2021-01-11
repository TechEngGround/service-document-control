FROM node:12 AS builder
COPY . /app/
WORKDIR /app/
RUN cd types && yarn install && yarn build && cd ../service-document-control && yarn install && yarn pkg 

FROM ubuntu:14.04

RUN apt-get update && apt-get install -y firefox wget
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
RUN echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
RUN apt-get update
RUN apt-get install google-chrome-stable dbus-x11 packagekit-gtk3-module libcanberra-gtk-module -y


ENV NODE_ENV=production
WORKDIR /app/
COPY --from=builder /app/service-document-control/document.app /app/document.app
RUN mkdir uploads
RUN mkdir downloads
RUN mkdir pdfgen
CMD /app/document.app