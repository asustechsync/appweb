-- Reglas de validez que Prisma no expresa: restricciones CHECK.
-- Idempotente: cada una se crea solo si todavia no existe, asi que se puede
-- correr las veces que haga falta. La migracion
-- 20261011140000_banners_fechas_specs_restricciones crea las mismas (y
-- 20261019120000_libro_reclamaciones, la de reclamos).
DO $$
DECLARE
  regla record;
BEGIN
  FOR regla IN
    SELECT * FROM (VALUES
      ('productos',        'productos_precio_valido',
       $c$"precio" >= 0 AND ("precioLista" IS NULL OR "precioLista" > "precio")$c$),
      ('variantes',        'variantes_stock_no_negativo',
       $c$"stock" >= 0$c$),
      ('movimientos_stock','movimientos_stock_delta_no_cero',
       $c$"delta" <> 0$c$),
      ('items_pedido',     'items_pedido_valores_validos',
       $c$"cantidad" > 0 AND "precioUnitario" >= 0$c$),
      ('pedidos',          'pedidos_montos_validos',
       $c$"subtotal" >= 0 AND "descuento" >= 0 AND "costoEnvio" >= 0 AND "total" >= 0$c$),
      ('pagos',            'pagos_monto_no_negativo',
       $c$"monto" >= 0$c$),
      ('cupones',          'cupones_porcentaje_valido',
       $c$"porcentaje" BETWEEN 1 AND 100$c$),
      ('metodos_envio',    'metodos_envio_costos_validos',
       $c$"costo" >= 0 AND ("gratisDesde" IS NULL OR "gratisDesde" >= 0)$c$),
      ('reclamos',         'reclamos_respuesta_coherente',
       $c$("estado" = 'PENDIENTE' AND "respuesta" IS NULL) OR ("estado" = 'RESPONDIDO' AND "respuesta" IS NOT NULL AND "respondidoEn" IS NOT NULL)$c$)
    ) AS t(tabla, nombre, condicion)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = regla.nombre) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s)', regla.tabla, regla.nombre, regla.condicion);
    END IF;
  END LOOP;
END
$$;
