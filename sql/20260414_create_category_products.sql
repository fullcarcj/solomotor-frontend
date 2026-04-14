-- Tabla: category_products
-- Ejecutar en la base del backend (p. ej. PostgreSQL del webhook-receiver).

CREATE TABLE IF NOT EXISTS category_products (
  id BIGSERIAL PRIMARY KEY,
  category_descripcion TEXT NOT NULL,
  category_ml TEXT
);

COMMENT ON TABLE category_products IS 'Categorías de producto (descripción + referencia ML).';
COMMENT ON COLUMN category_products.id IS 'Identificador interno.';
COMMENT ON COLUMN category_products.category_descripcion IS 'Descripción legible de la categoría.';
COMMENT ON COLUMN category_products.category_ml IS 'Identificador o ruta de categoría en Mercado Libre (según convención del negocio).';
