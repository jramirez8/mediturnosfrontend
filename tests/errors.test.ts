import { describe, expect, it } from '@jest/globals';
import { debugErrorPayload, isConnectivityMessage, readableError } from '../src/utils/errors';

describe('readableError', () => {
  it('prioriza el mensaje del backend', () => {
    const error = { response: { status: 400, data: { message: 'El DNI ya existe' } } };
    expect(readableError(error)).toBe('El DNI ya existe');
  });

  it('lee aliases frecuentes del backend', () => {
    expect(readableError({ response: { data: { mensaje: 'Cuenta no verificada' } } })).toBe('Cuenta no verificada');
    expect(readableError({ response: { data: { detail: 'Token vencido' } } })).toBe('Token vencido');
  });

  it('convierte details por campo en mensaje humano', () => {
    const error = { response: { data: { details: { email: 'inválido', password: 'muy corta' } } } };
    expect(readableError(error)).toBe('email: inválido · password: muy corta');
  });

  it('soporta arrays y objetos sin mostrar object Object', () => {
    expect(readableError({ response: { data: ['Uno', 'Dos'] } })).toBe('Uno · Dos');
    const message = readableError({ response: { data: { codigo: 123, activo: false } } });
    expect(message).toContain('codigo');
    expect(message).not.toContain('[object Object]');
  });

  it('usa error.message y luego fallback', () => {
    expect(readableError({ message: 'Network Error' })).toBe('No hay conexión a internet. Revisá tu conexión e intentá nuevamente.');
    expect(readableError(null, 'No pudimos continuar')).toBe('No pudimos continuar');
  });

  it('muestra timeout humano y oculta 400 genéricos', () => {
    expect(readableError({ code: 'ECONNABORTED' })).toBe('El servicio está tardando en responder. Revisá tu conexión e intentá nuevamente.');
    expect(readableError({ response: { status: 400, data: { message: 'Bad Request' } } }, 'Revisá los datos ingresados.'))
      .toBe('Revisá los datos ingresados.');
    expect(readableError({ response: { status: 400, data: { message: 'El DNI ya existe' } } }, 'Revisá los datos ingresados.'))
      .toBe('El DNI ya existe');
  });

  it('convierte valores primitivos y preferred objects', () => {
    expect(readableError({ response: { data: 404 } })).toBe('404');
    expect(readableError({ response: { data: false } })).toBe('false');
    expect(readableError({ response: { data: { message: { detail: 'Anidado' } } } })).toBe('Anidado');
  });

  it('no agrega códigos HTTP a los mensajes visibles', () => {
    expect(readableError({ response: { status: 401, data: { message: 'HTTP 401: no autorizado' } } }))
      .toBe('no autorizado');
  });

  it('oculta detalles técnicos de errores internos', () => {
    expect(readableError({ response: { status: 500, data: { message: 'NullPointerException' } } }))
      .toBe('El servicio no está disponible en este momento. Intentá nuevamente más tarde.');
  });
});

describe('isConnectivityMessage', () => {
  it('detecta mensajes de conectividad y disponibilidad', () => {
    expect(isConnectivityMessage('No hay conexión a internet.')).toBe(true);
    expect(isConnectivityMessage('El servicio no está disponible en este momento.')).toBe(true);
    expect(isConnectivityMessage('El DNI ya existe')).toBe(false);
    expect(isConnectivityMessage(null)).toBe(false);
  });
});

describe('debugErrorPayload', () => {
  it('expone solo datos útiles para diagnóstico', () => {
    const result = debugErrorPayload({
      response: { status: 500, data: { message: 'Error interno' } },
      config: { url: '/api/auth/login', method: 'post' },
      message: 'Request failed',
    });

    expect(result).toEqual({
      status: 500,
      method: 'POST',
      url: '/api/auth/login',
      data: { message: 'Error interno' },
      message: 'Request failed',
    });
  });
});
