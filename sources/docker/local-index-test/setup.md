### 1 Build Angular
cd ./evotingAngular

``npm run build-local-production``

### 2 Deploy Angular
cd ./frontend-deploy

``node frontend-deploy.js deploy``

### 4 Run nginx docker container

cd ./docker/local-index-test/index

edit the index.html -> ROW 120 to match your local config

cd ./docker/local-index-test

```docker-compose up```

### 5 Browser

http://localhost:8011/?address=local.decentravoteapp&network=local