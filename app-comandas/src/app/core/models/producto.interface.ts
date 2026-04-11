export interface Producto {
  id: string;                  // ID del producto en el catálogo
  nombre: string;              // Nombre del plato (Ej: 'Hamburguesa Smash')
  descripcion: string;         // Descripción detallada de los ingredientes
  precio: number;              // Precio unitario
  idCategoria: string;         // Categoría (Ej: 'bebidas', 'principales', 'postres')
  urlImagen?: string;          // URL de la imagen representativa
  alergenos: string[];         // Matriz de alérgenos críticos que contiene el plato (Ej: ['gluten', 'trazas_frutos_secos'])
  disponible: boolean;         // Si el restaurante tiene stock del producto actualmente
}
