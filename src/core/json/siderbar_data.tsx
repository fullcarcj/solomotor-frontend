import { all_routes } from "@/data/all_routes";

const route = all_routes;

export const SidebarData = [
  {
    label: "Principal",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Principal",
    submenuItems: [
      {
        label: "Principal",
        link: "#",
        icon: "layout-grid",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Panel de Control",
            icon: "layout-grid",
            submenu: true,
            showSubRoute: false,

            submenuItems: [
              { label: "Dashboard ERP",       link: route.erpDashboard,    showSubRoute: false },
              { label: "Panel Administrador", link: "/admin-dashboard" },
              { label: "Panel de Ventas", link: "/sales-dashboard" },
              { label: "Monitor de canales", link: route.channelsMonitor, showSubRoute: false },
            ],
          },
          {
            label: "Super Administrador",
            icon: "user-edit",
            submenu: true,
            showSubRoute: false,

            submenuItems: [
              { label: "Panel de Control", link: "/dashboard" },
              { label: "Empresas", link: "/companies" },
              { label: "Suscripciones", link: "/subscription" },
              { label: "Paquetes", link: "/packages" },
              { label: "Dominio", link: "/domain" },
              { label: "Transacciones de Compra", link: route.purchasetransaction },
            ],
          },
          {
            label: "Aplicaciones",
            icon: "brand-apple-arcade",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              { label: "Chat", link: "/chat", showSubRoute: false },
              {
                label: "Llamadas",
                submenu: true,
                submenuItems: [
                  { label: "Videollamada", link: "/video-call" },
                  { label: "Llamada de Audio", link: "/audio-call" },
                  { label: "Historial de Llamadas", link: "/call-history" },
                ],
              },
              { label: "Calendario", link: "/calendar", showSubRoute: false },
              { label: "Contactos", link: "/contacts", showSubRoute: false },
              { label: "Correo", link: "/email", showSubRoute: false },
              { label: "Tareas", link: "/todo", showSubRoute: false },
              { label: "Notas", link: "/notes", showSubRoute: false },
              {
                label: "Gestor de Archivos",
                link: "/file-manager",
                showSubRoute: false,
              },
              { label: "Proyectos", link: "/projects", showSubRoute: false },
              {
                label: "Tienda en Línea",
                submenu: true,
                submenuItems: [
                  { label: "Productos", link: "/products" },
                  { label: "Pedidos", link: route.ventasPedidos },
                  { label: "Clientes", link: "/customers" },
                  { label: "Carrito", link: "/cart" },
                  { label: "Finalizar Compra", link: "/checkout" },
                  { label: "Lista de Deseos", link: "/wishlist" },
                  { label: "Reseñas", link: "/reviews" },
                ],
              },
              { label: "Red Social", link: "/social-feed", showSubRoute: false },
              { label: "Búsqueda", link: "/search-list", showSubRoute: false },
            ],
          },
          {
            label: "Diseños",
            icon: "layout-sidebar-right-collapse",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              {
                label: "Horizontal",
                link: route.Horizontal,
                showSubRoute: false,
              },
              { label: "Desprendido", link: route.Detached, showSubRoute: false },
              // { label: "Moderno", link: route.Modern, showSubRoute: false },
              {
                label: "Dos Columnas",
                link: route.TwoColumn,
                showSubRoute: false,
              },
              { label: "Flotante", link: route.Hovered, showSubRoute: false },
              { label: "Encuadrado", link: route.Boxed, showSubRoute: false },
              { label: "RTL", link: route.RTL, showSubRoute: false },
              { label: "Oscuro", link: route.Dark, showSubRoute: false },
            ],
          },
        ],
      },
    ],
  },
  // ── SPACEWORK (inbox /bandeja) ───────────────────────────────────────────
  {
    label: "Spacework",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Spacework",
    submenuItems: [
      {
        label: "Spacework",
        link: "#",
        icon: "inbox",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Omnicanal",                  link: route.bandeja,                      icon: "messages",       showSubRoute: false, submenu: false },
          { label: "Sin leer",                 link: `${route.bandeja}?filter=unread`,   icon: "bell",           showSubRoute: false, submenu: false },
          { label: "Pago pendiente",           link: `${route.bandeja}?filter=payment_pending`, icon: "clock-hour-3", showSubRoute: false, submenu: false },
          { label: "Cotizar",                  link: `${route.bandeja}?filter=quote`,    icon: "file-invoice",   showSubRoute: false, submenu: false },
          { label: "Despachar",                link: `${route.bandeja}?filter=dispatch`, icon: "truck",          showSubRoute: false, submenu: false },
          { label: "WhatsApp",                 link: `${route.bandeja}?src=wa`,          icon: "brand-whatsapp", showSubRoute: false, submenu: false },
          { label: "MercadoLibre",             link: `${route.bandeja}?src=ml`,          icon: "shopping-cart",  showSubRoute: false, submenu: false },
          { label: "Historial",                link: route.inboxHistory,                 icon: "history",        showSubRoute: false, submenu: false },
        ],
      },
    ],
  },

  {
    label: "Ventas",
    submenuOpen: false,
    submenuHdr: "Ventas",
    showSubRoute: false,
    submenuItems: [
      {
        label: "Ventas",
        link: "#",
        icon: "shopping-cart",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          // ── Nuevas entradas al inicio ────────────────────────────────────
          { label: "Pedidos y Ventas",     link: route.ventasPedidos,      icon: "list-details",   showSubRoute: false, submenu: false },
          { label: "Historial de pedidos", link: route.ventasHistorial,    icon: "history",        showSubRoute: false, submenu: false },
          { label: "Todas las Ordenes",   link: route.orders,             icon: "list",           showSubRoute: false, submenu: false },
          { label: "Apertura/Cierre Caja",link: route.posCashRegister,    icon: "cash-register",  showSubRoute: false, submenu: false },
          {
            label: "Ventas",
            icon: "layout-grid",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              {
                label: "Pedidos en Línea",
                link: route.onlineorder,
                showSubRoute: false,
              },
              { label: "Pedidos POS", link: route.posorder, showSubRoute: false },
            ],
          },
          {
            label: "Facturas",
            link: route.invoice,
            icon: "file-invoice",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Devoluciones de Venta",
            link: "/sales-returns",
            icon: "receipt-refund",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Cotizaciones",
            link: route.ventasCotizaciones,
            icon: "files",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Nueva venta (POS)",
            link: route.ventasNueva,
            icon: "cash",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "POS",
            icon: "device-laptop",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "POS 1", link: "/pos", showSubRoute: false },
              { label: "POS 2", link: "/pos-2", showSubRoute: false },
              { label: "POS 3", link: "/pos-3", showSubRoute: false },
              { label: "POS 4", link: "/pos-4", showSubRoute: false },
              { label: "POS 5", link: "/pos-5", showSubRoute: false },
              {
                label: "POS 6",
                link: "https://dreamspos.dreamstechnologies.com/food-pos/nextjs/template/login",
                showSubRoute: false,
                target: "_blank",
              },
              {
                label: "POS 7",
                link: "https://dreamspos.dreamstechnologies.com/laundry-pos/nextjs/template/login",
                showSubRoute: false,
                target: "_blank",
              },
            ],
          },
          // ── Nuevas entradas al final ─────────────────────────────────────
          { label: "Vendedores y Territorios", link: route.salesReps,              icon: "users",         showSubRoute: false, submenu: false },
          { label: "Ordenes por Aprobar",      link: route.ordersPendingApproval,  icon: "checklist",     showSubRoute: false, submenu: false },
          { label: "Comisiones FV",            link: route.commissions,            icon: "coin",          showSubRoute: false, submenu: false },
        ],
      },
    ],
  },

  // ── MERCADOLIBRE ─────────────────────────────────────────────────────────
  {
    label: "MercadoLibre",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "MercadoLibre",
    submenuItems: [
      {
        label: "MercadoLibre",
        link: "#",
        icon: "brand-tabler",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Central ML",        link: route.mercadolibre,             icon: "layout-dashboard", showSubRoute: false, submenu: false },
          { label: "Preguntas",         link: route.mercadolibrePreguntas,    icon: "message-question", showSubRoute: false, submenu: false },
          { label: "Mensajes",          link: route.mercadolibreMensajes,     icon: "messages",         showSubRoute: false, submenu: false },
          { label: "Mapeo de SKUs",     link: route.mercadolibreMapeo,        icon: "arrows-exchange",  showSubRoute: false, submenu: false },
          { label: "Precios ML",        link: route.mercadolibrePrecios,      icon: "currency-dollar",  showSubRoute: false, submenu: false },
          { label: "Reputación",        link: route.mercadolibreReputacion,   icon: "star",             showSubRoute: false, submenu: false },
          { label: "Automatizaciones",  link: route.mlAutomatizaciones,       icon: "robot",            showSubRoute: false, submenu: false },
        ],
      },
    ],
  },

  {
    label: "Logística",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Logística",
    submenuItems: [
      {
        label: "Logística",
        link: "#",
        icon: "truck-delivery",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Cola de Picking",      link: route.logisticaPicking,   icon: "package",       showSubRoute: false, submenu: false },
          { label: "Despachos del Día",    link: route.logisticaDespachos, icon: "calendar-event",showSubRoute: false, submenu: false },
          { label: "Historial de Entregas",link: route.logisticaHistorial, icon: "history",       showSubRoute: false, submenu: false },
        ],
      },
    ],
  },

  {
    label: "Compras",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Compras",
    submenuItems: [
      {
        label: "Compras",
        link: "#",
        icon: "shopping-cart",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Proveedores",        link: route.comprasProveedores, icon: "building-store",  showSubRoute: false, submenu: false },
          { label: "Órdenes de Compra",  link: route.comprasOrdenes,     icon: "file-invoice",    showSubRoute: false, submenu: false },
          { label: "Nueva Recepción",    link: route.comprasRecepcion,   icon: "package-import",  showSubRoute: false, submenu: false },
        ],
      },
    ],
  },

  {
    label: "Inventario",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Inventario",
    submenuItems: [
      {
        label: "Inventario",
        link: "#",
        icon: "table-plus",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Productos y stock",
            link: route.inventarioProductos,
            icon: "packages",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Movimientos WMS",
            link: route.inventarioMovimientos,
            icon: "arrows-exchange",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Equiv. y Compatib.",
            link: route.inventarioSkus,
            icon: "car",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Productos",
            link: "/product-list",
            icon: "box",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Crear Producto",
            link: "/add-product",
            icon: "table-plus",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Productos Vencidos",
            link: "/expired-products",
            icon: "progress-alert",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Stock Bajo",
            link: "/low-stocks",
            icon: "trending-up-2",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Categoría",
            link: "/category-list",
            icon: "list-details",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Subcategoría",
            link: "/sub-categories",
            icon: "carousel-vertical",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Marcas",
            link: "/brand-list",
            icon: "triangles",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Unidades",
            link: "/units",
            icon: "brand-unity",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Atributos de Variante",
            link: "/variant-attributes",
            icon: "checklist",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Garantías",
            link: "/warranty",
            icon: "certificate",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Imprimir Código de Barras",
            link: "/barcode",
            icon: "barcode",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Imprimir Código QR",
            link: "/qrcode",
            icon: "qrcode",
            showSubRoute: false,
            submenu: false,
          },
        ],
      },
    ],
  },
  {
    label: "Stock",
    submenuOpen: false,
    submenuHdr: "Stock",
    showSubRoute: false,
    submenuItems: [
      {
        label: "Stock",
        link: "#",
        icon: "stack-3",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Gestionar Stock",
            link: "/manage-stocks",
            icon: "stack-3",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Ajuste de Stock",
            link: "/stock-adjustment",
            icon: "stairs-up",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Transferencia de Stock",
            link: "/stock-transfer",
            icon: "stack-pop",
            showSubRoute: false,
            submenu: false,
          },
        ],
      },
    ],
  },

  {
    label: "Promociones",
    submenuOpen: false,
    submenuHdr: "Promociones",
    showSubRoute: false,
    submenuItems: [
      {
        label: "Promociones",
        link: "#",
        icon: "discount-2",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Cupones",
            link: "/coupons",
            icon: "ticket",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Tarjetas de Regalo",
            link: route.GiftCard,
            icon: "cards",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Descuento",
            icon: "file-percent",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              {
                label: "Plan de Descuento",
                link: route.discountPlan,
                showSubRoute: false,
              },
              { label: "Descuento", link: route.discount, showSubRoute: false },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Compras",
    submenuOpen: false,
    submenuHdr: "Compras",
    showSubRoute: false,
    submenuItems: [
      {
        label: "Compras",
        link: "#",
        icon: "shopping-bag",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Compras",
            link: "/purchase-list",
            icon: "shopping-bag",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Orden de Compra",
            link: "/purchase-order-report",
            icon: "file-unknown",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Devoluciones de Compra",
            link: "/purchase-returns",
            icon: "file-upload",
            showSubRoute: false,
            submenu: false,
          },
        ],
      },
    ],
  },

  {
    label: "Finanzas y Contabilidad",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Finanzas y Contabilidad",
    submenuItems: [
      {
        label: "Finanzas y Contabilidad",
        link: "#",
        icon: "building-bank",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          // ── Finanzas ERP ─────────────────────────────────────────────────
          { label: "Caja y Resumen",        link: route.finanzasCaja,          icon: "cash",           showSubRoute: false, submenu: false },
          { label: "Banesco",               link: route.finanzasBanesco,       icon: "building-bank",  showSubRoute: false, submenu: false },
          { label: "Comprobantes WA",       link: route.finanzasComprobantes,  icon: "receipt",        showSubRoute: false, submenu: false },
          { label: "IGTF",                  link: route.finanzasIgtf,          icon: "file-percent",   showSubRoute: false, submenu: false },
          { label: "Utilidad Real (P&L)",   link: route.finanzasUtilidad,      icon: "chart-bar",      showSubRoute: false, submenu: false },
          // ── Banking (legacy) ─────────────────────────────────────────────
          { label: "Panel Banesco (legacy)", link: route.bankingBanesco,        icon: "building-bank",  showSubRoute: false, submenu: false },
          { label: "Conciliacion Bancaria",  link: route.bankingReconciliation, icon: "arrows-exchange",showSubRoute: false, submenu: false },
          { label: "Comprobantes Recibidos", link: route.bankingReceipts,       icon: "receipt",        showSubRoute: false, submenu: false },
          {
            label: "Gastos",
            submenu: true,
            showSubRoute: false,
            icon: "file-stack",
            submenuItems: [
              { label: "Gastos", link: "/expense-list", showSubRoute: false },
              {
                label: "Categoría de Gastos",
                link: "/expense-category",
                showSubRoute: false,
              },
            ],
          },
          {
            label: "Ingresos",
            submenu: true,
            showSubRoute: false,
            icon: "file-pencil",
            submenuItems: [
              { label: "Ingresos", link: "/income", showSubRoute: false },
              {
                label: "Categoría de Ingresos",
                link: "/income-category",
                showSubRoute: false,
              },
            ],
          },
          {
            label: "Cuentas Bancarias",
            link: route.accountlist,
            icon: "building-bank",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Transferencia de Dinero",
            link: "/money-transfer",
            icon: "moneybag",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Balance General",
            link: "/balance-sheet",
            icon: "report-money",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Balance de Comprobación",
            link: "/trial-balance",
            icon: "alert-circle",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Flujo de Caja",
            link: "/cash-flow",
            icon: "zoom-money",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Estado de Cuenta",
            link: "/account-statement",
            icon: "file-infinity",
            showSubRoute: false,
            submenu: false,
          },
        ],
      },
    ],
  },

  {
    label: "Personas",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Personas",

    submenuItems: [
      {
        label: "Personas",
        link: "#",
        icon: "users-group",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Directorio de Clientes",
            link: route.clientesDirectorio,
            icon: "address-book",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Historial de Compras",
            link: route.clientesHistorial,
            icon: "history",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Clientes",
            link: route.customers,
            icon: "users-group",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Facturadores",
            link: "/billers",
            icon: "user-up",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Proveedores",
            link: "/suppliers",
            icon: "user-dollar",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Tiendas",
            link: "/store-list",
            icon: "home-bolt",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Almacenes",
            link: "/warehouse",
            icon: "archive",
            showSubRoute: false,
            submenu: false,
          },
        ],
      },
    ],
  },

  /* HRM — módulo oculto
  {
    label: "HRM",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "HRM",
    submenuItems: [
      {
        label: "HRM",
        link: "#",
        icon: "briefcase",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Empleados",            link: "/employees-grid",     icon: "user",           showSubRoute: false },
          { label: "Departamentos",        link: "/department-grid",    icon: "compass",        showSubRoute: false },
          { label: "Cargos",               link: "/designation",        icon: "git-merge",      showSubRoute: false },
          { label: "Turnos",               link: "/shift",              icon: "arrows-shuffle", showSubRoute: false },
          { label: "Asistencia",           link: "#",                   icon: "user-cog",       showSubRoute: false, submenu: true,
            submenuItems: [
              { label: "Empleado",       link: "/attendance-employee" },
              { label: "Administrador",  link: "/attendance-admin" },
            ],
          },
          { label: "Permisos",             link: "#",                   icon: "calendar",       showSubRoute: false, submenu: true,
            submenuItems: [
              { label: "Permisos de Empleados",    link: "/leaves-employee" },
              { label: "Permisos de Administrador", link: "/leaves-admin" },
              { label: "Tipos de Permiso",          link: "/leave-types" },
            ],
          },
          { label: "Feriados",             link: "/holidays",           icon: "calendar-share", showSubRoute: false },
          { label: "Nómina",               link: "#",                   icon: "file-dollar",    showSubRoute: false, submenu: true,
            submenuItems: [
              { label: "Salario de Empleados", link: route.payrollList },
              { label: "Recibo de Pago",       link: "/payslip" },
            ],
          },
        ],
      },
    ],
  },
  */
  {
    label: "Reportes",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Reportes",
    submenuItems: [
      {
        label: "Reportes",
        link: "#",
        icon: "report-analytics",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Reportes ERP",
            link: route.reportesVentas,
            icon: "chart-area",
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Reporte de Ventas",
            icon: "chart-bar",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Reporte de Ventas", link: "/sales-report" },
              { label: "Más Vendidos", link: "/best-seller" },
            ],
          },
          {
            label: "Reporte de Compras",
            link: "/purchase-report",
            icon: "chart-pie-2",
            showSubRoute: false,
          },
          {
            label: "Reporte de Inventario",
            icon: "triangle-inverted",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Reporte de Inventario", link: "/inventory-report" },
              { label: "Historial de Stock", link: "/stock-history" },
              { label: "Stock Vendido", link: "/sold-stock" },
            ],
          },
          {
            label: "Reporte de Facturas",
            link: route.invoicereportnew,
            icon: "businessplan",
            showSubRoute: false,
          },
          {
            label: "Reporte de Proveedores",
            icon: "user-star",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Reporte de Proveedores", link: "/supplier-report" },
              { label: "Deudas de Proveedores", link: "/supplier-due-report" },
            ],
          },
          {
            label: "Reporte de Clientes",

            icon: "report",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Reporte de Clientes", link: "/customer-report" },
              { label: "Deudas de Clientes", link: "/customer-due-report" },
            ],
          },
          {
            label: "Reporte de Productos",
            icon: "report-analytics",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Reporte de Productos", link: "/product-report" },
              { label: "Reporte de Vencimientos", link: "/product-expiry-report" },
              {
                label: "Alerta de Cantidad",
                link: route.productquantityreport,
              },
            ],
          },
          {
            label: "Reporte de Gastos",
            link: "/expense-report",
            icon: "file-vector",
            showSubRoute: false,
          },
          {
            label: "Reporte de Ingresos",
            link: "/income-report",
            icon: "chart-ppf",
            showSubRoute: false,
          },
          {
            label: "Reporte de Impuestos",
            link: "/tax-report",
            icon: "chart-dots-2",
            showSubRoute: false,
          },
          {
            label: "Ganancias y Pérdidas",
            link: "/profit-loss-report",
            icon: "chart-donut",
            showSubRoute: false,
          },
          {
            label: "Reporte Anual",
            link: "/annual-report",
            icon: "report-search",
            showSubRoute: false,
          },
          // ── Nuevos reportes por canal ────────────────────────────────────
          { label: "Ventas por Canal",     link: route.reportsSalesByChannel,  icon: "chart-bar",     showSubRoute: false, submenu: false },
          { label: "Rentabilidad Canal",   link: route.reportsMarginByChannel, icon: "chart-pie-2",   showSubRoute: false, submenu: false },
          { label: "Comisiones FV",        link: route.reportsCommissions,     icon: "coin",          showSubRoute: false, submenu: false },
        ],
      },
    ],
  },

  {
    label: "Contenido (CMS)",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Contenido (CMS)",
    submenuItems: [
      {
        label: "Contenido (CMS)",
        link: "#",
        icon: "article",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Páginas",
            icon: "page-break",
            showSubRoute: false,
            submenu: true,
            submenuItems: [{ label: "Páginas", link: "/pages" }],
          },
          {
            label: "Blog",
            icon: "wallpaper",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Todo el Blog", link: all_routes.allBlogs },
              { label: "Etiquetas del Blog", link: all_routes.blogTag },
              { label: "Categorías", link: all_routes.blogCategories },
              { label: "Comentarios del Blog", link: all_routes.blogComments },
            ],
          },
          {
            label: "Ubicación",
            icon: "map-pin",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Países", link: all_routes.countries },
              { label: "Estados", link: all_routes.states },
              { label: "Ciudades", link: all_routes.cities },
            ],
          },
          {
            label: "Testimonios",
            icon: "star",
            link: all_routes.testimonial,
            showSubRoute: false,
            submenu: false,
          },
          {
            label: "Preguntas Frecuentes",
            icon: "help-circle",
            link: all_routes.faq,
            showSubRoute: false,
            submenu: false,
          },
        ],
      },
    ],
  },
  {
    label: "Gestión de Usuarios",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Gestión de Usuarios",
    submenuItems: [
      {
        label: "Gestión de Usuarios",
        link: "#",
        icon: "user-shield",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          {
            label: "Usuarios",
            link: "/users",
            icon: "shield-up",
            showSubRoute: false,
          },
          {
            label: "Roles y Permisos",
            link: "/roles-permissions",
            icon: "jump-rope",
            showSubRoute: false,
          },
          {
            label: "Solicitudes de Eliminación",
            link: "/delete-account",
            icon: "trash-x",
            showSubRoute: false,
          },
        ],
      },
    ],
  },
  {
    label: "Páginas",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Páginas",
    submenuItems: [
      {
        label: "Páginas",
        link: "#",
        icon: "files",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
      {
        label: "Perfil",
        link: "/profile",
        icon: "user-circle",
        showSubRoute: false,
      },
      {
        label: "Autenticación",
        submenu: true,
        showSubRoute: false,
        icon: "shield",
        submenuItems: [
          {
            label: "Inicio de Sesión",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              { label: "Portada", link: "/signin", showSubRoute: false },
              { label: "Ilustración", link: "/signin-2", showSubRoute: false },
              { label: "Básico", link: "/signin-3", showSubRoute: false },
            ],
          },
          {
            label: "Registro",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              { label: "Portada", link: "/register", showSubRoute: false },
              {
                label: "Ilustración",
                link: "/register-2",
                showSubRoute: false,
              },
              { label: "Básico", link: "/register-3", showSubRoute: false },
            ],
          },
          {
            label: "Olvidé mi Contraseña",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              { label: "Portada", link: "/forgot-password", showSubRoute: false },
              {
                label: "Ilustración",
                link: "/forgot-password-2",
                showSubRoute: false,
              },
              {
                label: "Básico",
                link: "/forgot-password-3",
                showSubRoute: false,
              },
            ],
          },
          {
            label: "Restablecer Contraseña",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              { label: "Portada", link: "/reset-password", showSubRoute: false },
              {
                label: "Ilustración",
                link: "/reset-password-2",
                showSubRoute: false,
              },
              {
                label: "Básico",
                link: "/reset-password-3",
                showSubRoute: false,
              },
            ],
          },
          {
            label: "Verificación de Correo",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              {
                label: "Portada",
                link: "/email-verification",
                showSubRoute: false,
              },
              {
                label: "Ilustración",
                link: "/email-verification-2",
                showSubRoute: false,
              },
              {
                label: "Básico",
                link: "/email-verification-3",
                showSubRoute: false,
              },
            ],
          },
          {
            label: "Verificación en 2 Pasos",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              {
                label: "Portada",
                link: "/two-step-verification",
                showSubRoute: false,
              },
              {
                label: "Ilustración",
                link: "/two-step-verification-2",
                showSubRoute: false,
              },
              {
                label: "Básico",
                link: "/two-step-verification-3",
                showSubRoute: false,
              },
            ],
          },
          { label: "Pantalla de Bloqueo", link: "/lock-screen", showSubRoute: false },
        ],
      },
      {
        label: "Páginas de Error",
        submenu: true,
        showSubRoute: false,
        icon: "file-x",
        submenuItems: [
          { label: "Error 404", link: "/error-404", showSubRoute: false },
          { label: "Error 500", link: "/error-500", showSubRoute: false },
        ],
      },
      {
        label: "Página en Blanco",
        link: "/blank-page",
        icon: "file",
        showSubRoute: false,
      },
      {
        label: "Precios",
        link: route.pricing,
        icon: "currency-dollar",
        showSubRoute: false,
      },
      {
        label: "Próximamente",
        link: "/coming-soon",
        icon: "send",
        showSubRoute: false,
      },
      {
        label: "En Mantenimiento",
        link: "/under-maintenance",
        icon: "alert-triangle",
        showSubRoute: false,
      },
        ],
      },
    ],
  },

  {
    label: "Configuración",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Configuración",
    submenuItems: [
      {
        label: "Configuración",
        link: "#",
        icon: "settings",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
      {
        label: "ERP — Configuración",
        submenu: true,
        showSubRoute: false,
        icon: "adjustments",
        submenuItems: [
          { label: "Empresa",                link: route.configEmpresa,          icon: "building",        showSubRoute: false, submenu: false },
          { label: "Sucursales",             link: route.configSucursales,       icon: "map-pin",         showSubRoute: false, submenu: false },
          { label: "Usuarios y Roles",       link: route.configUsuarios,         icon: "users",           showSubRoute: false, submenu: false },
          { label: "Integraciones",          link: route.configIntegraciones,    icon: "plug-connected",  showSubRoute: false, submenu: false },
          { label: "Mensajes automáticos WA",link: route.configAutomatizaciones, icon: "brand-whatsapp",  showSubRoute: false, submenu: false },
        ],
      },
      {
        label: "Configuración General",
        submenu: true,
        showSubRoute: false,
        icon: "settings",
        submenuItems: [
          { label: "Perfil", link: "/general-settings" },
          { label: "Seguridad", link: "/security-settings" },
          { label: "Notificaciones", link: "/notification" },
          { label: "Aplicaciones Conectadas", link: "/connected-apps" },
        ],
      },
      {
        label: "Configuración del Sitio",
        submenu: true,
        showSubRoute: false,
        icon: "world",
        submenuItems: [
          {
            label: "Configuración del Sistema",
            link: "/system-settings",
            showSubRoute: false,
          },
          {
            label: "Configuración de Empresa",
            link: "/company-settings",
            showSubRoute: false,
          },
          {
            label: "Localización",
            link: "/localization-settings",
            showSubRoute: false,
          },
          { label: "Prefijos", link: "/prefixes", showSubRoute: false },
          { label: "Preferencias", link: "/preference", showSubRoute: false },
          { label: "Apariencia", link: "/appearance", showSubRoute: false },
          {
            label: "Autenticación Social",
            link: "/social-authentication",
            showSubRoute: false,
          },
          {
            label: "Idioma",
            link: "/language-settings",
            showSubRoute: false,
          },
        ],
      },
      {
        label: "Configuración de la App",
        submenu: true,

        showSubRoute: false,
        icon: "device-mobile",
        submenuItems: [
          {
            label: "Factura",
            link: "/invoice-settings",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Configuración de Facturas", link: "/invoice-settings" },
              { label: "Plantilla de Facturas", link: "/invoice-template" },
            ],
          },
          { label: "Impresora", link: "/printer-settings", showSubRoute: false },
          { label: "POS", link: "/pos-settings", showSubRoute: false },
          {
            label: "Campos Personalizados",
            link: "/custom-fields",
            showSubRoute: false,
          },
        ],
      },
      {
        label: "Configuración del Sistema",
        submenu: true,
        showSubRoute: false,
        icon: "device-desktop",
        submenuItems: [
          {
            label: "Correo Electrónico",
            link: "/email-settings",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Configuración de Correo", link: "/email-settings" },
              { label: "Plantilla de Correo", link: "/email-template" },
            ],
          },
          {
            label: "Pasarelas SMS",
            link: "/sms-gateway",
            showSubRoute: false,
            submenu: true,
            submenuItems: [
              { label: "Configuración SMS", link: "/sms-settings" },
              { label: "Plantilla SMS", link: route.smstemplate },
            ],
          },
          { label: "OTP", link: "/otp-settings", showSubRoute: false },
          {
            label: "Cookies GDPR",
            link: "/gdpr-settings",
            showSubRoute: false,
          },
        ],
      },
      {
        label: "Configuración Financiera",
        submenu: true,
        showSubRoute: false,
        icon: "settings-dollar",
        submenuItems: [
          {
            label: "Pasarela de Pago",
            link: "/payment-gateway-settings",
            showSubRoute: false,
          },
          {
            label: "Cuentas Bancarias",
            link: "/bank-settings-grid",
            showSubRoute: false,
          },
          { label: "Tasas de Impuestos", link: "/tax-rates", showSubRoute: false },
          {
            label: "Monedas",
            link: "/currency-settings",
            showSubRoute: false,
          },
          {
            label: "Políticas de Precio",
            link: "/pricing-policies",
            showSubRoute: false,
          },
          {
            label: "Precios Calculados",
            link: "/product-prices",
            showSubRoute: false,
          },
        ],
      },
      {
        label: "Otras Configuraciones",
        submenu: true,
        showSubRoute: false,
        icon: "settings-2",
        submenuItems: [
          { label: "Almacenamiento", link: "/storage-settings", showSubRoute: false },
          {
            label: "Bloquear IP",
            link: "/ban-ip-address",
            showSubRoute: false,
          },
        ],
      },
      // ── Integraciones ────────────────────────────────────────────────────
      {
        label: "Integraciones",
        submenu: true,
        showSubRoute: false,
        icon: "plug",
        submenuItems: [
          { label: "MercadoLibre OAuth",    link: route.settingsMlConnect,   showSubRoute: false },
          { label: "Wasender WhatsApp",     link: route.settingsWasender,    showSubRoute: false },
          { label: "Banesco API",           link: route.settingsBanescoApi,  showSubRoute: false },
          { label: "Canales de Venta",      link: route.settingsChannels,    showSubRoute: false },
          { label: "Plantillas WhatsApp",   link: route.settingsWaTemplates, showSubRoute: false },
        ],
      },
      {
        label: "Cerrar Sesion",
        link: "/signin",
        icon: "logout",
        showSubRoute: false,
      },
        ],
      },
    ],
  },

  {
    label: "Interfaz UI",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Interfaz UI",
    submenuItems: [
      {
        label: "Interfaz UI",
        link: "#",
        icon: "palette",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
      {
        label: "UI Base",
        submenu: true,
        showSubRoute: false,
        icon: "vector-bezier",
        submenuItems: [
          { label: "Alertas", link: "/ui-alerts", showSubRoute: false },
          { label: "Acordeón", link: "/ui-accordion", showSubRoute: false },
          { label: "Avatar", link: "/ui-avatar", showSubRoute: false },
          { label: "Insignias", link: "/ui-badges", showSubRoute: false },
          { label: "Borde", link: "/ui-borders", showSubRoute: false },
          { label: "Botones", link: "/ui-buttons", showSubRoute: false },
          {
            label: "Grupo de Botones",
            link: "/ui-buttons-group",
            showSubRoute: false,
          },
          { label: "Migas de Pan", link: "/ui-breadcrumb", showSubRoute: false },
          { label: "Tarjeta", link: "/ui-cards", showSubRoute: false },
          { label: "Carrusel", link: "/ui-carousel", showSubRoute: false },
          { label: "Colores", link: "/ui-colors", showSubRoute: false },
          { label: "Desplegables", link: "/ui-dropdowns", showSubRoute: false },
          { label: "Cuadrícula", link: "/ui-grid", showSubRoute: false },
          { label: "Imágenes", link: "/ui-images", showSubRoute: false },
          { label: "Lightbox", link: "/ui-lightbox", showSubRoute: false },
          { label: "Medios", link: "/ui-media", showSubRoute: false },
          { label: "Modales", link: "/ui-modals", showSubRoute: false },
          { label: "Offcanvas", link: "/ui-offcanvas", showSubRoute: false },
          { label: "Paginación", link: "/ui-pagination", showSubRoute: false },
          { label: "Popovers", link: "/ui-popovers", showSubRoute: false },
          { label: "Progreso", link: "/ui-progress", showSubRoute: false },
          {
            label: "Marcadores",
            link: "/ui-placeholders",
            showSubRoute: false,
          },
          {
            label: "Control Deslizante",
            link: "/ui-rangeslider",
            showSubRoute: false,
          },
          { label: "Indicador de Carga", link: "/ui-spinner", showSubRoute: false },
         
          { label: "Pestañas", link: "/ui-nav-tabs", showSubRoute: false },
          { label: "Toasts", link: "/ui-toasts", showSubRoute: false },
          { label: "Tooltips", link: "/ui-tooltips", showSubRoute: false },
          { label: "Tipografía", link: "/ui-typography", showSubRoute: false },
          { label: "Video", link: "/ui-video", showSubRoute: false },
          { label: "Sortable", link: "/sortable", showSubRoute: false },
          { label: "SwiperJs", link: "/swiper-js", showSubRoute: false },
        ],
      },
      {
        label: "UI Avanzada",
        submenu: true,
        showSubRoute: false,
        icon: "stack-forward",
        submenuItems: [
          { label: "Cinta", link: "/ui-ribbon", showSubRoute: false },
          { label: "Portapapeles", link: "/ui-clipboard", showSubRoute: false },
          { label: "Arrastrar y Soltar", link: "/ui-drag-drop", showSubRoute: false },
          {
            label: "Control Deslizante",
            link: "/ui-rangeslider",
            showSubRoute: false,
          },
          { label: "Calificación", link: "/ui-rating", showSubRoute: false },
          {
            label: "Editor de Texto",
            link: "/ui-text-editor",
            showSubRoute: false,
          },
          { label: "Contador", link: "/ui-counter", showSubRoute: false },
          { label: "Barra de Desplazamiento", link: "/ui-scrollbar", showSubRoute: false },
        
          { label: "Línea de Tiempo", link: "/ui-timeline", showSubRoute: false },
        ],
      },
      {
        label: "Gráficos",
        submenu: true,
        showSubRoute: false,
        icon: "chart-infographic",
        submenuItems: [
          { label: "Apex Charts", link: "/chart-apex", showSubRoute: false },
         
        ],
      },
      {
        label: "Iconos",
        submenu: true,
        showSubRoute: false,
        icon: "icons",
        submenuItems: [
          {
            label: "Iconos Fontawesome",
            link: "/icon-fontawesome",
            showSubRoute: false,
          },
          {
            label: "Remix Icon",
            link: "/remix-icon",
            showSubRoute: false,
          },
          {
            label: "Bootstrap Icon",
            link: "/bootstrap-icon",
            showSubRoute: false,
          },
         
        
          { label: "Ionic Icons", link: "/icon-ionic", showSubRoute: false },
          {
            label: "Material Icons",
            link: "/icon-material",
            showSubRoute: false,
          },
          { label: "Pe7 Icons", link: "/icon-pe7", showSubRoute: false },
         
          {
            label: "Themify Icons",
            link: "/icon-themify",
            showSubRoute: false,
          },
         
          {
            label: "Typicon Icons",
            link: "/icon-typicon",
            showSubRoute: false,
          },
          {
            label: "Tabler Icons",
            link: "/icon-tabler",
            showSubRoute: false,
          },
       
          { label: "Iconos de Banderas", link: "/icon-flag", showSubRoute: false },
        ],
      },
      {
        label: "Formularios",
        submenu: true,
        showSubRoute: false,
        icon: "input-search",
        submenuItems: [
          {
            label: "Elementos de Formulario",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              {
                label: "Campos Básicos",
                link: "/form-basic-inputs",
                showSubRoute: false,
              },
              {
                label: "Casillas y Radio",
                link: "/form-checkbox-radios",
                showSubRoute: false,
              },
              {
                label: "Grupos de Entrada",
                link: "/form-input-groups",
                showSubRoute: false,
              },
              {
                label: "Cuadrícula y Márgenes",
                link: "/form-grid-gutters",
                showSubRoute: false,
              },
              {
                label: "Selector de Formulario",
                link: "/form-select",
                showSubRoute: false,
              },
           
              {
                label: "Subida de Archivos",
                link: "/form-fileupload",
                showSubRoute: false,
              },
            ],
          },
          {
            label: "Diseños",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              { label: "Formulario Horizontal", link: "/form-horizontal" },
              { label: "Formulario Vertical", link: "/form-vertical" },
              { label: "Etiquetas Flotantes", link: "/form-floating-labels" },
            ],
          },
          { label: "Validación de Formulario", link: "/form-validation" },
          { label: "Selector", link: "/form-select2" },
          { label: "Asistente de Formulario", link: "/form-wizard" },
          { label: "Selector de Fecha", link: "/form-picker" },
        ],
      },
      {
        label: "Tablas",
        submenu: true,
        showSubRoute: false,
        icon: "table",
        submenuItems: [
          { label: "Tablas Básicas", link: "/tables-basic" },
          { label: "Tabla de Datos", link: "/data-tables" },
        ],
      },
      {
        label: "Mapa",
        submenu: true,
        showSubRoute: false,
        icon: "map-pin-pin",
        submenuItems: [{ label: "Leaflet", link: "/leaflet" }],
      },
        ],
      },
    ],
  },
  {
    label: "Ayuda",
    submenuOpen: false,
    showSubRoute: false,
    submenuHdr: "Ayuda",
    submenuItems: [
      {
        label: "Ayuda",
        link: "#",
        icon: "lifebuoy",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
      {
        label: "Documentación",
        link: "https://dreamspos.dreamstechnologies.com/documentation/nextjs.html",
        icon: "file-text",
        showSubRoute: false,
      },
      {
        label: "Registro de Cambios v2.2.5",
        link: "https://dreamspos.dreamstechnologies.com/documentation/changelog.html",
        icon: "exchange",
        showSubRoute: false,
      },
      {
        label: "Multinivel",
        showSubRoute: false,
        submenu: true,
        icon: "menu-2",
        submenuItems: [
          { label: "Nivel 1.1", link: "#", showSubRoute: false },
          {
            label: "Nivel 1.2",
            submenu: true,
            showSubRoute: false,
            submenuItems: [
              { label: "Nivel 2.1", link: "#", showSubRoute: false },
              {
                label: "Nivel 2.2",
                submenu: true,
                showSubRoute: false,
                submenuItems: [
                  { label: "Nivel 3.1", link: "#", showSubRoute: false },
                  { label: "Nivel 3.2", link: "#", showSubRoute: false },
                ],
              },
            ],
          },
        ],
      },
        ],
      },
    ],
  },
];
