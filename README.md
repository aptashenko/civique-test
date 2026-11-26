# Civique Prep

Nuxt and Nitro run the application as a modular monolith. The quiz domain lives in `server/modules/quiz/domain`. Nitro owns attempts and scoring, TypeORM persists them in PostgreSQL, and Pinia coordinates the player on the client.

## Local setup

Use a supported Node.js release such as 24.15+ and PostgreSQL. Set `DATABASE_URL` in `.env` using `.env.example` as a template.

```sh
npm ci
npm run db:migrate
npm run dev
```

Training includes 190 distinct CSP questions across five themes. The bundled source and answer key live under `server/modules/questions/data/csp`. Training answers outside the reviewed exam subset are provisional.

The CSP mock is ready after database migrations. It draws from 42 questions selected from the official knowledge list and 16 authored practice situations. The application supplies the options, answer keys and explanations. The Ministry does not publish the official situational questions. [Official CSP question list](https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-csp/)

## Question bank

Import additional reviewed content with `npm run db:questions -- ./questions.json`. Use one JSON entry per question. A PostgreSQL entry with the same ID overrides the bundled question. Increment `version` to update an existing entry or deactivate it via `"active": false`. Existing attempts retain their own snapshots.

```json
[
  {
    "questionId": "your-stable-question-id",
    "version": 1,
    "type": "single_select",
    "text": "Texte de la question",
    "options": [
      { "id": "a", "text": "Première proposition" },
      { "id": "b", "text": "Deuxième proposition" },
      { "id": "c", "text": "Troisième proposition" },
      { "id": "d", "text": "Quatrième proposition" }
    ],
    "correctOptionIds": ["a"],
    "explanation": "Explication vérifiée",
    "categoryId": "values",
    "sourceType": "training",
    "translations": {}
  }
]
```

The CSP mock randomly draws 28 knowledge questions and 12 practice situations. Every quota below must be filled with distinct questions before the mock can start. Exam entries require four options and one correct answer. The bank importer validates the format and classification. Review the content and answer keys before importing them. [Official CSP distribution](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000052382287)

Use `sourceType: "official_knowledge"` with the matching `categoryId` and `notionId`. Use `sourceType: "practice_situation"` with the matching `categoryId` for practice situations.

| `categoryId` | Knowledge quotas by `notionId` | Practice situations |
| --- | --- | ---: |
| `republican_values` | `motto_and_symbols` (3), `secularism` (2) | 6 |
| `political_system` | `democracy_and_voting` (3), `french_republic` (2), `european_institutions` (1) | 0 |
| `rights_and_duties` | `fundamental_rights` (2), `resident_duties` (3) | 6 |
| `history_geography_culture` | `history_periods_and_figures` (3), `territories_and_geography` (3), `french_heritage` (2) | 0 |
| `living_in_france` | `settlement_and_residence` (1), `healthcare_access` (1), `working_in_france` (1), `parental_authority_and_education` (1) | 0 |

## Newsletter signups

Run `npm run db:migrate` and set `NUXT_PUBLIC_NEWSLETTER_PRIVACY_URL` to the published privacy notice before enabling signups. The signup dialog opens on the first visit and can be reopened from the header until sign-up. The form collects explicit consent and stores the email, language, consent version and signup time. Signups are independent of accounts. The app collects addresses for future issues and currently sends no email.

Export the table from an authorized PostgreSQL session. Select the configured schema if it differs from `public`.

```sql
\copy (SELECT email, locale, "consentedAt", "consentVersion" FROM public."NewsletterSubscription" ORDER BY "consentedAt") TO 'subscribers.csv' WITH CSV HEADER
```

Set `CIVIQUE_TEST_NEWSLETTER=1` when running the integration suite against a test deployment with signups enabled.

## Checks and deployment

```sh
npm test
npm run typecheck
npm run build
```

`npm run db:migrate` also supports an existing database initialized by Prisma. The initial TypeORM migration checks the application tables and records the baseline in `typeorm_migrations`, preserving existing data and migration history. An incomplete or incompatible schema causes the migration to fail. Schema synchronization is disabled.

For the HTTP integration checks, run the app against an isolated database and set `CIVIQUE_TEST_URL` and `CIVIQUE_TEST_DATABASE_URL` before running `npm run test:integration`. The test temporarily deactivates bundled questions in that database and removes its fixtures when it exits.

Apply migrations before starting a deployment and serve the Node build over HTTPS so browsers accept the secure account cookie.

```sh
TZ=UTC node .output/server/index.mjs
```

Set `TZ=UTC` on the deployed process. The Nitro scheduler finalizes expired exam sessions every minute and runs daily data cleanup at 03:00 UTC. Progress is calculated from retained completed attempts, so deletions also remove those attempts from statistics. Database migrations are available in `server/modules/infrastructure/migrations`.

### Analytics dashboard

Set `ANALYTICS_ADMIN_USERNAME` and `ANALYTICS_ADMIN_PASSWORD` on the Nuxt server. Open `/admin/analytics` directly and enter those credentials in the browser prompt. Use HTTPS in production. If either variable is empty, access is disabled. The activity counts use retained answers from the last 7 and 30 days.

Before a public release, the product decisions require a published privacy policy, retention and backup policy approval, and verification of any claims about the official examination interface.
