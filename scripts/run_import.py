"""
run_import.py
-------------
Launcher that reads SUPABASE_SERVICE_ROLE_KEY out of apps/web/.env.local and
runs another script with it exported as SUPABASE_SERVICE_KEY.

The data scripts read SUPABASE_SERVICE_KEY from the environment, which meant
pasting a service-role JWT into a shell every session — easy to get wrong
(cmd.exe keeps the quotes in `set VAR="x"`) and easy to leave in shell history.
The key already lives in apps/web/.env.local, so read it from there.

Usage
-----
  python scripts/run_import.py import_brand_catalogs.py --brands klairs,rhode
  python scripts/run_import.py backfill_photos.py --write
"""

import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(ROOT, "apps", "web", ".env.local")


def service_key() -> str:
    if not os.path.exists(ENV_FILE):
        sys.exit(f"Not found: {ENV_FILE}")
    with open(ENV_FILE, encoding="utf-8") as fh:
        for line in fh:
            m = re.match(r"\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)", line)
            if m:
                return m.group(1).strip().strip('"').strip("'").strip()
    sys.exit("SUPABASE_SERVICE_ROLE_KEY not found in apps/web/.env.local")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    script = os.path.join(os.path.dirname(os.path.abspath(__file__)), sys.argv[1])
    env = dict(os.environ)
    env["SUPABASE_SERVICE_KEY"] = service_key()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUNBUFFERED"] = "1"
    sys.exit(subprocess.call([sys.executable, script, *sys.argv[2:]], env=env))


if __name__ == "__main__":
    main()
