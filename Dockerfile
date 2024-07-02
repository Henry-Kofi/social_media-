FROM node:lts-alpine3.19

WORKDIR /

COPY package.json package.json
COPY yarn.lock yarn.lock

RUN yarn install

COPY . .

CMD [ "yarn","dev" ]

EXPOSE 4040