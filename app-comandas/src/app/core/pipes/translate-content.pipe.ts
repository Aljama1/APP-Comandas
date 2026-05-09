import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Translatable, getTranslation } from '../models/common.model';

@Pipe({
  name: 'translateContent',
  standalone: true,
  pure: false // Necesario para reaccionar al cambio de idioma de ngx-translate
})
export class TranslateContentPipe implements PipeTransform {
  private translate = inject(TranslateService);

  /**
   * Transforma un objeto LocalizedString o string simple al idioma actual.
   * @param value El contenido traducible desde el backend.
   * @returns El texto en el idioma activo.
   */
  transform(value: Translatable | undefined): string {
    const currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    return getTranslation(value, currentLang);
  }
}
