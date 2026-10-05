# Runtime Python pour les web services Deplay : Python 3.12 + ffmpeg (outils média)
# Construite sur le VPS par : podman build -t localhost/deplay-python:3.12-ffmpeg deploy/runtimes/python-ffmpeg
FROM docker.io/library/python:3.12-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*
