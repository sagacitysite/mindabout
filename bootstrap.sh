#!/usr/bin/env bash

apt-get update
#get curl, make, g++
apt-get install curl -y
apt-get install make -y
apt-get install g++ -y
#get the latest nodejs release
curl -sL https://deb.nodesource.com/setup | sudo bash -
apt-get install -y nodejs
apt-get install -y npm
apt-get install -y mongodb
#install node modules
cd /vagrant
npm install
if ! [ -L /var/www ]; then
  rm -rf /var/www
  ln -fs /vagrant /var/www
fi
