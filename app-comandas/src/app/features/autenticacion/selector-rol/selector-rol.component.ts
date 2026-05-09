import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
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
export class SelectorRolComponent implements OnInit {
  public settings = inject(UserSettingsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    addIcons({ restaurantOutline, shieldCheckmarkOutline, logInOutline, flameOutline, beerOutline, moonOutline, sunnyOutline });
  }

  ngOnInit() {
    // Si entramos con el parámetro ?mesa=X, redirigimos automáticamente al check-in
    const mesa = this.route.snapshot.queryParamMap.get('mesa');
    if (mesa) {
      this.router.navigate(['/check-in'], { 
        queryParams: { mesa: mesa },
        replaceUrl: true // Para que no pueda volver atrás al selector vacío
      });
    }
  }

  toggleDarkMode() {
    this.settings.toggleDark();
  }

  get esModoOscuro() { return this.settings.isDark; }
}

