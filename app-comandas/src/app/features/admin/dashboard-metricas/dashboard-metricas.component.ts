import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MetricasService } from '../../../core/services/metricas.service';
import { addIcons } from 'ionicons';
import { 
  barChartOutline, trendingUpOutline, timeOutline, walletOutline, 
  statsChartOutline, chevronBackOutline, medalOutline, alertCircleOutline,
  printOutline
} from 'ionicons/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-metricas',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './dashboard-metricas.component.html',
  styleUrls: ['./dashboard-metricas.component.scss']
})
export class DashboardMetricasComponent implements OnDestroy {
  public metricasService = inject(MetricasService);
  private router = inject(Router);

  constructor() {
    addIcons({ 
      barChartOutline, trendingUpOutline, timeOutline, walletOutline, 
      statsChartOutline, chevronBackOutline, medalOutline, alertCircleOutline,
      printOutline
    });
  }

  ngOnDestroy(): void {
    // Podríamos detener la escucha si quisiéramos ahorrar lecturas cuando no se ve el dashboard
    // this.metricasService.detenerEscucha();
  }

  volver() {
    this.router.navigateByUrl('/admin/panel-pedidos');
  }

  getPorcentajeVenta(totalRecaudado: number): number {
    const totalVentas = this.metricasService.kpis().totalVentas;
    if (totalVentas === 0) return 0;
    return (totalRecaudado / totalVentas) * 100;
  }

  exportarCierreZ() {
    const doc = new jsPDF();
    const kpis = this.metricasService.kpis();
    const productos = this.metricasService.rankingProductos();

    // Título y Cabecera
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('Cierre de Caja (Informe Z)', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de exportación: ${new Date().toLocaleString('es-ES')}`, 14, 28);
    doc.text(`Generado por: Trace Sistema de Comandas`, 14, 33);

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);

    // KPIs Generales
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Resumen de Operativa', 14, 48);

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Ventas Totales: ${kpis.totalVentas.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 14, 58);
    doc.text(`Comandas Totales: ${kpis.totalComandas}`, 14, 65);
    doc.text(`Ticket Medio: ${kpis.ticketMedio.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 100, 58);
    doc.text(`T. Medio Servicio: ${kpis.tiempoMedioServicio.toFixed(1)} min`, 100, 65);

    // Tabla de Ranking de Productos
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Ranking de Productos Vendidos', 14, 80);

    const bodyData = productos.map((p, index) => [
      index + 1,
      p.nombre,
      p.cantidad.toString(),
      p.totalRecaudado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Producto', 'Unidades', 'Recaudación']],
      body: bodyData,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    // Nombre del archivo
    const fechaArchivo = new Date().toISOString().split('T')[0];
    doc.save(`cierre_z_${fechaArchivo}.pdf`);
  }
}
