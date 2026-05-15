#!/usr/bin/env bash
# Generiert das Xcode-Projekt aus project.yml.
# Benötigt XcodeGen (https://github.com/yonaskolb/XcodeGen).
#
# Erstinstallation (einmalig):
#   brew install xcodegen
#
# Falls du Homebrew noch nicht hast:
#   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

set -euo pipefail
cd "$(dirname "$0")"

if ! command -v xcodegen >/dev/null 2>&1; then
    echo "❌ XcodeGen ist nicht installiert."
    echo "   Installiere mit: brew install xcodegen"
    exit 1
fi

xcodegen generate
echo "✅ Wetterfusion.xcodeproj wurde erzeugt."
echo "   Öffnen mit: open Wetterfusion.xcodeproj"
