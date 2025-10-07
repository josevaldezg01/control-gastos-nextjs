// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formateo de moneda colombiana
export function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}

// Formateo de fechas
export function formatearFecha(fecha: string | Date, formato: string = "dd/MM/yyyy"): string {
  const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  return format(fechaObj, formato, { locale: es });
}

export function formatearFechaCompleta(fecha: string | Date): string {
  const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  return format(fechaObj, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
}

// Obtener información del mes activo
export function obtenerInfoMesActivo(mesActivo: string) {
  const [anio, mes] = mesActivo.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, 1);

  const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long' });
  const nombreCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  // Calcular próximo mes
  const proximaFecha = new Date(anio, mes, 1);
  const proximoMes = proximaFecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const proximoCapitalizado = proximoMes.charAt(0).toUpperCase() + proximoMes.slice(1);

  const proximoFormato = `${proximaFecha.getFullYear()}-${String(proximaFecha.getMonth() + 1).padStart(2, '0')}`;

  return {
    nombreCompleto: `${nombreCapitalizado} ${anio}`,
    proximoNombre: proximoCapitalizado,
    proximoFormato: proximoFormato
  };
}

// Generar CSV
export function generarCSV(datos: any[], nombreArchivo: string) {
  if (!datos.length) return;
  
  const headers = Object.keys(datos[0]);
  const csvContent = [
    headers.join(','),
    ...datos.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${nombreArchivo}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Colores para gráficos
export const COLORES_GRAFICOS = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#8B5CF6', // Violeta
  '#EF4444', // Rojo
  '#F59E0B', // Amarillo
  '#64748B', // Gris
  '#F97316'  // Naranja
];