<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { TransitionGroup } from 'vue';
import api, { type Nota } from './services/api';

// NOTA TÉCNICA: El error de conexión anterior fue causado por un conflicto de CORS.
// Tanto el código Rust como la configuración de AWS Lambda estaban enviando headers
// 'Access-Control-Allow-Origin', lo que causaba que el navegador bloqueara las solicitudes.
// La solución fue desactivar la configuración de CORS en AWS y dejar que solo el código
// Rust maneje los headers CORS.

const notas = ref<Nota[]>([]);
const cargando = ref(false);
const nuevaNota = ref<Nota>({ titulo: '', contenido: '' });
const editandoId = ref<string | null>(null);
const busqueda = ref('');

// Array de colores para las carpetas (ciclado)
const coloresCarpetas = [
  'from-amber-600 to-amber-700 tab-amber-500',
  'from-indigo-600 to-indigo-700 tab-indigo-500',
  'from-slate-600 to-slate-700 tab-slate-500',
  'from-cyan-600 to-cyan-700 tab-cyan-500',
  'from-emerald-600 to-emerald-700 tab-emerald-500',
];

function getColorClass(index: number) {
  return coloresCarpetas[index % coloresCarpetas.length] || '';
}

// Filtrar notas en tiempo real
const notasFiltradas = computed(() => {
  if (!busqueda.value.trim()) return notas.value;
  
  const query = busqueda.value.toLowerCase();
  return notas.value.filter(nota => 
    nota.titulo.toLowerCase().includes(query) ||
    nota.contenido.toLowerCase().includes(query)
  );
});

// Cargar notas al iniciar
onMounted(async () => {
  await cargarNotas();
});

const gifKey = ref(0);

// Forzar reinicio del GIF
setInterval(() => {
  gifKey.value++;
}, 5000);

async function cargarNotas() {
  cargando.value = true;
  try {
    const res = await api.obtenerNotas();
    notas.value = res.data;
  } catch (error) {
    console.error('Error cargando notas:', error);
  } finally {
    cargando.value = false;
  }
}

async function guardarNota() {
  if (!nuevaNota.value.titulo.trim() || !nuevaNota.value.contenido.trim()) {
    return;
  }

  try {
    if (editandoId.value) {
      await api.editarNota({ ...nuevaNota.value, id: editandoId.value });
    } else {
      await api.crearNota(nuevaNota.value);
    }
    
    nuevaNota.value = { titulo: '', contenido: '' };
    editandoId.value = null;
    await cargarNotas();
  } catch (error) {
    console.error('Error guardando nota:', error);
  }
}

async function borrar(id: string) {
  if (!confirm('¿Eliminar esta nota permanentemente?')) return;
  try {
    await api.borrarNota(id);
    await cargarNotas();
  } catch (error) {
    console.error('Error borrando nota:', error);
  }
}

function iniciarEdicion(nota: Nota) {
  nuevaNota.value = { titulo: nota.titulo, contenido: nota.contenido };
  editandoId.value = nota.id || null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicion() {
  nuevaNota.value = { titulo: '', contenido: '' };
  editandoId.value = null;
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
    <!-- Header con Banner Ferris -->
    <header class="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Banner Ferris GIF -->
        <div class="flex justify-center mb-6">
          <img 
            :key="gifKey"
            :src="`https://rust-lang.org/static/images/ferris.gif?t=${gifKey}`" 
            alt="Ferris the Crab" 
            class="h-24 sm:h-32 drop-shadow-lg animate-float"
          />
        </div>

        <!-- Título -->
        <h1 class="text-center text-3xl sm:text-4xl lg:text-5xl font-black mb-2">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-orange-500">
            Rust Serverless Notas
          </span>
        </h1>
        
        <!-- Descripción -->
        <p class="text-center text-slate-400 text-xs sm:text-sm mb-6">
          ⚡ Vue 3 + Tailwind CSS + AWS Lambda + Rust
        </p>

        <!-- Buscador -->
        <div class="max-w-2xl mx-auto">
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg blur-md group-focus-within:blur-lg transition-all"></div>
            <input 
              v-model="busqueda"
              type="text"
              placeholder="🔍 Busca por título o contenido..."
              class="relative w-full px-6 py-3 bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
            <span v-if="busqueda" class="absolute right-4 top-3.5 text-slate-400 cursor-pointer hover:text-slate-200 transition-colors" @click="busqueda = ''">
              ✕
            </span>
          </div>
          <p v-if="busqueda" class="text-slate-400 text-xs mt-2 text-center">
            📌 {{ notasFiltradas.length }} nota{{ notasFiltradas.length !== 1 ? 's' : '' }} encontrada{{ notasFiltradas.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Sección de Formulario -->
      <div class="mb-16">
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-8 hover:border-orange-500/30 transition-all duration-300">
          <div class="flex items-center gap-3 mb-6">
            <span class="text-3xl">{{ editandoId ? '✏️' : '📝' }}</span>
            <h2 class="text-2xl font-bold">
              {{ editandoId ? 'Editar tu Nota' : 'Crea una Nueva Nota' }}
            </h2>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-2">Título</label>
              <input 
                v-model="nuevaNota.titulo"
                placeholder="Dale un título memorable..." 
                class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-2">Contenido</label>
              <textarea 
                v-model="nuevaNota.contenido"
                placeholder="Escribe aquí tus ideas, pensamientos o notas importantes..." 
                rows="6"
                class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200 resize-none"
              ></textarea>
            </div>
            
            <div class="flex gap-3 pt-4">
              <button 
                @click="guardarNota"
                class="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-orange-500/50 active:scale-95 flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                <span>{{ editandoId ? '💾' : '➕' }}</span>
                {{ editandoId ? 'Actualizar Nota' : 'Crear Nota' }}
              </button>
              
              <button 
                v-if="editandoId" 
                @click="cancelarEdicion"
                class="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all duration-200 shadow-md active:scale-95"
              >
                ✕ Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Indicador de Cargando -->
      <div v-if="cargando" class="flex flex-col items-center justify-center py-24">
        <div class="relative w-20 h-20 mb-6">
          <div class="absolute inset-0 rounded-full border-4 border-slate-700"></div>
          <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-500 animate-spin"></div>
        </div>
        <p class="text-slate-400 text-lg font-medium">Cargando tus notas desde Rust...</p>
      </div>

      <!-- Lista de Notas - Efecto Carpetas -->
      <div v-else>
        <TransitionGroup 
          name="carpeta"
          tag="div"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <div 
            v-for="(nota, index) in notasFiltradas" 
            :key="nota.id"
            class="group cursor-default"
          >
            <!-- Estructura de Carpeta -->
            <div class="relative mt-6 h-full">
              <!-- Pestaña de la Carpeta -->
              <div :class="[
                'absolute -top-6 left-0 w-2/5 h-6 rounded-t-xl z-0 transition-all duration-300 group-hover:-top-8 group-hover:w-1/2',
                getColorClass(index).split(' ')[0],
              ]"></div>
              
              <!-- Cuerpo de la Carpeta -->
              <div :class="[
                'relative h-full p-6 rounded-lg rounded-tl-none shadow-lg z-10 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-3 group-hover:shadow-orange-500/20 border border-slate-700 group-hover:border-orange-500/50 flex flex-col',
                'bg-gradient-to-br ' + getColorClass(index).split(' ').slice(0, 2).join(' '),
              ]">
                <!-- Contenido de la Nota -->
                <div class="flex-grow">
                  <h3 class="font-bold text-lg sm:text-xl text-white mb-3 line-clamp-2 group-hover:text-orange-100 transition-colors">
                    {{ nota.titulo }}
                  </h3>
                  
                  <p class="text-slate-100/80 whitespace-pre-wrap break-words line-clamp-4 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                    {{ nota.contenido }}
                  </p>
                </div>
                
                <!-- Botones de Acción -->
                <div class="pt-4 mt-4 border-t border-white/10 flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="iniciarEdicion(nota)" 
                    class="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 hover:text-blue-100 font-medium text-xs rounded-lg transition-all duration-200 border border-blue-500/30 hover:border-blue-500/50 flex items-center gap-1"
                  >
                    ✏️ Editar
                  </button>
                  
                  <button 
                    @click="borrar(nota.id!)" 
                    class="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-red-100 font-medium text-xs rounded-lg transition-all duration-200 border border-red-500/30 hover:border-red-500/50 flex items-center gap-1"
                  >
                    🗑️ Borrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>

        <!-- Estado Vacío -->
        <div v-if="notasFiltradas.length === 0" class="text-center py-24">
          <div class="text-7xl mb-6 opacity-60">📭</div>
          <h3 class="text-2xl sm:text-3xl font-bold text-slate-300 mb-3">
            {{ busqueda ? 'No se encontraron notas' : 'No hay notas aún' }}
          </h3>
          <p class="text-slate-400 text-sm sm:text-base">
            {{ busqueda ? 'Intenta con otra búsqueda o crea una nota nueva' : '¡Crea tu primera nota y comienza a guardar tus ideas!' }}
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800 bg-slate-950/50 mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-500 text-xs sm:text-sm">
        <p>
          Hecho con ❤️ usando Rust, Vue 3 y Tailwind CSS | 
          <a href="https://github.com/HernanEspinozaDev" target="_blank" class="hover:text-orange-500 transition-colors">
            HernanEspinozaDev
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Animación para carpetas */
.carpeta-enter-active,
.carpeta-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.carpeta-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.carpeta-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

/* Animación flotante */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
