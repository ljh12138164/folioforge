#!/usr/bin/env bash
set -euo pipefail
# Exercise the actual release script with isolated Docker/HTTP substitutes.
ROOT=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$ROOT/work"
TEST_ROOT=$(mktemp -d "$ROOT/work/release-test.XXXXXX")
[[ "$TEST_ROOT" = "$ROOT/work/release-test."* ]] || exit 2
trap 'rm -rf "$TEST_ROOT"' EXIT
mkdir -p "$TEST_ROOT/stack" "$TEST_ROOT/bin"
export TEST_STACK="$TEST_ROOT/stack" TEST_LOG="$TEST_ROOT/commands"
export PATH="$TEST_ROOT/bin:$PATH"
sed -e "s|STACK_DIR=/opt/stacks/[a-z]*|STACK_DIR=$TEST_STACK|" \
    -e "s|/run/lock/\$IMAGE-deploy.lock|$TEST_ROOT/deploy.lock|" \
    "$ROOT/deploy/server/deploy-folioforge" > "$TEST_ROOT/deploy"
cp "$ROOT/compose.yaml" "$TEST_STACK/compose.yaml"
cat > "$TEST_ROOT/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -eu
echo "$*" >> "$TEST_LOG"
case "$1 ${2:-}" in
  "load ") cat >/dev/null ;;
  "image inspect") printf '%s\n' "${TEST_BAD_REVISION:-${3#*:sha-}}" ;;
  "compose up")
    current=$(sed -n 's/^IMAGE_TAG=//p' "$TEST_STACK/.env")
    [[ "$current" != "${TEST_FAIL_TAG:-}" ]] ;;
esac
MOCK
cat > "$TEST_ROOT/bin/curl" <<'MOCK'
#!/usr/bin/env bash
set -eu
current=$(sed -n 's/^IMAGE_TAG=//p' "$TEST_STACK/.env")
[[ "$current" != "${TEST_HEALTH_FAIL_TAG:-}" ]] || exit 1
if [[ "$*" = *release.txt* ]]; then sed -n 's/^IMAGE_TAG=sha-//p' "$TEST_STACK/.env"; fi
MOCK
cat > "$TEST_ROOT/bin/sudo" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$TEST_LOG"
MOCK
cat > "$TEST_ROOT/bin/flock" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
cat > "$TEST_ROOT/bin/sleep" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
chmod +x "$TEST_ROOT/bin/"*
OLD=sha-1111111111111111111111111111111111111111
NEW=sha-2222222222222222222222222222222222222222
BAD=sha-3333333333333333333333333333333333333333
invoke() { printf 'test image payload' | gzip | bash "$TEST_ROOT/deploy" "$@"; }
printf 'IMAGE_TAG=%s\n' "$OLD" > "$TEST_STACK/.env"
invoke "$NEW"
grep -qx "IMAGE_TAG=$NEW" "$TEST_STACK/.env"
grep -qx "IMAGE_TAG=$OLD" "$TEST_STACK/.env.previous"

export TEST_FAIL_TAG="$BAD"
status=0; invoke "$BAD" || status=$?
test "$status" -eq 4
grep -qx "IMAGE_TAG=$NEW" "$TEST_STACK/.env"

unset TEST_FAIL_TAG
export TEST_HEALTH_FAIL_TAG="$BAD"
status=0; invoke "$BAD" || status=$?
test "$status" -eq 4
grep -qx "IMAGE_TAG=$NEW" "$TEST_STACK/.env"
unset TEST_HEALTH_FAIL_TAG

export TEST_BAD_REVISION=wrong
status=0; invoke "$BAD" || status=$?
test "$status" -eq 2
grep -qx "IMAGE_TAG=$NEW" "$TEST_STACK/.env"
unset TEST_BAD_REVISION

rm "$TEST_STACK/.env"
export TEST_FAIL_TAG="$BAD"
status=0; invoke "$BAD" || status=$?
test "$status" -eq 4
test ! -f "$TEST_STACK/.env"
grep -qx 'compose down' "$TEST_LOG"

unset TEST_FAIL_TAG
rm -f "$TEST_STACK/.env"
invoke "$NEW" image
grep -qx "IMAGE_TAG=$NEW" "$TEST_STACK/.env"
grep -q "image inspect pixelforge:$NEW" "$TEST_LOG"
status=0; invoke "$NEW" bogus || status=$?
test "$status" -eq 2

for command in 'whoami' 'deploy sha-invalid' "deploy $NEW extra" "deploy $NEW image extra" "deploy $NEW; whoami"; do
    status=0
    SSH_ORIGINAL_COMMAND="$command" sh "$ROOT/deploy/server/folioforge-deploy-gate" || status=$?
    test "$status" -eq 126
done
SSH_ORIGINAL_COMMAND="deploy $NEW" sh "$ROOT/deploy/server/folioforge-deploy-gate"
grep -qx -- "-n /usr/local/sbin/deploy-folioforge $NEW" "$TEST_LOG"
SSH_ORIGINAL_COMMAND="deploy $NEW image" sh "$ROOT/deploy/server/folioforge-deploy-gate"
grep -qx -- "-n /usr/local/sbin/deploy-folioforge $NEW image" "$TEST_LOG"
echo 'Release script checks passed: success, rollback, wrong revision, first-release failure, image product, restricted SSH.'
