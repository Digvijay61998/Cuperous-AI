<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

steps to deploy backend

Step 1 — push your source to the server:

bash

cd /media/jay/427EF9697EF9565F1/Digvijay-projects/Cuperous-AI/QuantumMind-backend

rsync -avz -e "ssh -i ~/jarcube-key.pem" \
  --exclude node_modules --exclude dist --exclude .git --exclude .env \
  ./ ubuntu@15.252.211.196:/home/ubuntu/backend/
This copies your src/ changes up. It does not touch the server's .env, node_modules, or dist (those are excluded).

Step 2 — on the server: install deps (only if you changed them), rebuild, reload:

bash

ssh -i ~/jarcube-key.pem ubuntu@15.252.211.196
Then, on the server prompt (ubuntu@ip-172-...):

bash

cd /home/ubuntu/backend
npm install                              # ONLY if you added/changed a package
export NODE_OPTIONS=--max-old-space-size=2048
npm run build                            # cooks src/ -> dist/
pm2 reload jarcube-backend               # restart so it re-reads dist/
Step 3 — verify:

bash

pm2 status                               # status should be "online"
curl -I http://localhost:4000/api/docs   # expect 200
That's the whole thing. Yes, you need to rebuild — because npm run build is the step that turns your edited src/ into the dist/ the server actually runs. Skip it and the server keeps running the old meal.

Do you need npm install? Only if you changed package.json (added a library). Otherwise skip it.


Rollback — two kinds
Kind A: the hotpatch backup (what I set up). Fast, no rebuild, but only survives until the next server rebuild:

bash

ssh -i ~/jarcube-key.pem ubuntu@15.252.211.196 \
  'cd /home/ubuntu/backend/dist && \
   cp ai/ai.module.js.bak-brotli ai/ai.module.js && \
   cp trainingdata/trainingdata.module.js.bak-brotli trainingdata/trainingdata.module.js && \
   pm2 reload jarcube-backend'
It just copies the old files back over the live ones and reloads. Works because the server only reads dist/*.js at startup.


Kind B: the proper rollback (Git). For real feature deploys, your safety net is Git, not .bak files. If a deploy breaks production, you go back to the last good commit and redeploy:

bash

# on laptop
git checkout <last-good-commit>
rsync ... (Step 1)
# then rebuild + reload on server (Step 2)
This is why committing before deploying matters — the commit is your rollback point.







prod logs connect steps

How to connect and read logs
bash

# SSH in (use the ~ copy, not the one on the exFAT drive)
ssh -i ~/jarcube-key.pem ubuntu@15.252.211.196

# Backend logs on EC2
pm2 status
pm2 logs jarcube-backend                    # live tail
pm2 logs jarcube-backend --lines 500 --nostream | grep -i error
The AI service is not on EC2 — per section 15 of your own infra guide it runs in Docker on this laptop, reached through a Cloudflare Tunnel. So its logs are local:

bash

docker ps
docker logs -f quantummind-ai
docker logs quantummind-ai --since 24h | grep -i ingest