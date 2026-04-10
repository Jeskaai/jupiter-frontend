# Cambios explicados del proyecto Júpiter

Este documento resume, de forma didáctica, todos los cambios que se hicieron en el proyecto y el motivo técnico de cada uno. La idea no es solo listar archivos, sino explicar el flujo completo para que puedas entender cómo se conectan entre sí las piezas de React, rutas, autenticación y Tailwind.

## 1. Objetivo general del trabajo

El proyecto arrancó como una plantilla básica de Vite + React y luego se transformó en una base real de aplicación con:

- enrutamiento con protección de rutas,
- autenticación centralizada,
- páginas separadas para login y dashboard,
- soporte para persistir sesión en `localStorage`,
- y corrección de la configuración de Tailwind/PostCSS para que la build funcionara correctamente.

En otras palabras, el cambio principal fue pasar de una demo de Vite a una estructura inicial de aplicación real.

---

## 2. Estado inicial del proyecto

Antes de los cambios, el archivo principal de la app mostraba el contenido por defecto de Vite:

- logo de React,
- contador de ejemplo,
- mensajes de “edit me”,
- y sin rutas reales.

Eso era útil para confirmar que el entorno funcionaba, pero no servía para construir un flujo de negocio.

Además, Tailwind estaba configurado con la sintaxis anterior, lo cual provocaba un error de build con la versión instalada del paquete.

---

## 3. Cambio de arquitectura en `App.tsx`

### Qué se hizo

El archivo [src/App.tsx](src/App.tsx) dejó de ser una pantalla de ejemplo y pasó a ser el punto de composición de la aplicación.

Ahora hace tres cosas importantes:

- envuelve la app con `AuthProvider`,
- define las rutas públicas y protegidas,
- y define qué hacer con rutas desconocidas.

### Por qué es importante

En React, `App.tsx` suele funcionar como el “árbol de entrada” de la interfaz. Cuando la app empieza a crecer, conviene que ese archivo coordine la composición general en lugar de contener toda la lógica dentro de una sola pantalla.

### Estructura nueva

La jerarquía quedó así:

- `AuthProvider`
- `BrowserRouter`
- `Routes`
- ruta pública `/login`
- rutas protegidas bajo `ProtectedRoute`
- fallback `*` que redirige a `/login`

### Qué problema resuelve

Con esta estructura:

- el login queda accesible sin autenticación,
- el dashboard queda bloqueado si no hay sesión,
- y cualquier URL inválida no rompe la navegación.

### Idea clave para aprender

`Routes` define el mapa de la navegación, pero `ProtectedRoute` actúa como un guardián. Eso permite separar navegación de control de acceso.

---

## 4. Protección de rutas con `ProtectedRoute`

Se creó [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx).

### Qué hace

Este componente revisa tres estados:

1. si todavía se está cargando la sesión,
2. si el usuario está autenticado,
3. y si puede ver las rutas hijas.

### Flujo interno

- Si `isLoading` es `true`, se muestra una pantalla simple de carga.
- Si `isAuthenticated` es `false`, se redirige a `/login`.
- Si el usuario sí está autenticado, se renderiza `<Outlet />`.

### Qué es `<Outlet />`

`Outlet` es el lugar donde React Router renderiza la ruta hija dentro de una ruta anidada.

En este proyecto eso significa que `ProtectedRoute` no renderiza el dashboard directamente, sino que deja pasar lo que esté dentro del bloque protegido.

### Por qué se hizo así

Es la forma correcta de proteger varias rutas a la vez sin repetir lógica en cada una.

Por ejemplo, si mañana agregas:

- `/dashboard/evaluacion`,
- `/dashboard/perfil`,
- `/dashboard/configuracion`,

no necesitas repetir el chequeo de autenticación en cada pantalla.

### Idea clave para aprender

La combinación `ProtectedRoute + Outlet` es un patrón muy común en aplicaciones con autenticación. El guardián decide si deja pasar o no, y `Outlet` decide dónde se monta el contenido permitido.

---

## 5. Centralización de autenticación con `AuthContext`

Se creó [src/context/AuthContext.tsx](src/context/AuthContext.tsx).

### Qué problema resuelve

Antes no existía un estado global de sesión. Eso significa que cada componente tendría que inventar su propia forma de saber si el usuario está logueado.

Con un contexto, la autenticación se vuelve compartida y predecible.

### Qué contiene el contexto

El contexto define:

- el tipo `User`,
- el tipo `AuthContextType`,
- el provider `AuthProvider`,
- y los datos compartidos para toda la app.

### El tipo `User`

Un usuario contiene:

- `id`
- `nombre`
- `rol`
- `token`

Eso modela la información que la app necesita para funcionar una vez iniciada la sesión.

### El estado que administra

El contexto guarda:

- `user`: el usuario actual o `null`,
- `isAuthenticated`: derivado de si existe usuario,
- `isLoading`: estado temporal mientras se recupera la sesión,
- `login()`: guarda la sesión,
- `logout()`: la limpia.

### Persistencia en `localStorage`

Se usan dos claves:

- `jupiter_token`
- `jupiter_user`

Eso permite que, al recargar la página, la sesión siga disponible sin volver a loguearse.

### Flujo de recuperación de sesión

Cuando el provider monta:

1. intenta leer usuario y token desde `localStorage`,
2. si encuentra ambos, reconstruye la sesión,
3. si falla el parseo o los datos están corruptos, limpia el almacenamiento,
4. al final cambia `isLoading` a `false`.

### Por qué existe `isLoading`

Sin ese estado, la app podría mostrar `/login` un instante antes de restaurar la sesión real. Eso produce un “flash” visual molesto y confuso.

`isLoading` evita ese problema.

### Idea clave para aprender

Un contexto no solo comparte datos; también centraliza reglas de negocio. En este caso, la regla es: “si hay token y usuario válidos, la sesión existe”.

---

## 6. Separación del hook `useAuth`

Se creó [src/context/useAuth.ts](src/context/useAuth.ts).

### Qué hizo esta separación

El hook de consumo se sacó del archivo del contexto para evitar un warning de Fast Refresh de ESLint.

Antes, `AuthContext.tsx` exportaba tanto el provider como el hook. React Refresh prefiere que un archivo exporte solo componentes cuando se trata de módulos usados en hot reload.

### Por qué esta separación es mejor

Separar el hook en otro archivo tiene varias ventajas:

- elimina el warning,
- deja el provider más limpio,
- mejora la organización,
- y hace más explícito el rol de cada archivo.

### Idea clave para aprender

Cuando un archivo empieza a mezclar responsabilidades, separarlo no es solo estética. También ayuda a herramientas como ESLint, Fast Refresh y al mantenimiento general.

---

## 7. Nueva pantalla de login

Se creó [src/pages/LoginPage.tsx](src/pages/LoginPage.tsx).

### Qué hace

Esta pantalla simula un inicio de sesión temporal.

Al hacer clic en el botón:

- se llama a `login()` del contexto,
- se guarda un usuario de prueba,
- y se navega a `/dashboard`.

### Por qué es un mock

La pantalla aclara que todavía no existe el formulario real conectado al backend.

Eso es importante porque separa dos fases del trabajo:

- validar el flujo de navegación y autenticación,
- integrar después el endpoint real.

### Idea clave para aprender

Usar un mock en etapas tempranas no es improvisación. Es una técnica útil para validar estructura antes de conectar servicios reales.

---

## 8. Nueva pantalla de dashboard

Se creó [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx).

### Qué hace

Muestra:

- un saludo al usuario,
- el rol de la sesión,
- y un botón de cerrar sesión.

### Flujo de cierre de sesión

Cuando se pulsa “Cerrar sesión”:

1. se ejecuta `logout()`,
2. se borra el usuario y el token de `localStorage`,
3. y se navega a `/login`.

### Qué valida esta pantalla

Sirve para comprobar que todo el sistema completo funciona:

- el contexto guarda sesión,
- la ruta protegida permite entrar,
- y el logout realmente expulsa al usuario.

### Idea clave para aprender

Una pantalla de dashboard no es solo visual. En este caso también sirve como prueba funcional del flujo de autenticación.

---

## 9. Corrección de Tailwind y PostCSS

Se corrigieron [postcss.config.js](postcss.config.js) y [src/index.css](src/index.css).

### Qué fallaba

La build estaba fallando porque el proyecto tenía Tailwind v4 instalado, pero la configuración seguía usando la integración antigua de PostCSS.

El error decía, en esencia, que Tailwind ya no debía usarse directamente como plugin de PostCSS.

### Qué se cambió

En `postcss.config.js`:

- se reemplazó `tailwindcss` por `@tailwindcss/postcss`.

En `index.css`:

- se cambió la sintaxis antigua:
  - `@tailwind base;`
  - `@tailwind components;`
  - `@tailwind utilities;`
- por la importación nueva:
  - `@import "tailwindcss";`

### Por qué era necesario

Tailwind v4 reorganizó parte de su integración con PostCSS. Si el proyecto usa la sintaxis vieja, la build se rompe.

### Idea clave para aprender

Cuando una dependencia mayor cambia de versión, no basta con instalarla. También hay que revisar cómo cambió su forma de integrarse con el resto del stack.

---

## 10. Dependencias agregadas o actualizadas

En [package.json](package.json) se reflejaron nuevas dependencias.

### Dependencias de runtime

- `react-router-dom`

Se agregó para manejar navegación entre login, dashboard y futuras rutas.

### Dependencias de desarrollo

- `@tailwindcss/postcss`

Se agregó para que PostCSS procese Tailwind v4 correctamente.

### Sobre `@types/react-router-dom`

Esa dependencia quedó instalada como parte del entorno, aunque en proyectos con `react-router-dom` moderno puede requerirse revisar si realmente hace falta según la versión usada y el tipado que provee el paquete principal.

### Idea clave para aprender

`package.json` no es solo una lista de librerías. Es el contrato técnico de cómo se construye, ejecuta y verifica la app.

---

## 11. Resultado de la verificación

Se validó el proyecto con los comandos:

- `npm run build`
- `npm run lint`
- `npm run dev`

### Resultado final

- la build compila correctamente,
- ESLint no reporta errores,
- y el servidor de desarrollo arranca bien.

### Qué aprendemos de esto

Una buena refactorización no termina cuando el código “parece correcto”. Termina cuando:

- compila,
- lint pasa,
- y el flujo esperado se puede ejecutar.

---

## 12. Resumen conceptual de la nueva arquitectura

La app ahora está organizada así:

- `App.tsx`: ensambla providers y rutas.
- `AuthContext.tsx`: guarda y administra sesión.
- `useAuth.ts`: expone el acceso limpio al contexto.
- `ProtectedRoute.tsx`: bloquea acceso según autenticación.
- `LoginPage.tsx`: simula autenticación.
- `DashboardPage.tsx`: muestra sesión activa y permite logout.
- `postcss.config.js` + `index.css`: dejan Tailwind funcionando con la versión actual.

### Cómo fluye el usuario

1. entra a la aplicación,
2. si no hay sesión, va a `/login`,
3. al hacer login mock, se guarda la sesión,
4. se redirige a `/dashboard`,
5. al cerrar sesión, vuelve a `/login`.

Ese es el ciclo completo que ahora soporta el proyecto.

---

## 13. Qué aprender de este cambio

Si quieres quedarte con la idea grande, es esta:

- React Router resuelve navegación,
- Context resuelve estado compartido,
- localStorage resuelve persistencia simple de sesión,
- Tailwind/PostCSS resuelve estilos,
- y la build/lint validan que todo sigue sano.

La mejora real no fue solo visual. Fue estructural.

---

## 14. Siguiente paso recomendado

Ahora que la base funciona, el siguiente paso natural sería reemplazar el login mock por una llamada real al backend y mover el dashboard hacia componentes más específicos.

Ese sería el siguiente nivel de evolución del proyecto.
