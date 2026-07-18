'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CuentaStreaming } from '@/hooks/useStreaming';

interface CuentaModalProps {
  cuenta?: CuentaStreaming | null;
  onClose: () => void;
  onGuardar: (cuenta: any) => Promise<void>;
}

const servicios = ['Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'YouTube Premium'];

const tiposCuentaPorServicio: Record<string, string[]> = {
  'Netflix': ['Netflix 1 pantalla', 'Netflix 2 pantallas', 'Netflix 4 pantallas'],
  'Prime Video': ['5 perfiles'],
  'Disney+': ['5 perfiles'],
  'HBO Max': ['5 perfiles'],
  'YouTube Premium': ['Premium (1 principal + 5 vinculadas)']
};

export const CuentaModal = ({ cuenta, onClose, onGuardar }: CuentaModalProps) => {
  const [servicio, setServicio] = useState(cuenta?.servicio || 'Netflix');
  const [tipoCuenta, setTipoCuenta] = useState(cuenta?.tipo_cuenta || '');
  const [costoMensual, setCostoMensual] = useState(cuenta?.costo_mensual?.toString() || '');
  const [diaPago, setDiaPago] = useState(cuenta?.dia_pago?.toString() || '');
  const [email, setEmail] = useState(cuenta?.email || '');
  const [tarjetaVinculada, setTarjetaVinculada] = useState(cuenta?.tarjeta_vinculada || '');
  const [notas, setNotas] = useState(cuenta?.notas || '');
  const [activa, setActiva] = useState(cuenta ? cuenta.activa : true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!cuenta && servicio) {
      setTipoCuenta(tiposCuentaPorServicio[servicio][0]);
    }
  }, [servicio, cuenta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!costoMensual || parseFloat(costoMensual) <= 0) {
      alert('Por favor ingresa un costo válido');
      return;
    }

    if (!email.trim()) {
      alert('Por favor ingresa el correo/login de la cuenta');
      return;
    }

    setGuardando(true);
    try {
      const datosCuenta = {
        servicio,
        tipo_cuenta: tipoCuenta,
        costo_mensual: parseFloat(costoMensual),
        dia_pago: diaPago ? parseInt(diaPago) : null,
        email: email.trim(),
        tarjeta_vinculada: servicio !== 'Netflix' ? (tarjetaVinculada.trim() || null) : null,
        notas: notas || null,
        activa
      };

      await onGuardar(datosCuenta);
      onClose();
    } catch (error) {
      console.error('Error guardando cuenta:', error);
      alert('Error al guardar la cuenta');
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-white text-2xl font-bold mb-6">
          {cuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Servicio */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Servicio *
            </label>
            <select
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              required
            >
              {servicios.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Email / Login */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Correo / Login *
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="multiservicios.userX@gmail.com"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              required
            />
            <p className="text-white/40 text-xs mt-1">Identificador único para diferenciar cuentas del mismo servicio</p>
          </div>

          {/* Tarjeta vinculada (solo no-Netflix) */}
          {servicio !== 'Netflix' && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Tarjeta / cuenta vinculada
              </label>
              <input
                type="text"
                value={tarjetaVinculada}
                onChange={(e) => setTarjetaVinculada(e.target.value)}
                placeholder="Ej: Daviplata Jose 9466"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-white/40 text-xs mt-1">Con qué tarjeta/cuenta se cobra automáticamente esta suscripción</p>
            </div>
          )}

          {/* Tipo de Cuenta */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Tipo de Cuenta *
            </label>
            <select
              value={tipoCuenta}
              onChange={(e) => setTipoCuenta(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              required
            >
              {tiposCuentaPorServicio[servicio].map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Costo Mensual */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Costo Mensual *
            </label>
            <input
              type="number"
              value={costoMensual}
              onChange={(e) => setCostoMensual(e.target.value)}
              placeholder="20000"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              required
              min="0"
              step="100"
            />
          </div>

          {/* Día de Pago */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Día de Pago (1-31)
            </label>
            <input
              type="number"
              value={diaPago}
              onChange={(e) => setDiaPago(e.target.value)}
              placeholder="15"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              min="1"
              max="31"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Información adicional..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Activa / Inactiva */}
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
            <div>
              <div className="text-white/80 text-sm font-medium">Cuenta activa</div>
              <p className="text-white/40 text-xs mt-0.5">
                Desactívala cuando se quede sin clientes: deja de aparecer como pendiente de pago, pero se conserva para reusarla después.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiva(!activa)}
              className={`shrink-0 ml-3 w-14 h-8 rounded-full transition-all relative ${
                activa ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                  activa ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
