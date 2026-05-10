import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IonicModule, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Firestore, collection, query, orderBy, getDocs, limit } from '@angular/fire/firestore';
import { FacturaLegal } from '../../../core/models/factura.model';
import { TicketService } from '../../../core/services/ticket.service';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  documentTextOutline,
  walletOutline,
  printOutline,
  searchOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-historial-facturas',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  templateUrl: './historial-facturas.component.html',
  styleUrls: ['./historial-facturas.component.scss']
})
export class HistorialFacturasComponent implements OnInit {
  private router = inject(Router);
  private firestore = inject(Firestore);
  private loadingCtrl = inject(LoadingController);
  private ticketService = inject(TicketService);
  private translate = inject(TranslateService);

  facturas: FacturaLegal[] = [];
  cargando = true;

  get idiomaActual(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'es';
  }

  constructor() {
    addIcons({
      chevronBackOutline,
      documentTextOutline,
      walletOutline,
      printOutline,
      searchOutline
    });
  }

  async ngOnInit() {
    await this.cargarFacturas();
  }

  async cargarFacturas() {
    this.cargando = true;
    try {
      const q = query(
        collection(this.firestore, 'facturas'),
        orderBy('fechaExpedicion', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      this.facturas = snapshot.docs.map(doc => doc.data() as FacturaLegal);
    } catch (error) {
      console.error('Error al cargar facturas', error);
    } finally {
      this.cargando = false;
    }
  }

  volver() {
    this.router.navigate(['/admin/panel-pedidos']);
  }

  imprimirFactura(factura: FacturaLegal) {
    this.ticketService.generarTicketPDF(factura);
  }
}
