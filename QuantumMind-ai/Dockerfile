# syntax=docker/dockerfile:1
FROM python:3.11-slim

# Avoid interactive prompts, keep Python output unbuffered for logs.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# System deps needed by sentence-transformers / torch runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Make pip resilient to flaky networks when pulling large ML wheels.
ENV PIP_DEFAULT_TIMEOUT=180 \
    PIP_RETRIES=10

RUN --mount=type=cache,target=/root/.cache/pip pip install --upgrade pip

# Download the CPU-only torch and milvus-lite wheels. This network resets
# long-lived connections at ~60s, so a single large pip/curl download never
# finishes. We run many SHORT, independent curl attempts that each resume from
# the partial file (-C -) and cap themselves under the reset window
# (--max-time 50). Completed wheels live in a BuildKit cache mount so they are
# not re-downloaded on rebuilds. CPU torch is far smaller than the CUDA build.
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=cache,target=/opt/wheelcache \
    set -e; \
    fetch() { \
        url="$1"; whl="/opt/wheelcache/$2"; \
        if [ ! -s "$whl" ]; then \
            for i in $(seq 1 60); do \
                curl -L -C - --max-time 50 -o "$whl.part" "$url" && mv "$whl.part" "$whl" && break; \
                echo "download interrupted, resuming $2 (attempt $i)"; \
                sleep 2; \
            done; \
        fi; \
        [ -s "$whl" ] || { echo "failed to download $2"; exit 1; }; \
        pip install "$whl"; \
    }; \
    fetch "https://download.pytorch.org/whl/cpu/torch-2.4.1%2Bcpu-cp311-cp311-linux_x86_64.whl" \
          "torch-2.4.1+cpu-cp311-cp311-linux_x86_64.whl"; \
    fetch "https://files.pythonhosted.org/packages/44/43/b3f6e9defd1f3927b972beac7abe3d5b4a3bdb287e3bad69618e2e76cf0a/milvus_lite-2.4.12-py3-none-manylinux2014_x86_64.whl" \
          "milvus_lite-2.4.12-py3-none-manylinux2014_x86_64.whl"

# Install the remaining Python dependencies. Retry loop + pip cache mount means
# every fully-downloaded wheel is cached and reused, guaranteeing forward
# progress even when individual downloads get reset.
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    set -e; \
    ok=""; \
    for i in $(seq 1 40); do \
        pip install -r requirements.txt && ok=1 && break || echo "pip retry $i"; \
        sleep 2; \
    done; \
    [ "$ok" = "1" ]

# Pre-download the embedding model so the first request is fast and the
# container works without outbound HuggingFace access at runtime. Baked into
# the image layer (not a cache mount). Disable hf-xet transfer (it fails on this
# flaky network); the standard HTTP downloader resumes partial files reliably.
ENV HF_HUB_DISABLE_XET=1 \
    HF_HUB_ENABLE_HF_TRANSFER=0
RUN set -e; \
    ok=""; \
    for i in $(seq 1 20); do \
        python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')" \
            && ok=1 && break || echo "model download retry $i"; \
        sleep 2; \
    done; \
    [ "$ok" = "1" ]

# Copy application code.
COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/healthcheck || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
