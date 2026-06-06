# Plan de refactor del BFF de Next.js y comparación con API directa

## Objetivo

Definir, con evidencia del código actual, si `neutra-frontend` debe mantener un BFF en Next.js o migrar el navegador a llamadas directas contra `api-neutra-v2`.

La recomendación inicial es **mantener un BFF robusto**, pero dejar explícita la alternativa de API directa y sus costos. Lo importante aquí no es “quitar una capa porque parece más simple”; lo importante es entender QUÉ responsabilidades cumple esa capa. En arquitectura, como en construcción, no se tira una viga porque estorba visualmente sin verificar qué carga está soportando.

## Evidencia del estado actual

### 1. El frontend ya está acoplado a rutas `/api/*`

`src/lib/api-client.ts` indica que, en el navegador, las requests se hacen contra el proxy relativo:

- cliente browser: `baseUrl = '/api'`;
- `credentials: 'include'` para cookies;
- headers de tenant (`x-tenant-slug`, `x-tenant-id`) derivados de cookies.

Esto significa que el contrato consumido por la UI no es hoy “backend directo”, sino **Next.js API Routes como fachada**.

### 2. La resolución de URL del backend está duplicada e inconsistente

Se observan varias piezas:

- `src/lib/backend-api.ts` resuelve backend desde `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'`.
- `src/app/api/auth/login/route.ts` repite una función local `getBackendUrl()`.
- `.env.example` ya contiene ambas variables relevantes:
  - `BACKEND_API_URL=http://localhost:4001/api` comentada;
  - `NEXT_PUBLIC_API_URL=http://localhost:4001/api` activa.

Conclusión: el archivo de ejemplo ya muestra la separación entre configuración pública y server-side, pero el código server-side todavía usa una variable pública (`NEXT_PUBLIC_API_URL`) para una responsabilidad interna. Eso debe corregirse con compatibilidad temporal, no con ruptura inmediata.

### 3. Hay una mezcla de handlers manuales y utilidades compartidas

Existen Route Handlers bajo `src/app/api/**`, incluyendo módulos de auth, catálogo, carrito, órdenes, admin, permisos, roles, tenants, usuarios, staff y appointments.

También existe `src/lib/api-route-handler.ts`, que ya intenta estandarizar:

- resolución de endpoints;
- query params para `GET`;
- parsing de body;
- logging con trace IDs;
- manejo de errores;
- respuesta tipo `NextResponse.json`.

Pero todavía hay rutas manuales como `src/app/api/auth/login/route.ts`, que implementan fetch directo, headers, parseo defensivo y forwarding de `Set-Cookie` por su cuenta.

### 4. Ya existe lógica específica de proxy que no debería vivir dispersa

`src/lib/proxy.ts` centraliza parcialmente:

- forwarding de `Cookie`;
- forwarding de tenant por header o cookie;
- prioridad de `x-tenant-slug` sobre `x-tenant-id`;
- filtrado del tenant default;
- forwarding de origen mediante `x-original-origin`.

Esa lógica es BFF real. Si el navegador llamara directo al backend, parte de esa responsabilidad se movería al browser o se tendría que resolver con CORS/cookies/SameSite de forma impecable.

### 5. Login tiene requisitos delicados

`src/app/api/auth/login/route.ts` ya contiene protección contra respuestas `204` o JSON inválido:

- `response.status === 204`;
- `response.json().catch(...)`;
- forwarding de `Set-Cookie`.

La prueba existente `tests/test-auth-login-route.js` protege específicamente que login no convierta una respuesta sin body en un 500 accidental.

Esto es una señal clara: el BFF no es solo “passthrough”; está normalizando casos borde que impactan autenticación.

## Opciones comparadas

## Opción A: Mantener y robustecer el BFF

### Qué implica

Mantener `apiClient` apuntando a `/api` y refactorizar las rutas de Next.js para que todas usen una utilidad única de proxy server-side.

### Ventajas

- Mantiene cookies HttpOnly fuera del JavaScript del navegador.
- Reduce problemas de CORS en el browser.
- Centraliza forwarding de tenant headers/cookies.
- Permite logging uniforme con trace ID.
- Permite normalizar errores y respuestas sin duplicar lógica por ruta.
- Oculta detalles del contrato real de `api-neutra-v2`.
- Permite adaptar el backend sin reescribir consumidores UI.

### Costos

- Hay una capa más que mantener.
- Si se implementa mal, duplica bugs y oculta errores del backend.
- Puede agregar latencia mínima por hop adicional.
- Requiere disciplina: una utilidad central, no 60 handlers copiando `fetch`.

### Recomendación técnica

Esta es la dirección recomendada. No por costumbre, sino porque el frontend ya depende de cookies, tenant context y rutas `/api/*`. La solución correcta no es eliminar la capa; es dejar de tenerla fragmentada.

## Opción B: Llamar directo a `api-neutra-v2` desde el navegador

### Qué implica

Cambiar `apiClient` para usar la URL pública del backend y depender de CORS con credenciales.

### Ventajas

- Menos código en Next.js.
- Menos hop de red.
- Menos Route Handlers que mantener.
- El contrato consumido por la UI sería el contrato real del backend.

### Costos y riesgos

- El backend queda más expuesto como contrato público del browser.
- CORS debe estar perfectamente configurado con `credentials: true`.
- Cookies requieren configuración correcta de `SameSite`, `Secure`, dominio y path.
- El browser debe enviar tenant context directamente.
- Se pierde un punto central para logging, adaptación de errores y forwarding de `Set-Cookie`.
- Cualquier cambio en `api-neutra-v2` impacta más directamente al frontend.

### Cuándo sería razonable

Sería razonable si el equipo decide que `api-neutra-v2` es una API pública/browser-first y acepta mantener CORS, cookies y versionado de contrato como parte formal del producto. Es viable técnicamente, pero no es la opción más segura para el estado actual del repo.

## Decisión preliminar

**Mantener BFF y refactorizarlo como capa única.**

La alternativa de API directa queda documentada como viable, pero no recomendada para la primera fase. La prioridad debe ser ordenar fundamentos: configuración, forwarding, errores, cookies y trazabilidad. CODEAR sin entender esta frontera sería construir paredes antes de revisar planos estructurales.

## Refactor objetivo

Crear una utilidad única para Route Handlers, por ejemplo:

```ts
proxyToBackend(req, {
  method,
  backendPath,
  includeQuery,
  bodyMode,
  successStatus,
})
```

### Responsabilidades de la utilidad

1. Resolver la URL base del backend.
2. Usar `BACKEND_API_URL` para server-side.
3. Aceptar `NEXT_PUBLIC_API_URL` solo como compatibilidad temporal.
4. Normalizar `/api` final sin duplicarlo.
5. Forwardear cookies.
6. Forwardear tenant headers/cookies con la prioridad actual:
   - `x-tenant-slug`;
   - `tenant-slug` cookie;
   - `x-tenant-id` si no es default;
   - `tenant-id` cookie si no es default y no hay slug.
7. Forwardear origen útil para backend:
   - `x-original-origin`;
   - `origin`, `referer`, `host` según corresponda.
8. Parsear body defensivamente.
9. Parsear respuesta defensivamente:
   - `204`;
   - body vacío;
   - JSON inválido;
   - errores 4xx/5xx del backend.
10. Propagar status code real del backend.
11. Forwardear `Set-Cookie` correctamente.
12. Registrar logs con trace ID.
13. Devolver `StandardResponse<T>` hacia el frontend.

## Configuración propuesta

### Variable principal

```env
BACKEND_API_URL=http://localhost:4001/api
```

### Compatibilidad temporal

`BACKEND_API_URL` debe ser la variable principal para server-side; `NEXT_PUBLIC_API_URL` puede mantenerse durante la migración, pero debe marcarse como deprecated para el BFF.

Regla recomendada:

```ts
const rawBackendUrl =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4001/api';
```

Tradeoff:

- usar `BACKEND_API_URL` evita exponer configuración interna al bundle del navegador;
- mantener fallback a `NEXT_PUBLIC_API_URL` reduce riesgo de romper ambientes existentes.

## Contrato que debe conservarse

El contrato hacia la UI debe seguir usando:

```ts
StandardResponse<T>
```

Login debe conservar:

```http
POST /api/auth/login
```

Y debe seguir garantizando:

- respuesta compatible con `StandardResponse<User>`;
- forwarding de cookie cuando el backend envía `Set-Cookie`;
- propagación correcta de 4xx;
- no convertir `204` o body vacío en 500.

## Plan de migración gradual

1. Crear pruebas para la utilidad de proxy antes de refactorizar rutas.
2. Crear `src/lib/backend-url.ts` o equivalente para resolver `BACKEND_API_URL`.
3. Crear `src/lib/backend-proxy.ts` o evolucionar `src/lib/api-route-handler.ts`.
4. Cubrir login como caso crítico.
5. Migrar rutas simples `GET` primero.
6. Migrar rutas con body (`POST`, `PUT`, `PATCH`) después.
7. Migrar rutas con parámetros dinámicos.
8. Eliminar duplicación de `getBackendUrl`.
9. Deprecar uso server-side de `NEXT_PUBLIC_API_URL`.
10. Revisar que `apiClient` del navegador siga apuntando a `/api`.

## Plan de pruebas

No ejecutar build, por regla del proyecto.

Pruebas Node livianas sugeridas:

1. Login no convierte `204` o respuesta sin JSON en `500`.
2. Errores `4xx` del backend se propagan como `4xx`, no como `500`.
3. `Set-Cookie` del backend se conserva.
4. Query params se reenvían cuando `includeQuery` está activo.
5. Tenant headers/cookies respetan prioridad.
6. Rutas migradas conservan shape `StandardResponse`.
7. `BACKEND_API_URL` tiene prioridad sobre `NEXT_PUBLIC_API_URL`.
8. URL base no duplica `/api`.

Comandos de verificación permitidos:

```bash
node tests/test-auth-login-route.js
npx eslint docs/bff-refactor-plan.md
```

Nota: `eslint` probablemente no aplique a Markdown en esta configuración. Para cambios solo de documentación, la verificación mínima útil es existencia/contenido del archivo y las pruebas Node existentes relacionadas con login.

## Riesgos

- Refactorizar todas las rutas de golpe aumentaría riesgo de regresión.
- Si se cambia `apiClient` para llamar directo al backend sin revisar cookies/CORS/SameSite, auth puede fallar de forma intermitente.
- Si el proxy central no preserva `Set-Cookie`, login puede parecer exitoso pero dejar al usuario sin sesión.
- Si no se propagan status codes, la UI perderá información útil para manejo de errores.

## Próximo paso recomendado

Implementar primero la utilidad central con pruebas. Después migrar una ruta crítica (`auth/login`) y una ruta simple de lectura. Si ambas pasan, continuar por lotes pequeños.

NO se debe hacer una migración masiva sin pruebas. Ese tipo de “avance rápido” es precisamente cómo se rompen sistemas que parecen simples por fuera pero tienen contratos invisibles por dentro.
