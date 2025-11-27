-- ============================================
-- Script SQL: Crear Personal Inicial
-- ============================================
-- Este script crea 2 vendedores y 2 trabajadores de taller iniciales
-- NOTA: Estos son solo registros en la base de datos, NO usuarios de autenticación
-- ============================================

-- VENDEDOR 1
INSERT INTO perfiles (id, nombre, apellido, role, created_at)
VALUES (
  gen_random_uuid(),
  'Juan',
  'Pérez',
  'vendedor',
  NOW()
);

-- VENDEDOR 2
INSERT INTO perfiles (id, nombre, apellido, role, created_at)
VALUES (
  gen_random_uuid(),
  'María',
  'González',
  'vendedor',
  NOW()
);

-- TRABAJADOR DE TALLER 1
INSERT INTO perfiles (id, nombre, apellido, role, especialidad, created_at)
VALUES (
  gen_random_uuid(),
  'Carlos',
  'Ramírez',
  'trabajador_taller',
  'Carpintero',
  NOW()
);

-- TRABAJADOR DE TALLER 2
INSERT INTO perfiles (id, nombre, apellido, role, especialidad, created_at)
VALUES (
  gen_random_uuid(),
  'Ana',
  'Mendoza',
  'trabajador_taller',
  'Pintor',
  NOW()
);

-- ============================================
-- Verificar que se crearon correctamente
-- ============================================
SELECT 
  id,
  nombre,
  apellido,
  role,
  especialidad,
  created_at
FROM perfiles
WHERE role IN ('vendedor', 'trabajador_taller')
ORDER BY role, nombre, apellido;


