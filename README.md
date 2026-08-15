# Schiri-Trainer

Persönlicher Fitness-Trainer für Landesliga-Schiedsrichter: Lauf- und Krafttraining planen,
durchs Krafttraining geführt werden, Fortschritte verfolgen.

Läuft als installierbare Web-App (PWA) vollständig offline. Keine Server, keine Konten,
keine laufenden Kosten.

---

## Schnellstart

```bash
npm install
```

```bash
npm run dev
```

Dann `http://localhost:5173` öffnen.

---

## Was die App macht

**Trainingsplan in 4-Wochen-Blöcken.** Drei Wochen Aufbau, die vierte ist eine
Entlastungswoche mit weniger Sätzen und reduzierten Vorgaben. Bewusst ohne feste
Wochentage — bei Spielansetzungen am Wochenende wäre „Dienstag ist Lauftag" nur eine
Quelle für schlechtes Gewissen. Stattdessen: pro Woche stehen N Einheiten an, du machst
sie, wann es passt.

**Geführtes Krafttraining.** Satz für Satz abhaken, Wiederholungen per Plus/Minus
korrigieren, Pausentimer startet automatisch mit der richtigen Länge. Ton, Vibration und
Bildschirm-Wachhalten sind abschaltbar. Für Halteübungen wie den Copenhagen Plank lässt
sich die Haltezeit mitstoppen.

**Vorgaben, die mitwachsen.** Nach jeder Einheit passt die App die Vorgaben an: Alle Sätze
geschafft → nächstes Mal mehr. Mehrheit der Sätze deutlich verfehlt → zurück auf ein
Niveau, bei dem die Ausführung sauber bleibt. In Entlastungswochen bleibt alles stehen.

**Unterstützungsbänder bei Klimmzügen.** Jeder Satz speichert die verwendete Bandstufe.
Ist die Wiederholungsgrenze der Stufe erreicht, wechselt die App aufs nächst schwächere
Band und setzt die Vorgabe zurück — im Verlauf sind die Punkte nach Stufe eingefärbt,
damit ein Bandwechsel nicht wie ein Rückschritt aussieht.

**Laufeinheiten mit persönlichen Zielwerten.** Jede Einheit zeigt konkreten Zielpuls und
Zieltempo statt „zügig" — abgeleitet aus HFmax, Ruhepuls und dem letzten Test. Dazu die
Vorgabe in der Form, in der du sie in die Uhr eintippst (mit Kopierknopf). Gelaufen wird
mit der Garmin, danach trägst du Distanz, Zeit und Puls ein.

**Kurzform für knappe Tage.** Jede Kraft- und Laufeinheit hat eine 20–30-Minuten-Variante,
umschaltbar per Chip. Gekürzt wird immer der Umfang, nie die Intensität — eine halbierte,
aber gleich harte Einheit wirkt deutlich mehr als eine gleich lange, aber verwässerte.

**Spielprotokoll.** Nach dem Spiel Positionierung und Disziplinkontrolle bewerten — mit
beschriebenen Stufen statt nackter 1–5-Skala, damit die Reihe über eine Saison vergleichbar
bleibt. Plus Laufdistanz aus dem Spiel als objektiver Gegenpol zur Selbsteinschätzung.

**Fortschritt.** Verlauf je Übung (bester Satz oder Summe), Kraftvolumen pro Woche,
Laufkilometer pro Woche, Einheiten pro Woche, Bestwerte, Wochen-Serie, Verlauf der beiden
Spielleitungs-Fokuspunkte. Optional Körpergewicht.

---

## Trainingsinhalt

### Krafttraining — zwei Ganzkörper-Workouts im Wechsel

Bei 1–2 Einheiten pro Woche ist Ganzkörper deutlich sinnvoller als ein Split: Selbst wenn
eine Woche nur ein Training zustande kommt, wurde alles belastet.

| Workout A — Drücken & Beine    | Workout B — Ziehen & Rückseite    |
| ------------------------------ | --------------------------------- |
| **Strecksprünge** (Sprungkraft) | **Seitliche Einbeinsprünge**      |
| Liegestütze                    | Klimmzüge                         |
| Bulgarian Split Squat          | Australian Rows (Tischrudern)     |
| Pike Liegestütze               | Nordic Curls                      |
| Wadenheben einbeinig           | Einbeinige Hüftbrücke             |
| Copenhagen Plank               | Einbeiniges Kreuzheben            |
| Dead Bug                       | Seitstütz                         |

Die Sprünge stehen bewusst ganz vorne: Explosivkraft braucht ein ausgeruhtes Nervensystem,
nach vier Sätzen Klimmzügen ist der Reiz nur noch halb so viel wert.

**Jede Übung hat eine Progressionsobergrenze.** Ohne sie würde die App die Vorgabe endlos
hochzählen — nach einem halben Jahr stünden 40 Liegestütze im Satz, und das ist kein
Kraft-, sondern Ausdauertraining. Hypertrophie und Kraft entstehen über einen weiten
Lastbereich, solange die Sätze nah ans Muskelversagen gehen (Schoenfeld et al., J Strength
Cond Res 2017) — bei sehr hohen Wiederholungszahlen fällt der Reiz aber aus diesem Bereich
heraus. Ist die Grenze erreicht, verweist die App auf die schwerere Variante:

| Übung | Grenze | Danach |
| --- | --- | --- |
| Strecksprünge | 8 | Drop Jumps |
| Seitliche Einbeinsprünge | 10 je Bein | Landung 2 s halten |
| Klimmzüge | 12 | Pause oben, langsameres Ablassen |
| Liegestütze | 25 | Füße erhöht |
| Australian Rows | 20 | Füße erhöht |
| Nordic Curls | 12 | größerer Bewegungsumfang |
| Copenhagen Plank | 45 s | unteres Bein anheben |
| Seitstütz | 60 s | Sternstütz |

Die Grenze bei Nordic Curls entspricht dem Endpunkt des Protokolls aus der Feldstudie von
Petersen et al. (3 Sätze × 12 Wiederholungen, über zehn Wochen aufgebaut).

#### Klimmzüge mit Unterstützungsband

Acht Wiederholungen mit orangem Band und acht ohne sind völlig verschiedene Leistungen.
Ohne die Stufe daneben ist die Wiederholungszahl als Verlaufsgröße wertlos — deshalb hängt
an **jedem Satz** die verwendete Stufe.

| Stufe | Unterstützung | Wechsel bei |
| --- | --- | --- |
| Orange | am meisten | 10 saubere Wdh auf allen Sätzen |
| Gelb | mittel | 10 Wdh |
| Grün | wenig | 10 Wdh |
| Ohne Band | keine | Obergrenze 12 Wdh |

Beim Wechsel fällt die Vorgabe auf 5 Wiederholungen zurück. Das ist der Fortschritt, nicht
sein Gegenteil — und der Verlauf färbt die Punkte nach Stufe ein, damit genau das sichtbar
bleibt. Liefen die Sätze einer Einheit auf **unterschiedlichen** Stufen, hält die App die
Vorgabe an: Daraus ließe sich kein Fortschritt ablesen.

Zum Vorgehen selbst: Das Stufenschema ist Trainingspraxis, keine Studienevidenz. Belegt ist,
dass der entscheidende Reiz die Nähe zum Muskelversagen ist (Schoenfeld et al., J Strength
Cond Res 2017) — und die stellt eine passende Bandstärke überhaupt erst her.

**Eine Eigenheit von Bändern:** Ein Band zieht umso stärker, je weiter es gedehnt ist. Beim
Klimmzug heißt das: unten im Hang maximale Unterstützung, oben an der Stange fast keine.
Der obere Teil bleibt also nahezu unassistiert — dort scheitert man zuerst, und das ist
normal. Wer gezielt daran arbeiten will, hängt zwei langsam abgelassene Klimmzüge ohne Band
an; die belasten den gesamten Weg mit vollem Körpergewicht.

**Kraft und Laufen zeitlich trennen.** Ausdauer- und Krafttraining behindern sich, je näher
sie beieinanderliegen (Interferenzeffekt, Metaanalyse von Wilson et al., J Strength Cond
Res 2012 — bei Laufen ausgeprägter als bei Radfahren). Bei zwei plus zwei Einheiten pro
Woche ist das beherrschbar: verschiedene Tage, sonst mindestens sechs Stunden Abstand und
den Lauf zuerst. Die App weist darauf hin, wenn beides in derselben Woche noch offen ist.

Wer am selben Tag die Kombi-Einheit gelaufen ist, lässt den Sprungblock im Krafttraining
weg — zwei bis maximal drei Plyometrie-Einheiten pro Woche sind das sinnvolle Maß
(de Villarreal et al., J Strength Cond Res 2009).

#### Übungen abwählen — ohne den Plan zu zerstören

Unter *Übungen → Übungen auswählen* lässt sich jede der 30 Übungen abschalten. Sie sind
nach **Bewegungsmustern** gruppiert, sodass immer sichtbar ist, welche Alternativen dasselbe
abdecken. Wird eine Übung abgewählt, rückt automatisch eine andere aus demselben Muster nach
— die Struktur des Plans bleibt erhalten, nur die konkrete Übung wechselt.

| Muster | Übungen | Status |
| --- | --- | --- |
| Sprungkraft | Strecksprünge, Seitliche Einbeinsprünge, Pogo-Sprünge | Empfohlen |
| Drücken waagerecht | Liegestütze, Diamant-Liegestütze, Dips | **Pflicht** |
| Drücken über Kopf | Pike Liegestütze, Wandlauf zum Handstand | Optional |
| Ziehen senkrecht | Klimmzüge Ober-/Untergriff | **Pflicht** |
| Ziehen waagerecht | Australian Rows, Türrudern, Rucksack-Rudern | **Pflicht** |
| Beine knie-dominant | Split Squat, Ausfallschritte, Step-ups | **Pflicht** |
| Beine hüft-dominant | Nordic Curls, einbeiniges Kreuzheben, Hüftbrücke, Good Mornings | **Pflicht** |
| Wade | Wadenheben gestreckt / gebeugt | Empfohlen |
| Adduktoren | Copenhagen Plank, Adduktoren-Isometrie | Empfohlen |
| Hüftabduktoren | Seitliches Beinheben | Optional |
| Rumpf gegen Überstreckung | Dead Bug, Unterarmstütz | Empfohlen |
| Rumpf gegen seitliches Kippen | Seitstütz, Koffertragen | Empfohlen |
| Rumpf gegen Rotation | Bird Dog | Optional |

Die **letzte Übung eines Pflichtmusters lässt sich nicht abwählen** — lieber ein gesperrter
Schalter als ein Plan, der stillschweigend eine Körperregion auslässt. Wird ein empfohlenes
Muster leer, erscheint ein Hinweis mit der Begründung.

Die Auswahlseite zeigt außerdem laufend das **Verhältnis von Zug- zu Drucksätzen** pro Woche.
Beide Workouts sind so aufgebaut, dass mindestens so viele Zug- wie Drucksätze zusammenkommen
(aktuell 7:7); abwählen kann das nicht kippen, weil immer eine Übung desselben Musters
nachrückt.

**Zur Einordnung der Push/Pull-Regel:** Dass mindestens ebenso viel gezogen wie gedrückt
werden sollte, ist ein Grundsatz aus der Trainingslehre — begründet damit, dass die
schulterblattführenden Muskeln beim Drücken kaum arbeiten. Die verbreitete Behauptung, viel
Drücken verursache einen Rundrücken, ist dagegen **nicht belegt**: Übersichtsarbeiten finden
zwischen Haltung und Schulter- oder Nackenbeschwerden nur schwache und inkonsistente
Zusammenhänge (u. a. Barrett et al., Manual Therapy 2016). Die App behauptet das deshalb auch
nicht.

**Warum diese Auswahl.** Klimmzüge und Liegestütze decken den Oberkörper gut ab, lassen
aber die drei Lücken offen, die für jemanden mit viel Lauf- und Sprintbelastung
gesundheitlich am wichtigsten sind:

- **Beinrückseite** → Nordic Curls. Die wirksamste bekannte Übung gegen
  Oberschenkelzerrungen: Die Metaanalyse von **van Dyk et al.** (BJSM 2019) kommt über
  mehrere Studien auf rund 50 % weniger Hamstring-Verletzungen, die Feldstudie von
  **Petersen et al.** (AJSM 2011) im dänischen Fußball auf noch deutlichere Werte.
- **Adduktoren / Leiste** → Copenhagen Plank. Klassische Problemzone bei Schiedsrichtern,
  weil viel seitlich und rückwärts gelaufen wird. **Harøy et al.** (BJSM 2019) fanden mit
  einem Adduktorenprogramm rund 41 % weniger Leistenprobleme.
- **Wade / Achillessehne** → einbeiniges Wadenheben. Beim Sprint und Abstoppen wirken
  Kräfte weit über Körpergewicht.

Dazu **Rudern als Gegenspieler zum Drücken** (Haltung, Schultergesundheit) — ohne Geräte
als *Australian Rows* unter einem stabilen Tisch, an einer tief eingehängten Klimmzugstange
oder mit einem Handtuch um die Türklinke. Und eine **einbeinige Beinübung**, weil Laufen
einbeinig passiert und Seitenunterschiede sonst unbemerkt zu Überlastung führen.

Jede Übung hat in der App eine leichtere und eine schwerere Variante hinterlegt.

### Laufen — Ziel Spielfitness

Ein Schiedsrichter läuft im Spiel rund 9–11 km, davon der größte Teil locker, unterbrochen
von 40–60 hochintensiven Antritten. Entscheidend ist nicht Dauerleistung am Stück, sondern
die Fähigkeit, Antritte zu wiederholen und sich dazwischen zu erholen.

Bei ein bis zwei Läufen pro Woche stehen zwei **Kombi-Einheiten** im Zentrum, die den
neuromuskulären und den aeroben Reiz bündeln — erst Sprints und Sprünge im ausgeruhten
Zustand, dann die Intervalle:

| Einheit                             | Zielbereich          | Wofür                                       |
| ----------------------------------- | -------------------- | ------------------------------------------- |
| **Kombi: Sprints + 4 × 4 Minuten**  | 90–95 % HFmax        | Antritt plus maximale Sauerstoffaufnahme    |
| **Kombi: Sprints + 5 × 3 Minuten**  | Kurzintervall-Tempo  | Erholung zwischen wiederholten Antritten    |
| Schiri-Intervalle 75/25             | Schwelle             | Spielrhythmus eins zu eins, Positionierung  |
| Schwellenlauf 2 × 12 Minuten        | 82–88 % HFmax        | Tempo anheben, das 90 Minuten trägt         |
| Fahrtspiel                          | Schwelle             | Tempowechsel, moderat                       |
| Ruhiger Dauerlauf                   | 70–80 % HFmax        | Aerobe Grundlage, schnellere Erholung       |
| Regenerationslauf                   | unter 70 % HFmax     | Entlastungswoche                            |

Die Wochenrotation legt **die intensive Einheit immer auf Position eins**: Wenn nur ein
Lauf klappt, ist es der mit dem größten Effekt. Der ruhige Dauerlauf ist die Ergänzung,
nicht die Basis — für eine echte Grundlagenbasis fehlt bei zwei Läufen pro Woche schlicht
der Umfang.

Das 4×4-Protokoll bei 90–95 % HFmax stammt aus der Untersuchung von **Helgerud et al.**
(Med Sci Sports Exerc, 2007), in der es die maximale Sauerstoffaufnahme deutlich stärker
steigerte als gleich langes Training im moderaten Bereich. Die wiederholten Sprints mit
unvollständiger Pause zielen auf die Wiederherstellung zwischen Belastungen (**Buchheit &
Laursen**, Sports Medicine 2013).

### Kurzformen

Jede Einheit gibt es in zwei Längen. Umgeschaltet wird auf der Startseite (Kraft) bzw. auf
der Laufseite (Laufen).

| Einheit | Voll | Kurz | Was wegfällt |
| --- | --- | --- | --- |
| Workout A / B | 35 Min | 22 Min | Zwei Übungen vom Ende, ein Satz je Übung |
| Kombi 4×4 | 62 Min | 28 Min | 4 × 4 Min → 10 × 30/30, vier statt sechs Sprints |
| Kombi RSA | 58 Min | 26 Min | Intervallblock entfällt, Sprintteil bleibt |
| Schiri-Intervalle | 50 Min | 26 Min | 2 × 8 statt 3 × 10 Wiederholungen |
| Schwellenlauf | 50 Min | 27 Min | Ein Block à 13 Min statt zwei à 12 |
| Fahrtspiel | 45 Min | 25 Min | 6 statt 10 schnelle Minuten |
| Dauerlauf | 50 Min | 28 Min | nur kürzer, gleiches Tempo |

Zwei Prinzipien dahinter:

- **Umfang kürzen, nicht Intensität.** Beim Kombi-4×4 heißt das: statt vier Vier-Minuten-
  Intervallen kommen zehn 30-Sekunden-Wiederholungen mit 30 Sekunden Trabpause. Dieses
  Format sammelt in kurzer Zeit viel Zeit nahe der maximalen Sauerstoffaufnahme
  (Billat et al., Eur J Appl Physiol 2000).
- **Das Aufwärmen bleibt.** Vor Sprints und Sprüngen ist es der Teil, an dem man nicht
  spart — dort wird lieber der Hauptteil gekürzt.

### Leistungsdaten und Zonen

Alle Puls- und Tempovorgaben leiten sich aus fünf Zahlen unter *Mehr → Leistungsdaten* ab:
HFmax, Ruhepuls sowie Distanz, Zeit und Datum des letzten All-out-Tests. Änderst du sie,
ziehen sämtliche Einheiten automatisch nach.

> **Beim ersten Start rechnet die App mit Platzhaltern** (HFmax 185, Ruhepuls 60, 5 km in
> 5:30 min/km). Das sind generische Werte, keine sinnvollen Vorgaben — bis eigene Daten
> hinterlegt sind, weist die App auf der Startseite und in der Zonenübersicht darauf hin.

Die Tempozonen entstehen als Faktoren auf das Testtempo. Ein All-out-Test über 5 bis 6 km
dauert etwa 25 bis 30 Minuten und liegt damit praktisch auf der anaeroben Schwelle — ein
brauchbarer Anker. Die Faktoren sind gegen die VDOT-Tabellen nach Daniels kalibriert; über
den ganzen Leistungsbereich weichen die abgeleiteten Zonen nur um wenige Sekunden pro
Kilometer von den Tabellenwerten ab.

#### Warum die Zonen nicht zu denen der Uhr passen

Es kursieren zwei Zonenmodelle mit denselben Namen:

- **Prozentbänder** (Garmin-Standard): fünf gleich breite Scheiben der HFmax. „Zone 2"
  heißt dort schlicht 60–70 % HFmax — eine rechnerische Grenze ohne physiologischen Bezug.
- **Physiologisches Modell** (Sportwissenschaft, u. a. Seiler & Kjerland, Scand J Med Sci
  Sports 2006): Die Grenzen sind die Laktatschwellen LT1 und LT2. Das, was populär
  „Zone-2-Training" heißt, meint *unterhalb LT1* — und das liegt bei Freizeitsportlern
  typischerweise bei 70–80 % HFmax, nicht bei 60–70 %.

Diese App richtet sich nach dem zweiten Modell und zeigt zu jeder Zone die Garmin-Nummer
dazu. Die Grundlagenzone endet bei 78 % HFmax — bewusst konservativ, weil ein zu harter
„lockerer" Lauf der häufigste Trainingsfehler überhaupt ist. Zwischen Grundlage und
Schwelle steht die **Grauzone** explizit im Modell: zu hart für gute Erholung, zu leicht
für einen echten Reiz. Sie wird im Plan bewusst kaum genutzt.

Im Zweifel entscheidet der Sprechtest, nicht die Zahl.

#### HFmax und Ruhepuls

**Nur die HFmax ist kritisch** — an ihr hängt jede Zonengrenze. Stammt sie aus einer
Faustformel wie 220 minus Alter, kann sie zweistellig danebenliegen; die Streuung dieser
Formel ist seit Langem bekannt (Robergs & Landwehr, J Exerc Physiol 2002). Verlässlicher
ist der höchste Puls, den die Uhr im letzten All-out-Test aufgezeichnet hat.

Der **Ruhepuls verschiebt keine einzige Zonengrenze** — er geht nur in die zusätzlich
angezeigte Karvonen-Angabe ein. Eine Unsicherheit dort ist also unkritisch.

Den Test alle 8–12 Wochen wiederholen. Sonst trainierst du irgendwann nach Zahlen von
gestern.

### Spielleitung

Nach jedem Spiel lassen sich die zwei Fokuspunkte aus den Beobachterbögen bewerten:
**Positionierung** und **Disziplinkontrolle**, jeweils auf einer Skala mit beschriebenen
Stufen (von „oft zu weit weg, Szenen aus der Distanz beurteilt" bis „durchgehend nah dran,
freie Sicht auf alle Zweikämpfe"). Eine nackte 1–5-Skala driftet über eine Saison; mit
Ankertexten bleibt die Reihe vergleichbar.

Dazu Laufdistanz und Puls aus dem Spiel — die Distanz ist der ehrlichste Gradmesser für
Positionierung: Wer nah am Geschehen bleibt, läuft mehr, nicht weniger. Und ein Feld für
die schwierigste Szene, aus dem der nächste Fokuspunkt entsteht.

> Die App ersetzt keinen ärztlichen Rat. Bei Schmerzen, die über normalen Muskelkater
> hinausgehen, pausieren und abklären lassen.

---

## Auf dem Handy installieren

Die App ist eine PWA und lässt sich wie eine normale App auf den Startbildschirm legen:

- **Android / Chrome:** Menü (⋮) → *App installieren* bzw. *Zum Startbildschirm hinzufügen*
- **iPhone / Safari:** Teilen-Symbol → *Zum Home-Bildschirm*

Danach läuft sie im Vollbild und funktioniert offline — auch auf dem Sportplatz ohne Empfang.

---

## Kostenlos deployen (GitHub Pages)

Der Workflow unter `.github/workflows/deploy.yml` ist fertig eingerichtet.

1. Repository auf GitHub anlegen und den Code pushen:

```bash
git init && git add -A && git commit -m "Schiri-Trainer" && git branch -M main
```

```bash
git remote add origin https://github.com/DEIN-NAME/schiri-trainer.git && git push -u origin main
```

2. Auf GitHub unter **Settings → Pages** bei *Source* **GitHub Actions** auswählen.

3. Fertig. Jeder Push auf `main` deployt automatisch nach
   `https://DEIN-NAME.github.io/schiri-trainer/`.

Es sind keine Anpassungen an Pfaden nötig: Der Build nutzt relative Asset-Pfade
(`base: './'`) und die App einen HashRouter. Damit läuft derselbe Build unverändert unter
jedem Unterpfad — auch bei Netlify, Cloudflare Pages oder lokal aus dem `dist`-Ordner.

**Sichtbarkeit:** GitHub Pages ist bei kostenlosen Konten öffentlich. Die App enthält keine
Daten — die liegen ausschließlich auf deinem Gerät. Öffentlich ist also nur der Code samt
Trainingsplan, nicht dein Trainingsverlauf.

---

## Deine Daten

Alles liegt in der **IndexedDB deines Browsers**. Kein Server, kein Konto, keine Kosten.

**Überlebt das Schließen des Browsers?** Ja. IndexedDB liegt auf der Festplatte, nicht im
Arbeitsspeicher — Browser schließen, Rechner neu starten, Tab wegwerfen: alles unkritisch.

Drei Dinge löschen die Daten trotzdem:

1. **Browserdaten löschen** („Cookies und Websitedaten"). Dagegen hilft nur der Export.
2. **Speicherknappheit.** Standardmäßig gilt der Speicher als „best effort" und darf bei
   vollem Datenträger geräumt werden. Die App fordert deshalb beim Start automatisch
   *dauerhaften* Speicher an (Storage API). Chrome und Edge gewähren das meist ohne
   Nachfrage, sobald die Seite als App installiert oder als Lesezeichen gesetzt ist;
   Firefox fragt. Der aktuelle Status steht unter **Mehr → Speicher**.
3. **Safari / iOS**: löscht Website-Daten, die sieben Tage lang nicht benutzt wurden. Diese
   Regel greift **nicht**, wenn die App über *Teilen → Zum Home-Bildschirm* installiert ist.
   Auf dem iPhone also unbedingt installieren, nicht nur im Browser öffnen.

Privates Fenster / Inkognito verliert die Daten grundsätzlich beim Schließen.

Zusätzlich: unter **Mehr → Sicherung herunterladen** gelegentlich eine JSON-Datei
exportieren. Über *Sicherung einspielen* kommt sie auf einem anderen Gerät wieder rein
(ersetzt dort den vorhandenen Bestand vollständig — bewusst kein Zusammenführen, weil dabei
Duplikate praktisch unvermeidbar wären).

---

## Befehle

| Befehl            | Wirkung                                          |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Entwicklungsserver auf Port 5173                 |
| `npm run build`   | Typprüfung und Produktions-Build nach `dist/`    |
| `npm run preview` | Produktions-Build lokal ausliefern               |
| `npm run icons`   | PWA-Icons neu erzeugen (`public/icon-*.png`)     |

---

## Aufbau

```
src/
  domain/          Fachlogik, frei von React
    types.ts       Datenmodell
    exercises.ts   Übungsbibliothek mit Ausführung und Varianten
    workouts.ts    Workout A und B
    zones.ts       Puls- und Tempozonen aus den Leistungsdaten
    runs.ts        Laufeinheiten inklusive Garmin-Vorgaben
    plan.ts        4-Wochen-Blöcke, Wochenplan, Entlastungswoche
    progression.ts Automatische Anpassung der Vorgaben
  db/              Dexie/IndexedDB: Schema, Sicherung, Schreiboperationen
  hooks/           Pausentimer, Wake Lock, Datenzugriff
  components/      Navigation, Diagramme, Timer-Leiste, Icons
  pages/           Heute, Krafteinheit, Lauf, Spiel, Fortschritt, Übungen, Verlauf, Mehr
  lib/             Datum, Statistik, Ton und Vibration
```

Übungen, Workouts und Laufeinheiten stehen bewusst **als Code, nicht in der Datenbank**.
So lässt sich der Plan ändern, ohne über Datenmigrationen nachdenken zu müssen; in der
Datenbank steht nur, was du tatsächlich getan hast.

Neue Übung hinzufügen: Eintrag in `src/domain/exercises.ts` ergänzen und in
`src/domain/workouts.ts` in ein Workout aufnehmen. Mehr ist nicht nötig.
