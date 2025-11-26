/**
 * Centralized export for all API services
 * 
 * Usage:
 * ```typescript
 * import { authService, productsService } from '@/services';
 * 
 * const user = await authService.login({ email, password });
 * const products = await productsService.getAll();
 * ```
 */

export { authService } from './auth.service';
export { usersService } from './users.service';
export { productsService } from './products.service';
export { cartService } from './cart.service';
export { ordersService } from './orders.service';
export { categoriesService } from './categories.service';
export { bannersService } from './banners.service';
export { slidersService } from './sliders.service';
export { couponsService } from './coupons.service';
export { rolesService } from './roles.service';
export { permissionsService } from './permissions.service';
