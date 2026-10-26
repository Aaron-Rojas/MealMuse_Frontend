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
 * - error: Combinación de fondo pastel (#FDE8E8) y texto (#E02424) para el banner de error.
 * - border / divider: Grises sutiles para delimitar inputs, divisores y botones secundarios.
 */
export const colors = {
  primary: '#2E9461',
  primaryDark: '#24784E',
  primaryLight: '#E6F5ED',

  background: {
    main: '#FBFBFA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    elevated: '#F3F4F6',
  },

  text: {
    primary: '#1A2530',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#2E9461',
  },

  error: {
    background: '#FDE8E8',
    text: '#E02424',
    border: '#FCA5A5',
  },

  status: {
    success: '#2E9461',
    warning: '#F59E0B',
    danger: '#E02424',
    info: '#3B82F6',
    expiredBackground: '#FDE8E8',
    expiredText: '#E02424',
    expiringBackground: '#FEF3C7',
    expiringText: '#B45309',
    currentBackground: '#E6F5ED',
    currentText: '#2E9461',
    neutralBackground: '#F3F4F6',
    neutralText: '#6B7280',
  },

  border: {
    light: '#E5E7EB',
    focus: '#2E9461',
    divider: '#E5E7EB',
  },

  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',
};
