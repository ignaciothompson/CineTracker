#!/bin/sh
set -e

mkdir -p /pb/pb_data

if [ -n "$ANTHROPIC_API_KEY" ]; then
  printf '%s' "$ANTHROPIC_API_KEY" > /pb/pb_data/.anthropic_api_key
  chmod 600 /pb/pb_data/.anthropic_api_key
fi

exec /pb/pocketbase serve --http=0.0.0.0:8090 --dir=/pb/pb_data
