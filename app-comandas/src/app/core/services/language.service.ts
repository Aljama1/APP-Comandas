import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);
  
  // Signal para manejar el idioma actual de forma reactiva en toda la app
  public currentLang = signal<string>('es');

  constructor() {
    this.initLanguage();
  }

  /**
   * Inicializa el idioma basándose en localStorage o el navegador.
   */
  private initLanguage() {
    const savedLang = localStorage.getItem('app_lang');
    const browserLang = this.translate.getBrowserLang();
    const defaultLang = savedLang || (browserLang?.match(/en|es/) ? browserLang : 'es');
    
    this.translate.setDefaultLang('es');
    this.setLanguage(defaultLang);
  }

  /**
   * Cambia el idioma de la aplicación.
   * @param lang El código del idioma (ej: 'es', 'en').
   */
  public setLanguage(lang: string) {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem('app_lang', lang);
    
    // Actualizar el atributo lang del HTML para accesibilidad y SEO
    document.documentElement.lang = lang;
  }

  /**
   * Alterna entre español e inglés.
   */
  public toggleLanguage() {
    const newLang = this.currentLang() === 'es' ? 'en' : 'es';
    this.setLanguage(newLang);
  }
}
