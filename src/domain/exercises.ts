import type { Exercise } from './types'
import { PATTERNS } from './patterns'

/**
 * Übungsbibliothek für Training ohne Geräte, geordnet nach Bewegungsmustern.
 *
 * Zu jedem Muster gibt es mehrere Übungen, die einander ersetzen können. Wird eine
 * Übung abgewählt, rückt eine andere aus demselben Muster nach — der Plan bleibt
 * dadurch vollständig, egal welche einzelne Übung jemandem nicht liegt.
 *
 * Vorausgesetzte Ausstattung: Klimmzugstange, ein stabiler Tisch, ein Stuhl oder
 * Sofa, ein Handtuch, ein Rucksack. Mehr braucht keine Übung hier.
 */
export const EXERCISES: Exercise[] = [
  // ══ Sprungkraft ══════════════════════════════════════════════════════════
  {
    key: 'cmj',
    name: 'Strecksprünge',
    pattern: 'plyo',
    unilateral: false,
    unit: 'reps',
    why: 'Explosivkraft für den Antritt aus dem Stand. Genau die Fähigkeit, die darüber entscheidet, ob du beim Umschaltmoment die ersten fünf Meter mitgehst — und die reines Ausdauertraining nicht mit abdeckt.',
    setup:
      'Schulterbreiter Stand, Arme locker. Zügig in die Halbkniebeuge absenken und ohne Pause maximal hoch abspringen.',
    cues: [
      'Der Wechsel von unten nach oben passiert so schnell wie möglich — keine Pause in der Hocke',
      'Arme aktiv mit nach oben reißen',
      'Weich über den Ballen landen; federn die Knie nach innen weg, Satz beenden',
    ],
    easier: 'Nur bis zur halben Höhe springen, dafür sauber landen. Oder aus der Hocke ohne Gegenbewegung.',
    harder: 'Aus 30 cm Höhe herabspringen und sofort maximal hochspringen (Drop Jump).',
    startTarget: 5,
    increment: 1,
    maxTarget: 8,
  },
  {
    key: 'lateral_hop',
    name: 'Seitliche Einbeinsprünge',
    pattern: 'plyo',
    unilateral: true,
    unit: 'reps',
    why: 'Richtungswechsel und Sprunggelenkstabilität in einem. Auf unebenem Rasen ist das die Bewegung, die vor dem Umknicken schützt — und zugleich die, mit der du dich seitlich zur Diagonalen versetzt.',
    setup:
      'Auf einem Bein stehen, eine gedachte Linie oder ein Handtuch am Boden als Markierung. Seitlich darüber springen und auf demselben Bein landen.',
    cues: [
      'Landung kurz stabilisieren, bevor der nächste Sprung kommt',
      'Knie zeigt über den Fuß, nicht nach innen',
      'Erst wenn die Landung sicher steht, schneller springen',
    ],
    easier: 'Beidbeinig springen, oder einbeinig nur hin und zurück mit kurzem Halt.',
    harder: 'Nach jeder Landung 2 Sekunden ruhig stehen bleiben, oder mit geschlossenen Augen.',
    startTarget: 6,
    increment: 1,
    maxTarget: 10,
  },
  {
    key: 'pogo',
    name: 'Pogo-Sprünge',
    pattern: 'plyo',
    unilateral: false,
    unit: 'reps',
    why: 'Trainiert die Federwirkung von Achillessehne und Fußgewölbe — den Teil der Laufökonomie, der ohne Muskelarbeit auskommt. Ergänzt Strecksprünge, die eher die Hüftstreckung treffen.',
    setup:
      'Aufrechter Stand, Knie fast durchgestreckt. Nur aus dem Sprunggelenk kleine, schnelle Sprünge am Ort.',
    cues: [
      'Bodenkontakt so kurz wie möglich — der Boden ist heiß',
      'Knie bleiben nahezu gestreckt, die Bewegung kommt aus dem Fuß',
      'Rhythmus zählt mehr als Höhe',
    ],
    easier: 'Kleinere Sprünge, mehr Kniebeugung zulassen.',
    harder: 'Einbeinig ausführen, oder Bodenkontaktzeit bewusst weiter verkürzen.',
    startTarget: 20,
    increment: 5,
    maxTarget: 40,
  },

  // ══ Drücken waagerecht ═══════════════════════════════════════════════════
  {
    key: 'pushup',
    name: 'Liegestütze',
    pattern: 'push_horizontal',
    unilateral: false,
    unit: 'reps',
    why: 'Brust, Trizeps, vordere Schulter – und nebenbei kräftige Rumpfarbeit, weil der Körper die Linie halten muss.',
    setup: 'Hände etwas weiter als schulterbreit, Finger nach vorne, Körper gestreckt, Gesäß angespannt.',
    cues: [
      'Ellenbogen etwa 45 Grad zum Körper, nicht seitlich abspreizen',
      'Brust bis knapp über den Boden',
      'Gesäß mitspannen, damit die Hüfte nicht durchhängt',
    ],
    easier: 'Hände auf eine Tischkante oder Treppenstufe – je höher, desto leichter.',
    harder: 'Füße erhöht auf einen Stuhl, oder 2 Sekunden Pause unten.',
    startTarget: 12,
    increment: 2,
    maxTarget: 25,
  },
  {
    key: 'diamond_pushup',
    name: 'Diamant-Liegestütze',
    pattern: 'push_horizontal',
    unilateral: false,
    unit: 'reps',
    why: 'Enge Handstellung verlagert die Arbeit deutlich auf den Trizeps. Sinnvolle Alternative, wenn breite Liegestütze in der Schulter zwicken — der engere Griff ist für viele die angenehmere Variante.',
    setup:
      'Wie ein Liegestütz, aber Daumen und Zeigefinger berühren sich unter der Brust und bilden ein Dreieck.',
    cues: [
      'Ellenbogen eng am Körper nach hinten führen',
      'Brust zu den Händen senken, nicht der Kopf',
      'Körper bleibt eine Linie',
    ],
    easier: 'Hände auf einer Erhöhung, oder Hände etwas weiter auseinander.',
    harder: 'Füße erhöht, oder 2 Sekunden Pause unten.',
    startTarget: 6,
    increment: 1,
    maxTarget: 20,
  },
  {
    key: 'dips_chair',
    name: 'Dips zwischen zwei Stühlen',
    pattern: 'push_horizontal',
    unilateral: false,
    unit: 'reps',
    why: 'Trifft Trizeps und untere Brust stärker als jeder Liegestütz. Achtung: In der tiefen Position steht die Schulter unter Zug — wer dort Beschwerden hat, bleibt besser bei Liegestützen.',
    setup:
      'Zwei stabile, gleich hohe Stühle mit Lehne nach außen. Hände auf den Sitzflächen, Körper dazwischen, Beine nach vorne gestreckt oder angewinkelt.',
    cues: [
      'Nur so tief, bis der Oberarm etwa waagerecht ist — nicht tiefer',
      'Schultern bewusst nach unten ziehen, nicht zu den Ohren hochkommen lassen',
      'Oberkörper aufrecht halten',
    ],
    easier: 'Füße am Boden lassen und mit den Beinen mitschieben. Oder Bankdips mit Gesäß vor einer Stuhlkante.',
    harder: 'Beine gestreckt auf einen dritten Stuhl legen, oder Rucksack aufsetzen.',
    startTarget: 8,
    increment: 1,
    maxTarget: 20,
  },

  // ══ Drücken über Kopf ════════════════════════════════════════════════════
  {
    key: 'pike_pushup',
    name: 'Pike Liegestütze',
    pattern: 'push_vertical',
    unilateral: false,
    unit: 'reps',
    why: 'Überkopf-Drücken ohne Gewichte. Kräftigt die Schulter in der Position, die beim normalen Liegestütz fehlt – wichtig für ein rundum belastbares Schultergelenk.',
    setup:
      'Aus dem Liegestütz die Hüfte hochschieben, bis der Körper ein umgekehrtes V bildet. Füße näher an die Hände, Blick zwischen die Füße.',
    cues: [
      'Scheitel Richtung Boden zwischen die Hände senken',
      'Hüfte bleibt oben, nicht in den Liegestütz abkippen',
      'Ellenbogen nach schräg hinten, nicht breit ausstellen',
    ],
    easier: 'Hände auf eine Erhöhung, oder die Hüfte weniger stark anheben.',
    harder: 'Füße auf einen Stuhl, sodass der Oberkörper fast senkrecht steht.',
    startTarget: 6,
    increment: 1,
    maxTarget: 15,
  },
  {
    key: 'wall_walk',
    name: 'Wandlauf zum Handstand',
    pattern: 'push_vertical',
    unilateral: false,
    unit: 'reps',
    why: 'Bringt die Schulter kontrolliert in die volle Überkopfposition und kräftigt sie dort haltend. Anspruchsvoller als Pike Liegestütze, dafür ohne Belastungsspitze.',
    setup:
      'Mit den Füßen an einer freien Wand im Liegestütz starten, Füße an der Wand. Schrittweise die Wand hochlaufen und die Hände dabei näher zur Wand setzen.',
    cues: [
      'Nur so weit hoch, wie du kontrolliert wieder zurückkommst',
      'Rippen unten lassen, kein Hohlkreuz',
      'Schultern aktiv wegdrücken, nicht durchhängen',
    ],
    easier: 'Nur zwei, drei Schritte hoch und wieder zurück.',
    harder: 'Oben 10 Sekunden halten, bevor du zurückläufst.',
    startTarget: 3,
    increment: 1,
    maxTarget: 8,
  },

  // ══ Ziehen senkrecht ═════════════════════════════════════════════════════
  {
    key: 'pullup',
    name: 'Klimmzüge (Obergriff)',
    pattern: 'pull_vertical',
    unilateral: false,
    unit: 'reps',
    why: 'Stärkster Reiz für oberen Rücken, Latissimus und Griffkraft. Gegenspieler zum Drücken über Kopf.',
    setup:
      'Stange etwas weiter als schulterbreit im Obergriff fassen, aus dem Hängen starten, Schultern aktiv nach unten ziehen.',
    cues: [
      'Erst Schulterblätter nach unten ziehen, dann erst die Arme beugen',
      'Rippen unten lassen, kein Hohlkreuz',
      'Ablassen langsam über 2–3 Sekunden, nicht fallen lassen',
    ],
    easier:
      'Stärkeres Unterstützungsband einhängen. Oder negative Klimmzüge: hochspringen, dann 5 Sekunden langsam ablassen.',
    harder:
      'Schwächeres Band, 2 Sekunden Pause oben, oder auf 4 Sekunden verlangsamtes Ablassen.',
    assistLadder: 'band',
    assistStepUpAt: 10,
    assistResetTarget: 5,
    startTarget: 8,
    increment: 1,
    maxTarget: 12,
  },
  {
    key: 'chinup',
    name: 'Klimmzüge (Untergriff)',
    pattern: 'pull_vertical',
    unilateral: false,
    unit: 'reps',
    why: 'Derselbe Zug senkrecht, aber mit deutlich mehr Bizeps-Anteil und für die meisten in der Schulter angenehmer. Wer mit Obergriff nicht auf brauchbare Wiederholungszahlen kommt, baut hier die Grundlage auf.',
    setup: 'Stange schulterbreit im Untergriff fassen, Handflächen zeigen zu dir.',
    cues: [
      'Ellenbogen nach unten Richtung Rippen ziehen',
      'Brust zur Stange führen, nicht das Kinn strecken',
      'Kontrolliert ablassen bis in die volle Streckung',
    ],
    easier: 'Stärkeres Band, oder nur der langsam abgelassene Teil.',
    harder: 'Schwächeres Band, Pause oben, oder langsameres Ablassen.',
    assistLadder: 'band',
    assistStepUpAt: 12,
    assistResetTarget: 6,
    startTarget: 8,
    increment: 1,
    maxTarget: 14,
  },

  // ══ Ziehen waagerecht ════════════════════════════════════════════════════
  {
    key: 'row_inverted',
    name: 'Australian Rows (Tischrudern)',
    pattern: 'pull_horizontal',
    unilateral: false,
    unit: 'reps',
    why: 'Der Geräte-Ersatz fürs Rudern und der direkte Gegenspieler zum Liegestütz: Er trifft mittleren Trapez, Rautenmuskeln und hintere Schulter — genau die Muskeln, die beim Drücken nichts zu tun haben.',
    setup:
      'Unter einen stabilen Tisch legen, Tischkante schulterbreit greifen, Körper gestreckt, Fersen am Boden. Alternativ die Klimmzugstange tief einhängen.',
    cues: [
      'Körper bleibt ein Brett von Ferse bis Kopf',
      'Brust zur Tischkante ziehen, Ellenbogen eng am Körper',
      'Oben kurz halten, Schulterblätter zusammenziehen',
    ],
    easier: 'Knie beugen und Füße näher heranstellen – je aufrechter, desto leichter.',
    harder: 'Füße auf einen Stuhl legen, sodass der Körper waagerecht oder tiefer liegt.',
    startTarget: 10,
    increment: 1,
    maxTarget: 20,
  },
  {
    key: 'door_row',
    name: 'Türrudern mit Handtuch',
    pattern: 'pull_horizontal',
    unilateral: false,
    unit: 'reps',
    why: 'Braucht wirklich nichts außer einer Tür und einem Handtuch. Der Widerstand lässt sich stufenlos über die Fußstellung regeln, was den Einstieg leichter macht als beim Tischrudern.',
    setup:
      'Handtuch um beide Türklinken einer geschlossenen, verriegelten Tür legen. Vor der Türkante stehen, Füße nah an der Zarge, mit gestreckten Armen zurücklehnen.',
    cues: [
      'Körper bleibt gestreckt, die Bewegung kommt aus den Armen und dem Rücken',
      'Schulterblätter aktiv zusammenziehen, bevor die Ellenbogen beugen',
      'Je weiter die Füße nach vorne, desto schwerer',
    ],
    easier: 'Aufrechter stehen, Füße weiter zurück.',
    harder: 'Füße weiter nach vorne, bis der Oberkörper deutlich nach hinten geneigt ist.',
    startTarget: 12,
    increment: 2,
    maxTarget: 25,
  },
  {
    key: 'backpack_row',
    name: 'Einarmiges Rudern mit Rucksack',
    pattern: 'pull_horizontal',
    unilateral: true,
    unit: 'reps',
    why: 'Die einzige Zugübung im Plan, bei der du die Last frei wählen kannst — mit Büchern oder Wasserflaschen im Rucksack. Einarmig, dadurch größerer Bewegungsweg und beide Seiten einzeln belastet.',
    setup:
      'Eine Hand und ein Knie auf einem Stuhl oder Sofa abstützen, Rücken waagerecht und gerade. Der Rucksack hängt in der freien Hand.',
    cues: [
      'Rucksack Richtung Hüfte ziehen, Ellenbogen dicht am Körper',
      'Schulter oben nicht mitdrehen — der Oberkörper bleibt ruhig',
      'Unten voll ausstrecken und die Schulter nachgeben lassen',
    ],
    easier: 'Weniger Gewicht in den Rucksack.',
    harder: 'Mehr Gewicht, oder oben eine Sekunde halten.',
    startTarget: 12,
    increment: 1,
    maxTarget: 20,
  },

  // ══ Beine knie-dominant ══════════════════════════════════════════════════
  {
    key: 'split_squat',
    name: 'Bulgarian Split Squat',
    pattern: 'knee',
    unilateral: true,
    unit: 'reps',
    why: 'Die stärkste Beinübung ohne Gewichte. Einbeinig – und damit genau so, wie Laufen tatsächlich passiert. Deckt außerdem Seitenunterschiede auf, die sonst zu Überlastung führen.',
    setup:
      'Rücken zum Stuhl oder Sofa, hinteren Fußspann auf die Sitzfläche legen, vorderer Fuß etwa einen großen Schritt davor.',
    cues: [
      'Oberkörper leicht nach vorne geneigt, Gewicht auf der ganzen vorderen Fußsohle',
      'Hinteres Knie Richtung Boden senken, vorderes Knie bleibt über dem Fuß',
      'Kontrolliert runter, kraftvoll hoch',
    ],
    easier: 'Hinteren Fuß auf den Boden statt erhöht stellen.',
    harder: 'Unten 2 Sekunden halten, oder einen Rucksack mit Büchern aufsetzen.',
    startTarget: 8,
    increment: 1,
    maxTarget: 15,
  },
  {
    key: 'lunge_walk',
    name: 'Ausfallschritte gehend',
    pattern: 'knee',
    unilateral: true,
    unit: 'reps',
    why: 'Wie der Split Squat einbeinig, aber mit Vorwärtsbewegung und damit näher am Laufen. Weniger Belastung auf einem Punkt, dafür mehr Anspruch an das Gleichgewicht.',
    setup: 'Aufrechter Stand, Hände an der Hüfte. Ein großer Schritt nach vorne.',
    cues: [
      'Hinteres Knie fast bis zum Boden senken',
      'Oberkörper aufrecht, nicht nach vorne kippen',
      'Aus der Ferse des vorderen Beins nach oben und direkt in den nächsten Schritt',
    ],
    easier: 'Am Platz statt gehend, mit kurzem Halt zwischen den Wiederholungen.',
    harder: 'Rucksack aufsetzen, oder das hintere Knie kurz vor dem Boden 2 Sekunden halten.',
    startTarget: 10,
    increment: 2,
    maxTarget: 20,
  },
  {
    key: 'step_up',
    name: 'Step-ups auf einen Stuhl',
    pattern: 'knee',
    unilateral: true,
    unit: 'reps',
    why: 'Die knieschonendste der drei einbeinigen Beinübungen, weil der Bewegungsweg kürzer ist und keine Landung stattfindet. Gute Wahl bei Kniebeschwerden.',
    setup:
      'Vor einem stabilen Stuhl oder einer Treppenstufe stehen. Einen Fuß komplett auf die Fläche setzen.',
    cues: [
      'Das obere Bein macht die Arbeit — nicht mit dem unteren abstoßen',
      'Kontrolliert wieder absenken, nicht fallen lassen',
      'Knie zeigt über den Fuß',
    ],
    easier: 'Niedrigere Stufe wählen.',
    harder: 'Höhere Stufe, Rucksack, oder oben das freie Knie anziehen.',
    startTarget: 10,
    increment: 2,
    maxTarget: 20,
  },

  // ══ Beine hüft-dominant ══════════════════════════════════════════════════
  {
    key: 'nordic_curl',
    name: 'Nordic Curls',
    pattern: 'hinge',
    unilateral: false,
    unit: 'reps',
    why: 'Die wirksamste bekannte Übung gegen Oberschenkelzerrungen: Die Metaanalyse von van Dyk et al. (BJSM 2019) kommt über mehrere Studien auf etwa halb so viele Hamstring-Verletzungen. Für jemanden, der aus dem Stand antreten muss, die wichtigste Einzelübung im Plan.',
    setup:
      'Auf die Knie (Kissen unterlegen), Füße von jemandem halten lassen oder unter Sofakante, Heizkörper oder Türzarge klemmen. Körper von Knie bis Kopf gestreckt.',
    cues: [
      'So langsam wie möglich nach vorne absenken, Hüfte bleibt gestreckt',
      'Erst am letzten Punkt mit den Händen abfangen',
      'Mit den Armen hochdrücken – der Weg nach unten ist die Übung',
    ],
    easier:
      'Nur bis zur Hälfte absenken. Oder Razor Curl: Hände auf einem Stuhl abstützen und aktiv mitdrücken.',
    harder: 'Absenken auf 5+ Sekunden strecken, oder Arme vor der Brust verschränken.',
    startTarget: 4,
    increment: 1,
    maxTarget: 12,
  },
  {
    key: 'sl_rdl',
    name: 'Einbeiniges Kreuzheben',
    pattern: 'hinge',
    unilateral: true,
    unit: 'reps',
    why: 'Trainiert Beinrückseite und Gleichgewicht gleichzeitig – genau die Fähigkeit, die auf unebenem Rasen und bei schnellen Richtungswechseln vor dem Umknicken schützt.',
    setup: 'Auf einem Bein stehen, Standbein-Knie ganz leicht gebeugt.',
    cues: [
      'Hüfte nach hinten schieben, Oberkörper kippt nach vorne',
      'Freies Bein streckt sich nach hinten, der Körper bildet eine Waage',
      'Rücken bleibt gerade, Hüfte waagerecht – nicht zur Seite kippen',
    ],
    easier: 'Mit einer Hand leicht an einer Wand abstützen.',
    harder: 'Augen schließen, oder in jeder Hand eine gefüllte Wasserflasche halten.',
    startTarget: 8,
    increment: 1,
    maxTarget: 15,
  },
  {
    key: 'sl_hip_thrust',
    name: 'Einbeinige Hüftbrücke',
    pattern: 'hinge',
    unilateral: true,
    unit: 'reps',
    why: 'Kräftigt den Gesäßmuskel, der beim Antritt die eigentliche Arbeit macht. Die gelenkschonendste Übung dieses Musters und deshalb auch bei müden Beinen machbar.',
    setup:
      'Rückenlage, ein Fuß aufgestellt, das andere Bein angehoben oder gestreckt in der Luft. Arme neben dem Körper.',
    cues: [
      'Hüfte nur durch Anspannen des Gesäßes hochdrücken',
      'Oben eine gerade Linie Knie–Hüfte–Schulter, 1 Sekunde halten',
      'Nicht ins Hohlkreuz ausweichen – Rippen unten lassen',
    ],
    easier: 'Beidbeinig ausführen.',
    harder: 'Schultern auf einer Sofakante ablegen, oder den Fuß erhöht auf einen Stuhl stellen.',
    startTarget: 10,
    increment: 2,
    maxTarget: 20,
  },
  {
    key: 'good_morning',
    name: 'Good Mornings',
    pattern: 'hinge',
    unilateral: false,
    unit: 'reps',
    why: 'Die reine Hüftbeugebewegung beidbeinig — gut geeignet, um das Muster überhaupt erst zu lernen, bevor es einbeinig oder mit Nordic Curls schwer wird.',
    setup: 'Hüftbreiter Stand, Hände an den Schläfen oder vor der Brust, Knie leicht gebeugt.',
    cues: [
      'Hüfte nach hinten schieben, bis es in der Beinrückseite zieht',
      'Rücken bleibt die ganze Zeit gerade — kein Rundrücken',
      'Nur so weit vorbeugen, wie der Rücken gerade bleibt',
    ],
    easier: 'Kleinerer Bewegungsweg, Hände vor der Brust.',
    harder: 'Rucksack aufsetzen, oder unten 2 Sekunden halten.',
    startTarget: 12,
    increment: 2,
    maxTarget: 20,
  },

  // ══ Wade und Achillessehne ═══════════════════════════════════════════════
  {
    key: 'calf_raise',
    name: 'Wadenheben einbeinig',
    pattern: 'calf',
    unilateral: true,
    unit: 'reps',
    why: 'Die wichtigste Vorsorge für Achillessehne und Wade. Beim Sprint und beim Abstoppen wirken Kräfte weit über Körpergewicht – eine belastbare Wade ist der beste Schutz vor Achillesbeschwerden.',
    setup:
      'Mit dem Ballen eines Fußes auf einer Treppenstufe stehen, Ferse frei hängend. Mit einer Hand am Geländer nur balancieren, nicht ziehen.',
    cues: [
      'Ferse tief absenken, bis es in der Wade zieht',
      'Langsam hoch bis ganz auf den Ballen, oben 1 Sekunde halten',
      'Ablassen betont langsam – der Absenkteil bringt den Sehnenreiz',
    ],
    easier: 'Beidbeinig ausführen, oder auf flachem Boden statt an der Stufe.',
    harder: 'Rucksack tragen, oder das Ablassen auf 5 Sekunden strecken.',
    startTarget: 12,
    increment: 2,
    maxTarget: 25,
  },
  {
    key: 'calf_raise_bent',
    name: 'Wadenheben mit gebeugtem Knie',
    pattern: 'calf',
    unilateral: true,
    unit: 'reps',
    why: 'Trifft den tiefer liegenden Schollenmuskel, der beim gestreckten Wadenheben kaum mitarbeitet — im Dauerlauf aber den größeren Anteil trägt. Sinnvolle Ergänzung oder Alternative.',
    setup:
      'Wie beim einbeinigen Wadenheben, aber das Knie des Standbeins etwa 30 Grad gebeugt und während der ganzen Bewegung gebeugt lassen.',
    cues: [
      'Kniewinkel bleibt konstant — nicht mit dem Bein mitdrücken',
      'Ferse tief absenken, dann langsam auf den Ballen',
      'Deutlich weniger Kraft als gestreckt, das ist normal',
    ],
    easier: 'Beidbeinig ausführen.',
    harder: 'Rucksack tragen, oder langsameres Ablassen.',
    startTarget: 12,
    increment: 2,
    maxTarget: 25,
  },

  // ══ Adduktoren und Leiste ════════════════════════════════════════════════
  {
    key: 'copenhagen',
    name: 'Copenhagen Plank',
    pattern: 'adduction',
    unilateral: true,
    unit: 'seconds',
    why: 'Kräftigt die Adduktoren. Die Leiste ist bei Schiedsrichtern und Fußballern eine der häufigsten Problemzonen, weil viel seitlich und rückwärts gelaufen wird — Harøy et al. (BJSM 2019) fanden mit einem Adduktorenprogramm rund 41 Prozent weniger Leistenprobleme.',
    setup:
      'Seitlage im Unterarmstütz, oberes Bein mit dem Innenknöchel auf einer Stuhl- oder Sofakante ablegen. Unteres Bein hängt frei.',
    cues: [
      'Hüfte hochdrücken, bis der Körper eine gerade Linie bildet',
      'Das obere Bein drückt aktiv gegen die Auflage',
      'Nicht nach vorne oder hinten kippen',
    ],
    easier:
      'Statt des Knöchels das Knie des oberen Beins auflegen – deutlich kürzerer Hebel. Oder das untere Bein am Boden lassen.',
    harder: 'Unteres Bein zusätzlich frei anheben und heranziehen.',
    startTarget: 20,
    increment: 5,
    maxTarget: 45,
  },
  {
    key: 'adductor_squeeze',
    name: 'Adduktoren-Isometrie',
    pattern: 'adduction',
    unilateral: false,
    unit: 'seconds',
    why: 'Dieselbe Muskulatur wie der Copenhagen Plank, aber ohne Hebel und ohne Belastungsspitze. Die Variante für Tage mit Leistenbeschwerden — und der sinnvolle Einstieg, wenn der Copenhagen Plank noch zu schwer ist.',
    setup:
      'Rückenlage, Knie angewinkelt und aufgestellt. Ein zusammengerolltes Handtuch, Kissen oder einen Ball zwischen die Knie klemmen.',
    cues: [
      'Knie fest zusammendrücken und die Spannung halten',
      'Etwa 70 Prozent der maximalen Kraft, nicht bis zum Zittern',
      'Ruhig weiteratmen, Gesäß bleibt am Boden',
    ],
    easier: 'Weniger fest drücken, kürzer halten.',
    harder: 'Beine weiter strecken, sodass der Hebel länger wird.',
    startTarget: 30,
    increment: 5,
    maxTarget: 60,
  },

  // ══ Hüftabduktoren ═══════════════════════════════════════════════════════
  {
    key: 'side_leg_raise',
    name: 'Seitliches Beinheben',
    pattern: 'abduction',
    unilateral: true,
    unit: 'reps',
    why: 'Kräftigt den mittleren Gesäßmuskel, der beim einbeinigen Stand das Becken waagerecht hält. Ob das Laufbeschwerden verhindert, ist in Studien nicht eindeutig belegt — die Übung kostet aber kaum Zeit.',
    setup:
      'Seitlage, unterer Arm als Kopfstütze, Beine gestreckt übereinander. Der Körper bildet eine Linie.',
    cues: [
      'Oberes Bein gestreckt anheben, Fußspitze leicht nach unten gedreht',
      'Nicht nach vorne kippen — der Oberkörper bleibt ruhig',
      'Langsam absenken, ohne das Bein abzulegen',
    ],
    easier: 'Kleinerer Bewegungsweg, unteres Bein anwinkeln für mehr Stabilität.',
    harder: 'Oben 2 Sekunden halten, oder einen Rucksack auf den Oberschenkel legen.',
    startTarget: 12,
    increment: 2,
    maxTarget: 25,
  },

  // ══ Rumpf gegen Überstreckung ════════════════════════════════════════════
  {
    key: 'dead_bug',
    name: 'Dead Bug',
    pattern: 'core_antiextension',
    unilateral: false,
    unit: 'reps',
    why: 'Bringt dem Rumpf bei, stabil zu bleiben, während Arme und Beine unabhängig arbeiten. Rückenschonender als Sit-ups und überträgt sich besser aufs Laufen.',
    setup:
      'Rückenlage, Arme senkrecht nach oben, Hüfte und Knie im rechten Winkel. Der untere Rücken hat Bodenkontakt.',
    cues: [
      'Lendenwirbelsäule bleibt die ganze Zeit an den Boden gedrückt',
      'Gegengleich: rechter Arm nach hinten, linkes Bein nach vorne strecken',
      'Langsam, mit Ausatmen bei der Streckung',
    ],
    easier: 'Nur die Arme oder nur die Beine bewegen.',
    harder: 'Langsamer, größerer Streckweg, Ferse knapp über dem Boden halten.',
    startTarget: 10,
    increment: 2,
    maxTarget: 20,
  },
  {
    key: 'plank',
    name: 'Unterarmstütz',
    pattern: 'core_antiextension',
    unilateral: false,
    unit: 'seconds',
    why: 'Dieselbe Aufgabe wie beim Dead Bug — die Lendenwirbelsäule gegen das Durchhängen halten — nur haltend statt bewegt. Die einfachere und selbsterklärendere Variante.',
    setup: 'Unterarme unter den Schultern, Beine gestreckt, Körper eine Linie von Ferse bis Kopf.',
    cues: [
      'Gesäß und Bauch gleichzeitig anspannen, Becken leicht aufrichten',
      'Hüfte weder durchhängen noch nach oben schieben',
      'Ruhig weiteratmen — wer die Luft anhält, hält nur scheinbar länger',
    ],
    easier: 'Knie am Boden ablegen, oder Unterarme auf einer Erhöhung.',
    harder: 'Einen Arm oder ein Bein anheben, oder Füße auf einer Erhöhung.',
    startTarget: 40,
    increment: 10,
    maxTarget: 90,
  },

  // ══ Rumpf gegen seitliches Kippen ════════════════════════════════════════
  {
    key: 'side_plank',
    name: 'Seitstütz',
    pattern: 'core_antilateral',
    unilateral: true,
    unit: 'seconds',
    why: 'Stabilisiert die seitliche Rumpfkette und verhindert das Absacken der Hüfte beim Laufen, das langfristig zu Knie- und ITB-Beschwerden führt.',
    setup: 'Seitlage, Unterarm unter der Schulter, Füße übereinander oder versetzt.',
    cues: ['Hüfte aktiv hochdrücken', 'Kopf in Verlängerung der Wirbelsäule', 'Ruhig weiteratmen'],
    easier: 'Knie am Boden ablegen und ab dem Knie stützen.',
    harder: 'Oberen Arm und oberes Bein gleichzeitig anheben (Sternstütz).',
    startTarget: 30,
    increment: 5,
    maxTarget: 60,
  },
  {
    key: 'suitcase_carry',
    name: 'Koffertragen',
    pattern: 'core_antilateral',
    unilateral: true,
    unit: 'seconds',
    why: 'Dieselbe seitliche Stabilisation wie der Seitstütz, aber im Gehen und damit näher an dem, was der Rumpf beim Laufen leisten muss. Trainiert nebenbei die Griffkraft.',
    setup:
      'Einen gut gefüllten Rucksack an einem Griff in einer Hand halten. Aufrecht stehen, Schultern waagerecht.',
    cues: [
      'Nicht zur Gegenseite lehnen — der Oberkörper bleibt senkrecht',
      'Schulter der Lastseite bewusst unten halten',
      'Ruhig und gleichmäßig gehen',
    ],
    easier: 'Weniger Gewicht, kürzere Zeit.',
    harder: 'Mehr Gewicht, oder auf einer gedachten Linie gehen.',
    startTarget: 30,
    increment: 10,
    maxTarget: 60,
  },

  // ══ Rumpf gegen Rotation ═════════════════════════════════════════════════
  {
    key: 'bird_dog',
    name: 'Bird Dog',
    pattern: 'core_antirotation',
    unilateral: true,
    unit: 'reps',
    why: 'Die dritte Stabilisationsrichtung: Der Rumpf muss der Verdrehung widerstehen, während gegenüberliegender Arm und Bein strecken. Kräftigt zusätzlich die tiefen Rückenstrecker.',
    setup: 'Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte, Rücken gerade.',
    cues: [
      'Gegengleich strecken: rechter Arm, linkes Bein',
      'Hüfte bleibt waagerecht — kein Ausweichen zur Seite',
      'Oben 2 Sekunden halten, dann kontrolliert zurück',
    ],
    easier: 'Nur den Arm oder nur das Bein strecken.',
    harder: 'Oben länger halten, oder Ellenbogen und Knie unter dem Bauch zusammenführen.',
    startTarget: 10,
    increment: 2,
    maxTarget: 20,
  },
]

export const EXERCISE_BY_KEY: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.key, e]),
)

export function getExercise(key: string): Exercise {
  const ex = EXERCISE_BY_KEY[key]
  if (!ex) throw new Error(`Unbekannte Übung: ${key}`)
  return ex
}

/** Alle Übungen eines Bewegungsmusters, in der Reihenfolge der Bibliothek. */
export function exercisesForPattern(patternKey: string): Exercise[] {
  return EXERCISES.filter((e) => e.pattern === patternKey)
}

/** Übungen nach Muster gruppiert, in der Reihenfolge der Musterliste. */
export function exercisesByPattern(): { pattern: string; exercises: Exercise[] }[] {
  return PATTERNS.map((p) => ({ pattern: p.key, exercises: exercisesForPattern(p.key) })).filter(
    (g) => g.exercises.length > 0,
  )
}
