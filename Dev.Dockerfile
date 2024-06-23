FROM node:18
WORKDIR /home/node/app
RUN npm install -g npm-watch nodemon
CMD ./watch-dev.sh