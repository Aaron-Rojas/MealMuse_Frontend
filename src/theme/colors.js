/**
 * Sistema de Diseño - Paleta de Colores Extraída del Diseño de Figma (MealMuse)
 * 
 * ¿POR QUÉ?
 * Centralizar los valores cromáticos extraídos del diseño garantiza fidelidad visual 1:1,
 * consistencia en toda la app y un desacoplamiento limpio entre componentes y temas.
 * 
 * ¿CÓMO?
 * Se agrupan los tokens por contexto semántico:
 * - primary: Verde de marca (#2E9461) para botones de acción y enlaces clave.
 * - background: Tono marfil suave (#FBFBFA) para el lienzo de pantalla y blanco (#FFFFFF) para superficies/cards.
 * - text: Escala de contraste desde el azul grisáceo oscuro (#1A2530) hasta neutros secundarios (#6B7280).
 * - error: Combinación de fondo pastel (#FDE8E8) y texto (#E02424) para el banner de validación.
 * - border / divider: Grises sutiles para delimitar inputs, divisores y botones secundarios.
 */
export const colors = {
  // Marca e interactividad principal
  primary: '#2E9461',
  primaryDark: '#24784E',
  primaryLight: '#E6F5ED',

  // Superficies y lienzos
  background: {
    main: '#FBFBFA',       // Fondo marfil suave de pantalla según Figma
    surface: '#FFFFFF',    // Blanco puro para inputs y tarjetas
    card: '#FFFFFF',
    elevated: '#F3F4F6',
  },

  // Jerarquía tipográfica
  text: {
    primary: '#1A2530',    // Títulos y etiquetas en alto contraste
    secondary: '#6B7280',  // Subtítulos y textos informativos
    muted: '#9CA3AF',      // Placeholders e iconos secundarios
    inverse: '#FFFFFF',    // Texto en botones sólidos
    link: '#2E9461',       // Enlaces interactivos ("¿Olvidaste tu contraseña?")
  },

  // Estados de error y alertas (Banner de error en Figma)
  error: {
    background: '#FDE8E8', // Fondo rosa suave del aviso de error
    text: '#E02424',       // Texto rojo de error
    border: '#FCA5A5',
  },

  // Semántica general de despensa y vencimientos
  status: {
    success: '#2E9461',
    warning: '#F59E0B',
    danger: '#E02424',
    info: '#3B82F6',
  },

  // Bordes y líneas divisorias
  border: {
    light: '#E5E7EB',      // Borde estándar de inputs y botón de Google
    focus: '#2E9461',      // Borde al enfocar campo de texto
    divider: '#E5E7EB',    // Líneas del separador "o continúa con"
  },

  // Utilidades
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',
};
