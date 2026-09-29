#!/usr/bin/env bash
# One-time setup so `pnpm dev` just works after every restart.
# Installs portless as a startup service (so https://arcade.localhost is always ready)
# and trusts its certificate (so the browser doesn't warn). Asks for your sudo password.
set -e
cd "$(dirname "$0")/.."

# Stop any proxy started by hand, so the service can take over port 443.
sudo env "PATH=$PATH" pnpm exec portless proxy stop 2>/dev/null || true

sudo env "PATH=$PATH" pnpm exec portless service install   # add --lan here to also get arcade.local for phones
pnpm exec portless trust || echo "Couldn't trust the certificate; try: pnpm exec portless trust"

pnpm exec portless service status
echo
echo "All set. From now on, just run: pnpm dev"
