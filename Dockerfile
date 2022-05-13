FROM node:slim

ADD . /root
WORKDIR /root
EXPOSE 3000
RUN npm install

CMD ["node","main.js"]
