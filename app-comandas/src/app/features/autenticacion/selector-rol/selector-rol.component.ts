import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { restaurantOutline, shieldCheckmarkOutline, logInOutline, flameOutline, beerOutline, moonOutline, sunnyOutline } from 'ionicons/icons';
import { UserSettingsService } from '../../../core/services/user-settings.service';

@Component({
  selector: 'app-selector-rol',
  standalone: true,
  imports: [IonicModule, RouterLink],
  templateUrl: './selector-rol.component.html',
  styleUrls: ['./selector-rol.component.scss']
})
export class SelectorRolComponent {
  public settings = inject(UserSettingsService);

  constructor() {
    addIcons({ restaurantOutline, shieldCheckmarkOutline, logInOutline, flameOutline, beerOutline, moonOutline, sunnyOutline });
  }

  toggleDarkMode() {
    this.settings.toggleDark();
  }

  get esModoOscuro() { return this.settings.isDark; }
}

