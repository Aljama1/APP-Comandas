import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartaService } from '../../core/services/carta.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ComandaService } from '../../core/services/comanda.service';
import { ComandaFirestoreService } from '../../core/services/comanda-firestore.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { AudioService } from '../../core/services/audio.service';
import { Producto, VarianteProducto, OpcionModificador, Alergeno, MAPA_ALERGENOS } from '../../core/models/producto.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateContentPipe } from '../../core/pipes/translate-content.pipe';
import { TranslateAlergenosPipe } from '../../core/pipes/translate-alergenos.pipe';
import { areTranslatableEqual } from '../../core/models/common.model';

export interface ProductoMaquetado extends Producto {
  esSeguro: boolean;
  alergenosPeligrosos: Alergeno[];
  agotado: boolean;
}

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  'entrante': 'CATEGORIAS.entrante',
  'principal': 'CATEGORIAS.principal',
  'postre': 'CATEGORIAS.postre',
  'bebida': 'CATEGORIAS.bebida',
  'especial': 'CATEGORIAS.especial'
};

const EMOJIS_CATEGORIA: Record<string, string> = {
  'entrante': '🥗', 'principal': '🍽️', 'postre': '🍰', 'bebida': '🥤', 'especial': '⭐'
};

const ORDEN_CATEGORIAS = ['entrante', 'principal', 'postre', 'bebida', 'especial'];

@Component({
  selector: 'app-carta',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, TranslateContentPipe, TranslateAlergenosPipe],
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss']
})
export class CartaComponent {
  public cartaService = inject(CartaService);
  private usuarioService = inject(UsuarioService);
  public comandaService = inject(ComandaService);
  public firestoreService = inject(ComandaFirestoreService);
  public settings = inject(UserSettingsService);
  private audioService = inject(AudioService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private translate = inject(TranslateService);
  protected readonly MAPA_ALERGENOS = MAPA_ALERGENOS;

  perfil = this.usuarioService.perfil;

  // Modal de detalle de producto
  productoSeleccionado = signal<ProductoMaquetado | null>(null);
  mostrarModalProducto = signal<boolean>(false);

  // Selección actual en el modal
  varianteSeleccionada = signal<VarianteProducto | null>(null);
  modificadoresSeleccionados = signal<OpcionModificador[]>([]);

  // Modal de configuración de usuario
  mostrarSettings = signal<boolean>(false);

  // Copia editable de alérgenos en el modal de settings
  alergenosEditados = signal<string[]>([]);

  readonly todosLosAlergenos: { id: Alergeno; nombre: string; emoji: string }[] = [
    { id: 'Gluten',                         nombre: 'ALERGENOS.gluten',        emoji: '🌾' },
    { id: 'Lácteos',                        nombre: 'ALERGENOS.lactosa',       emoji: '🥛' },
    { id: 'Frutos de cáscara',              nombre: 'ALERGENOS.frutos-secos',  emoji: '🌰' },
    { id: 'Huevos',                         nombre: 'ALERGENOS.huevo',         emoji: '🥚' },
    { id: 'Pescado',                        nombre: 'ALERGENOS.pescado',       emoji: '🐟' },
    { id: 'Crustáceos',                     nombre: 'ALERGENOS.crustaceos',    emoji: '🦞' },
    { id: 'Cacahuetes',                     nombre: 'ALERGENOS.cacahuetes',    emoji: '🥜' },
    { id: 'Soja',                           nombre: 'ALERGENOS.soja',          emoji: '🫘' },
    { id: 'Apio',                           nombre: 'ALERGENOS.apio',          emoji: '🥬' },
    { id: 'Mostaza',                        nombre: 'ALERGENOS.mostaza',       emoji: '🌭' },
    { id: 'Granos de sésamo',               nombre: 'ALERGENOS.sesamo',        emoji: '🥯' },
    { id: 'Dióxido de azufre y sulfitos',   nombre: 'ALERGENOS.sulfitos',      emoji: '🍷' },
    { id: 'Altramuces',                     nombre: 'ALERGENOS.altramuces',    emoji: '🌼' },
    { id: 'Moluscos',                       nombre: 'ALERGENOS.moluscos',      emoji: '🦪' },
  ];

  // Feedback visual al añadir
  productoRecienAnadido = signal<string | null>(null);

  productosMaquetados = computed<ProductoMaquetado[]>(() => {
    const alergiasUsuarioIds = this.perfil()?.alergenos || []; // ids como 'gluten', 'lactosa'
    
    return this.cartaService.productos().map(producto => {
      // Normalizamos la comparación: producto.alergenos tiene 'Gluten', alergiasUsuarioIds tiene 'gluten'
      const alergenosPeligrosos = producto.alergenos.filter(al => 
        alergiasUsuarioIds.some(id => id.toLowerCase() === al.toLowerCase())
      );
      
      const agotado = producto.stock !== undefined && producto.stock !== null && producto.stock <= 0;
      
      return { 
        ...producto, 
        esSeguro: alergenosPeligrosos.length === 0, 
        alergenosPeligrosos,
        agotado
      } as ProductoMaquetado;
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

  constructor() {}

  get idiomaActual(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'es';
  }

  toggleIdioma(): void {
    const nuevoIdioma = this.idiomaActual === 'es' ? 'en' : 'es';
    this.translate.use(nuevoIdioma);
    localStorage.setItem('app_lang', nuevoIdioma);
  }

  // ── Producto Modal ──────────────────────────────────────────────
  abrirProducto(producto: any): void {
    this.productoSeleccionado.set(producto);
    this.varianteSeleccionada.set(null);
    this.modificadoresSeleccionados.set([]);
    this.mostrarModalProducto.set(true);
  }

  cerrarProducto(): void {
    this.mostrarModalProducto.set(false);
  }

  manejarCierreModalProducto(evento: Event): void {
    const eventoModal = evento as CustomEvent<{ role?: string }>;
    const rol = eventoModal.detail?.role;

    // Limpieza de estado al cerrar por cualquier vía (botón, backdrop, gesto, etc.)
    this.productoSeleccionado.set(null);
    this.varianteSeleccionada.set(null);
    this.modificadoresSeleccionados.set([]);
    this.mostrarModalProducto.set(false);

    // Punto de extensión para comportamiento futuro según el rol de cierre
    if (rol === 'confirmar') return;
  }

  seleccionarVariante(variante: VarianteProducto): void {
    this.varianteSeleccionada.set(variante);
  }

  toggleModificador(grupo: any, opcion: OpcionModificador): void {
    const seleccionados = [...this.modificadoresSeleccionados()];
    const index = seleccionados.findIndex(o => areTranslatableEqual(o.nombre, opcion.nombre));

    if (grupo.tipo === 'EXCLUYENTE') {
      // Quitar otras opciones del mismo grupo
      const nuevasOpciones = seleccionados.filter(o => !grupo.opciones.find((gop: any) => areTranslatableEqual(gop.nombre, o.nombre)));
      nuevasOpciones.push(opcion);
      this.modificadoresSeleccionados.set(nuevasOpciones);
    } else {
      // Checkbox normal
      if (index >= 0) {
        seleccionados.splice(index, 1);
      } else {
        seleccionados.push(opcion);
      }
      this.modificadoresSeleccionados.set(seleccionados);
    }
  }

  esModificadorSeleccionado(opcion: OpcionModificador): boolean {
    return this.modificadoresSeleccionados().some(o => areTranslatableEqual(o.nombre, opcion.nombre));
  }

  puedeAnadir(): boolean {
    const p = this.productoSeleccionado();
    if (!p || !p.esSeguro || p.agotado) return false;

    // Si tiene variantes, una debe estar seleccionada
    if (p.variantes && p.variantes.length > 0 && !this.varianteSeleccionada()) {
      return false;
    }

    // Aquí se podrían añadir validaciones de grupos obligatorios si los hubiera
    return true;
  }

  agregarDesdeModal(producto: Producto): void {
    if (!this.puedeAnadir()) return;

    this.comandaService.agregarLinea(
      producto, 
      1, 
      '', 
      this.varianteSeleccionada() || undefined, 
      this.modificadoresSeleccionados()
    );

    this.audioService.reproducirNotificacionSuave();
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
    // Si el cliente tiene pedidos activos en cocina, avisamos explícitamente
    // de que la comanda seguirá su curso pero perderá el seguimiento.
    const hayPedidosActivos = this.firestoreService.tieneComandas();
    const alert = await this.alertController.create({
      header: this.translate.instant('CARTA.CERRAR_SESION_TITULO'),
      message: hayPedidosActivos
        ? this.translate.instant('CARTA.CERRAR_SESION_MSG_PEDIDOS') || 'Tienes pedidos activos en cocina. Si cierras sesión, no podrás seguir su estado desde este dispositivo. ¿Continuar?'
        : this.translate.instant('CARTA.CERRAR_SESION_MSG'),
      mode: 'ios',
      buttons: [
        { text: this.translate.instant('ACCIONES.CANCELAR'), role: 'cancel' },
        {
          text: this.translate.instant('SEGUIMIENTO.CERRAR_SESION'), role: 'destructive',
          handler: () => {
            this.firestoreService.limpiarSeguimiento();
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

