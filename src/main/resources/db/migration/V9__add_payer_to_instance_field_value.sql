ALTER TABLE instance_field_value
    ADD COLUMN payer_participant_id UUID REFERENCES template_participant(id);
