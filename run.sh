if [ "$(docker ps -a | grep mmrwebc)" ]
then
  docker start mmrwebc > /dev/null
  docker exec -it mmrwebc bash
else
  docker run -it --name mmrwebc -e DISPLAY --privileged --user $(id -u):$(id -g) -v $(pwd)/../mmr-web:/home/apps/mmr-web --network=host mmrweb:latest bash
fi