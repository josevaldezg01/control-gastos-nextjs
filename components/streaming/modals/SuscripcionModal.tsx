'use client';

import { useState, useEffect } from 'react';
import { useStreaming, Suscripcion } from '@/hooks/useStreaming';

interface SuscripcionModalProps {
  streaming: ReturnType<typeof useStreaming>;
  suscripcion?: Suscripcion | null;
  onClose: () => void;
  onGuardar: (suscripcion: any, id?: number) => Promise<void>;
}

export const SuscripcionModal = ({ streaming, suscripcion, onClose, onGuardar }: SuscripcionModalProps) => {
  const [cuentaId, setCuentaId] = useState<number>(suscripcion?.cuenta_id || 0);
  const [clienteId, setClienteId] = useState<number>(suscripcion?.cliente_id || 0);
  const [tipoAcceso, setTipoAcceso] = useState(suscripcion?.tipo_acceso || '');
  const [costoMensual, setCostoMensual] = useState(suscripcion?.costo_mensual?.toString() || '');
  const [proximoCobro, setProximoCobro] = useState(suscripcion?.proximo_cobro || '');
  const [notas, setNotas] = useState(suscripcion?.notas || '');
  const [guardando, setGuardando] = useState(false);
  const [espaciosDisponibles, setEspaciosDisponibles] = useState<string[]>([]);

  const cuentasActivas = streaming.cuentas.filter(c => c.activa);
  const clientesActivos = streaming.clientes.filter(c => c.activo);

  useEffect(() => {
    if (!cuentaId) return;

    const cuenta = cuentasActivas.find(c => c.id === cuentaId);
    if (!cuenta) return;

    const tipoCuenta = cuenta.tipo_cuenta.toLowerCase();

    let opciones: string[] = [];
    if (tipoCuenta.includes('1 pantalla')) {
      opciones = ['Pantalla 1'];
    } else if (tipoCuenta.includes('2 pantallas')) {
      opciones = ['Pantalla 1', 'Pantalla 2'];
    } else if (tipoCuenta.includes('4 pantallas')) {
      opciones = ['Pantalla 1', 'Pantalla 2', 'Pantalla 3', 'Pantalla 4'];
    } else if (tipoCuenta.includes('5 perfiles')) {
      opciones = ['Perfil 1', 'Perfil 2', 'Perfil 3', 'Perfil 4', 'Perfil 5'];
    } else if (tipoCuenta.includes('premium')) {
      opciones = ['Cuenta principal', 'Cuenta vinculada 1', 'Cuenta vinculada 2', 'Cuenta vinculada 3', 'Cuenta vinculada 4', 'Cuenta vinculada 5'];
    }

    // Filtrar espacios ya ocupados
    const suscripcionesActivas = streaming.suscripciones.filter(s =>
      s.cuenta_id === cuentaId &&
      s.activa &&
      s.id !== suscripcion?.id  // Excluir la suscripción actual si estamos editando
    );
    const espaciosOcupados = suscripcionesActivas.map(s => s.tipo_acceso);
    const espaciosLibres = opciones.filter(o => !espaciosOcupados.includes(o));

    setEspaciosDisponibles(espaciosLibres);
    if (espaciosLibres.length > 0 && !tipoAcceso) {
      setTipoAcceso(espaciosLibres[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuentaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cuentaId || !clienteId || !tipoAcceso || !costoMensual || !proximoCobro) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (parseFloat(costoMensual) <= 0) {
      alert('El costo debe ser mayor a 0');
      return;
    }

    setGuardando(true);
    try {
      const datosSuscripcion = {
        cuenta_id: cuentaId,
        cliente_id: clienteId,
        tipo_acceso: tipoAcceso,
        costo_mensual: parseFloat(costoMensual),
        proximo_cobro: proximoCobro,
        notas: notas || null
      };

      if (suscripcion) {
        await onGuardar(datosSuscripcion, suscripcion.id);
      } else {
        await onGuardar(datosSuscripcion);
      }
      onClose();
    } catch (error) {
      console.error('Error guardando suscripción:', error);
      alert('Error al guardar la suscripción');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-white text-2xl font-bold mb-6">
          {suscripcion ? 'Editar Suscripción' : 'Nueva Suscripción'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cuenta */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Cuenta *
            </label>
            <select
              value={cuentaId}
              onChange={(e) => {
                setCuentaId(parseInt(e.target.value));
                setTipoAcceso('');
              }}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={!!suscripcion}
            >
              <option value={0}>Selecciona una cuenta</option>
              {cuentasActivas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.servicio} - {cuenta.tipo_cuenta}
                </option>
              ))}
            </select>
            {suscripcion && (
              <p className="text-white/40 text-xs mt-1">
                La cuenta no se puede cambiar al editar
              </p>
            )}
          </div>

          {/* Tipo de Acceso */}
          {cuentaId > 0 && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Tipo de Acceso * ({espaciosDisponibles.length} disponibles)
              </label>
              {espaciosDisponibles.length === 0 ? (
                <div className="bg-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm">
                  No hay espacios disponibles en esta cuenta
                </div>
              ) : (
                <select
                  value={tipoAcceso}
                  onChange={(e) => setTipoAcceso(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={!!suscripcion}
                >
                  {espaciosDisponibles.map((espacio) => (
                    <option key={espacio} value={espacio}>{espacio}</option>
                  ))}
                </select>
              )}
              {suscripcion && (
                <p className="text-white/40 text-xs mt-1">
                  El tipo de acceso no se puede cambiar al editar
                </p>
              )}
            </div>
          )}

          {/* Cliente */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Cliente *
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(parseInt(e.target.value))}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value={0}>Selecciona un cliente</option>
              {clientesActivos.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
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
              placeholder="5000"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
              min="0"
              step="100"
            />
          </div>

          {/* Próximo Cobro */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Fecha del Próximo Cobro *
            </label>
            <input
              type="date"
              value={proximoCobro}
              onChange={(e) => setProximoCobro(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
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
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
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
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              disabled={guardando || (!suscripcion && espaciosDisponibles.length === 0)}
            >
              {guardando ? 'Guardando...' : (suscripcion ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
