import { create } from "zustand";

type RegistrationData = {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  obraSocialId?: number | string;
  obraSocial?: string;
  tipoSangre?: string;
  fechaNacimiento?: string;
  numeroHistoriaClinica?: string;
  numeroAfiliado?: string;
  institucionCabecera?: string;
  medicoCabecera?: string;
  telefono?: string;
};

type RegistrationState = {
  data: RegistrationData;
  setStep1: (nombre: string, apellido: string, dni: string) => void;
  setStep2: (email: string, password: string, confirmPassword?: string) => void;
  setMedicalInfo: (info: Partial<RegistrationData>) => void;
  reset: () => void;
};

export const useRegistrationStore = create<RegistrationState>((set) => ({
  data: {
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
  },

  setStep1: (nombre, apellido, dni) =>
    set((state) => ({ data: { ...state.data, nombre, apellido, dni } })),

  setStep2: (email, password, confirmPassword) =>
    set((state) => ({ data: { ...state.data, email, password, confirmPassword: confirmPassword ?? password } })),

  setMedicalInfo: (info) =>
    set((state) => ({ data: { ...state.data, ...info } })),

  reset: () => set({ data: { nombre: "", apellido: "", dni: "", email: "" } }),
}));
