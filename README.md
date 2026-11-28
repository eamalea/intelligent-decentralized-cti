# Plateforme CTI intelligente et décentralisée

Prototype académique du module **Intelligence Artificielle Avancée et Blockchain**.
Le projet combine l'analyse des renseignements de cybermenaces (CTI), le NLP,
le Machine Learning, MITRE ATT&CK, MISP et Ethereum afin de proposer une
validation collaborative, traçable et explicable.

> **Statut :** initialisation du projet
> **Périmètre :** prototype académique, non destiné à la production

## Objectifs

- importer des rapports CTI et des IOC ;
- extraire, normaliser et dédupliquer les IOC ;
- classifier les rapports en `phishing`, `ransomware`, `malware` ou
  `vulnerability_exploitation` ;
- enrichir les renseignements avec MITRE ATT&CK ;
- stocker et partager les CTI via MISP/PyMISP ;
- enregistrer les empreintes, votes et statuts de validation sur Ethereum ;
- calculer un score de fiabilité explicable et gérer la réputation des
  organisations ;
- détecter les corrélations potentielles entre rapports.

## Architecture

Le flux principal est :

```text
Rapport CTI
    -> NLP : extraction, normalisation et déduplication des IOC
    -> ML  : classification TF-IDF / Logistic Regression
    -> MITRE ATT&CK : enrichissement
    -> MISP : stockage et partage off-chain
    -> Ethereum : empreinte, votes et validation on-chain
    -> Streamlit : consultation des résultats
```

FastAPI orchestre les modules, MISP et Ethereum.

### Séparation des données

- **Off-chain (MISP et base applicative)** : rapports, IOC, descriptions,
  métadonnées, résultats d'analyse et techniques MITRE.
- **On-chain (Ethereum)** : empreintes cryptographiques, identifiants,
  organisations, votes et statuts de validation.

Les rapports complets et les secrets ne doivent jamais être enregistrés sur la
blockchain.

## Arborescence

```text
intelligent-decentralized-cti/
├── backend/
│   ├── correlation/       # Corrélation entre rapports
│   ├── mitre/             # Enrichissement MITRE ATT&CK
│   ├── ml/                # Classification et évaluation ML
│   ├── misp/              # Adaptateur MISP/PyMISP
│   └── nlp/               # Extraction, normalisation et déduplication IOC
├── blockchain/
│   ├── contracts/         # Smart contracts Solidity
│   ├── scripts/           # Déploiement local
│   ├── test/              # Tests Hardhat des contrats
│   ├── package.json       # Dépendances et commandes Hardhat
│   └── README.md          # Règles et démarrage du module
├── data/
│   ├── annotated/         # Corpus annoté et relations de référence
│   ├── raw/
│   │   ├── iocs/          # IOC bruts
│   │   └── reports/       # Rapports CTI bruts
│   └── splits/            # Jeux train / validation / test
├── docker/                # Configuration de déploiement
├── docs/                  # Documentation technique et scientifique
├── frontend/              # Interface Streamlit
├── tests/                 # Tests unitaires et d'intégration
├── .env.example           # Variables d'environnement documentées
└── README.md
```

Les fichiers `.gitkeep` présents dans les dossiers vides servent uniquement à
conserver l'arborescence dans Git.

## Stack cible

| Composant | Technologie |
|---|---|
| Backend et API | Python, FastAPI |
| Interface | Streamlit |
| Extraction IOC | Regex, spaCy si nécessaire |
| Machine Learning | scikit-learn, TF-IDF, Logistic Regression |
| CTI | MISP, PyMISP |
| Enrichissement | MITRE ATT&CK |
| Blockchain | Ethereum local, Hardhat, Solidity |
| Communication blockchain | Web3.py |
| Déploiement | Docker Compose |

## Corpus de données

Le corpus visé contient environ 80 extraits, idéalement 20 par catégorie, ainsi
que 30 à 50 annotations initiales de qualité. Les sources peuvent inclure des
rapports CTI publics, URLhaus, MalwareBazaar, MITRE ATT&CK et STIX.

Les données synthétiques doivent être identifiées comme telles et chaque source
doit conserver sa provenance, sa licence et sa date de collecte.

Les formats prévus sont :

- `data/annotated/reports.jsonl` : rapports, catégorie, techniques MITRE et
  provenance ;
- `data/annotated/iocs.csv` : `report_id`, `ioc_type`, `ioc_value`,
  `malicious_label` ;
- `data/annotated/relations.csv` : relations justifiées entre rapports ;
- `data/splits/` : jeux d'entraînement, validation et test.

## API initiale

FastAPI exposera notamment :

```text
POST /api/v1/reports
POST /api/v1/reports/analyze
GET  /api/v1/reports
GET  /api/v1/reports/{id}
POST /api/v1/reports/{id}/submit
POST /api/v1/reports/{id}/vote
GET  /api/v1/reports/{id}/status
GET  /api/v1/reports/{id}/correlations
GET  /api/v1/organizations
GET  /api/v1/organizations/{id}/reputation
```

## Scénario de démonstration

Trois organisations simulées (A, B et C) suivent le scénario :

1. A importe un rapport CTI ;
2. le NLP extrait et normalise les IOC ;
3. le système vérifie les doublons ;
4. le modèle propose une catégorie ;
5. MITRE ATT&CK enrichit le rapport ;
6. le renseignement est enregistré dans MISP ;
7. A soumet son empreinte au smart contract ;
8. B et C votent ;
9. le contrat finalise le statut ;
10. l'interface affiche les votes, la fiabilité et la réputation ;
11. un second rapport partageant un IOC est signalé comme corrélé.

## Développement

Les modules avancent par fonctionnalité, avec une branche dédiée et une pull
request vérifiée. Le module blockchain contient le contrat MVP et ses tests.

Pour lancer les tests du contrat, depuis la racine du dépôt :

```powershell
cd blockchain
npm install
npm test
```

Les étapes de lancement du nœud Hardhat et de déploiement local sont décrites
dans [`blockchain/README.md`](blockchain/README.md).

Les identifiants MISP, les clés privées Ethereum et les fichiers `.env` réels
ne doivent jamais être versionnés. Copier `.env.example` vers `.env` lors de la
configuration locale, puis renseigner uniquement des valeurs locales.

La priorité de réalisation est un parcours complet :

```text
Rapport -> NLP -> ML -> MITRE -> MISP -> Ethereum -> Streamlit
```

## Références du projet

- Cahier des charges fonctionnel et technique (`CDC_2I2AY.pdf`)
- Document de cadrage scientifique et technique
- MITRE ATT&CK
- MISP
