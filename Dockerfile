FROM node:16
WORKDIR /user/src/app
COPY package*.json ./
RUN apt update
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "node", "server.js" ]