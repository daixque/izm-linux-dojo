#!/usr/bin/env python3
"""
ブラウザテストのエントリーポイント。

使用方法:
    python test.py
    python test.py -k 01_ls_cd
    python test.py --headed
"""

import subprocess
import sys


def main():
    args = ["pytest", "test/", "-v", "--tb=short", "--browser", "chromium"] + sys.argv[1:]
    result = subprocess.run(args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
