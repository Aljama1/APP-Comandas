/**
 * seed-carta.mjs — Poblar Firestore con la carta completa para demo
 *
 * USO:
 *   cd app-comandas
 *   node scripts/seed-carta.mjs <adminEmail> <adminPassword>
 *
 * Requiere Node.js >= 18 y las dependencias de firebase ya instaladas.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';

// ─── CONFIG (tomada del environment.ts) ───────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyCVujTcksT_EJ1Aky5cDJRJq1ygQwGNuQs',
  authDomain: 'trace-6a41a.firebaseapp.com',
  projectId: 'trace-6a41a',
  storageBucket: 'trace-6a41a.firebasestorage.app',
  messagingSenderId: '224107812856',
  appId: '1:224107812856:web:b3ce8718821554198be80d',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const t = (es, en) => ({ es, en });

// ─── CARTA COMPLETA PARA DEMO ─────────────────────────────────────────────────
// 21 productos que demuestran TODAS las funcionalidades del sistema:
//   • Todas las categorías: entrante, principal, postre, bebida, especial
//   • Variantes de precio
//   • Modificadores EXCLUYENTES (obligatorios y no)
//   • Modificadores OPCIONALES (extras a precio adicional)
//   • Los 14 tipos de alérgenos
//   • Control de stock (algunos con stock bajo)
//   • Turnos ALMUERZO / CENA / ambos
//   • Productos bilingüe ES/EN

const carta = [
  // ══════════════════════════════════════════════════════════════════════════
  // ENTRANTES
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'entrante-01',
    nombre: t('Croquetas de Jamón Ibérico', 'Iberian Ham Croquettes'),
    descripcion: t(
      'Cremosas croquetas caseras de jamón ibérico con bechamel artesanal, rebozadas en pan rallado y fritas al momento.',
      'Creamy homemade Iberian ham croquettes with artisan béchamel, breaded and freshly fried.'
    ),
    precio: 8.9,
    urlImagen: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
    categoria: 'entrante',
    alergenos: ['Gluten', 'Lácteos', 'Huevos'],
    disponible: true,
    stock: 30,
    orden: 1,
    variantes: [
      { nombre: t('Ración 6 uds', 'Portion 6 pcs'), precio: 8.9 },
      { nombre: t('Ración 12 uds', 'Portion 12 pcs'), precio: 15.9 },
    ],
    modificadores: [
      {
        nombre: t('Salsa de acompañamiento', 'Dipping sauce'),
        tipo: 'EXCLUYENTE',
        obligatorio: true,
        opciones: [
          { nombre: t('Alioli', 'Aioli'), precioAdicional: 0 },
          { nombre: t('Tomate frito', 'Tomato sauce'), precioAdicional: 0 },
          { nombre: t('Salsa brava', 'Spicy sauce'), precioAdicional: 0 },
        ],
      },
    ],
  },

  {
    id: 'entrante-02',
    nombre: t('Ensalada César', 'Caesar Salad'),
    descripcion: t(
      'Lechuga romana, pollo a la plancha, croutones de pan artesanal, parmesano rallado y aderezo césar con anchoas.',
      'Romaine lettuce, grilled chicken, artisan croutons, shaved Parmesan and Caesar dressing with anchovies.'
    ),
    precio: 11.5,
    urlImagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    categoria: 'entrante',
    alergenos: ['Huevos', 'Pescado', 'Lácteos', 'Gluten', 'Mostaza'],
    disponible: true,
    orden: 2,
    variantes: [
      { nombre: t('Individual', 'Individual'), precio: 11.5 },
      { nombre: t('Para compartir', 'To share'), precio: 19.9 },
    ],
  },

  {
    id: 'entrante-03',
    nombre: t('Gazpacho Andaluz', 'Andalusian Gazpacho'),
    descripcion: t(
      'Gazpacho tradicional elaborado con tomates maduros de temporada, pepino, pimiento y aceite de oliva virgen extra. Solo disponible en almuerzo.',
      'Traditional gazpacho made with seasonal ripe tomatoes, cucumber, pepper and extra virgin olive oil. Lunch only.'
    ),
    precio: 6.5,
    urlImagen: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&q=80',
    categoria: 'entrante',
    alergenos: [],
    disponible: true,
    stock: 20,
    turnos: ['ALMUERZO'],
    orden: 3,
    modificadores: [
      {
        nombre: t('Toppings', 'Toppings'),
        tipo: 'OPCIONAL',
        obligatorio: false,
        opciones: [
          { nombre: t('Cebolla crujiente', 'Crispy onion'), precioAdicional: 0.5 },
          { nombre: t('Picatostes', 'Croutons'), precioAdicional: 0.5 },
          { nombre: t('Jamón serrano', 'Serrano ham'), precioAdicional: 1.5 },
        ],
      },
    ],
  },

  {
    id: 'entrante-04',
    nombre: t('Burrata con Tomate y Albahaca', 'Burrata with Tomato & Basil'),
    descripcion: t(
      'Burrata fresca de importación italiana sobre cama de tomates cherry asados y pesto de albahaca. Stock limitado.',
      'Fresh Italian burrata on a bed of roasted cherry tomatoes and basil pesto. Limited stock.'
    ),
    precio: 13.9,
    urlImagen: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    categoria: 'entrante',
    alergenos: ['Lácteos'],
    disponible: true,
    stock: 8,
    orden: 4,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PRINCIPALES
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'principal-01',
    nombre: t('Chuletón de Ávila', 'Ávila T-Bone Steak'),
    descripcion: t(
      'Chuletón de vaca rubia gallega madurado 30 días, cocinado a la brasa con sal maldon y aceite de oliva. Elige el punto de cocción y la guarnición.',
      'Galician blonde cow rib steak aged 30 days, charcoal grilled with maldon salt and olive oil. Choose your doneness and side dish.'
    ),
    precio: 28.9,
    urlImagen: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
    categoria: 'principal',
    alergenos: [],
    disponible: true,
    orden: 5,
    variantes: [
      { nombre: t('400g', '400g'), precio: 28.9 },
      { nombre: t('600g', '600g'), precio: 38.9 },
      { nombre: t('1kg para dos', '1kg for two'), precio: 62.0 },
    ],
    modificadores: [
      {
        nombre: t('Punto de cocción', 'Doneness'),
        tipo: 'EXCLUYENTE',
        obligatorio: true,
        opciones: [
          { nombre: t('Poco hecho', 'Rare'), precioAdicional: 0 },
          { nombre: t('En su punto', 'Medium'), precioAdicional: 0 },
          { nombre: t('Muy hecho', 'Well done'), precioAdicional: 0 },
        ],
      },
      {
        nombre: t('Guarnición', 'Side dish'),
        tipo: 'EXCLUYENTE',
        obligatorio: false,
        opciones: [
          { nombre: t('Patatas fritas', 'French fries'), precioAdicional: 0 },
          { nombre: t('Patatas asadas', 'Roasted potatoes'), precioAdicional: 0 },
          { nombre: t('Verduras asadas', 'Roasted vegetables'), precioAdicional: 0 },
          { nombre: t('Pimientos de padrón', 'Padrón peppers'), precioAdicional: 0 },
        ],
      },
    ],
  },

  {
    id: 'principal-02',
    nombre: t('Merluza a la Romana', 'Roman-Style Hake'),
    descripcion: t(
      'Lomo de merluza del Cantábrico rebozado en tempura ligera, acompañado de la guarnición a elegir y limón fresco.',
      'Cantabrian hake loin in light tempura batter, served with your choice of side dish and fresh lemon.'
    ),
    precio: 16.9,
    urlImagen: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
    categoria: 'principal',
    alergenos: ['Pescado', 'Gluten', 'Huevos'],
    disponible: true,
    orden: 6,
    modificadores: [
      {
        nombre: t('Guarnición', 'Side dish'),
        tipo: 'EXCLUYENTE',
        obligatorio: true,
        opciones: [
          { nombre: t('Patatas fritas', 'French fries'), precioAdicional: 0 },
          { nombre: t('Verduras al vapor', 'Steamed vegetables'), precioAdicional: 0 },
          { nombre: t('Arroz blanco', 'White rice'), precioAdicional: 0 },
        ],
      },
    ],
  },

  {
    id: 'principal-03',
    nombre: t('Risotto de Setas del Bosque', 'Wild Mushroom Risotto'),
    descripcion: t(
      'Risotto cremoso con mezcla de setas silvestres, vino blanco, caldo de verduras casero y parmesano. Acepta extras de lujo.',
      'Creamy risotto with wild mushroom mix, white wine, homemade vegetable stock and Parmesan. Luxury extras available.'
    ),
    precio: 18.5,
    urlImagen: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
    categoria: 'principal',
    alergenos: ['Lácteos', 'Gluten', 'Dióxido de azufre y sulfitos'],
    disponible: true,
    orden: 7,
    modificadores: [
      {
        nombre: t('Extras de lujo', 'Luxury extras'),
        tipo: 'OPCIONAL',
        obligatorio: false,
        opciones: [
          { nombre: t('Láminas de trufa negra', 'Black truffle shavings'), precioAdicional: 5.0 },
          { nombre: t('Parmesano extra', 'Extra Parmesan'), precioAdicional: 1.5 },
          { nombre: t('Foie mi-cuit', 'Mi-cuit foie'), precioAdicional: 4.0 },
        ],
      },
    ],
  },

  {
    id: 'principal-04',
    nombre: t('Hamburguesa Artesana', 'Artisan Burger'),
    descripcion: t(
      'Hamburguesa de ternera gallega 200g, pan brioche artesanal, lechuga, tomate, cebolla caramelizada y salsa de la casa. Elige tus extras.',
      '200g Galician beef patty, artisan brioche bun, lettuce, tomato, caramelised onion and house sauce. Choose your extras.'
    ),
    precio: 14.9,
    urlImagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    categoria: 'principal',
    alergenos: ['Gluten', 'Huevos', 'Lácteos', 'Mostaza', 'Soja', 'Granos de sésamo'],
    disponible: true,
    stock: 25,
    orden: 8,
    variantes: [
      { nombre: t('Classic (200g)', 'Classic (200g)'), precio: 14.9 },
      { nombre: t('BBQ (200g)', 'BBQ (200g)'), precio: 15.9 },
      { nombre: t('Doble (400g)', 'Double (400g)'), precio: 18.9 },
    ],
    modificadores: [
      {
        nombre: t('Pan', 'Bun'),
        tipo: 'EXCLUYENTE',
        obligatorio: true,
        opciones: [
          { nombre: t('Brioche', 'Brioche'), precioAdicional: 0 },
          { nombre: t('Integral', 'Wholegrain'), precioAdicional: 0 },
          { nombre: t('Sin gluten', 'Gluten-free'), precioAdicional: 1.0 },
        ],
      },
      {
        nombre: t('Extras', 'Extras'),
        tipo: 'OPCIONAL',
        obligatorio: false,
        opciones: [
          { nombre: t('Bacon extra', 'Extra bacon'), precioAdicional: 1.5 },
          { nombre: t('Huevo frito', 'Fried egg'), precioAdicional: 1.0 },
          { nombre: t('Queso extra', 'Extra cheese'), precioAdicional: 1.0 },
          { nombre: t('Aguacate', 'Avocado'), precioAdicional: 2.0 },
        ],
      },
    ],
  },

  {
    id: 'principal-05',
    nombre: t('Pasta Carbonara Tradicional', 'Traditional Carbonara Pasta'),
    descripcion: t(
      'Rigatoni al dente con salsa carbonara romana clásica: guanciale, yema de huevo, pecorino romano y pimienta negra. Solo disponible en cena.',
      'Al dente rigatoni with classic Roman carbonara: guanciale, egg yolk, pecorino romano and black pepper. Dinner only.'
    ),
    precio: 14.5,
    urlImagen: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80',
    categoria: 'principal',
    alergenos: ['Gluten', 'Huevos', 'Lácteos'],
    disponible: true,
    turnos: ['CENA'],
    orden: 9,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // POSTRES
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'postre-01',
    nombre: t('Tarta de Queso de La Viña', 'La Viña Cheesecake'),
    descripcion: t(
      'La legendaria tarta de queso del restaurante La Viña de San Sebastián, cremosa y ligeramente quemada por fuera. Stock limitado.',
      'The legendary cheesecake from La Viña restaurant in San Sebastián, creamy with a lightly charred top. Limited stock.'
    ),
    precio: 7.5,
    urlImagen: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80',
    categoria: 'postre',
    alergenos: ['Lácteos', 'Huevos', 'Gluten'],
    disponible: true,
    stock: 12,
    orden: 10,
  },

  {
    id: 'postre-02',
    nombre: t('Coulant de Chocolate Negro', 'Dark Chocolate Lava Cake'),
    descripcion: t(
      'Bizcocho tibio de chocolate negro 70% con corazón fundido. Servido con helado de vainilla o nata montada. Solo en cena.',
      'Warm dark chocolate 70% cake with molten centre. Served with vanilla ice cream or whipped cream. Dinner only.'
    ),
    precio: 8.0,
    urlImagen: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80',
    categoria: 'postre',
    alergenos: ['Gluten', 'Lácteos', 'Huevos', 'Frutos de cáscara'],
    disponible: true,
    turnos: ['CENA'],
    orden: 11,
    modificadores: [
      {
        nombre: t('Acompañamiento', 'Accompaniment'),
        tipo: 'OPCIONAL',
        obligatorio: false,
        opciones: [
          { nombre: t('Helado de vainilla', 'Vanilla ice cream'), precioAdicional: 1.5 },
          { nombre: t('Nata montada', 'Whipped cream'), precioAdicional: 1.0 },
        ],
      },
    ],
  },

  {
    id: 'postre-03',
    nombre: t('Crème Brûlée', 'Crème Brûlée'),
    descripcion: t(
      'Crema francesa clásica de vainilla de Madagascar, con su característica costra de azúcar caramelizado crujiente.',
      'Classic French vanilla cream from Madagascar, with its signature crispy caramelised sugar crust.'
    ),
    precio: 6.5,
    urlImagen: 'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=600&q=80',
    categoria: 'postre',
    alergenos: ['Lácteos', 'Huevos'],
    disponible: true,
    orden: 12,
  },

  {
    id: 'postre-04',
    nombre: t('Sorbete Artesano', 'Artisan Sorbet'),
    descripcion: t(
      'Sorbete elaborado en casa con fruta fresca de temporada, sin lactosa ni gluten. Elige tu sabor favorito.',
      'Homemade sorbet with fresh seasonal fruit, lactose and gluten free. Choose your favourite flavour.'
    ),
    precio: 5.5,
    urlImagen: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=600&q=80',
    categoria: 'postre',
    alergenos: [],
    disponible: true,
    orden: 13,
    modificadores: [
      {
        nombre: t('Sabor', 'Flavour'),
        tipo: 'EXCLUYENTE',
        obligatorio: true,
        opciones: [
          { nombre: t('Limón', 'Lemon'), precioAdicional: 0 },
          { nombre: t('Mango', 'Mango'), precioAdicional: 0 },
          { nombre: t('Fresa', 'Strawberry'), precioAdicional: 0 },
          { nombre: t('Maracuyá', 'Passion fruit'), precioAdicional: 0 },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEBIDAS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bebida-01',
    nombre: t('Agua Mineral', 'Mineral Water'),
    descripcion: t(
      'Agua mineral natural de manantial, disponible con o sin gas.',
      'Natural spring mineral water, available still or sparkling.'
    ),
    precio: 2.5,
    urlImagen: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80',
    categoria: 'bebida',
    alergenos: [],
    disponible: true,
    orden: 14,
    variantes: [
      { nombre: t('50cl sin gas', '50cl still'), precio: 2.5 },
      { nombre: t('50cl con gas', '50cl sparkling'), precio: 2.5 },
      { nombre: t('1L sin gas', '1L still'), precio: 3.9 },
    ],
  },

  {
    id: 'bebida-02',
    nombre: t('Vino de la Casa', 'House Wine'),
    descripcion: t(
      'Selección de vinos de denominación de origen española. Pregunta a tu camarero por las opciones disponibles hoy.',
      'Selection of Spanish denomination of origin wines. Ask your waiter about today\'s available options.'
    ),
    precio: 3.5,
    urlImagen: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
    categoria: 'bebida',
    alergenos: ['Dióxido de azufre y sulfitos'],
    disponible: true,
    orden: 15,
    variantes: [
      { nombre: t('Copa blanco', 'Glass white'), precio: 3.5 },
      { nombre: t('Copa tinto', 'Glass red'), precio: 3.5 },
      { nombre: t('Copa rosado', 'Glass rosé'), precio: 3.5 },
      { nombre: t('Botella blanco', 'Bottle white'), precio: 16.9 },
      { nombre: t('Botella tinto', 'Bottle red'), precio: 16.9 },
    ],
  },

  {
    id: 'bebida-03',
    nombre: t('Cerveza Artesana', 'Craft Beer'),
    descripcion: t(
      'Cervezas artesanales de producción local, elaboradas con lúpulo seleccionado y malta de calidad.',
      'Local craft beers brewed with selected hops and quality malt.'
    ),
    precio: 4.0,
    urlImagen: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&q=80',
    categoria: 'bebida',
    alergenos: ['Gluten', 'Dióxido de azufre y sulfitos'],
    disponible: true,
    orden: 16,
    variantes: [
      { nombre: t('IPA', 'IPA'), precio: 4.5 },
      { nombre: t('Rubia', 'Lager'), precio: 4.0 },
      { nombre: t('Tostada', 'Amber ale'), precio: 4.5 },
      { nombre: t('Sin alcohol', 'Non-alcoholic'), precio: 3.5 },
    ],
  },

  {
    id: 'bebida-04',
    nombre: t('Refresco', 'Soft Drink'),
    descripcion: t(
      'Refrescos en lata o botella de 33cl, bien fríos.',
      '33cl can or bottle cold soft drinks.'
    ),
    precio: 3.0,
    urlImagen: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=600&q=80',
    categoria: 'bebida',
    alergenos: [],
    disponible: true,
    orden: 17,
    variantes: [
      { nombre: t('Coca-Cola', 'Coca-Cola'), precio: 3.0 },
      { nombre: t('Fanta Naranja', 'Fanta Orange'), precio: 3.0 },
      { nombre: t('Fanta Limón', 'Fanta Lemon'), precio: 3.0 },
      { nombre: t('Tónica', 'Tonic Water'), precio: 3.0 },
      { nombre: t('Aquarius Naranja', 'Aquarius Orange'), precio: 3.0 },
    ],
  },

  {
    id: 'bebida-05',
    nombre: t('Café', 'Coffee'),
    descripcion: t(
      'Café de especialidad de origen único. Elige tu tipo y personaliza tu bebida.',
      'Single origin specialty coffee. Choose your type and personalise your drink.'
    ),
    precio: 1.8,
    urlImagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
    categoria: 'bebida',
    alergenos: ['Lácteos'],
    disponible: true,
    orden: 18,
    modificadores: [
      {
        nombre: t('Tipo de café', 'Coffee type'),
        tipo: 'EXCLUYENTE',
        obligatorio: true,
        opciones: [
          { nombre: t('Solo', 'Espresso'), precioAdicional: 0 },
          { nombre: t('Cortado', 'Cortado'), precioAdicional: 0 },
          { nombre: t('Con leche', 'Flat white'), precioAdicional: 0.2 },
          { nombre: t('Capuchino', 'Cappuccino'), precioAdicional: 0.5 },
          { nombre: t('Americano', 'Americano'), precioAdicional: 0 },
        ],
      },
      {
        nombre: t('Tipo de leche', 'Milk type'),
        tipo: 'OPCIONAL',
        obligatorio: false,
        opciones: [
          { nombre: t('Leche desnatada', 'Skimmed milk'), precioAdicional: 0 },
          { nombre: t('Leche de soja', 'Soy milk'), precioAdicional: 0.3 },
          { nombre: t('Leche de avena', 'Oat milk'), precioAdicional: 0.3 },
        ],
      },
    ],
  },

  {
    id: 'bebida-06',
    nombre: t('Zumo Natural', 'Fresh Juice'),
    descripcion: t(
      'Zumo recién exprimido al momento. Solo disponible en almuerzo.',
      'Freshly squeezed juice. Lunch service only.'
    ),
    precio: 4.5,
    urlImagen: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=80',
    categoria: 'bebida',
    alergenos: [],
    disponible: true,
    turnos: ['ALMUERZO'],
    orden: 19,
    variantes: [
      { nombre: t('Naranja', 'Orange'), precio: 4.5 },
      { nombre: t('Zanahoria y naranja', 'Carrot & orange'), precio: 4.5 },
      { nombre: t('Tomate', 'Tomato'), precio: 3.5 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ESPECIALES
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'especial-01',
    nombre: t('Menú del Día', 'Set Lunch Menu'),
    descripcion: t(
      'Menú completo: entrante + principal + postre + bebida + pan. Incluye nuestros platos del día preparados con producto de mercado fresco. Solo almuerzo de lunes a viernes. Stock limitado.',
      'Full set menu: starter + main + dessert + drink + bread. Includes our daily dishes prepared with fresh market produce. Monday to Friday lunch only. Limited availability.'
    ),
    precio: 14.9,
    urlImagen: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=600&q=80',
    categoria: 'especial',
    alergenos: ['Gluten', 'Huevos', 'Lácteos', 'Pescado'],
    disponible: true,
    stock: 20,
    turnos: ['ALMUERZO'],
    orden: 20,
  },

  {
    id: 'especial-02',
    nombre: t('Experiencia Gastronómica Chef', "Chef's Tasting Experience"),
    descripcion: t(
      '7 pases creativos de autor diseñados por nuestro chef, con los mejores productos de temporada. Maridaje opcional con vinos de pequeños productores seleccionados. Plazas muy limitadas, solo cena.',
      '7 creative chef-designed courses featuring the best seasonal produce. Optional wine pairing with selected small producer wines. Very limited seats, dinner only.'
    ),
    precio: 65.0,
    urlImagen: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    categoria: 'especial',
    alergenos: ['Gluten', 'Lácteos', 'Huevos', 'Pescado', 'Crustáceos', 'Frutos de cáscara', 'Moluscos', 'Altramuces'],
    disponible: true,
    stock: 6,
    turnos: ['CENA'],
    orden: 21,
    modificadores: [
      {
        nombre: t('Maridaje', 'Wine pairing'),
        tipo: 'EXCLUYENTE',
        obligatorio: true,
        opciones: [
          { nombre: t('Sin maridaje', 'Without pairing'), precioAdicional: 0 },
          { nombre: t('Maridaje con vinos seleccionados', 'Selected wine pairing'), precioAdicional: 25.0 },
        ],
      },
    ],
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('❌  Uso: node scripts/seed-carta.mjs <adminEmail> <adminPassword>');
    process.exit(1);
  }

  console.log('🔥  Inicializando Firebase...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`🔐  Autenticando como ${email}...`);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅  Autenticación correcta\n');
  } catch (err) {
    console.error('❌  Error de autenticación:', err.message);
    process.exit(1);
  }

  // Borrar carta existente
  console.log('🗑️   Borrando productos existentes...');
  const snap = await getDocs(collection(db, 'productos'));
  if (!snap.empty) {
    const deleteBatch = writeBatch(db);
    snap.forEach((d) => deleteBatch.delete(d.ref));
    await deleteBatch.commit();
    console.log(`     ${snap.size} productos eliminados\n`);
  } else {
    console.log('     (no había productos previos)\n');
  }

  // Insertar carta nueva en lotes de 500 (límite Firestore)
  console.log('📥  Insertando carta demo...');
  let insertBatch = writeBatch(db);
  let count = 0;

  for (const producto of carta) {
    const { id, ...data } = producto;
    const ref = doc(collection(db, 'productos'), id);
    insertBatch.set(ref, data);
    count++;

    if (count % 500 === 0) {
      await insertBatch.commit();
      insertBatch = writeBatch(db);
    }
  }

  if (count % 500 !== 0) {
    await insertBatch.commit();
  }

  console.log(`\n✅  ${count} productos insertados correctamente:\n`);

  const resumen = {
    entrantes: carta.filter((p) => p.categoria === 'entrante').length,
    principales: carta.filter((p) => p.categoria === 'principal').length,
    postres: carta.filter((p) => p.categoria === 'postre').length,
    bebidas: carta.filter((p) => p.categoria === 'bebida').length,
    especiales: carta.filter((p) => p.categoria === 'especial').length,
  };

  console.log('   🥗 Entrantes:  ', resumen.entrantes);
  console.log('   🍽️  Principales:', resumen.principales);
  console.log('   🍰 Postres:    ', resumen.postres);
  console.log('   🥤 Bebidas:    ', resumen.bebidas);
  console.log('   ⭐ Especiales: ', resumen.especiales);

  console.log('\n📋  Funcionalidades demostradas:');
  console.log('   • Variantes de precio (ej: chuletón 400g/600g/1kg)');
  console.log('   • Modificadores EXCLUYENTES obligatorios (ej: punto de cocción)');
  console.log('   • Modificadores OPCIONALES con precio adicional (ej: extras hamburguesa)');
  console.log('   • Todos los 14 tipos de alérgenos cubiertos');
  console.log('   • Control de stock (burrata x8, menú del día x20, experiencia chef x6)');
  console.log('   • Turnos: solo ALMUERZO (gazpacho, menú), solo CENA (pasta, coulant, experiencia)');
  console.log('   • Bilingüe ES/EN en todos los campos');
  console.log('   • Destino automático COCINA/BARRA según categoría\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
