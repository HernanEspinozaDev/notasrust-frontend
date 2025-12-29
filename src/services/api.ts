import axios from 'axios';

// Configuración del dominio personalizado
const API_URL = 'https://api-notasrust.testingpage.store';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Nota {
  id?: string;
  titulo: string;
  contenido: string;
}

export default {
  obtenerNotas() {
    return api.get<Nota[]>('/');
  },
  crearNota(nota: Nota) {
    return api.post('/', nota);
  },
  borrarNota(id: string) {
    return api.delete(`/?id=${id}`);
  },
  editarNota(nota: Nota) {
    return api.put('/', nota);
  }
};
