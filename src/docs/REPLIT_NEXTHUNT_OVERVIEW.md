# NextHunt Mobile — Vollständige Technische Übersicht für Replit
## Systemarchitektur, Features & API-Integration

---

## 1. Was ist NextHunt?

**NextHunt** ist eine professionelle Jagdverwaltungs-Plattform für Jagdpächter, Revierleiter und Jagdgesellschaften in Deutschland/DACH. Sie kombiniert eine Web-App (Desktop) mit einer mobilen App (iOS/Android via Expo/React Native).

### Kernkonzept: Mandanten-Architektur (Multi-Tenant)
- Jede **Jagdgesellschaft / Reviergemeinschaft** ist ein eigener **Tenant**
- Ein Tenant hat ein oder mehrere **Reviere** (Jagdbezirke)
- Jedes Revier hat **Mitglieder** (TenantMembers) mit unterschiedlichen Rollen und Berechtigungen
- Ein User kann Mitglied in mehreren Tenants/Revieren sein (z.B. eingeladen als Gast-Jäger)

### Subscription-Modelle
| Plan | Features |
|------|----------|
| `free_trial` | 30 Tage Vollversion |
| `solo` | Nur Mobile, Basisfunktionen |
| `pro` | Desktop + Mobile, alle Module |
| `enterprise` | Alles + White-Label |

Add-ons: `addon_wildmanagement`, `addon_wildkammer`, `addon_kameras`, `addon_oeffentlichkeit`

---

## 2. Datenmodell — Alle Entities

### Core-Entities

#### Tenant
Mandant / Jagdgesellschaft
- `id`, `name`, `contact_email`, `plan` (solo|pro|enterprise|free_trial)
- `status` (active|trial|suspended|expired)
- `plan_status`, `plan_expires_at`, `plan_store` (APP_STORE|PLAY_STORE|manual)
- `addons[]` — aktive Add-ons
- `feature_*` Flags — welche Module aktiviert sind
- `nav_*` Flags — welche Menüpunkte sichtbar sind
- `max_flaeche_ha`, `max_mitglieder` — Plan-Limits

#### Revier
Jagdbezirk / Revier
- `id`, `tenant_id`, `name`, `region`
- `size_ha` (manuell), `flaeche_ha` (auto aus GeoJSON berechnet)
- `boundary_geojson` — GeoJSON Reviergrenzen für Karte
- `status` (active|archived)

#### TenantMember
Mitglied einer Jagdgesellschaft
- `tenant_id`, `user_email`, `first_name`, `last_name`, `callsign`
- `role` (tenant_owner|tenant_member)
- `status` (active|inactive)
- `allowed_reviere[]` — welche Reviere der User sehen darf (leer = alle)
- Berechtigungen: `perm_wildmanagement`, `perm_strecke`, `perm_wildkammer`, `perm_kalender`, `perm_aufgaben`, `perm_personen`, `perm_oeffentlichkeit`, `perm_einrichtungen`

---

### Jagd & Abschuss

#### Strecke
Erlegtes Wild (Abschuss-Protokoll)
- `tenant_id`, `revier_id`
- `species` (rotwild|schwarzwild|rehwild|damwild|sikawild|niederwild|wolf)
- `gender` (maennlich|weiblich|unbekannt), `age_class`
- `date`, `shooter_email`, `shooter_person_id`
- `latitude`, `longitude`
- `weight_kg`, `wildmark_id`
- `status` (erfasst|bestaetigt|wildkammer|verkauft|archiviert)

#### Abschussplan
Jahresplanung für Wildabschüsse
- `tenant_id`, `revier_id`, `jagdjahr` (z.B. "2025/2026")
- `species`, `kategorie` (Altersklasse), `soll` (Planmenge)

#### Wildmarke
Digitale Wildmarken-Verwaltung (NFC-fähig)
- `tenant_id`, `nummer` (Format: NH-XXXXX)
- `status` (frei|vergeben)
- `abschuss_id`, `nfc_written`

---

### Wildkammer & Vermarktung

#### Wildkammer
Wildkammer / Kühlhaus-Protokoll
- Verknüpft mit `strecke_id`
- `eingang_datum`, `kuehltemperatur`, `gewicht_aufgebrochen`, `gewicht_kalt`
- `trichinenprobe`, `trichinenprobe_ergebnis` (ausstehend|negativ|positiv)
- `freigabe`, `freigabe_datum`
- `status` (eingang|verarbeitung|lager|ausgabe|verkauft)
- `ausgabe_typ` (eigenverbrauch|verkauf|spende|entsorgung)

#### WildProdukt
Verarbeitete Wildprodukte im Lager
- Gewicht, Einheit, Preis, Kühltemperatur, Mindesthaltbarkeit

#### Verkauf / Kunde
Wildverkauf mit Rechnungserstellung
- Kunde-Entität mit Adresse für Rechnungen

---

### Jagdkalender & Termine

#### Termin
Allgemeine Jagdtermine
- `tenant_id`, `revier_id`, `titel`, `datum`
- `uhrzeit_start`, `uhrzeit_ende`, `ort`
- `gast_ids[]` — eingeladene Personen
- `status` (geplant|aktiv|abgeschlossen|abgesagt)

#### GesellschaftsJagd
Gesellschaftsjagd / Drückjagd
- `jagdform` (drueckjagd|treibjagd|stoeberjagd|feldtreibjagd|bewegungsjagd|gemeinschaftsansitz|niederwildjagd)
- `jagdleiter_email`, `max_teilnehmer`, `zielwild[]`
- Live-Monitor: Echtzeit-Standorte der Jäger während der Jagd

#### JagdMeldung
Echtzeit-Meldungen während einer Jagd (Live-Monitor)
- Sichtungen, Abschüsse, Positionsmeldungen in Echtzeit

---

### Karte & Einrichtungen

#### Jagdeinrichtung
Hochsitze, Kirrungen, Salzlecken, etc.
- `type` (hochsitz|leiter|erdsitz|kirrung|salzlecke|suhle|drueckjagdbock|ansitzdrueckjagdleiter|wildacker|fuetterung|fanganlage)
- `latitude`, `longitude`, `condition` (gut|maessig|schlecht|neu)
- `orientation` (n|ne|e|se|s|sw|w|nw)
- `photos[]`

#### WildManagement (Sichtungen allgemein)
Wildtier-Sichtungen (alle Arten)
- Für Rehwild, Rotwild, Damwild, allgemeine Wildbeobachtungen

---

### Schwarzwild-Modul (neu)

#### SchwarzwildSichtung
- Schwarzwild-spezifische Sichtungserfassung mit Stückzahl nach Altersklasse
- `anzahl_frischlinge`, `anzahl_ueberlaeufer`, `anzahl_bachen`, `anzahl_keiler`
- `verhalten`, `witterung`, `wind`
- `source` ("mobile" | "schwarzwild_karte") — Herkunft der Sichtung
- Karteneintrag direkt per Klick auf Revierkarte möglich

#### SchwarzwildRotte
Rotten (Gruppen) verfolgen
- `name`, `geschaetzte_stueckzahl`, `leitbache_bekannt`
- `status` (aktiv|abgewandert|unbekannt)
- Aktivitätsmuster: `aktivitaet_morgens`, `_mittags`, `_abends`, `_nachts`
- GPS der letzten Sichtung

#### SchwarzwildSchaden
Wildschadenprotokolle
- `schadensart` (Umbruch|Mais|Getreide|Wiese/Weide|Wald|Garten|Sonstiges)
- `flaeche_ha`, `schadenshoehe_euro`
- Landwirt-Kontakt, Schadensersatz-Tracking
- `status` (offen|gemeldet|in_bearbeitung|reguliert|abgeschlossen)

#### Trichinenprotokoll
Gesetzlich vorgeschriebene Trichinen-Untersuchung
- Pflicht bei jedem Wildschwein und Dachs (§ 6 Tier-LMHV + EU-VO 2015/1375)
- `ergebnis` (ausstehend|negativ|positiv|nicht_untersucht)
- Verknüpfung mit `strecke_id` und `wildkammer_id`
- Bei positivem Ergebnis: `sperrfrist_aktiv` → automatische Sperrung der Wildkammer

#### ASPMeldung
Afrikanische Schweinepest — Verdachtsfälle
- `fund_typ` (Fallwild|Verdachtsfall_lebend|Kadaver|Blutspuren)
- Veterinäramt-Meldung-Tracking
- `hygieneprotokoll_eingehalten`
- `ergebnis` (ausstehend|negativ|positiv|nicht_beprobt)

#### Kirrung
Kirrungsverwaltung (Futterplätze für Schwarzwild)
- `kirrmittel` (Mais|Kartoffeln|Rüben|Getreide|Sonstiges)
- `letztes_befuellen_datum`, `naechstes_befuellen_faellig`
- `hochsitz_vorhanden`, `hochsitz_entfernung_m`
- `bejagungserfolg`

---

### WolfTrack-Modul

#### WolfSighting / WolfRiss / WolfSample / WolfCamera / WolfTerritory
- Spezielles Modul für Wolfs-Monitoring
- Rissprotokolle, DNA-Proben, Wildkameras
- Meldepflicht-Tracking an Behörden
- Berichte-Generator (Monats-/Quartals-/Jahresbericht)

---

### Aufgaben & Personen

#### Aufgabe
- `title`, `description`, `assigned_to`, `due_date`
- `priority` (low|medium|high), `status` (offen|in_bearbeitung|erledigt)
- Verknüpfung mit `einrichtung_id` und `schadensprotokolle_ids[]`

#### Person
Jagdgäste, Personal (externe Personen ohne Login)
- Name, Kontakt, Jagdscheinnummer, Waffenschein

---

## 3. REST API — Vollständige Referenz

### Authentication
```
Header: x-api-key: <NEXTHUNT_API_KEY>
```
Alternativ JWT Bearer Token (für Mobile Auth-Flow):
```
Header: Authorization: Bearer <jwt_token>
```
JWT-Payload enthält: `{ user_email, tenant_id, iat, exp }`

### Base URL
```
https://app.base44.com/api/functions/api
```

### Routing-Schema
```
GET    <BASE_URL>?path=/resource&tenant_id=xxx
GET    <BASE_URL>?path=/resource/ID&tenant_id=xxx
POST   <BASE_URL>?path=/resource&tenant_id=xxx     (Body: JSON)
PUT    <BASE_URL>?path=/resource/ID&tenant_id=xxx  (Body: JSON)
DELETE <BASE_URL>?path=/resource/ID&tenant_id=xxx
```

### Globale Query-Parameter
| Parameter | Pflicht | Beschreibung |
|-----------|---------|--------------|
| `tenant_id` | Ja | Mandanten-ID |
| `revier_id` | Nein | Filter auf spezifisches Revier |
| `updated_since` | Nein | ISO-Datum für Delta-Sync |

---

### Alle verfügbaren Endpunkte

```
# Reviere
GET    ?path=/reviere                    — Alle Reviere des Tenants
GET    ?path=/reviere/{id}              — Einzelnes Revier

# Jagdeinrichtungen
GET    ?path=/einrichtungen             — Hochsitze, Kirrungen, etc.
GET    ?path=/einrichtungen/{id}
POST   ?path=/einrichtungen             — Neue Einrichtung anlegen
PUT    ?path=/einrichtungen/{id}        — Einrichtung aktualisieren

# Abschüsse (Strecke)
GET    ?path=/abschuesse               — Erlegte Tiere
POST   ?path=/abschuesse               — Neuen Abschuss erfassen

# Sichtungen (allgemein / WildManagement)
GET    ?path=/sichtungen               — Wild-Sichtungen
POST   ?path=/sichtungen               — Sichtung erfassen

# Aufgaben
GET    ?path=/aufgaben                 — Aufgabenliste
PUT    ?path=/aufgaben/{id}            — Aufgabe aktualisieren (z.B. als erledigt markieren)

# Termine
GET    ?path=/termine                  — Jagdtermine

# Gesellschaftsjagd-Termine
GET    ?path=/jagdtermine              — Drückjagden, Treibjagden etc.

# --- SCHWARZWILD-MODUL ---
GET    ?path=/schwarzwild_sichtungen
POST   ?path=/schwarzwild_sichtungen
PUT    ?path=/schwarzwild_sichtungen/{id}
DELETE ?path=/schwarzwild_sichtungen/{id}

GET    ?path=/schwarzwild_rotten
POST   ?path=/schwarzwild_rotten
PUT    ?path=/schwarzwild_rotten/{id}

GET    ?path=/schwarzwild_schaeden
POST   ?path=/schwarzwild_schaeden
PUT    ?path=/schwarzwild_schaeden/{id}

GET    ?path=/trichinen
POST   ?path=/trichinen
PUT    ?path=/trichinen/{id}

GET    ?path=/asp_meldungen
POST   ?path=/asp_meldungen
PUT    ?path=/asp_meldungen/{id}

GET    ?path=/kirrungen
POST   ?path=/kirrungen
PUT    ?path=/kirrungen/{id}
```

---

### Dedizierte Funktions-Endpunkte (POST-only)

Diese Endpunkte existieren zusätzlich als eigene Funktionen und akzeptieren `action`-Felder im Body:

```
POST /api/functions/reviere
POST /api/functions/einrichtungen
POST /api/functions/schwarzwild_rotten
POST /api/functions/schwarzwild_sichtungen
POST /api/functions/schwarzwild_schaeden
POST /api/functions/trichinen
POST /api/functions/asp_meldungen
POST /api/functions/kirrungen
```

**Body-Format:**
```json
{
  "action": "create" | "update" | "delete",  // kein action = listing
  "tenant_id": "xxx",
  "revier_id": "yyy",
  "id": "record_id",          // für update/delete
  "updated_since": "ISO",     // für Delta-Sync beim listing
  ...weitere Felder
}
```

---

### Mobile Auth-Flow

```
POST /api/functions/mobileAuth
Body: { email, password }
Response: { token: "<jwt>", tenant_id, user_email, expires_in }
```

Das JWT wird in allen Folge-Requests als `Authorization: Bearer <token>` mitgeschickt.
Der tenant_id aus dem JWT wird automatisch für alle Datenbankabfragen genutzt.

---

### Reviere mit Mitgliedschafts-Lookup

```
POST /api/functions/reviere
Body: { tenant_id: "eigener_tenant", user_email: "user@example.com" }
```

Gibt zurück: Eigene Reviere des Tenants + alle Reviere aus anderen Tenants wo die Email als aktives Mitglied eingetragen ist (für eingeladene Jäger).

---

## 4. Subscription-basierte Feature-Flags

Die Mobile App MUSS diese Flags beim Login aus der Tenant-Entity auslesen und lokal cachen:

```json
{
  "feature_map": true,           // Interaktive Karte
  "feature_sightings": true,     // Wildmanagement/Sichtungen
  "feature_strecke": true,       // Strecken-Erfassung
  "feature_wildkammer": false,   // Wildkammer (nur Pro/Enterprise)
  "feature_tasks": true,         // Aufgaben
  "feature_driven_hunt": false,  // Gesellschaftsjagd (nur Pro)
  "feature_public_portal": false, // Öffentlichkeit
  "feature_wildmarken": false,   // NFC Wildmarken
  "addon_wildmanagement": false, // Schwarzwild-Modul Add-on
  "addon_wildkammer": false,     // Wildkammer Add-on
  "addon_kameras": false,        // Wildkameras Add-on
  "nav_*": true/false            // Menü-Sichtbarkeit je Modul
}
```

**Wichtig für Schwarzwild-Modul:**
- Schadensprotokoll, Trichinen, ASP → nur wenn `addon_wildmanagement: true` ODER Plan `pro`/`enterprise`
- Basis-Sichtungen und Kirrungen → ab `solo` Plan

---

## 5. Delta-Sync-Strategie (Mobile)

### Empfohlener Workflow beim App-Start:
```javascript
const lastSync = await AsyncStorage.getItem('last_sync');
const since = lastSync || '2020-01-01T00:00:00Z';

// Alle relevanten Endpunkte parallel abrufen
const [reviere, einrichtungen, strecke, sichtungen, aufgaben, termine] = await Promise.all([
  api.get(`/reviere?tenant_id=${tid}&updated_since=${since}`),
  api.get(`/einrichtungen?tenant_id=${tid}&updated_since=${since}`),
  api.get(`/abschuesse?tenant_id=${tid}&updated_since=${since}`),
  api.get(`/sichtungen?tenant_id=${tid}&updated_since=${since}`),
  api.get(`/aufgaben?tenant_id=${tid}&updated_since=${since}`),
  api.get(`/termine?tenant_id=${tid}&updated_since=${since}`),
]);

// Schwarzwild-Modul (falls aktiviert)
if (tenant.addon_wildmanagement) {
  const [swSichtungen, swRotten, swSchaeden, trichinen, asp, kirrungen] = await Promise.all([
    api.get(`/schwarzwild_sichtungen?tenant_id=${tid}&updated_since=${since}`),
    api.get(`/schwarzwild_rotten?tenant_id=${tid}&updated_since=${since}`),
    api.get(`/schwarzwild_schaeden?tenant_id=${tid}&updated_since=${since}`),
    api.get(`/trichinen?tenant_id=${tid}&updated_since=${since}`),
    api.get(`/asp_meldungen?tenant_id=${tid}&updated_since=${since}`),
    api.get(`/kirrungen?tenant_id=${tid}&updated_since=${since}`),
  ]);
}

// Merge: ID-basiert — neue Einträge hinzufügen, bestehende aktualisieren
await localDB.upsertMany('reviere', reviere);
// ...

await AsyncStorage.setItem('last_sync', new Date().toISOString());
```

---

## 6. Fehler-Codes

| Code | Bedeutung |
|------|-----------|
| 200 | OK |
| 201 | Erstellt |
| 400 | Pflichtfeld fehlt / Validierungsfehler |
| 401 | API Key fehlt oder ungültig |
| 404 | Datensatz nicht gefunden |
| 405 | HTTP-Methode nicht erlaubt für diesen Endpunkt |
| 500 | Interner Server-Fehler |

**Fehler-Response-Format:**
```json
{ "error": "Beschreibung des Fehlers" }
```

---

## 7. Offline-Fähigkeit (Empfehlung)

Die Mobile App soll vollständig offline nutzbar sein:

1. **Lokale SQLite/MMKV Datenbank** — alle Entitäten lokal cachen
2. **Offline-Queue** — Aktionen während Offline-Phasen in Queue speichern
3. **Sync beim Reconnect** — Queue abarbeiten, dann Delta-Sync
4. **Konflikt-Strategie** — Server-Version gewinnt bei Konflikten (last-write-wins)

---

## 8. Foto-Upload

Fotos werden als URLs in Arrays gespeichert (`fotos: [...]`).

**Upload-Flow:**
1. Foto aufnehmen / aus Galerie wählen
2. Als `multipart/form-data` an Base44-Storage hochladen
3. Zurückgegebene URL in das entsprechende `fotos[]`-Array des Eintrags speichern

Alle Foto-Arrays akzeptieren beliebig viele URLs. Fotos werden außerhalb der Datenbankeinträge gespeichert.

---

## 9. Kartenfunktionen

Die Karte nutzt **Leaflet** (Web) bzw. **react-native-maps** (Mobile) mit:
- **Dark-Theme Tiles** von CartoDB (`dark_all`)
- **Revier-Grenzen** als GeoJSON-Polygone
- **Einrichtungs-Marker** mit Typ-Icons (Hochsitz, Kirrung, etc.)
- **Sichtungs-Marker** für Schwarzwild (🐗) mit Stückzahl-abhängiger Größe
- **Live-Monitor** für Gesellschaftsjagden — Echtzeit-GPS der Jäger
- **Windy-Overlay** für Wetterkarte (Wind-Visualisierung)

---

## 10. Wichtige Geschäftslogik

### Trichinen-Sync
Wenn ein Trichinenprotokoll mit `ergebnis=negativ` aktualisiert wird:
- Verknüpfte Wildkammer → `freigabe: true`, `trichinenprobe_ergebnis: "negativ"`, `status: "lager"`
- Verknüpfte Strecke → `status: "bestaetigt"`, `notes: "Trichinenprobe negativ ✓"`

Bei `ergebnis=positiv`:
- Wildkammer → `freigabe: false`, `trichinenprobe_ergebnis: "positiv"`
- Strecke → `status: "erfasst"`, `notes: "Trichinenprobe POSITIV ⚠"`
- **Sperrfrist aktiv** → Fleisch darf nicht verwertet werden

### Plan-Limits (Areal-Beschränkung)
- `max_flaeche_ha` aus Tenant — maximale Gesamtfläche aller Reviere
- Bei Überschreitung: `grace_period_until` gesetzt — nach Ablauf gesperrt
- Mobile App soll Warnung anzeigen wenn nahe am Limit

### Berechtigungs-Hierarchie
1. Platform-Admin — alles
2. Tenant-Owner — alles innerhalb des Tenants
3. Tenant-Member mit spezifischen `perm_*` Flags
4. Revier-Beschränkung via `allowed_reviere[]` — leeres Array = alle Reviere

---

## 11. Technologie-Stack

### Web-App (Base44)
- React 18 + Vite
- Tailwind CSS (Dark-Theme, NextHunt-Grün `#22c55e`)
- React Router v6
- TanStack Query (Caching, Mutations)
- Leaflet + react-leaflet (Karte)
- Recharts (Statistiken)
- Backend: Deno-Deploy Functions + Base44 Entity-DB

### Mobile App (Replit / Expo)
- React Native / Expo
- Gleiche REST API via `x-api-key`
- JWT Auth für User-Sessions
- Delta-Sync für Offline-Support

---

## 12. Kontakt & Weiterentwicklung

Bei neuen Features oder API-Erweiterungen bitte:
1. Neues Entity-Schema in Base44 anlegen
2. Route in `functions/api` ergänzen
3. Diese Dokumentation aktualisieren
4. Replit-Team informieren

Dedizierte Einzel-Funktionen (z.B. `/api/functions/schwarzwild_rotten`) sind **äquivalent** zur Route im `api`-Gateway und können alternativ genutzt werden.