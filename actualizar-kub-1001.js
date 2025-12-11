/**
 * Script para actualizar KUB-1001 directamente
 * Ejecutar con: node actualizar-kub-1001.js
 */

async function actualizarKUB1001() {
  try {
    console.log('🔄 Actualizando cotización KUB-1001...\n');
    
    const response = await fetch('http://localhost:4321/api/actualizar-costos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ numeroCotizacion: 'KUB-1001' }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data.error || 'Error desconocido');
      if (data.materiales_no_encontrados) {
        console.log('\n📋 Materiales no encontrados:');
        data.materiales_no_encontrados.forEach((mat: string) => {
          console.log(`  - ${mat}`);
        });
      }
      if (data.materiales_en_gastos_reales) {
        console.log('\n💰 Materiales en gastos reales:');
        data.materiales_en_gastos_reales.forEach((mat: string) => {
          console.log(`  - ${mat}`);
        });
      }
      return;
    }

    console.log('✅ Actualización exitosa!\n');
    console.log(`📋 Cotización: ${data.numeroCotizacion}`);
    console.log(`📦 Cantidad del Item: ${data.cantidadItem} unidades`);
    console.log(`✅ Materiales Actualizados: ${data.materialesActualizados}`);
    console.log(`💰 Nuevo Total: $${data.nuevoTotal?.toLocaleString('es-CO') || 'N/A'}`);
    
    if (data.materialesActualizados > 0) {
      console.log('\n✅ La cotización ha sido actualizada con los costos reales multiplicados por 15 unidades.');
    }
  } catch (error) {
    console.error('❌ Error al ejecutar:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('  1. El servidor esté corriendo (npm run dev)');
    console.log('  2. La cotización KUB-1001 exista');
    console.log('  3. Haya gastos reales registrados para esa cotización');
  }
}

actualizarKUB1001();






