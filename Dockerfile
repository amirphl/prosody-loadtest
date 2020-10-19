FROM node:14.14.0-alpine3.10
RUN apk add bash bash-completion
WORKDIR /usr/src/app
RUN npm install @xmpp/client @xmpp/debug
COPY loadtest.js .
CMD ["node" , "loadtest.js"]
