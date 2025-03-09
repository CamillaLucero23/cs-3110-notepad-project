#!/bin/bash

scp html/* root@inkscribe.mooo.com:/var/www/html/
scp jsapp/* root@inkscribe.mooo.com:/var/www/jsapp/
ssh root@inkscribe.mooo.com systemctl restart jsapp
