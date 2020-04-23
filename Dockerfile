FROM ubuntu:18.04

WORKDIR /root

RUN apt-get update && apt-get install -y git sudo curl wget nano unzip && curl -sL https://deb.nodesource.com/setup_10.x | bash - && apt-get update && apt-get -y install nodejs


RUN adduser apps
RUN echo "apps     ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers
RUN mkdir -p /home/apps && chown apps:apps /home/apps

USER apps

WORKDIR /home/apps
