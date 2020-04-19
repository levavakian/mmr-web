FROM ubuntu:18.04

WORKDIR /root

RUN apt-get update && apt-get install -y git curl wget nano unzip && wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install && rm google-chrome-stable_current_amd64.deb

RUN useradd apps
RUN mkdir -p /home/apps && chown apps:apps /home/apps

WORKDIR /home/apps
USER apps

RUN git clone https://github.com/flutter/flutter.git -b beta
ENV PATH="/home/apps/flutter/bin:${PATH}"
RUN flutter channel beta && flutter upgrade && flutter config --enable-web && flutter precache
