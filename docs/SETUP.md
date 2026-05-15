# Setup für Patrick — Web-Version

Du baust **Wetterfusion** als Progressive Web App. Vorteile:

- **Komplett gratis** — auch dauerhaft, auch wenn andere die App nutzen
- Funktioniert auf **iPhone, Android, Mac, PC**
- Iteration ist Sekunden statt Minuten (kein Xcode-Compile)
- Aufs iPhone wie eine echte App: **"Zum Home-Bildschirm"**

Alles in 4 Schritten. Plan: ~30 Min beim ersten Mal, danach Minuten.

---

## Schritt 1 — Werkzeuge installieren (einmalig)

### a) Node.js

Wir brauchen Node (die Sprache, in der die App gebaut wird).

1. https://nodejs.org/ öffnen
2. Auf den großen grünen Button **"LTS"** klicken (aktuell Node 22)
3. Installer ausführen, alles bestätigen
4. Terminal öffnen (⌘+Leertaste → "Terminal") und prüfen:

   ```bash
   node --version
   ```

   Wenn da `v22.x.x` o.ä. steht — fertig.

### b) GitHub-Account

Falls noch nicht: https://github.com/signup — kostenlos, Email + Passwort reicht.

### c) Git (vermutlich schon da)

```bash
git --version
```

Wenn nicht installiert: macOS fragt dann selbst nach den Command Line Tools — Bestätigen.

---

## Schritt 2 — Lokal starten

```bash
cd "/Users/patrick-02/Documents/Claude Code/wetter/web"
npm install
npm run dev
```

`npm install` lädt einmalig die Bibliotheken (~30 Sek).
`npm run dev` startet die App lokal. Im Terminal erscheint:

```
  ➜  Local:   http://localhost:5173/
```

Öffne den Link im Browser. Du solltest die App sehen — frag den Browser nach Standort-Berechtigung, dann lädt die Vorhersage.

**Hot Reload:** Wenn ich was am Code ändere, siehst du es sofort im Browser — kein Neustart nötig.

---

## Schritt 3 — Auf GitHub pushen (einmalig einrichten)

1. Auf https://github.com/new ein neues Repo erstellen:
   - Name: `wetter`
   - Public (sonst kein gratis GitHub Pages)
   - Keine README, keine .gitignore — wir haben schon welche
   - "Create repository"

2. Terminal:

   ```bash
   cd "/Users/patrick-02/Documents/Claude Code/wetter"
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/DEINUSER/wetter.git
   git push -u origin main
   ```

   (Ersetze `DEINUSER` durch deinen GitHub-Namen.)

3. GitHub fragt nach Login. Beim ersten Push einen **Personal Access Token** statt Passwort eingeben:
   - https://github.com/settings/tokens → "Generate new token (classic)"
   - Scopes: `repo` ankreuzen
   - Token kopieren, als "Passwort" einfügen

4. GitHub Pages aktivieren:
   - Im Repo: **Settings → Pages**
   - **Source:** "GitHub Actions" auswählen
   - Speichern

5. Warten 1–2 Min. Reiter **Actions** im Repo zeigt den Deploy-Lauf. Wenn grün ✅, ist deine App live unter:

   `https://DEINUSER.github.io/wetter/`

---

## Schritt 4 — Aufs iPhone als App installieren

1. In **Safari** auf dem iPhone die URL `https://DEINUSER.github.io/wetter/` öffnen.
2. **Teilen-Button** (Quadrat mit Pfeil nach oben) tippen.
3. **"Zum Home-Bildschirm"** wählen.
4. Bestätigen. Icon erscheint auf dem Home-Bildschirm wie eine echte App.

Beim ersten Öffnen Standort erlauben — fertig.

Für **andere** (Freunde, Familie): einfach Link teilen. Sie machen das gleiche.

---

## Tägliche Arbeit

```bash
cd "/Users/patrick-02/Documents/Claude Code/wetter/web"
npm run dev
```

Browser auf `http://localhost:5173` öffnen.

**Änderung deployen:**

```bash
cd "/Users/patrick-02/Documents/Claude Code/wetter"
git add .
git commit -m "was du geändert hast"
git push
```

GitHub baut und deployed automatisch (~1 Min). Live-Version aktualisiert sich.

---

## Wenn etwas hängt

Sag mir im Chat:
- Welcher Schritt
- Welcher Fehlertext oder Screenshot

Ich gehe es mit dir durch.

---

## Optional: Warmstart-Gewichte (später)

Siehe [backend/backtest/README.md](../backend/backtest/README.md). Macht die Vorhersagen pro Region noch genauer. Nicht nötig, um anzufangen.
