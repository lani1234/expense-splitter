CREATE TABLE template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE template_participant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES template(id),
    name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL
);

CREATE TABLE split_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES template(id),
    name VARCHAR(100) NOT NULL
);

CREATE TABLE split_rule_share (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    split_rule_id UUID NOT NULL REFERENCES split_rule(id),
    template_participant_id UUID NOT NULL REFERENCES template_participant(id),
    percent NUMERIC(5,2) NOT NULL
);

CREATE TABLE template_field (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES template(id),
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(20) NOT NULL,
    default_split_rule_id UUID REFERENCES split_rule(id),
    display_order INT NOT NULL
);

CREATE TABLE template_instance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES template(id),
    period VARCHAR(7) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE instance_field_value (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES template_instance(id),
    template_field_id UUID NOT NULL REFERENCES template_field(id),
    amount NUMERIC(10,2) NOT NULL,
    note VARCHAR(255),
    entry_date DATE,
    split_mode VARCHAR(20) NOT NULL DEFAULT 'DEFAULT',
    override_split_rule_id UUID REFERENCES split_rule(id)
);

CREATE TABLE entry_participant_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES instance_field_value(id),
    template_participant_id UUID NOT NULL REFERENCES template_participant(id),
    amount NUMERIC(10,2) NOT NULL
);
