# Consolidación de variable de entorno para URL del backend

## Objetivo

Establecer una convención clara para la variable que apunta al servicio externo (`api-neutra-v2`) y eliminar la ambigüedad actual entre `NEXT_PUBLIC_API_URL` y `BACKEND_API_URL`.

## Problema actual

### Duplicación e inconsistencia

| Ubicación | Variable usada | Contexto |
|-----------|----------------|----------|
| `src/lib/backend-api.ts` | `NEXT_PUBLIC_API_URL` | Server-side |
| `src/app/api/auth/login/route.ts` | `NEXT_PUBLIC_API_URL` | Server-side |
| `src/app/(booking)/services/page.tsx` | `NEXT_PUBLIC_API_URL` | Server-side |
| `src/app/(store)/orders/[id]/page.tsx` | `NEXT_PUBLIC_API_URL` | Server-side |
| `src/app/_admin_legacy/page.tsx` | `NEXT_PUBLIC_API_URL` | Server-side |
| `src/app/_admin_legacy/roles/page.tsx` | `NEXT_PUBLIC_API_URL` | Server-side |
| `src/lib/proxy.ts` | `BACKEND_API_URL` | Server-side (solo lectura) |
| `next.config.ts` (rewrites) | `NEXT_PUBLIC_API_URL` | Configuración Next.js |
| `.env.example` | `NEXT_PUBLIC_API_URL` (activa), `BACKEND_API_URL` (comentada) | Plantilla |

### Issue clave

- **`NEXT_PUBLIC_API_URL`** se expone al bundle del navegador, lo cual **no es necesario** para llamadas server-side.
- **`BACKEND_API_URL`** existe pero **no está activa** en `.env.example` ni se usa de forma consistente.
- El código server-side repite la misma lógica de resolución en múltiples archivos.

## Solución propuesta

### Nueva convención

| Variable | Propósito | Uso |
|----------|-----------|-----|
| `BACKEND_API_URL` | URL del backend para server-side | **Principal** (BFF y SSR) |
| `NEXT_PUBLIC_API_URL` | URL del backend para cliente | **Deprecada** para BFF (solo si se migra a API directa) |

### Regla de resolución

```ts
// src/lib/backend-url.ts
export function getBackendUrl(): string {
  // Prioridad: BACKEND_API_URL > NEXT_PUBLIC_API_URL > fallback
  const rawBackendUrl =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4001/api';

  // Normalizar /api al final sin duplicar
  return rawBackendUrl.endsWith('/api')
    ? rawBackendUrl
    : `${rawBackendUrl}/api`;
}
```

## Migración paso a paso

### 1. Actualizar `.env.example`

```env
# URL del backend para server-side (BFF)
BACKEND_API_URL=http://localhost:4001/api

# URL pública del backend (solo si se migra a API directa)
# NEXT_PUBLIC_API_URL=http://localhost:4001/api
```

### 2. Crear utilidad centralizada

**Archivo:** `src/lib/backend-url.ts`

```ts
export function getBackendUrl(): string {
  const rawBackendUrl =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4001/api';

  return rawBackendUrl.endsWith('/api')
    ? rawBackendUrl
    : `${rawBackendUrl}/api`;
}
```

### 3. Refactorizar archivos que usan `NEXT_PUBLIC_API_URL`

| Archivo | Cambio |
|---------|--------|
| `src/lib/backend-api.ts` | Reemplazar `process.env.NEXT_PUBLIC_API_URL` con `getBackendUrl()` |
| `src/app/api/auth/login/route.ts` | Reemplazar `getBackendUrl()` local con import de `getBackendUrl()` |
| `src/app/(booking)/services/page.tsx` | Reemplazar `process.env.NEXT_PUBLIC_API_URL` con `getBackendUrl()` |
| `src/app/(store)/orders/[id]/page.tsx` | Reemplazar `process.env.NEXT_PUBLIC_API_URL` con `getBackendUrl()` |
| `src/app/_admin_legacy/page.tsx` | Reemplazar `process.env.NEXT_PUBLIC_API_URL` con `getBackendUrl()` |
| `src/app/_admin_legacy/roles/page.tsx` | Reemplazar `process.env.NEXT_PUBLIC_API_URL` con `getBackendUrl()` |
| `next.config.ts` | Usar `getBackendUrl()` en rewrites (requiere `require` dinámico o variable estática) |

### 4. Actualizar `src/lib/proxy.ts`

```ts
import { getBackendUrl } from './backend-url';

export const forwardProxy = (req: Request) => {
  const baseUrl = getBackendUrl();
  // ... resto de la lógica
};
```

### 5. Actualizar `docker-compose.yml`

```yaml
environment:
  - BACKEND_API_URL=http://api-neutra-v2-app-1:4001/api
  # - NEXT_PUBLIC_API_URL=http://api-neutra-v2-app-1:4001/api  # Solo si se migra a API directa
```

## Contrato de API hacia el frontend

**Mantener:** `apiClient` del navegador sigue apuntando a `/api`

```ts
// src/lib/api-client.ts
const baseUrl = '/api';
```

Esto garantiza que el contrato hacia la UI no cambie durante la migración.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Romper entornos que solo tienen `NEXT_PUBLIC_API_URL` | Mantener fallback en `getBackendUrl()` |
| Exponer `BACKEND_API_URL` al bundle del cliente | No se usa en código del cliente |
| URLs mal formadas (doble `/api`) | Normalización en `getBackendUrl()` |

## Verificación

1. Ejecutar las pruebas existentes:
   ```bash
   node tests/test-auth-login-route.js
   ```

2. Verificar que `BACKEND_API_URL` tiene prioridad:
   - Configurar ambas variables en entorno local.
   - Confirmar que la resolución usa `BACKEND_API_URL`.

3. Revisar que las rutas SSR siguen funcionando correctamente.

## Referencias

- [bff-refactor-plan.md](./bff-refactor-plan.md) - Plan original de refactor del BFF
- `src/lib/backend-api.ts` - Archivo actual con uso de `NEXT_PUBLIC_API_URL`
- `src/lib/proxy.ts` - Lógica de proxy existente