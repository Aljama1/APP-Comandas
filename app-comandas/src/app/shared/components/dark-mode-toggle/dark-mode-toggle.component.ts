import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-dark-mode-toggle',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="theme-toggle-fab">
      <ion-fab-button (click)="toggleTheme()" [attr.aria-label]="isDark() ? 'Activar modo claro' : 'Activar modo oscuro'" class="glass-fab">
        <ion-icon [name]="isDark() ? 'sunny-outline' : 'moon-outline'"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  `,
  styleUrls: ['./dark-mode-toggle.component.scss']
})
export class DarkModeToggleComponent implements OnInit {
  private document = inject(DOCUMENT);
  isDark = signal<boolean>(false);

  constructor() {
    addIcons({ moonOutline, sunnyOutline });
  }

  ngOnInit() {
    const isDarkGlobal = localStorage.getItem('trace-dark-mode') === 'true';
    this.isDark.set(isDarkGlobal);
  }

  toggleTheme() {
    const newState = !this.isDark();
    this.isDark.set(newState);
    this.document.body.classList.toggle('dark', newState);
    localStorage.setItem('trace-dark-mode', String(newState));
  }
}
