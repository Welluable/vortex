-- FTS5 availability probe (built-in module)
CREATE VIRTUAL TABLE IF NOT EXISTS _vortex_fts5_probe USING fts5(content);
--> statement-breakpoint
INSERT INTO _vortex_fts5_probe VALUES ('ok');
--> statement-breakpoint
DROP TABLE _vortex_fts5_probe;
--> statement-breakpoint
-- sqlite-vec availability probe (extension must be loaded before migrate runs)
CREATE VIRTUAL TABLE IF NOT EXISTS _vortex_vec_probe USING vec0(embedding FLOAT[1536]);
--> statement-breakpoint
DROP TABLE _vortex_vec_probe;
