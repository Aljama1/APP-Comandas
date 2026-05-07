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
  restaurantOutline, imageOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-formulario-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './formulario-producto.component.html',
  styleUrls: ['./formulario-producto.component.scss']
})
export class FormularioProductoComponent implements OnInit {
  productoService = inject(ProductoAdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  modoEdicion = signal(false);
  productoId = signal<string | null>(null);

  // Form state
  nombre      = signal('');
  descripcion = signal('');
  precio      = signal<number | null>(null);
  categoria   = signal<CategoriaProducto>('principal');
  alergenos   = signal<string[]>([]);
  disponible  = signal(true);
  urlImagen   = signal('');
  imagenPreview = signal<string | null>(null);
  imagenFile    = signal<File | null>(null);
  guardando     = signal(false);

  categorias: { clave: CategoriaProducto; etiqueta: string }[] = [
    { clave: 'entrante',  etiqueta: 'Entrante'  },
    { clave: 'principal', etiqueta: 'Principal' },
    { clave: 'postre',    etiqueta: 'Postre'    },
    { clave: 'bebida',    etiqueta: 'Bebida'    },
    { clave: 'especial',  etiqueta: 'Especial'  }
  ];

  todosLosAlergenos: { id: string; label: string; emoji: string }[] = [
    { id: 'gluten',       label: 'Gluten',       emoji: '🌾' },
    { id: 'lactosa',      label: 'Lácteos',      emoji: '🥛' },
    { id: 'frutos-secos', label: 'Frutos secos', emoji: '🥜' },
    { id: 'huevo',        label: 'Huevo',        emoji: '🥚' },
    { id: 'pescado',      label: 'Pescado',      emoji: '🐟' },
    { id: 'marisco',      label: 'Marisco',      emoji: '🦐' },
    { id: 'sulfitos',     label: 'Sulfitos',     emoji: '🍷' }
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
      this.nombre.set(encontrado.nombre);
      this.descripcion.set(encontrado.descripcion || '');
      this.precio.set(encontrado.precio);
      this.categoria.set(encontrado.categoria as CategoriaProducto);
      this.alergenos.set([...encontrado.alergenos]);
      this.disponible.set(encontrado.disponible);
      this.urlImagen.set(encontrado.urlImagen || '');
      this.imagenPreview.set(encontrado.urlImagen || null);
    }
  }

  constructor() {
    addIcons({
      chevronBackOutline, cameraOutline, closeCircleOutline,
      checkmarkOutline, warningOutline, cloudUploadOutline,
      restaurantOutline, imageOutline
    });
  }

  toggleAlergeno(id: string): void {
    const actual = this.alergenos();
    const idx = actual.indexOf(id);
    if (idx === -1) {
      this.alergenos.set([...actual, id]);
    } else {
      this.alergenos.set(actual.filter(a => a !== id));
    }
  }

  tieneAlergeno(id: string): boolean {
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

  esValido(): boolean {
    const n = this.nombre().trim();
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
        nombre:      this.nombre().trim(),
        descripcion: this.descripcion().trim(),
        precio:      this.precio()!,
        categoria:   this.categoria(),
        alergenos:   this.alergenos(),
        disponible:  this.disponible()
      };

      if (urlFinal) {
        datos.urlImagen = urlFinal;
      }

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