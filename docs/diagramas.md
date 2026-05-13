# Anexo: Diagramas técnicos del proyecto Trace

Este anexo concentra los diagramas que apoyan la lectura de la documentación
técnica del TFG. Todos están escritos en sintaxis Mermaid, lo que permite su
renderizado directo en GitHub, GitLab, MkDocs, VS Code y Obsidian sin
herramientas externas, y su exportación a SVG/PNG mediante CLI (`mmdc`).

Los diagramas reflejan el estado real del repositorio a fecha **2026-05-13**, y
están vinculados al código mediante referencias a los modelos
[`app-comandas/src/app/core/models/`](../app-comandas/src/app/core/models/) y a
las reglas [`firestore.rules`](../app-comandas/firestore.rules).

---

## 1. Arquitectura por capas (Clean Architecture)

Vista lógica de la organización del *frontend* Angular 20 (Standalone) y su
relación con el *backend* Firebase BaaS. La separación `core` / `shared` /
`features` impone que solo `features` dependa de `core`, nunca al revés.

```mermaid
flowchart TB
    subgraph Cliente["Cliente — Angular 20 + Ionic 8 (Standalone)"]
        direction TB
        subgraph Features["features/ (vistas de dominio)"]
            FA["autenticacion<br/>(check-in B2C, login B2B)"]
            FC["carta<br/>(menú filtrado por alérgenos)"]
            FCM["comandas<br/>(resumen, seguimiento)"]
            FAD["admin<br/>(panel-pedidos, KDS, facturas)"]
        end
        subgraph Shared["shared/ (UI reutilizable)"]
            SC["componentes<br/>(admin-config-bar, resumen-flotante)"]
            SP["pipes & directivas"]
        end
        subgraph Core["core/ (servicios singleton)"]
            CS["services<br/>(UsuarioService, ComandaService,<br/>ComandaFirestoreService, AdminAuthService,<br/>FacturacionService, MetricasService,<br/>HorarioRestauranteService, AudioService,<br/>UserSettingsService)"]
            CM["models<br/>(Producto, Comanda, FacturaLegal,<br/>PerfilUsuario, HorarioRestaurante)"]
            CG["guards & providers<br/>(adminGuard, ioniconsProvider)"]
        end
        Features --> Shared
        Features --> Core
        Shared --> Core
    end

    subgraph Firebase["Firebase BaaS (europe-west1)"]
        FAuth["Auth<br/>(anónima B2C + email/password B2B)"]
        FFS["Cloud Firestore<br/>(comandas, productos,<br/>facturas, metadatos,<br/>configuracion)"]
        FRules["Security Rules<br/>(append-only facturas,<br/>contador +1 forzado,<br/>default-deny)"]
        FHost["Hosting + PWA"]
    end

    Core <-->|onSnapshot / setDoc /<br/>runTransaction| FFS
    Core <-->|signInAnonymously /<br/>signInWithEmailAndPassword| FAuth
    FRules -.->|aplica sobre| FFS
    Cliente -.->|servido desde| FHost
```

> **Lectura.** Los servicios de `core/` son el único punto que conoce el SDK de
> Firebase. Las vistas de `features/` consumen exclusivamente *signals*
> expuestos por dichos servicios, lo que permite reemplazar el *backend* sin
> tocar las plantillas.

---

## 2. Modelo Entidad-Relación de Firestore

Modelado lógico de las cinco colecciones del proyecto. Firestore es NoSQL
documental, por lo que las relaciones se expresan mediante claves foráneas no
forzadas a nivel de motor; la integridad referencial se garantiza por
convención del cliente y por las reglas de seguridad.

```mermaid
erDiagram
    COMANDAS ||--|{ LINEAS_COMANDA : "contiene"
    COMANDAS }o--|| MESAS : "se sirve en"
    COMANDAS }o--|| USUARIOS_AUTH : "creada por"
    LINEAS_COMANDA }o--|| PRODUCTOS : "referencia a"
    FACTURAS }o--|| COMANDAS : "factura una o varias"
    FACTURAS }o--|| METADATOS : "consume contador de"
    FACTURAS ||--|| FACTURAS : "hashAnterior (cadena)"
    PRODUCTOS }o--o{ ALERGENOS_UE : "etiquetado con"

    COMANDAS {
        string id PK
        string idMesa FK
        string idCliente FK
        string nombreCliente
        EstadoComanda estado
        number precioTotal
        number fechaCreacion
        number fechaActualizacion
        boolean solicitaCuenta
        array alergenosUsuario
    }

    LINEAS_COMANDA {
        string idProducto FK
        Translatable nombreProducto
        number cantidad
        number precioUnitario
        number subtotal
        DestinoReceptor destino "BARRA o COCINA"
        string notasEspeciales
        boolean preparado
        VarianteProducto varianteSeleccionada
        array modificadoresSeleccionados
    }

    PRODUCTOS {
        string id PK
        Translatable nombre
        Translatable descripcion
        number precio
        CategoriaProducto categoria
        array alergenos
        boolean disponible
        array variantes
        array modificadores
        array turnos "ALMUERZO o CENA"
        number orden
        number stock
    }

    FACTURAS {
        string id PK
        string idMesa FK
        string numeroFactura "Serie+correlativo"
        number fechaExpedicion
        number baseImponible
        number cuotaIva
        number porcentajeIva
        number importeTotal
        string metodoPago
        string hashAnterior FK "encadenamiento"
        string hashActual
        array productos "snapshot inmutable"
    }

    METADATOS {
        string id PK "contadores_facturas"
        string serieActual "Ej. F26"
        number ultimoNumero
        string ultimoHash
    }
```

> **Nota fiscal.** La autorrelación `FACTURAS → FACTURAS (hashAnterior)`
> implementa la cadena de integridad SHA-256 exigida por el RD 1007/2023. Las
> reglas de Firestore impiden cualquier `update` o `delete` sobre esta
> colección.

---

## 3. Secuencia de emisión de factura Veri\*factu (modo demostración)

Diagrama de secuencia que ilustra la interacción entre el cliente staff, el
servicio de facturación y Firestore al cobrar una cuenta. La transacción
`runTransaction` garantiza atomicidad entre el incremento del contador y la
escritura de la nueva factura.

```mermaid
sequenceDiagram
    actor Staff as Staff (B2B)
    participant UI as Panel admin<br/>(GestionCuentasComponent)
    participant FS as FacturacionService
    participant TX as Firestore<br/>runTransaction()
    participant Meta as metadatos/<br/>contadores_facturas
    participant Fac as facturas/{nuevoId}
    participant Crypto as Web Crypto API

    Staff->>UI: Pulsa "Cobrar mesa"
    UI->>FS: emitirFactura(comanda, metodoPago)
    FS->>TX: iniciar transacción atómica
    TX->>Meta: get() contadores_facturas
    Meta-->>TX: { serieActual, ultimoNumero, ultimoHash }
    TX->>FS: ultimoNumero + 1 = nuevoNumero<br/>(p. ej. F26-000146)
    FS->>FS: calcularDesgloseIva(total, 10%)<br/>→ base + cuota
    FS->>Crypto: generarHashFactura(<br/>numero, fecha, total, ultimoHash)
    Crypto-->>FS: hashActual (SHA-256 hex)
    FS->>TX: update metadatos<br/>{ultimoNumero: +1, ultimoHash}
    Note over TX,Meta: Regla Firestore exige<br/>ultimoNumero == previo + 1
    FS->>TX: create facturas/{nuevoId}<br/>{numeroFactura, hashAnterior,<br/>hashActual, base, cuota, ...}
    Note over TX,Fac: Regla Firestore prohíbe<br/>update y delete (append-only)
    TX-->>FS: commit OK
    FS->>UI: FacturaLegal generada
    UI->>UI: jsPDF + autoTable<br/>(PDF + QR informativo)
    UI-->>Staff: Descarga / impresión
```

---

## 4. Flujo de datos B2C en tiempo real

Diagrama de estados de la sesión del comensal, desde el escaneo del QR hasta
la finalización del servicio. Las transiciones marcadas con `onSnapshot`
representan empujes (`push`) en tiempo real desde Firestore.

```mermaid
stateDiagram-v2
    [*] --> EscaneoQR : cliente escanea<br/>QR físico de mesa
    EscaneoQR --> CheckIn : URL ?mesa=N<br/>(autocompleta mesa)
    CheckIn --> CartaFiltrada : establecerPerfil()<br/>+ signInAnonymously()
    CartaFiltrada --> CartaFiltrada : computed() cruza<br/>alergenos × perfil
    CartaFiltrada --> ResumenComanda : pulsa píldora<br/>flotante
    ResumenComanda --> CartaFiltrada : "Seguir pidiendo"
    ResumenComanda --> Pendiente : confirmar()<br/>→ Firestore.addDoc()

    state EnFirestore {
        Pendiente --> Preparando : staff acepta<br/>(onSnapshot push)
        Preparando --> Servido : cocina/barra marcha<br/>todas las líneas<br/>(marcar = ya en mesa)
        Servido --> Pagado : staff cobra<br/>→ FacturaLegal
    }

    Pendiente --> SolicitaCuenta : flag solicitaCuenta=true
    Preparando --> SolicitaCuenta : flag solicitaCuenta=true
    Servido --> SolicitaCuenta : flag solicitaCuenta=true
    SolicitaCuenta --> Pagado : staff cobra

    Pagado --> [*] : sesión cerrada
```

> **Resiliencia.** Cualquier transición `→ EnFirestore` se persiste en
> `localStorage` (`UsuarioService`, `ComandaService`), de modo que un F5 o un
> corte de red recupera la sesión completa sin pérdida de carrito.

---

## 5. Diagrama Gantt de fases reales

Cronograma reconstruido a partir del historial `git log --reverse` del
repositorio. Refleja la ejecución real del proyecto entre el 11 de abril y el
12 de mayo de 2026.

```mermaid
gantt
    title Cronograma real del proyecto Trace (TFG DAM)
    dateFormat YYYY-MM-DD
    axisFormat %d-%b

    section Configuración
    Fase 0 — Clean Architecture     :f0, 2026-04-11, 1d

    section Cliente B2C
    Fase 1 — Identidad y acceso     :f1, 2026-04-13, 1d
    Fase 2 — Menú filtrado          :f2, 2026-04-13, 13d
    Fase 3 — Carrito                :f3, 2026-04-26, 1d
    Fase 4 — Firestore + seguimiento:f4, 2026-04-26, 3d
    Fase 5 — Destinos y rondas      :f5, 2026-04-29, 1d

    section Staff B2B
    Fase 6 — Panel pedidos          :f6, 2026-05-04, 2d
    Fase 7 — KDS Cocina/Barra       :f7, 2026-05-06, 1d
    Fase 8 — Backoffice avanzado    :f8, 2026-05-07, 2d
    Fase 9 — Analítica y stock      :f9, 2026-05-09, 1d

    section Endurecimiento
    Fase 10 — Seguridad + PWA + i18n:f10, 2026-05-09, 2d
    Fase 11 — Veri*factu (demo)     :crit, f11, 2026-05-09, 4d
    Fase 12 — Auditoría y limpieza  :f12, 2026-05-13, 1d

    section Defensa
    Documentación y entrega         :milestone, 2026-05-13, 0d
```

---

## Cómo regenerar los diagramas

Para exportar todos los diagramas a SVG/PNG fuera del navegador:

```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i docs/diagramas.md -o docs/_render/diagramas.pdf -t neutral
```

Los IDE modernos (VS Code con la extensión *Mermaid Preview*, JetBrains,
Obsidian) renderizan los bloques ```` ```mermaid ```` de forma nativa sin
configuración adicional.
