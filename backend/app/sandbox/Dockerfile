FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin sandbox

RUN mkdir -p /workspace && chown -R 10001:10001 /workspace

WORKDIR /workspace

# Pytest is needed for the deterministic test runner.
RUN pip install --no-cache-dir pytest==8.3.5

USER 10001:10001

CMD ["python", "--version"]