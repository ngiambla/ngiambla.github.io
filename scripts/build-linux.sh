#!/usr/bin/env bash
# Builds the Linux that boots in the browser and writes it to public/linux/:
#   fs.json   the 9p filesystem index v86 reads at boot
#   flat/     every file, zstd-compressed and named by its sha256 (lazily
#             fetched by the emulator, so only files that are used download)
# Needs docker (or podman) and python3 with the `zstandard` module.
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/build-content.mjs
IMAGE=ngiambla-site-linux
OUT=public/linux
TAR=$(mktemp -d)/rootfs.tar

docker build --platform linux/386 -f linux/Dockerfile -t "$IMAGE" .
CID=$(docker create --platform linux/386 "$IMAGE")
docker export "$CID" -o "$TAR"
docker rm "$CID" >/dev/null
tar -f "$TAR" --delete .dockerenv 2>/dev/null || true

rm -rf "$OUT"
mkdir -p "$OUT/flat"
python3 linux/v86-tools/fs2json.py --zstd --out "$OUT/fs.json" "$TAR"
python3 linux/v86-tools/copy-to-sha256.py --zstd "$TAR" "$OUT/flat"
rm -f "$TAR"
echo "linux: $(ls "$OUT/flat" | wc -l) files, $(du -sh "$OUT" | cut -f1) in $OUT"
