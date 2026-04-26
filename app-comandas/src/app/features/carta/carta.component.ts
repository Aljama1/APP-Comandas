import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartaService } from '../../core/services/carta.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ComandaService } from '../../core/services/comanda.service';
import { ResumenFlotanteComponent } from '../../shared/components/resumen-flotante/resumen-flotante.component';
import { addIcons } from 'ionicons';
import { 
  shieldCheckmark,
  shieldOutline,
  personCircleOutline,
  warningOutline,
  addOutline,
  cartOutline,
  searchOutline,
  logOutOutline,
  checkmarkOutline
} from 'ionicons/icons';

/** Mapa de etiquetas legibles para cada categoría del menú */
const ETIQUETAS_CATEGORIA: Record<string, string> = {
  'entrante': '🥗 Entrantes',
  'principal': '🍽️ Principales',
  'postre': '🍰 Postres',
  'bebida': '🥤 Bebidas',
  'especial': '⭐ Especiales'
};

/** Orden de visualización de las categorías en la carta */
const ORDEN_CATEGORIAS = ['entrante', 'principal', 'postre', 'bebida', 'especial'];

@Component({
  selector: 'app-carta',
  standalone: true,
  imports: [CommonModule, IonicModule, ResumenFlotanteComponent],
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss']
})
export class CartaComponent {
  private cartaService = inject(CartaService);
  private usuarioService = inject(UsuarioService);
  public comandaService = inject(ComandaService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  // Datos globales del usuario (Signal)
  perfil = this.usuarioService.perfil;

  // Lista de todos los productos (Signal)
  todosLosProductos = this.cartaService.productos;

  // Control del feedback visual al añadir al carrito
  productoRecienAnadido = signal<string | null>(null);

  /**
   * EL MOTOR DE FILTRADO (Día 4 completado)
   * Evalúa el peligro de cada producto cruzando los alérgenos del
   * producto con el vector de alergias activas del individuo.
   */
  productosMaquetados = computed(() => {
    const alergiasUsuario = this.perfil()?.alergenos || [];
    
    return this.todosLosProductos().map(producto => {
      const alergenosPeligrosos = producto.alergenos.filter(al => alergiasUsuario.includes(al));
      const esSeguro = alergenosPeligrosos.length === 0;
      
      return {
        ...producto,
        esSeguro,
        alergenosPeligrosos
      };
    });
  });

  /**
   * AGRUPACIÓN POR CATEGORÍAS
   * Organiza los productos en secciones ordenadas para facilitar
   * la navegación visual del comensal en cartas extensas.
   */
  productosPorCategoria = computed(() => {
    const productos = this.productosMaquetados();
    const grupos: { clave: string; etiqueta: string; items: typeof productos }[] = [];

    for (const cat of ORDEN_CATEGORIAS) {
      const items = productos.filter(p => p.categoria === cat);
      if (items.length > 0) {
        grupos.push({
          clave: cat,
          etiqueta: ETIQUETAS_CATEGORIA[cat] || cat,
          items
        });
      }
    }
    return grupos;
  });

  constructor() {
    addIcons({
      shieldCheckmark,
      shieldOutline,
      personCircleOutline,
      warningOutline,
      addOutline,
      cartOutline,
      searchOutline,
      logOutOutline,
      checkmarkOutline
    });
  }

  /**
   * Añade un producto al carrito y muestra feedback visual temporal.
   */
  agregarAlCarrito(producto: any) {
    this.comandaService.agregarLinea(producto, 1);

    // Feedback visual: marca el producto como recién añadido durante 800ms
    this.productoRecienAnadido.set(producto.id);
    setTimeout(() => {
      if (this.productoRecienAnadido() === producto.id) {
        this.productoRecienAnadido.set(null);
      }
    }, 800);
  }

  irALaComanda() {
    this.router.navigateByUrl('/resumen-comanda');
  }

  async confirmarCierreSesion() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas salir? Si tienes una comanda sin enviar, se perderá.',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {
            this.usuarioService.limpiarPerfil();
            this.comandaService.vaciarComanda();
            this.router.navigateByUrl('/check-in');
          }
        }
      ]
    });
    await alert.present();
  }
}
