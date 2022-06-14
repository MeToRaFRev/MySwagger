docker rm -f MySwagger
docker image rm lastdemon/myswagger
docker build . -t lastdemon/myswagger
docker image push lastdemon/myswagger 
docker run -p 443:8080 -p 3000:3000 --restart=always --name MySwagger -d lastdemon/myswagger

