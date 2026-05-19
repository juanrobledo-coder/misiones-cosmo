# TareasAdmin 📋

Panel de administración de tareas escolares con vencimiento automático.

## Características

- ✅ Crear, editar y eliminar tareas
- 📅 Fecha de creación automática y fecha de entrega configurable
- ⏳ **Expiración automática** 5 días después de la fecha de entrega
- 🎨 Estados visuales: Pendiente / Próxima / Hoy / Vencida / Expirada
- 🔍 Filtrado por estado y búsqueda por texto
- 💾 Persistencia en `localStorage` (no requiere backend)
- 📱 Diseño responsivo

## Estados de una tarea

| Estado     | Significado                                         |
|------------|-----------------------------------------------------|
| Pendiente  | Más de 2 días para la entrega                        |
| Próxima    | 1–2 días para la entrega                             |
| Hoy        | Vence hoy                                            |
| Vencida    | Pasó la fecha de entrega (aún no expiró)             |
| Expirada   | Han pasado 5 días desde la fecha de entrega → se elimina automáticamente con "Limpiar" |

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

Luego abre [http://localhost:5173](http://localhost:5173).

## Tecnologías

- **React 18** + **Vite 5**
- CSS Modules (sin librerías externas de UI)
- `localStorage` para persistencia
- Fuentes: Syne + DM Mono (Google Fonts)
