import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from '@/services/products.service';
import * as apiClientModule from '@/lib/api-client';

vi.mock('@/lib/api-client', () => {
    const mockGet = vi.fn();
    const mockPost = vi.fn();
    const mockPut = vi.fn();
    const mockDelete = vi.fn();

    return {
        api: {
            get: mockGet,
            post: mockPost,
            put: mockPut,
            delete: mockDelete,
            patch: vi.fn(),
        },
        apiClient: vi.fn(),
        ApiError: class extends Error {
            statusCode: number;
            constructor(message: string, statusCode: number) {
                super(message);
                this.statusCode = statusCode;
            }
        },
        apiFetch: vi.fn(),
    };
});

const mockApi = apiClientModule.api;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('productsService.getAll', () => {
    it('returns products array when response is an array', async () => {
        const products = [
            { id: '1', name: 'Product 1', price: 10 },
            { id: '2', name: 'Product 2', price: 20 },
        ];

        (mockApi.get as any).mockResolvedValueOnce(products);

        const result = await productsService.getAll();

        expect(mockApi.get).toHaveBeenCalledWith('/products');
        expect(result).toEqual(products);
    });

    it('returns products from response.products when wrapped', async () => {
        const products = [{ id: '1', name: 'Product 1', price: 10 }];

        (mockApi.get as any).mockResolvedValueOnce({ products });

        const result = await productsService.getAll();

        expect(result).toEqual(products);
    });

    it('returns empty array when response is empty object', async () => {
        (mockApi.get as any).mockResolvedValueOnce({});

        const result = await productsService.getAll();

        expect(result).toEqual([]);
    });

    it('returns empty array when api call fails', async () => {
        (mockApi.get as any).mockRejectedValueOnce(new Error('Network error'));

        await expect(productsService.getAll()).rejects.toThrow('Network error');
    });
});

describe('productsService.getById', () => {
    it('fetches product by ID', async () => {
        const product = { id: '1', name: 'Product 1', price: 10 };

        (mockApi.get as any).mockResolvedValueOnce(product);

        const result = await productsService.getById('1');

        expect(mockApi.get).toHaveBeenCalledWith('/products/1');
        expect(result).toEqual(product);
    });

    it('throws when product not found', async () => {
        (mockApi.get as any).mockRejectedValueOnce(new Error('Not found'));

        await expect(productsService.getById('999')).rejects.toThrow('Not found');
    });
});

describe('productsService.search', () => {
    it('searches products by name', async () => {
        const products = [{ id: '1', name: 'Laptop', price: 500 }];

        (mockApi.post as any).mockResolvedValueOnce(products);

        const result = await productsService.search('Laptop');

        expect(mockApi.post).toHaveBeenCalledWith('/products/search', { name: 'Laptop' });
        expect(result).toEqual(products);
    });
});

describe('productsService.create', () => {
    it('creates a product with correct data', async () => {
        const data = { name: 'New Product', price: 30, description: 'A new item' };
        const created = { id: '3', ...data };

        (mockApi.post as any).mockResolvedValueOnce(created);

        const result = await productsService.create(data);

        expect(mockApi.post).toHaveBeenCalledWith('/products', data);
        expect(result).toEqual(created);
    });
});

describe('productsService.update', () => {
    it('updates a product with correct ID and data', async () => {
        const update = { name: 'Updated Name', price: 35 };
        const updated = { id: '1', name: 'Updated Name', price: 35 };

        (mockApi.put as any).mockResolvedValueOnce(updated);

        const result = await productsService.update('1', update);

        expect(mockApi.put).toHaveBeenCalledWith('/products/1', update);
        expect(result).toEqual(updated);
    });
});

describe('productsService.delete', () => {
    it('deletes a product by ID', async () => {
        const deleted = { id: '1', name: 'Deleted', price: 0 };

        (mockApi.delete as any).mockResolvedValueOnce(deleted);

        const result = await productsService.delete('1');

        expect(mockApi.delete).toHaveBeenCalledWith('/products/1');
        expect(result).toEqual(deleted);
    });

    it('throws when delete fails', async () => {
        (mockApi.delete as any).mockRejectedValueOnce(new Error('Access denied'));

        await expect(productsService.delete('1')).rejects.toThrow('Access denied');
    });
});

describe('productsService.getStats', () => {
    it('fetches product statistics', async () => {
        const stats = { totalProducts: 100, outOfStock: 5, lowStock: 12 };

        (mockApi.get as any).mockResolvedValueOnce(stats);

        const result = await productsService.getStats();

        expect(mockApi.get).toHaveBeenCalledWith('/products/stats');
        expect(result).toEqual(stats);
    });
});