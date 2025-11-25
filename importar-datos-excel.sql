-- Script para importar datos del Excel "Plantilla 250425 subida.xlsm"
-- Ejecutar este script en Supabase SQL Editor después de ajustar los valores según tu Excel

-- ============================================
-- MATERIALES
-- ============================================
-- Reemplaza estos valores con los datos reales de tu Excel

INSERT INTO materiales (nombre, tipo, unidad, costo_unitario, proveedor) VALUES
-- Maderas
('MDF 18mm', 'madera', 'm²', 45000, 'Proveedor A'),
('MDF 12mm', 'madera', 'm²', 35000, 'Proveedor A'),
('MDF 9mm', 'madera', 'm²', 28000, 'Proveedor A'),
('Pino', 'madera', 'm²', 55000, 'Proveedor B'),
('Roble', 'madera', 'm²', 120000, 'Proveedor C'),
('Cedro', 'madera', 'm²', 80000, 'Proveedor B'),

-- Hierro y Metales
('Hierro 1/2"', 'hierro', 'metro lineal', 15000, 'Proveedor D'),
('Hierro 1"', 'hierro', 'metro lineal', 25000, 'Proveedor D'),
('Hierro 3/4"', 'hierro', 'metro lineal', 20000, 'Proveedor D'),
('Aluminio', 'metal', 'metro lineal', 35000, 'Proveedor E'),
('Lámina galvanizada', 'metal', 'm²', 45000, 'Proveedor E'),

-- Insumos
('Bisagras', 'insumos', 'unidad', 5000, 'Proveedor F'),
('Tornillos', 'insumos', 'unidad', 500, 'Proveedor F'),
('Pegante', 'insumos', 'unidad', 15000, 'Proveedor G'),
('Lijas', 'insumos', 'unidad', 3000, 'Proveedor G'),
('Clavos', 'insumos', 'unidad', 800, 'Proveedor F'),
('Masilla', 'insumos', 'unidad', 12000, 'Proveedor G'),

-- Pintura y Acabados
('Pintura Base', 'pintura', 'galón', 85000, 'Proveedor H'),
('Barniz', 'pintura', 'galón', 95000, 'Proveedor H'),
('Laca', 'pintura', 'galón', 120000, 'Proveedor H'),
('Thinner', 'pintura', 'galón', 45000, 'Proveedor H'),
('Primer', 'pintura', 'galón', 75000, 'Proveedor H'),

-- Accesorios
('Manijas', 'accesorios', 'unidad', 8000, 'Proveedor I'),
('Rieles', 'accesorios', 'unidad', 25000, 'Proveedor I'),
('Cajones', 'accesorios', 'unidad', 45000, 'Proveedor J'),
('Estantes', 'accesorios', 'unidad', 30000, 'Proveedor J'),
('Puertas', 'accesorios', 'unidad', 60000, 'Proveedor J')

ON CONFLICT DO NOTHING;

-- ============================================
-- SERVICIOS / MANO DE OBRA
-- ============================================
-- Reemplaza estos valores con los datos reales de tu Excel

INSERT INTO servicios (nombre, descripcion, precio_por_hora, horas_estimadas) VALUES
('Carpintero', 'Trabajo de carpintería general, corte, ensamble', 35000, 8),
('Soldador', 'Trabajo de soldadura en hierro y metales', 40000, 6),
('Pintor', 'Aplicación de pintura, barniz y acabados', 30000, 4),
('Instalador', 'Instalación de muebles en sitio del cliente', 45000, 4),
('Diseñador', 'Diseño, planos y especificaciones técnicas', 50000, 2),
('Auxiliar', 'Ayudante de taller, preparación de materiales', 25000, 8),
('Maquinista', 'Operación de maquinaria especializada', 40000, 6),
('Acabador', 'Acabados finos, lijado, pulido', 35000, 4)

ON CONFLICT DO NOTHING;

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Ajusta los valores según los datos reales de tu Excel
-- 2. Los precios están en pesos colombianos (COP)
-- 3. Las unidades pueden ser: m², metro lineal, unidad, galón, etc.
-- 4. Ejecuta este script en el SQL Editor de Supabase
-- 5. Si ya existen materiales/servicios, usa UPDATE en lugar de INSERT


