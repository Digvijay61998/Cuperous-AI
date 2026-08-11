# JarCube AI — common tasks
#
# The eval and test targets run inside the service image because it already has
# every dependency plus the embedding model baked in. That avoids a multi-minute
# local install and guarantees CI and local runs use identical versions.

.PHONY: help up up-storage down down-hard logs health rebuild \
        test eval eval-baseline eval-compare eval-judge eval-multiturn \
        eval-exact shell clean-eval

IMAGE       := quantummind-ai-ai-service:latest
NETWORK     := quantummind-ai
MILVUS_HOST := milvus-standalone

# Run a command inside the service image, wired to the compose network.
# MILVUS_HOST is the *container* name, not the compose alias: plain `docker run`
# resolves container names but not compose service aliases.
DRUN = docker run --rm --network $(NETWORK) --env-file .env \
       -e MILVUS_HOST=$(MILVUS_HOST) -e MILVUS_PORT=19530 \
       -v "$(PWD)":/app -w /app $(IMAGE)

help:
	@echo "Stack"
	@echo "  make up             start everything (Milvus + AI service)"
	@echo "  make up-storage     start only etcd + MinIO + Milvus"
	@echo "  make down           stop, keep data"
	@echo "  make down-hard      stop and DELETE all vector data"
	@echo "  make rebuild        rebuild the service image"
	@echo "  make logs           follow AI service logs"
	@echo "  make health         show container health"
	@echo ""
	@echo "Quality"
	@echo "  make test           run the pytest suite"
	@echo "  make eval           run the eval harness (deterministic)"
	@echo "  make eval-baseline  run and save as the comparison baseline"
	@echo "  make eval-compare   run and FAIL on regression"
	@echo "  make eval-judge     run with LLM-as-judge scoring (costs money)"
	@echo "  make eval-multiturn only multi-turn cases (2 of 4 fail pre-P1 — L1)"
	@echo "  make eval-exact     only exact-match cases (pass today — see L23)"
	@echo ""
	@echo "  make shell          shell inside the service image"

# ------------------------------------------------------------------ stack
up:
	docker compose up -d --build

up-storage:
	docker compose up -d etcd minio milvus
	@echo "Waiting for Milvus to report healthy..."
	@for i in $$(seq 1 40); do \
		h=$$(docker inspect milvus-standalone --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null); \
		if [ "$$h" = "healthy" ]; then echo "Milvus healthy."; exit 0; fi; \
		sleep 5; \
	done; \
	echo "Milvus did not become healthy in time."; exit 1

down:
	docker compose down

down-hard:
	@echo "This DELETES all ingested vectors (etcd + MinIO + Milvus volumes)."
	@printf 'Continue? [y/N] ' && read ans && [ "$$ans" = "y" ]
	docker compose down -v

rebuild:
	docker compose build --no-cache ai-service

logs:
	docker logs -f quantummind-ai

health:
	@docker compose ps

# ------------------------------------------------------------------ quality
test:
	$(DRUN) bash -c "pip install --quiet pytest pyyaml 2>/dev/null; pytest -v"

eval:
	$(DRUN) bash -c "pip install --quiet pyyaml 2>/dev/null; python -m eval.runner"

eval-baseline:
	$(DRUN) bash -c "pip install --quiet pyyaml 2>/dev/null; python -m eval.runner --baseline"

eval-compare:
	$(DRUN) bash -c "pip install --quiet pyyaml 2>/dev/null; python -m eval.runner --compare"

eval-judge:
	$(DRUN) bash -c "pip install --quiet pyyaml 2>/dev/null; python -m eval.runner --mode judge"

eval-multiturn:
	$(DRUN) bash -c "pip install --quiet pyyaml 2>/dev/null; python -m eval.runner --tags multi_turn"

eval-exact:
	$(DRUN) bash -c "pip install --quiet pyyaml 2>/dev/null; python -m eval.runner --tags exact_match"

shell:
	docker run --rm -it --network $(NETWORK) --env-file .env \
		-e MILVUS_HOST=$(MILVUS_HOST) -e MILVUS_PORT=19530 \
		-v "$(PWD)":/app -w /app $(IMAGE) bash

clean-eval:
	rm -rf eval/results
	@echo "Cleared eval/results (including baseline.json)."
