import React from "react";

const COMPLIANCE = {
  "Bayern": {
    type: "warning",
    text: `Bundesland: Bayern
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD (wenn du die Trichinenprobe selbst entnimmst)
Zuständige Behörde: Landratsamt / Veterinäramt
Rechtsgrundlage: BayJG + § 2b Tier-LMHV
Bei Schalenwild (Reh, Hirsch etc.): Keine Pflicht`
  },
  "Baden-Württemberg": {
    type: "warning",
    text: `Bundesland: Baden-Württemberg
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD
Besonderheit: BW verwendet eigene 6-stellige Wildmarken mit BW-Kennzeichnung
Zuständige Behörde: Landratsamt / Veterinäramt
Rechtsgrundlage: JWMG BW + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Nordrhein-Westfalen": {
    type: "warning",
    text: `Bundesland: Nordrhein-Westfalen
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD
Zuständige Behörde: Veterinäramt / Landratsamt — Ausgabe nur an Jagdausübungsberechtigte
Rechtsgrundlage: LJG NRW + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Niedersachsen": {
    type: "warning",
    text: `Bundesland: Niedersachsen
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD
Zuständige Behörde: Die Behörde die dir die Trichinenentnahme übertragen hat
Rechtsgrundlage: NJagdG + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Hessen": {
    type: "warning",
    text: `Bundesland: Hessen
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD
Zuständige Behörde: Veterinäramt / Landratsamt
Rechtsgrundlage: HJagdG + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Rheinland-Pfalz": {
    type: "warning",
    text: `Bundesland: Rheinland-Pfalz
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD — Kontrolle obliegt der Behörde
Zuständige Behörde: Kreisverwaltung / Veterinäramt
Rechtsgrundlage: LJG RLP + LJagdVO RLP + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Saarland": {
    type: "warning",
    text: `Bundesland: Saarland
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD
Zuständige Behörde: Veterinäramt / Landratsamt
Rechtsgrundlage: SJagdG + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Schleswig-Holstein": {
    type: "warning",
    text: `Bundesland: Schleswig-Holstein
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD
Zuständige Behörde: Untere Jagdbehörde / Kreis
Rechtsgrundlage: LJagdG SH + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Hamburg": {
    type: "warning",
    text: `Bundesland: Hamburg
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD
Zuständige Behörde: Behörde für Justiz und Verbraucherschutz / Veterinäramt Hamburg
Rechtsgrundlage: HmbJagdG + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Bremen": {
    type: "warning",
    text: `Bundesland: Bremen
Pflicht: Behördliche Wildmarke nur bei SCHWARZWILD
Zuständige Behörde: Senator für Klimaschutz, Umwelt, Mobilität / Veterinäramt Bremen
Rechtsgrundlage: BremJagdG + § 2b Tier-LMHV
Bei Schalenwild: Keine Pflicht`
  },
  "Brandenburg": {
    type: "danger",
    text: `⚠️ Bundesland: Brandenburg
Pflicht: Behördliche Wildmarke für ALLES Schalenwild + Schwarzwild!
Zuständige Behörde: Untere Jagdbehörde (Landratsamt / kreisfreie Stadt)
Rechtsgrundlage: § 55 JagdG Brandenburg + Verordnung zur Überwachung und Kontrolle des Wildhandels BB
Wichtig: Nicht genutzte Wildmarken müssen bis 30. April des Folgejahres zurückgemeldet werden!`
  },
  "Sachsen": {
    type: "danger",
    text: `⚠️ Bundesland: Sachsen
Pflicht: Behördliche Wildmarke für ALLES Schalenwild + Schwarzwild!
Zuständige Behörde: Untere Jagdbehörde (Landratsamt)
Rechtsgrundlage: SächsJagdG + SächsJagdVO § 5
Wichtig: Die Wildmarkennummer muss ins Wildhandelsbuch eingetragen werden!`
  },
  "Thüringen": {
    type: "danger",
    text: `⚠️ Bundesland: Thüringen
Pflicht: Behördliche Wildmarke für ALLES Schalenwild + Schwarzwild!
Zuständige Behörde: Untere Jagdbehörde (Landratsamt / kreisfreie Stadt)
Rechtsgrundlage: ThJG §§ 26-30 + Verordnung zur Ausführung des Thüringer Jagdgesetzes
Wichtig: Wildmarke muss in der Brust- oder Bauchwand befestigt werden. Ausgabe erfolgt sofort beim Landratsamt.`
  },
  "Mecklenburg-Vorpommern": {
    type: "danger",
    text: `⚠️ Bundesland: Mecklenburg-Vorpommern
Pflicht: Behördliche Wildmarke für ALLES Schalenwild + Schwarzwild!
Zuständige Behörde: Jagdbehörde (Landratsamt / kreisfreie Stadt)
Rechtsgrundlage: WildHÜVO M-V vom 23. März 2001 + LJagdG M-V
Wichtig: Marke muss unmittelbar nach Erlegung angebracht werden. Fallwild zur Entsorgung im Revier ist ausgenommen.`
  },
  "Sachsen-Anhalt": {
    type: "danger",
    text: `⚠️ Bundesland: Sachsen-Anhalt
Pflicht: Behördliche Wildmarke für ALLES Schalenwild + Schwarzwild!
Zuständige Behörde: Untere Jagdbehörde (Landratsamt)
Rechtsgrundlage: LJagdG LSA + LJagdG-DVO Sachsen-Anhalt
Wichtig: Eigene Wildmarken-Sets für Sachsen-Anhalt sind beim Verlagshaus Stadthagen erhältlich.`
  },
  "Berlin": {
    type: "danger",
    text: `⚠️ Bundesland: Berlin
Pflicht: Behördliche Wildmarke für ALLES Schalenwild + Schwarzwild!
Zuständige Behörde: Bezirksamt / Senatsverwaltung für Umwelt und Klimaschutz
Rechtsgrundlage: BlnJagdG — orientiert sich an Brandenburgischen Regelungen
Wichtig: Ausgabe über das zuständige Bezirksamt.`
  }
};

export default function WildmarkenCompliance({ bundesland }) {
  if (!bundesland) return null;
  const info = COMPLIANCE[bundesland];
  if (!info) return null;

  const isDanger = info.type === "danger";

  return (
    <div className={`rounded-xl p-4 mb-4 ${isDanger ? "bg-red-900/30 border border-red-500/40" : "bg-yellow-900/30 border border-yellow-500/40"}`}>
      <p className={`text-xs font-mono whitespace-pre-line leading-relaxed ${isDanger ? "text-red-200" : "text-yellow-200"}`}>
        {info.text}
      </p>
    </div>
  );
}