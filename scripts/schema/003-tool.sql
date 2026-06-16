-- Harness v0 schema - migration 003
-- Tool registry: external tools registered by capability for workflow steps.

CREATE TABLE tool (
    name            TEXT PRIMARY KEY,
    since           TEXT NOT NULL DEFAULT (datetime('now')),
    command         TEXT NOT NULL,
    description     TEXT NOT NULL,
    responsibility  TEXT NOT NULL,
    args            TEXT,
    kind            TEXT NOT NULL DEFAULT 'cli'
                    CHECK(kind IN ('cli','binary','mcp','skill','http')),
    capability      TEXT,
    scan_target     TEXT,
    status          TEXT DEFAULT 'unknown'
                    CHECK(status IN ('present','missing','unknown')),
    checked_at      TEXT,
    provider        TEXT
);

INSERT INTO schema_version (version) VALUES (3);
