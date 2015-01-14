#!/usr/bin/env bash

#update package sources
apt-get update

#make etherpad
apt-get install -y default-jdk scala mysql-server mysql-client libmysql-java git-core
git clone --quiet https://github.com/ether/etherpad-lite.git etherpad
pushd etherpad
bin/build.sh
bin/run.sh&
popd

#install nodejs dependencies
apt-get install -y git
apt-get install -y curl
apt-get install -y make
apt-get install -y g++

#get the latest nodejs release
curl -sL https://deb.nodesource.com/setup | sudo bash -
apt-get install -y nodejs
apt-get install -y npm
apt-get install -y mongodb

#change to project dir
cd /vagrant

#install node modules
npm install
if ! [ -L /var/www ]; then
  rm -rf /var/www
  ln -fs /vagrant /var/www
fi

#start mongodb
./mongod&

#set app.js environment
export IP=127.0.0.1
export PORT=80
#node app.js