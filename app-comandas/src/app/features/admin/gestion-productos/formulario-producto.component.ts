import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductoAdminService } from '../../../core/services/producto-admin.service';
import { Producto, CategoriaProducto } from '../../../core/models/producto.model';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline, cameraOutline, closeCircleOutline,
  checkmarkOutline, warningOutline, cloudUploadOutline,
  restaurantOutline, imageOutline, addOutline, trashOutline
} from 'ionicons/icons';
import { VarianteProducto, GrupoModificadores, Turno, OpcionModificador, Alergeno } from '../../../core/models/producto.model';
import { LocalizedString, Translatable, getTranslation } from '../../../core/models/common.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-formulario-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './formulario-producto.component.html',
  styleUrls: ['./formulario-producto.component.scss']
})
export class FormularioProductoComponent implements OnInit {
  productoService = inject(ProductoAdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private translate = inject(TranslateService);

  modoEdicion = signal(false);
  productoId = signal<string | null>(null);

  // Form state
  nombreEs    = signal('');
  nombreEn    = signal('');
  descEs      = signal('');
  descEn      = signal('');
  precio      = signal<number | null>(null);
  categoria   = signal<CategoriaProducto>('principal');
  alergenos   = signal<Alergeno[]>([]);
  disponible  = signal(true);
  urlImagen   = signal('');
  imagenPreview = signal<string | null>(null);
  imagenFile    = signal<File | null>(null);
  guardando     = signal(false);

  // Nuevos campos avanzados
  variantes     = signal<VarianteProducto[]>([]);
  modificadores = signal<GrupoModificadores[]>([]);
  turnos        = signal<Turno[]>([]);
  orden         = signal<number>(0);
  stock         = signal<number | null>(null);

  categorias: { clave: CategoriaProducto; etiqueta: string }[] = [
    { clave: 'entrante',  etiqueta: 'Entrante'  },
    { clave: 'principal', etiqueta: 'Principal' },
    { clave: 'postre',    etiqueta: 'Postre'    },
    { clave: 'bebida',    etiqueta: 'Bebida'    },
    { clave: 'especial',  etiqueta: 'Especial'  }
  ];

  todosLosAlergenos: { id: Alergeno; label: string; emoji: string }[] = [
    { id: 'Gluten',       label: 'Gluten',       emoji: '🌾' },
    { id: 'Crustáceos',   label: 'Crustáceos',   emoji: '🦞' },
    { id: 'Huevos',       label: 'Huevos',       emoji: '🥚' },
    { id: 'Pescado',      label: 'Pescado',      emoji: '🐟' },
    { id: 'Cacahuetes',   label: 'Cacahuetes',   emoji: '🥜' },
    { id: 'Soja',         label: 'Soja',         emoji: '🫘' },
    { id: 'Lácteos',      label: 'Lácteos',      emoji: '🥛' },
    { id: 'Frutos de cáscara', label: 'Frutos secos', emoji: '🌰' },
    { id: 'Apio',         label: 'Apio',         emoji: '🥬' },
    { id: 'Mostaza',      label: 'Mostaza',      emoji: '🌭' },
    { id: 'Granos de sésamo', label: 'Sésamo',   emoji: '🥯' },
    { id: 'Dióxido de azufre y sulfitos', label: 'Sulfitos', emoji: '🍷' },
    { id: 'Altramuces',   label: 'Altramuces',   emoji: '🌼' },
    { id: 'Moluscos',     label: 'Moluscos',     emoji: '🦪' }
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicion.set(true);
      this.productoId.set(id);
      this.cargarProducto(id);
    }
  }

  private cargarProducto(id: string) {
    const encontrado = this.productoService.productos().find(p => p.id === id);
    if (encontrado) {
      // Cargar textos localizados (Híbrido)
      this.nombreEs.set(getTranslation(encontrado.nombre, 'es'));
      this.nombreEn.set(getTranslation(encontrado.nombre, 'en'));
      this.descEs.set(getTranslation(encontrado.descripcion || '', 'es'));
      this.descEn.set(getTranslation(encontrado.descripcion || '', 'en'));
      this.precio.set(encontrado.precio);
      this.categoria.set(encontrado.categoria as CategoriaProducto);
      
      // Normalizamos la carga por si hay datos viejos en minúscula
      const alergenosNormalizados = encontrado.alergenos.map(al => {
        const match = this.todosLosAlergenos.find(t => t.id.toLowerCase() === al.toLowerCase());
        return match ? match.id : (al as Alergeno);
      });
      this.alergenos.set(alergenosNormalizados);

      this.disponible.set(encontrado.disponible);
      this.urlImagen.set(encontrado.urlImagen || '');
      this.imagenPreview.set(encontrado.urlImagen || null);
      
      // Cargar campos avanzados
      this.variantes.set([...(encontrado.variantes || [])]);
      this.modificadores.set(JSON.parse(JSON.stringify(encontrado.modificadores || []))); // Deep copy
      this.turnos.set([...(encontrado.turnos || [])]);
      this.orden.set(encontrado.orden ?? 0);
      this.stock.set(encontrado.stock ?? null);
    }
  }

  constructor() {
    addIcons({
      chevronBackOutline, cameraOutline, closeCircleOutline,
      checkmarkOutline, warningOutline, cloudUploadOutline,
      restaurantOutline, imageOutline
    });
  }

  toggleAlergeno(id: Alergeno): void {
    const actual = this.alergenos();
    const idx = actual.indexOf(id);
    if (idx === -1) {
      this.alergenos.set([...actual, id]);
    } else {
      this.alergenos.set(actual.filter(a => a !== id));
    }
  }

  tieneAlergeno(id: Alergeno): boolean {
    return this.alergenos().includes(id);
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    this.imagenFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.imagenPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  quitarImagen(): void {
    this.imagenFile.set(null);
    this.imagenPreview.set(null);
    this.urlImagen.set('');
  }

  // ── Métodos para Variantes ──────────────────────────────────────
  anadirVariante() {
    this.variantes.update(v => [...v, { nombre: { es: '', en: '' }, precio: 0 }]);
  }

  quitarVariante(index: number) {
    this.variantes.update(v => v.filter((_, i) => i !== index));
  }

  // ── Métodos para Modificadores ──────────────────────────────────
  anadirGrupoModificadores() {
    this.modificadores.update(m => [...m, { 
      nombre: { es: '', en: '' }, 
      tipo: 'EXCLUYENTE', 
      opciones: [{ nombre: { es: '', en: '' }, precioAdicional: 0 }] 
    }]);
  }

  quitarGrupoModificadores(index: number) {
    this.modificadores.update(m => m.filter((_, i) => i !== index));
  }

  anadirOpcionModificador(grupoIndex: number) {
    this.modificadores.update(m => {
      const nuevos = [...m];
      nuevos[grupoIndex].opciones.push({ nombre: { es: '', en: '' }, precioAdicional: 0 });
      return nuevos;
    });
  }

  quitarOpcionModificador(grupoIndex: number, opcionIndex: number) {
    this.modificadores.update(m => {
      const nuevos = [...m];
      nuevos[grupoIndex].opciones = nuevos[grupoIndex].opciones.filter((_, i) => i !== opcionIndex);
      return nuevos;
    });
  }

  // ── Métodos para Turnos ─────────────────────────────────────────
  toggleTurno(t: Turno) {
    const actual = this.turnos();
    const idx = actual.indexOf(t);
    if (idx === -1) {
      this.turnos.set([...actual, t]);
    } else {
      this.turnos.set(actual.filter(item => item !== t));
    }
  }

  tieneTurno(t: Turno): boolean {
    return this.turnos().includes(t);
  }

  // ── Actualizadores para ngModel (debido a señales de arrays) ───
  updateVarianteNombre(i: number, lang: 'es' | 'en', val: string) {
    this.variantes.update(v => {
      const copy = [...v];
      const nombreActual = copy[i].nombre as LocalizedString;
      copy[i].nombre = { 
        es: lang === 'es' ? val : (typeof nombreActual === 'string' ? nombreActual : nombreActual.es),
        en: lang === 'en' ? val : (typeof nombreActual === 'string' ? '' : nombreActual.en)
      };
      return copy;
    });
  }
  updateVariantePrecio(i: number, val: number) {
    this.variantes.update(v => {
      const copy = [...v];
      copy[i].precio = val;
      return copy;
    });
  }

  updateGrupoNombre(i: number, lang: 'es' | 'en', val: string) {
    this.modificadores.update(m => {
      const copy = [...m];
      const nombreActual = copy[i].nombre as LocalizedString;
      copy[i].nombre = { 
        es: lang === 'es' ? val : (typeof nombreActual === 'string' ? nombreActual : nombreActual.es),
        en: lang === 'en' ? val : (typeof nombreActual === 'string' ? '' : nombreActual.en)
      };
      return copy;
    });
  }
  updateGrupoTipo(i: number, val: any) {
    this.modificadores.update(m => {
      const copy = [...m];
      copy[i].tipo = val;
      return copy;
    });
  }

  updateOpcionNombre(gi: number, oi: number, lang: 'es' | 'en', val: string) {
    this.modificadores.update(m => {
      const copy = JSON.parse(JSON.stringify(m));
      const nombreActual = copy[gi].opciones[oi].nombre as LocalizedString;
      copy[gi].opciones[oi].nombre = { 
        es: lang === 'es' ? val : (typeof nombreActual === 'string' ? nombreActual : nombreActual.es),
        en: lang === 'en' ? val : (typeof nombreActual === 'string' ? '' : nombreActual.en)
      };
      return copy;
    });
  }
  updateOpcionPrecio(gi: number, oi: number, val: number) {
    this.modificadores.update(m => {
      const copy = JSON.parse(JSON.stringify(m));
      copy[gi].opciones[oi].precioAdicional = val;
      return copy;
    });
  }

  esValido(): boolean {
    const n = this.nombreEs().trim();
    const p = this.precio();
    return n.length > 0 && p !== null && p > 0;
  }

  async guardar(): Promise<void> {
    if (!this.esValido()) {
      const toast = await this.toastCtrl.create({
        message: 'Completa nombre y precio (mayor que 0).',
        duration: 2500, position: 'top', color: 'warning'
      });
      await toast.present();
      return;
    }

    this.guardando.set(true);

    try {
      // 1. Si hay un archivo de imagen, subirlo primero
      let urlFinal = this.urlImagen();
      if (this.imagenFile()) {
        urlFinal = await this.productoService.subirImagen(this.imagenFile()!);
      }

      const datos: any = {
        nombre:      { es: this.nombreEs().trim(), en: this.nombreEn().trim() },
        descripcion: { es: this.descEs().trim(), en: this.descEn().trim() },
        precio:      this.precio()!,
        categoria:   this.categoria(),
        alergenos:   this.alergenos(),
        disponible:  this.disponible(),
        // Campos avanzados
        variantes:     this.variantes(),
        modificadores: this.modificadores(),
        turnos:        this.turnos(),
        orden:         this.orden(),
        stock:         this.stock() ?? undefined
      };

      if (urlFinal) {
        datos.urlImagen = urlFinal;
      }

      // Limpiar objetos vacíos en inglés si no se introdujeron (opcional, pero recomendado)
      if (!datos.nombre.en) datos.nombre.en = datos.nombre.es;
      if (!datos.descripcion.en) datos.descripcion.en = datos.descripcion.es;

      // 2. Guardar en Firestore
      if (this.modoEdicion()) {
        await this.productoService.actualizarProducto(this.productoId()!, datos);
      } else {
        await this.productoService.crearProducto(datos);
      }

      const toast = await this.toastCtrl.create({
        message: this.modoEdicion() ? 'Producto actualizado.' : 'Producto creado.',
        duration: 1500, position: 'top', color: 'success', icon: 'checkmark-outline'
      });
      await toast.present();
      this.router.navigate(['/admin/productos']);
    } catch (e) {
      console.error('ERROR AL GUARDAR:', e);
      const toast = await this.toastCtrl.create({
        message: 'Error al guardar. Revisa la consola.',
        duration: 2500, position: 'top', color: 'danger'
      });
      await toast.present();
    } finally {
      this.guardando.set(false);
    }
  }

  irAtras() { this.router.navigate(['/admin/productos']); }
}