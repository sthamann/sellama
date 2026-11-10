-- Older workers can finish a request, but cannot replace a newer model generation.
ALTER TABLE embedding_generations
    ADD COLUMN model_revision bigint NOT NULL DEFAULT 0 CHECK (model_revision >= 0);
