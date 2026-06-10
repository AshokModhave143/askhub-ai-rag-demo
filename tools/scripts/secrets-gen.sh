#!/usr/bin/env sh
set -e
echo "# Generated secrets — paste into .env"
echo "LANGFUSE_SECRET=$(openssl rand -base64 32)"
echo "LANGFUSE_SALT=$(openssl rand -base64 32)"
echo "LANGFUSE_ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
