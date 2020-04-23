FROM ubuntu:18.04

WORKDIR /root

RUN apt-get update && apt-get install -y git sudo curl wget nano unzip && curl -sL https://deb.nodesource.com/setup_10.x | bash - && apt-get update && apt-get -y install nodejs
RUN curl https://cli-assets.heroku.com/install.sh | sh

RUN adduser apps
RUN echo "apps     ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers
RUN mkdir -p /home/apps/mmr-web && chown apps:apps /home/apps
COPY myapp /home/apps/mmr-web/myapp
WORKDIR /home/apps/mmr-web/myapp
RUN npm install
RUN npm run build

USER apps
WORKDIR /home/apps/mmr-web
