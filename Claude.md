Instrucciones para el agente de IA en este proyecto. Léelas completas antes de escribir código. Si una instrucción del usuario contradice este archivo, gana el usuario, pero avísale del conflicto.

## 1. Contexto del proyecto

- Aplicación web frontend construida sin escribir código a mano. El usuario dirige, tú construyes.
- Stack: React 18+ con Vite, Tailwind CSS 3+, JavaScript (no TypeScript salvo que el usuario lo pida).
- Entorno: desarrollo local en `localhost`. No configures despliegue, dominios ni backend salvo instrucción explícita.
- El usuario puede no ser programador. Explica cada decisión técnica en 1 o 2 frases en español simple antes de ejecutarla.

## 2. Idioma y comunicación

- Responde siempre en español.
- Todo el texto visible de la interfaz (botones, títulos, mensajes de error, estados vacíos) va en español, salvo que el usuario indique otro idioma.
- Los nombres de archivos, componentes, variables y funciones van en inglés, siguiendo la convención estándar de React.
- Nunca uses jerga sin explicarla la primera vez. Ejemplo: “Voy a crear un componente (una pieza reutilizable de la interfaz) llamado Navbar”.

## 3. Configuración inicial

Cuando el proyecto parte de cero:

```bash
npm create vite@latest nombre-proyecto -- --template react
cd nombre-proyecto
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

- Configura `tailwind.config.js` con `content: ["./index.html", "./src/**/*.{js,jsx}"]`.
- Agrega las 3 directivas de Tailwind a `src/index.css`.
- Verifica que `npm run dev` levante en `http://localhost:5173` antes de construir nada más.
- Después de cada cambio significativo, confirma que el servidor sigue corriendo sin errores en consola.

## 4. Estructura de archivos

```
src/
  components/     Componentes reutilizables (Button.jsx, Card.jsx, Navbar.jsx)
  pages/          Vistas completas (Home.jsx, About.jsx)
  assets/         Imágenes, íconos, fuentes locales
  hooks/          Hooks personalizados si se necesitan
  App.jsx         Composición principal
  index.css       Tailwind y estilos base
```

- Un componente por archivo. Nombre del archivo igual al nombre del componente.
- Componentes de menos de 150 líneas. Si crece más, divídelo.
- No instales librerías de componentes (shadcn, MUI, Chakra, DaisyUI) salvo que el usuario lo pida. El diseño se construye con Tailwind puro. Esa es la razón principal por la que el resultado no se ve genérico.

## 5. Sistema de diseño: reglas duras

Esta sección es la más importante del archivo. El objetivo es que la interfaz parezca diseñada por un estudio, no generada por una plantilla.

### 5.1 Antes de escribir código

Antes de construir cualquier pantalla, define y muestra al usuario un mini sistema de diseño:

1. Paleta: 4 a 6 colores con hex, cada uno con nombre y función (fondo, texto, acento, borde, superficie).
2. Tipografía: 2 fuentes con roles claros. Una display con carácter para títulos, una de lectura para el cuerpo. Cárgalas desde Google Fonts en `index.html`.
3. Concepto de layout: 1 frase que describa la estructura de la página.
4. Elemento firma: el único detalle memorable de esta interfaz (un tratamiento tipográfico, una interacción, una forma de mostrar los datos). Uno solo.

Espera la aprobación del usuario antes de construir. Si el usuario dice “hazlo tú”, decide y explica por qué.

### 5.2 Prohibiciones (esto es lo que delata a la IA)

- Prohibido el gradiente violeta a azul, el violeta a rosado y cualquier gradiente como protagonista del hero.
- Prohibida la combinación fondo crema + serif de alto contraste + acento terracota. Es el cliché número 1 de diseño generado por IA en 2025 y 2026.
- Prohibido el fondo casi negro con un solo acento verde ácido o naranja neón, salvo que el rubro lo justifique y el usuario lo apruebe.
- Prohibido usar Inter, Roboto o la fuente por defecto del sistema para los títulos. Para el cuerpo, Inter se permite solo si la display tiene carácter propio.
- Prohibid