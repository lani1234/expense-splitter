# Wiping All Data

Use this when you need a clean slate — e.g. before running auth migrations that require empty tables.

---

## Local

**Option A — Flyway clean (recommended)**

1. Temporarily add to `src/main/resources/application.properties`:
   ```
   spring.flyway.clean-disabled=false
   ```
2. Run:
   ```bash
   mvn flyway:clean
   mvn spring-boot:run
   ```
   Flyway drops all schema objects and re-runs all migrations from V1.
3. Remove the `clean-disabled` line from `application.properties`.

**Option B — Drop and recreate the database in psql**

```sql
DROP DATABASE your_db_name;
CREATE DATABASE your_db_name;
```

Then restart the app — Flyway re-runs all migrations automatically on startup.

---

## Hosted (Supabase)

Use the **SQL Editor** in the Supabase dashboard. Run in this order to respect FK constraints:

```sql
TRUNCATE TABLE
  entry_participant_allocation,
  instance_field_value,
  template_instance,
  split_rule_allocation,
  split_rule,
  template_field,
  template_participant,
  template
CASCADE;
```

No Railway or schema changes are needed. The next Railway deploy will run any pending Flyway migrations automatically on top of the now-empty schema.

> Only truncate `flyway_schema_history` if you need Flyway to re-run past migrations. For a data-only wipe, leave it alone.
