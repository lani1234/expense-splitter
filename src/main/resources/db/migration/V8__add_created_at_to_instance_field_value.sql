ALTER TABLE instance_field_value
    ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT now();
