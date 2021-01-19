# BookBase
This webshop is completely broken and on purpose includes some exciting vulnerabilities like SQL injection and XSS.

# Environment variables in `.env` file
For configuring the app you can either set these variables in your environment or provide a `.env` file.

- `NODE_ENV` — the environment the app is running in (production|development)
- `PORT` — the port the app should be listening on
- `LOG_LEVEL` — the log level at which logging entries should be displayed/saved
- `JWT_SECRET` — a super long secret for creating jwt signatures
- `DB_HOST` — host of the database e.g. `localhost` or `my-db.example.com`
- `DB_PORT` — the database port
- `DB_TYPE` — a database type supported by TypeORM
- `DB_USER` — the database user
- `DB_PASSWORD` — the database users password
- `DB_NAME` — the name of the database that should be used
- `DB_SSL` — should the database connection use SSL (true|false)

Extra info is available in the `.env.sample` file.
