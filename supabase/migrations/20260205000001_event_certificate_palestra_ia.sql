-- Migration: Create event certificate for "Palestra Online – Consultório do Futuro na Odontologia (IA)"
-- Event: Today (2026-02-05) at 20:00 (Brasília time), 20h certificate

-- 1. Insert the live event
INSERT INTO live_events (
  title,
  description,
  start_at,
  duration_minutes,
  instructor_name,
  status,
  is_featured
) VALUES (
  'Palestra Online – Consultório do Futuro na Odontologia (IA)',
  'Palestra exclusiva da Odonto GPT sobre o futuro da odontologia com Inteligência Artificial. Evento com certificado de 20 horas.',
  '2026-02-05T23:00:00+00:00', -- 20:00 BRT = 23:00 UTC
  120, -- 2 hours duration
  'Odonto GPT',
  'scheduled',
  true
);

-- 2. Insert the certificate template for this event
INSERT INTO certificate_templates (
  name,
  description,
  hours,
  signatures,
  layout_config,
  available_start,
  available_end
) VALUES (
  'Palestra Online – Consultório do Futuro na Odontologia (IA)',
  'Certificado de participação na Palestra Online – Consultório do Futuro na Odontologia (IA) da Odonto GPT. Carga horária: 20 horas.',
  20,
  '[{"name": "Odonto GPT", "role": "Organizador"}]'::jsonb,
  '{"type": "event", "event_name": "Palestra Online – Consultório do Futuro na Odontologia (IA)", "cakto_product_id": "pi6xasc_754503"}'::jsonb,
  '2026-02-05',
  null
);
