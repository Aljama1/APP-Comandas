import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartaService } from '../../core/services/carta.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ComandaService } from '../../core/services/comanda.service';
import { ComandaFirestoreService } from '../../core/services/comanda-firestore.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { Producto } from '../../core/models/producto.model';
import { addIcons } from 'ionicons';
import {
  shieldCheckmark, shieldOutline, personCircleOutline, warningOutline,
  addOutline, cartOutline, logOutOutline, checkmarkOutline, receiptOutline,
  closeOutline, settingsOutline, moonOutline, sunnyOutline,
  nutritionOutline, leafOutline, eggOutline, fishOutline, restaurantOutline,
  chevronForwardOutline, alertCircleOutline
} from 'ionicons/icons';

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  'entrante': 'Entrantes',
  'principal': 'Principales',
  'postre': 'Postres',
  'bebida': 'Bebidas',
  'especial': 'Especiales'
};

const EMOJIS_CATEGORIA: Record<string, string> = {
  'entrante': '🥗', 'principal': '🍽️', 'postre': '🍰', 'bebida': '🥤', 'especial': '⭐'
};

const ORDEN_CATEGORIAS = ['entrante', 'principal', 'postre', 'bebida', 'especial'];

@Component({
  selector: 'app-carta',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss']
})
export class CartaComponent {
  private cartaService = inject(CartaService);
  private usuarioService = inject(UsuarioService);
  public comandaService = inject(ComandaService);
  public firestoreService = inject(ComandaFirestoreService);
  public settings = inject(UserSettingsService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  perfil = this.usuarioService.perfil;

  // Modal de detalle de producto
  productoSeleccionado = signal<any | null>(null);
  mostrarModalProducto = signal<boolean>(false);

  // Modal de configuración de usuario
  mostrarSettings = signal<boolean>(false);

  // Copia editable de alérgenos en el modal de settings
  alergenosEditados = signal<string[]>([]);

  readonly todosLosAlergenos = [
    { id: 'gluten',       nombre: 'Gluten',    icono: '/assets/icon/gluten.svg',       esSvg: true  },
    { id: 'lactosa',      nombre: 'Lactosa',   icono: '/assets/icon/lactosa.svg',      esSvg: true  },
    { id: 'frutos-secos', nombre: 'F. Secos',  icono: '/assets/icon/frutos-secos.svg', esSvg: true  },
    { id: 'huevo',        nombre: 'Huevo',     icono: 'egg-outline',                   esSvg: false },
    { id: 'pescado',      nombre: 'Pescado',   icono: 'fish-outline',                  esSvg: false },
    { id: 'marisco',      nombre: 'Marisco',   icono: 'restaurant-outline',            esSvg: false },
  ];

  // Feedback visual al añadir
  productoRecienAnadido = signal<string | null>(null);

  productosMaquetados = computed(() => {
    const alergiasUsuario = this.perfil()?.alergenos || [];
    return this.cartaService.productos().map(producto => {
      const alergenosPeligrosos = producto.alergenos.filter(al => alergiasUsuario.includes(al));
      return { ...producto, esSeguro: alergenosPeligrosos.length === 0, alergenosPeligrosos };
    });
  });

  productosPorCategoria = computed(() => {
    const productos = this.productosMaquetados();
    const grupos: { clave: string; etiqueta: string; emoji: string; items: typeof productos }[] = [];
    for (const cat of ORDEN_CATEGORIAS) {
      const items = productos.filter(p => p.categoria === cat);
      if (items.length > 0) {
        grupos.push({ clave: cat, etiqueta: ETIQUETAS_CATEGORIA[cat] || cat, emoji: EMOJIS_CATEGORIA[cat] || '', items });
      }
    }
    return grupos;
  });

  constructor() {
    addIcons({
      shieldCheckmark, shieldOutline, personCircleOutline, warningOutline,
      addOutline, cartOutline, logOutOutline, checkmarkOutline, receiptOutline,
      closeOutline, settingsOutline, moonOutline, sunnyOutline,
      nutritionOutline, leafOutline, eggOutline, fishOutline, restaurantOutline,
      chevronForwardOutline, alertCircleOutline
    });
  }

  // ── Producto Modal ──────────────────────────────────────────────
  abrirProducto(producto: any): void {
    this.productoSeleccionado.set(producto);
    this.mostrarModalProducto.set(true);
  }

  cerrarProducto(): void {
    this.mostrarModalProducto.set(false);
    setTimeout(() => this.productoSeleccionado.set(null), 300);
  }

  agregarDesdeModal(producto: any): void {
    this.comandaService.agregarLinea(producto, 1);
    this.productoRecienAnadido.set(producto.id);
    setTimeout(() => {
      if (this.productoRecienAnadido() === producto.id) this.productoRecienAnadido.set(null);
    }, 1200);
    this.cerrarProducto();
  }

  // ── Settings Modal ──────────────────────────────────────────────
  abrirSettings(): void {
    this.alergenosEditados.set([...(this.perfil()?.alergenos || [])]);
    this.mostrarSettings.set(true);
  }

  cerrarSettings(): void {
    this.mostrarSettings.set(false);
  }

  toggleAlergenoSettings(id: string): void {
    const actual = this.alergenosEditados();
    const idx = actual.indexOf(id);
    if (idx === -1) {
      this.alergenosEditados.set([...actual, id]);
    } else {
      this.alergenosEditados.set(actual.filter(a => a !== id));
    }
  }

  guardarSettings(): void {
    const perfilActual = this.perfil();
    if (perfilActual) {
      this.usuarioService.establecerPerfil({ ...perfilActual, alergenos: this.alergenosEditados() });
    }
    this.cerrarSettings();
  }

  estaActivo(id: string): boolean {
    return this.alergenosEditados().includes(id);
  }

  // ── Navegación ──────────────────────────────────────────────────
  irALaComanda() { this.router.navigateByUrl('/resumen-comanda'); }
  irAMisPedidos() { this.router.navigateByUrl('/seguimiento-comanda'); }

  async confirmarCierreSesion() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas salir?',
      mode: 'ios',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir', role: 'destructive',
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
