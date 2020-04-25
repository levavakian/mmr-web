FROM ubuntu:18.04

WORKDIR /root

RUN apt-get update && apt-get install -y locales git sudo curl wget nano unzip python3-pip gnupg 
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install nodejs mongodb-org
RUN curl https://cli-assets.heroku.com/install.sh | sh
RUN mkdir -p /data/db

RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && locale-gen
ENV LANG en_US.UTF-8  
ENV LANGUAGE en_US:en  
ENV LC_ALL en_US.UTF-8 

RUN adduser apps
RUN echo "apps     ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers
RUN mkdir -p /home/apps/mmr-web && chown apps:apps /home/apps
COPY client /home/apps/mmr-web/client
COPY server /home/apps/mmr-web/server
WORKDIR /home/apps/mmr-web/client
RUN npm install
RUN npm run build
WORKDIR /home/apps/mmr-web/server
RUN pip3 install -r requirements.txt

USER apps
WORKDIR /home/apps/mmr-web
