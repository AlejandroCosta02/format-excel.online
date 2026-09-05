# **.cursorrules / Reference Specification: Excel & Productivity SaaS**

## ---

**1\. Visión General del Proyecto**

El proyecto es una plataforma SaaS de productividad enfocada en la automatización de flujos de trabajo con archivos Excel y herramientas de utilidad. El objetivo central es ofrecer un formateador automático de planillas Excel mediante un editor visual en tiempo real, complementado con utilidades de Mail Merge semi-automático y Extractor de Manifest.

## **2\. Modelo de Negocio (Freemium Based)**

| Nivel | Funcionalidades Incluidas | Estrategia de Monetización   |
| :---- | :---- | :---- |
| **Gratis (Gancho)** | Carga Drag & Drop de archivos .xlsx / .csv. Previsualización interactiva e inmediata en pantalla. Eliminación de columnas, personalización visual (colores, fuentes) y agregado de fórmulas básicas. Exportación de archivo procesado individual. Uso con límites diarios/de volumen para Mail Merge y Extractor de Manifest. | Acceso libre sin registro obligatorio para pruebas inmediatas, incentivando la adopción rápida. |
| **Pro / Pago (Suscripción)** | **Guardado de Plantillas (Feature Clave):** Almacena configuraciones JSON de formato para aplicar en 1-click a futuros archivos con la misma estructura. Procesamiento por lotes (Batch processing de múltiples Excels en simultáneo). Mail Merge ilimitado e integraciones avanzadas. Límites extendidos de tamaño y filas de procesamiento. | Suscripción recurrente (Lemon Squeezy / Stripe) orientada al ahorro de tiempo recurrente. |

## **3\. Stack Tecnológico**

* **Framework Fullstack:** Next.js (App Router, TypeScript).  
* **UI & Styling:** Tailwind CSS \+ Shadcn UI (Radix Primitives).  
* **Iconografía & Interacción:** Lucide React \+ Framer Motion.  
* **Procesamiento Excel:** ExcelJS (manejo y formateo nativo) \+ @tanstack/react-table (tabla interactiva frontend) \+ SheetJS / xlsx.  
* **Base de Datos & Autenticación:** Supabase (PostgreSQL \+ OAuth con Google \+ Row Level Security).  
* **Pasarela de Pagos:** Lemon Squeezy (o Stripe) para suscripciones y Webhooks.  
* **Despliegue & Hosting:** Vercel.

## **4\. Guías de Estilo Artístico y Sistema de Diseño**

La interfaz debe comunicar profesionalismo, modernidad y máxima claridad en la manipulación de datos masivos.

### **4.1 Paleta de Colores**

* **Fondo Principal (Background):** \#F8FAFC (Slate 50\) para zonas generales; \#FFFFFF para tarjetas y contenedores.  
* **Primario / Acción (Brand):** \#2563EB (Blue 600\) / Hover: \#1D4ED8 (Blue 700).  
* **Acento de Éxito / Excel:** \#16A34A (Green 600\) / \#15803D (Green 700\) para acciones asociadas a exportación o salud de datos.  
* **Bordes & Divisores:** \#E2E8F0 (Slate 200).  
* **Texto:** Principal \#0F172A (Slate 900), Secundario \#475569 (Slate 600).

### **4.2 Tipografía**

* **Fuente Primaria:** Inter o Geist Sans (Vercel font stack) para la interfaz de usuario.  
* **Fuente Monospaced:** JetBrains Mono o Geist Mono para códigos de fórmulas, etiquetas de columnas y previsualización de datos técnicos.

### **4.3 UI/UX Layout Rules**

* Diseño limpio basado en *Bento Grids* y paneles colapsables laterales para opciones de formato.  
* Área de carga Drag & Drop destacada con animaciones sutiles al arrastrar archivos.  
* Tabla de datos con comportamiento "sticky" en cabeceras y soporte nativo para scroll horizontal/vertical fluido.

## **5\. Autenticación y Flujo de Usuarios**

* **Login por Google (Primary Auth):** Implementado mediante Supabase Auth (\`supabase.auth.signInWithOAuth({ provider: 'google' })\`).  
* **Sesión Persistente:** Middlewares de Next.js para proteger rutas \`/dashboard\`, \`/templates\` y \`/settings\`.  
* **Experiencia Guest-to-Paid:** Un usuario no registrado puede cargar un archivo y probar el editor. Al intentar hacer clic en "Guardar Plantilla" o "Procesar en Lote", se activa un Modal de Autenticación rápida con Google.

## **6\. Esquema de Datos (Supabase / PostgreSQL)**

### **6.1 Tabla \`profiles\`**

CREATE TABLE profiles (  
  id UUID REFERENCES auth.users PRIMARY KEY,  
  email TEXT UNIQUE NOT NULL,  
  full\_name TEXT,  
  avatar\_url TEXT,  
  subscription\_status TEXT DEFAULT 'free', \-- 'free', 'pro', 'cancelled'  
  lemon\_squeezy\_customer\_id TEXT,  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

### **6.2 Tabla \`templates\`**

CREATE TABLE templates (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  user\_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,  
  title TEXT NOT NULL,  
  description TEXT,  
  config JSONB NOT NULL,  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

## **7\. Estructura del JSON de Configuración de Plantilla**

{  
  "template\_id": "tpl\_987654321",  
  "template\_name": "Reporte Mensual de Ventas",  
  "match\_criteria": {  
    "expected\_columns": \["ID", "Fecha", "Monto", "Cliente", "Notas"\]  
  },  
  "actions": {  
    "remove\_columns": \["Notas"\],  
    "column\_styles": \[  
      {  
        "column": "Monto",  
        "bg\_color": "\#E6F4EA",  
        "font\_color": "\#137333",  
        "bold": true,  
        "font\_size": 11  
      }  
    \],  
    "formulas": \[  
      {  
        "target\_column": "Total con IVA",  
        "formula\_pattern": "=C{row}\*1.21"  
      }  
    \],  
    "summary\_row": {  
      "enabled": true,  
      "operations": \[  
        { "column": "Monto", "type": "SUM" }  
      \]  
    }  
  }  
}

## **8\. Reglas de Desarrollo para Cursor / IA**

1. Utilizar siempre \*\*TypeScript estricto\*\* y validar esquemas de datos con \`Zod\`.  
2. Mantener los componentes de UI modularizados en \`@/components/ui\` utilizando las primitivas de Shadcn UI.  
3. Procesar las previsualizaciones de Excel del lado del cliente para optimizar rendimiento de servidor; ejecutar transformaciones masivas o de plantillas guardadas a través de Server Actions de Next.js.  
4. Garantizar que todas las llamadas a Supabase respeten las políticas de seguridad \*\*Row Level Security (RLS)\*\*.