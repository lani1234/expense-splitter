CREATE TABLE template_field_default_participant_amount (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_field_id UUID NOT NULL REFERENCES template_field(id) ON DELETE CASCADE,
    template_participant_id UUID NOT NULL REFERENCES template_participant(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    UNIQUE(template_field_id, template_participant_id)
);
