-- ============================================
-- Script para crear un usuario administrador
-- Ejecuta esto DESPUÉS de crear el usuario en Authentication
-- ============================================

-- PASO 1: Primero crea el usuario en Authentication > Users
-- PASO 2: Copia el User ID (UUID) del usuario creado
-- PASO 3: Reemplaza 'TU_USER_ID_AQUI' con el UUID real
-- PASO 4: Ejecuta este script

INSERT INTO perfiles (id, email, role, nombre)
VALUES (
  'TU_USER_ID_AQUI',  -- ⚠️ REEMPLAZA ESTO con el UUID del usuario
  'admin@muebleria.com',
  'admin',
  'Administrador Principal'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', nombre = 'Administrador Principal';

-- ============================================
-- Para verificar que se creó correctamente:
-- ============================================
-- SELECT * FROM perfiles WHERE email = 'admin@muebleria.com';
-- ============================================


