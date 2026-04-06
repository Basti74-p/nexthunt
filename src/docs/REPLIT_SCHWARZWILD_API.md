# NextHunt Mobile — Schwarzwild-Modul API Integration
## Anleitung für Replit / NextHunt Mobile App

---

## Übersicht

Das **Schwarzwild-Modul** ist jetzt vollständig in der NextHunt REST API verfügbar.
Alle Endpunkte sind über die bestehende `api`-Backend-Funktion erreichbar.

**Base URL (Backend Function):**
```
https://app.base44.com/api/functions/api   ← wird euch vom Base44-System bereitgestellt
```

**Auth:** Jeder Request braucht den Header:
```
x-api-key: <NEXTHUNT_API_KEY>
```

**Pflicht-Query-Param:** `?tenant_id=<tenant_id>`  
**Optional:** `?revier_id=<id>` und `?updated_since=<ISO-Datum>` für Delta-Sync

---

## Routing-Schema

Alle Ressourcen werden über den Query-Parameter `path` angesprochen:
```
GET  <BASE_URL>?path=/schwarzwild_sichtungen&tenant_id=xxx
POST <BASE_URL>?path=/schwarzwild_sichtungen&tenant_id=xxx   ← Body als JSON
PUT  <BASE_URL>?path=/schwarzwild_sichtungen/ID&tenant_id=xxx
DELETE <BASE_URL>?path=/schwarzwild_sichtungen/ID&tenant_id=xxx
```

---

## 1. Schwarzwild-Sichtungen (`/schwarzwild_sichtungen`)

Entity: `SchwarzwildSichtung`

### GET — Liste abrufen
```
GET ?path=/schwarzwild_sichtungen&tenant_id=xxx&revier_id=yyy&updated_since=2024-01-01T00:00:00Z
```

**Response:**
```json
[
  {
    "id": "abc123",
    "tenant_id": "xxx",
    "revier_id": "yyy",
    "rotte_id": "rotte_id_optional",
    "datum": "2024-03-15T18:30:00.000Z",
    "uhrzeit": "18:30",
    "ort_lat": 48.1234,
    "ort_lng": 11.5678,
    "anzahl_frischlinge": 3,
    "anzahl_ueberlaeufer": 1,
    "anzahl_bachen": 1,
    "anzahl_keiler": 0,
    "anzahl_unbekannt": 0,
    "leitbache_gesehen": false,
    "verhalten": "aesend",        // ruhig | fluechtig | aesend | wuehlend | aggressiv
    "witterung": "klar",          // klar | bewoelkt | regen | nebel | schnee
    "wind": "windstill",          // windstill | leicht | stark
    "fotos": [],
    "notizen": "Am Waldrand",
    "erfasst_von": "max@jagd.de",
    "source": "schwarzwild_karte", // "schwarzwild_karte" | "mobile" — für Import-Erkennung
    "created_date": "2024-03-15T18:31:00.000Z",
    "updated_date": "2024-03-15T18:31:00.000Z"
  }
]
```

### POST — Neue Sichtung anlegen
```
POST ?path=/schwarzwild_sichtungen&tenant_id=xxx
Content-Type: application/json
```
```json
{
  "tenant_id": "xxx",
  "revier_id": "yyy",
  "rotte_id": "optional",
  "datum": "2024-03-15T18:30:00.000Z",
  "ort_lat": 48.1234,
  "ort_lng": 11.5678,
  "anzahl_frischlinge": 2,
  "anzahl_ueberlaeufer": 0,
  "anzahl_bachen": 1,
  "anzahl_keiler": 0,
  "anzahl_unbekannt": 0,
  "leitbache_gesehen": false,
  "verhalten": "ruhig",
  "witterung": "klar",
  "wind": "windstill",
  "notizen": "Sichtung vom Hochsitz",
  "erfasst_von": "max@jagd.de",
  "source": "mobile"
}
```
**Pflichtfelder:** `tenant_id`, `revier_id`, `datum`

### PUT — Sichtung aktualisieren
```
PUT ?path=/schwarzwild_sichtungen/ID&tenant_id=xxx
Body: { felder die geändert werden sollen }
```

### DELETE — Sichtung löschen
```
DELETE ?path=/schwarzwild_sichtungen/ID&tenant_id=xxx
```

---

## 2. Schwarzwild-Rotten (`/schwarzwild_rotten`)

Entity: `SchwarzwildRotte`

### GET
```
GET ?path=/schwarzwild_rotten&tenant_id=xxx&revier_id=yyy
```
**Response-Felder:** `id`, `tenant_id`, `revier_id`, `name`, `geschaetzte_stueckzahl`, `leitbache_bekannt`, `status` (aktiv|abgewandert|unbekannt), `letzte_sichtung_datum`, `letzte_sichtung_ort_lat/lng`, `aktivitaet_morgens/mittags/abends/nachts`, `notizen`

### POST
```json
{
  "tenant_id": "xxx",
  "revier_id": "yyy",
  "name": "Rotte Nordholz",
  "geschaetzte_stueckzahl": 8,
  "status": "aktiv",
  "aktivitaet_nachts": true,
  "notizen": ""
}
```
**Pflichtfelder:** `tenant_id`, `revier_id`, `name`

### PUT
```
PUT ?path=/schwarzwild_rotten/ID
Body: { z.B. "geschaetzte_stueckzahl": 10, "letzte_sichtung_datum": "2024-03-15T00:00:00Z" }
```

---

## 3. Schwarzwild-Schäden (`/schwarzwild_schaeden`)

Entity: `SchwarzwildSchaden`

### GET
```
GET ?path=/schwarzwild_schaeden&tenant_id=xxx&revier_id=yyy
```
**Response-Felder:** `id`, `datum`, `ort_lat/lng`, `ort_beschreibung`, `schadensart` (Umbruch|Mais|Getreide|Wiese/Weide|Wald|Garten|Sonstiges), `flaeche_qm`, `flaeche_ha`, `schadenshoehe_euro`, `landwirt_name`, `landwirt_kontakt`, `landwirt_informiert`, `schadensersatz_beantragt`, `fotos`, `status` (offen|gemeldet|in_bearbeitung|reguliert|abgeschlossen), `notizen`

### POST
```json
{
  "tenant_id": "xxx",
  "revier_id": "yyy",
  "datum": "2024-03-15",
  "schadensart": "Mais",
  "ort_lat": 48.1234,
  "ort_lng": 11.5678,
  "ort_beschreibung": "Maisfeld Ecke Nord",
  "flaeche_ha": 0.5,
  "schadenshoehe_euro": 1200,
  "landwirt_name": "Hans Müller",
  "status": "offen"
}
```
**Pflichtfelder:** `tenant_id`, `revier_id`, `datum`, `schadensart`

---

## 4. Trichinenprotokolle (`/trichinen`)

Entity: `Trichinenprotokoll`

### GET
```
GET ?path=/trichinen&tenant_id=xxx&revier_id=yyy&updated_since=2024-01-01T00:00:00Z
```
**Response-Felder:** `id`, `abschuss_id`, `datum_erlegung`, `wildart` (Wildschwein|Dachs), `altersklasse`, `geschlecht`, `gewicht_kg`, `wildmarken_nummer`, `probe_entnommen`, `probe_datum`, `untersuchungsstelle`, `ergebnis` (ausstehend|negativ|positiv|nicht_untersucht), `ergebnis_datum`, `sperrfrist_aktiv`, `freigabe_erteilt`, `freigabe_datum`, `strecke_id`, `wildkammer_id`

### POST — Neues Protokoll
```json
{
  "tenant_id": "xxx",
  "revier_id": "yyy",
  "datum_erlegung": "2024-03-15",
  "wildart": "Wildschwein",
  "altersklasse": "Frischling",
  "geschlecht": "weiblich",
  "gewicht_kg": 18.5,
  "probe_entnommen": true,
  "untersuchungsstelle": "Tiergesundheitsamt München",
  "ergebnis": "ausstehend",
  "strecke_id": "strecke_id_optional",
  "wildkammer_id": "wildkammer_id_optional"
}
```
**Pflichtfelder:** `tenant_id`, `revier_id`, `datum_erlegung`

### PUT — Ergebnis nachtragen
```json
{
  "ergebnis": "negativ",
  "ergebnis_datum": "2024-03-18",
  "freigabe_erteilt": true,
  "freigabe_datum": "2024-03-18"
}
```

> ⚠️ **WICHTIG:** Nach PUT auf ein Trichinenprotokoll mit `ergebnis=negativ/positiv` müssen in der App auch die verknüpften Entitäten synchronisiert werden:
> - `PUT /schwarzwild_schaeden` oder verknüpfte `Wildkammer`-Einträge aktualisieren
> - `updated_since`-Sync beim nächsten Öffnen auslösen

---

## 5. ASP-Meldungen (`/asp_meldungen`)

Entity: `ASPMeldung`

### GET
```
GET ?path=/asp_meldungen&tenant_id=xxx&revier_id=yyy
```
**Response-Felder:** `id`, `datum_fund`, `uhrzeit_fund`, `ort_lat/lng`, `ort_beschreibung`, `fund_typ` (Fallwild|Verdachtsfall_lebend|Kadaver|Blutspuren), `wildart`, `anzahl_stueck`, `zustand`, `foto_gemacht`, `fotos`, `veterinaeramt_gemeldet`, `veterinaeramt_meldedatum`, `aktenzeichen`, `probe_entnommen`, `ergebnis` (ausstehend|negativ|positiv|nicht_beprobt), `hygieneprotokoll_eingehalten`, `status` (offen|gemeldet|beprobt|abgeschlossen)

### POST
```json
{
  "tenant_id": "xxx",
  "revier_id": "yyy",
  "datum_fund": "2024-03-15",
  "fund_typ": "Fallwild",
  "wildart": "Wildschwein",
  "ort_lat": 48.1234,
  "ort_lng": 11.5678,
  "ort_beschreibung": "Waldweg Süd",
  "anzahl_stueck": 1,
  "zustand": "frisch",
  "foto_gemacht": true,
  "hygieneprotokoll_eingehalten": true,
  "status": "offen"
}
```
**Pflichtfelder:** `tenant_id`, `revier_id`, `datum_fund`, `fund_typ`

---

## 6. Kirrungen (`/kirrungen`)

Entity: `Kirrung`

### GET
```
GET ?path=/kirrungen&tenant_id=xxx&revier_id=yyy
```
**Response-Felder:** `id`, `name`, `ort_lat/lng`, `kirrmittel` (Mais|Kartoffeln|Rüben|Getreide|Sonstiges), `letztes_befuellen_datum`, `letztes_befuellen_menge_kg`, `naechstes_befuellen_faellig`, `hochsitz_vorhanden`, `hochsitz_entfernung_m`, `aktiv`, `letzte_bejagung_datum`, `bejagungserfolg`, `notizen`

### POST
```json
{
  "tenant_id": "xxx",
  "revier_id": "yyy",
  "name": "Kirrung Waldweg Nord",
  "ort_lat": 48.1234,
  "ort_lng": 11.5678,
  "kirrmittel": "Mais",
  "letztes_befuellen_datum": "2024-03-10",
  "letztes_befuellen_menge_kg": 5,
  "hochsitz_vorhanden": true,
  "aktiv": true
}
```
**Pflichtfelder:** `tenant_id`, `revier_id`, `name`

---

## Delta-Sync (Empfehlung)

Für effiziente Synchronisation in der Mobile App:
```
GET ?path=/schwarzwild_sichtungen&tenant_id=xxx&updated_since=<letzter_sync_timestamp>
```

**Workflow:**
1. Beim App-Start: `updated_since = last_sync_timestamp` aus lokalem Storage laden
2. Alle 6 Endpunkte parallel mit `updated_since` abrufen
3. Lokale Daten mit erhaltenen Datensätzen mergen (nach `id`)
4. `last_sync_timestamp = new Date().toISOString()` speichern

---

## Foto-Upload

Fotos werden separat hochgeladen und die URL in den Arrays `fotos: [...]` gespeichert.

```
POST ?path=/einrichtungen  (gleicher API-Endpunkt, body mit fotos-Array)
```

Für den Foto-Upload bitte die bestehende `UploadFile`-Integration nutzen oder via den `api`-Endpunkt (noch nicht implementiert — bei Bedarf ergänzen).

---

## `source`-Feld (Revierkarte-Import)

Sichtungen die aus der Desktop-Revierkarte kommen haben `source: "schwarzwild_karte"`.
Sichtungen aus der Mobile App sollten `source: "mobile"` setzen.

Das erlaubt später einen **Import-Flow**: Wenn ein Nutzer in der Revierkarte eine Sichtung markiert, kann die Mobile App diese als "aus Desktop übernommen" anzeigen und bestätigen.

---

## Fehler-Codes

| Code | Bedeutung |
|------|-----------|
| 401  | API Key fehlt oder falsch |
| 400  | Pflichtfeld fehlt (Fehlermeldung im Body) |
| 404  | Datensatz nicht gefunden |
| 405  | HTTP-Methode nicht erlaubt |
| 500  | Server-Fehler |

---

## Bestehende Endpunkte (unverändert)

| Endpunkt | Methoden |
|----------|----------|
| `/reviere` | GET |
| `/einrichtungen` | GET, POST, PUT |
| `/abschuesse` | GET, POST |
| `/sichtungen` | GET, POST (WildManagement/JagdMeldung) |
| `/aufgaben` | GET, PUT |
| `/termine` | GET |
| `/jagdtermine` | GET |