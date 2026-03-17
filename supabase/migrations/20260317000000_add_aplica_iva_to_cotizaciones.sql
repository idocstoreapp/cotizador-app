-- Agrega bandera para cotizaciones exentas de IVA
-- Default: aplica IVA (true) para no romper cotizaciones existentes

alter table public.cotizaciones
add column if not exists aplica_iva boolean not null default true;

-- Backfill por si existían filas con null (por cambios previos)
update public.cotizaciones
set aplica_iva = true
where aplica_iva is null;

