ALTER TABLE template_field
    ADD COLUMN default_payer_participant_id UUID REFERENCES template_participant(id);
