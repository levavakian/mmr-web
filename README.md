# mmr-web

To prepare a dev environment, run `./build.sh` and then `./run.sh`. This will create a docker called `mmrwebc` that has a set up dev environment and mounts your local files.

All commands from this point on are assumed to be in the `mmrwebc` container.

To bring up the server, run `sudo mongod` to start up the DB and `mmr-web/server/run.sh` to start up the flask server.
To run the dev UI, run `npm run dev` in `mmr-web/client`.