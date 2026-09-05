# **.cursorrules / Reference Specification: Excel & Productivity SaaS (Updated)**

## ---

**1\. Visión General del Proyecto**

La plataforma es un SaaS de productividad integral enfocado en la automatización de archivos Excel y utilidades de flujo de trabajo. Consta de tres módulos principales integrados en una interfaz unificada mediante pestañas: Formateador de Excel, Mail Merge semi-automático y Extractor de Manifest.

## **2\. Arquitectura de Experiencia del Usuario (Estrategia Guest-First)**

Para maximizar la conversión y reducir la fricción, \*\*ninguna función básica requiere registro obligatorio previo\*\*.

### **2.1 Flujo Guest-to-Paid (Sin Registro Obligatorio Inicial)**

* **Usuario Invitado (Sin Login):** Acceso inmediato a las 3 herramientas en modo gratuito/limitado.  
* **Disparadores de Autenticación (Modals de Google Auth):**  
  * Al intentar hacer clic en *"Guardar Plantilla"* en el Formateador de Excel.  
  * Al superar el límite diario de envíos (5 a 10\) en el Mail Merge (controlado localmente vía localStorage).  
  * Al intentar procesar archivos masivos en lote en el Extractor de Manifest o en el Formateador.

## **3\. Estructura de Características por Herramienta**

| Módulo / Herramienta | Modo Invitado / Gratis (Gancho) | Modo Pro / Pago (Suscripción)   |
| :---- | :---- | :---- |
| **1\. Formateador Excel** | Carga Drag & Drop, previsualización interactiva, eliminación de columnas, cambio de color/fuente, agregado de fórmulas básicas y descarga directa de 1 archivo. | **Guardado de Plantillas JSON (Feature Clave)** para aplicar formatos en 1-click a futuros reportes. Procesamiento por lote (batch) de múltiples archivos simultáneos. |
| **2\. Mail Merge** | Uso semi-automático de scripts existentes para generación de correos con límite diario (5-10 envíos/día) gestionado localmente. | Envíos ilimitados, historial de campañas y automatización avanzada. |
| **3\. Extractor Manifest** | Extracción unitaria de archivos de manifiesto individuales (límite de tamaño 2 MB). | Extracción masiva por lotes (procesar carpetas o múltiples manifests consolidados en una sola tabla). |

## **4\. Layout y Distribución de la Página Principal (\`app/page.tsx\`)**

La interfaz se organiza en una estructura de aplicación web moderna de una sola página (SPA Layout) dividida en 4 zonas:

### **4.1 Header (Navegación Superior)**

* **Izquierda:** Logo \+ Nombre del SaaS.  
* **Centro:** Selector de Pestañas Principales (Tabs Component):  
  * \[📊 Formateador Excel\]  
  * \[✉️ Mail Merge\]  
  * \[📄 Extractor Manifest\]  
* **Derecha:** Botón secundario *"Precios / Planes"* \+ Botón primario destacado *"Iniciar sesión con Google"* / Badge de Estado de Cuenta.

### **4.2 Hero / Selector de Estado (Según Pestaña Activa)**

* Encabezado dinámico que cambia según la pestaña seleccionada explicando el valor inmediato de la herramienta.

### **4.3 Área de Trabajo Central (Main Workspace)**

* **En Pestaña Excel:** Zona de arrastre Drag & Drop \-\> Tabla interactiva de previsualización (@tanstack/react-table) \+ Barra lateral/superior de herramientas de formato (eliminar columnas, aplicar colores, agregar fórmulas) \+ Botones "Exportar Excel" (Gratis) y "Guardar Plantilla" (Pro / Trigger Auth).  
* **En Pestaña Mail Merge:** Interfaz conectada a los scripts de la carpeta ./scripts/mail-merge/ con contadores de uso diario local.  
* **En Pestaña Extractor Manifest:** Carga de manifiestos procesada a través de los scripts en ./scripts/manifest-extractor/.

### **4.4 Footer**

* Enlaces legales, soporte y estado de consumo de cuota local.

## **5\. Integración de Scripts Existentes (Carpeta \`./scripts\`)**

El código existente para el Mail Merge y el Extractor de Manifest se encuentra ubicado en la carpeta raíz dentro de ./scripts/. Se deben integrar de la siguiente manera:

* **Ubicación:** ./scripts/mail-merge/ y ./scripts/manifest-extractor/.  
* **Estrategia de Integración:** Convertir o envolver la lógica de estos scripts en TypeScript reutilizable dentro de @/lib/scripts/ o utilizarlos como utilidades invocadas directamente desde Server Actions / API Routes de Next.js.

## **6\. Sistema de Diseño, Colores y Autenticación**

* **Paleta:** Fondo \#F8FAFC (Slate 50), Contenedores \#FFFFFF, Primario \#2563EB (Blue 600), Acento Éxito/Excel \#16A34A (Green 600).  
* **Fuentes:** Inter / Geist Sans (UI) y JetBrains Mono (Datos/Fórmulas).  
* **Auth:** Supabase Google OAuth (\`supabase.auth.signInWithOAuth({ provider: 'google' })\`).