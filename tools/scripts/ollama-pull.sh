#!/usr/bin/env sh
set -e
: "${OLLAMA_HOST:=http://localhost:11434}"
: "${OLLAMA_MODELS:=qwen3:4b,qwen3:8b,nomic-embed-text}"

echo "[ollama-pull] host=$OLLAMA_HOST"
IFS=','
for m in $OLLAMA_MODELS; do
  echo "[ollama-pull] >>> $m"
  curl -fsS -X POST "$OLLAMA_HOST/api/pull" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"$m\",\"stream\":false}" \
    | sed 's/{/\n{/g' | tail -n 1
done
echo "[ollama-pull] done"
