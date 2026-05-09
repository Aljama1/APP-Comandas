import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Alergeno, MAPA_ALERGENOS } from '../models/producto.model';

@Pipe({
  name: 'translateAlergenos',
  standalone: true,
  pure: false
})
export class TranslateAlergenosPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: (Alergeno | string)[] | Alergeno | string | undefined): string {
    if (!value) return '';
    
    const items = Array.isArray(value) ? value : [value];
    
    return items.map(al => {
      // Intentamos buscar en el mapa del modelo primero (para nombres como 'Gluten')
      const keyFromMap = MAPA_ALERGENOS[al as Alergeno];
      if (keyFromMap) {
        return this.translate.instant(keyFromMap);
      }

      // Si no está en el mapa, probamos si es un ID (como 'gluten' o 'frutos-secos')
      // Los IDs suelen ser lowercase o contener guiones
      if (al.toLowerCase() === al) {
        return this.translate.instant(`ALERGENOS.${al}`);
      }

      // Fallback: el propio valor
      return al;
    }).join(', ');
  }
}
