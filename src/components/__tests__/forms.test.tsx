// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    mockLogin: vi.fn(),
    mockPush: vi.fn(),
    mockToastError: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockCreateFeature: vi.fn(),
    mockUpdateFeature: vi.fn(),
}));

// The auth pages render `Link` inside a Radix `Button asChild`, so the mock has
// to forward arbitrary props onto a real DOM element for the label queries to
// resolve.
vi.mock("@tanstack/react-router", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        Link: ({
            to,
            children,
            ...rest
        }: {
            to?: string;
            children?: ReactNode;
            [key: string]: unknown;
        }) =>
            createElement(
                "a",
                { href: typeof to === "string" ? to : "#", ...rest },
                children,
            ),
    };
});

vi.mock("@/lib/navigation", () => ({
    useRouter: () => ({ push: mocks.mockPush }),
    useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/store/auth-store", () => ({
    useAuthStore: (selector: (state: unknown) => unknown) =>
        selector({
            login: mocks.mockLogin,
            loading: false,
            user: null,
        }),
}));

vi.mock("sonner", () => ({
    toast: {
        error: mocks.mockToastError,
        success: mocks.mockToastSuccess,
    },
}));

vi.mock("@/services/features.service", () => ({
    featuresService: {
        create: mocks.mockCreateFeature,
        update: mocks.mockUpdateFeature,
    },
}));

import { LoginForm } from "@/app/(store)/login/login-client";
import { FeatureDialog } from "@/components/admin/features/FeatureDialog";

const feature = {
    id: "feature-loyalty",
    key: "LOYALTY",
    name: "Loyalty Program",
    description: "Enable customer loyalty rewards",
    category: "MODULE",
    price: 3,
};

describe("LoginForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockLogin.mockResolvedValue(undefined);
    });

    it("submits the typed credentials as the login payload", async () => {
        render(<LoginForm />);

        await userEvent.type(
            screen.getByLabelText("Correo Electrónico"),
            "juan@ejemplo.com",
        );
        await userEvent.type(
            screen.getByLabelText("Contraseña"),
            "supersecreto",
        );
        await userEvent.click(
            screen.getByRole("button", { name: /Iniciar sesión/ }),
        );

        await waitFor(() =>
            expect(mocks.mockLogin).toHaveBeenCalledWith(
                "juan@ejemplo.com",
                "supersecreto",
            ),
        );
        expect(mocks.mockPush).toHaveBeenCalledWith("/");
    });

    it("blocks an empty submit with the inline validation message", async () => {
        render(<LoginForm />);

        await userEvent.click(
            screen.getByRole("button", { name: /Iniciar sesión/ }),
        );

        expect(
            await screen.findByText("Por favor completa todos los campos"),
        ).toBeInTheDocument();
        expect(mocks.mockLogin).not.toHaveBeenCalled();
    });

    it("renders the Spanish message for an AUTH_* code and maps a field error onto its input", async () => {
        mocks.mockLogin.mockRejectedValueOnce({
            errors: [
                {
                    code: "AUTH_INVALID_CREDENTIALS",
                    field: "email",
                    message: "Invalid email or password",
                },
            ],
        });
        render(<LoginForm />);

        await userEvent.type(
            screen.getByLabelText("Correo Electrónico"),
            "juan@ejemplo.com",
        );
        await userEvent.type(screen.getByLabelText("Contraseña"), "incorrecta");
        await userEvent.click(
            screen.getByRole("button", { name: /Iniciar sesión/ }),
        );

        expect(
            await screen.findByText(
                /El correo o la contraseña son incorrectos/,
            ),
        ).toBeInTheDocument();
        // Server `errors[].field` must become a TanStack Form field error, not
        // only a single banner: the offending input is marked invalid and the
        // translated detail is rendered next to it.
        await waitFor(() =>
            expect(screen.getByLabelText("Correo Electrónico")).toHaveAttribute(
                "aria-invalid",
                "true",
            ),
        );
        expect(screen.getByText(/Revisá el correo/)).toBeInTheDocument();
    });
});

describe("FeatureDialog (admin editor)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockCreateFeature.mockResolvedValue(undefined);
        mocks.mockUpdateFeature.mockResolvedValue(undefined);
    });

    it("submits the edited feature with the same payload shape", async () => {
        render(
            <FeatureDialog
                open
                onOpenChange={vi.fn()}
                feature={feature}
                onSuccess={vi.fn()}
            />,
        );

        const nameInput = screen.getByPlaceholderText("Analíticas Avanzadas");
        fireEvent.change(nameInput, { target: { value: "Analítica" } });
        await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

        await waitFor(() =>
            expect(mocks.mockUpdateFeature).toHaveBeenCalledWith(
                "feature-loyalty",
                expect.objectContaining({
                    name: "Analítica",
                    key: "LOYALTY",
                    description: "Enable customer loyalty rewards",
                    category: "MODULE",
                    price: 3,
                }),
            ),
        );
    });

    it("keeps the required-field validation message and does not submit", async () => {
        render(
            <FeatureDialog
                open
                onOpenChange={vi.fn()}
                feature={null}
                onSuccess={vi.fn()}
            />,
        );

        await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

        expect(mocks.mockToastError).toHaveBeenCalledWith(
            "Nombre y clave son obligatorios",
        );
        expect(mocks.mockCreateFeature).not.toHaveBeenCalled();
    });

    it("maps a backend field error onto the offending input", async () => {
        mocks.mockCreateFeature.mockRejectedValueOnce({
            errors: [
                {
                    code: "VALIDATION_INVALID_FORMAT",
                    field: "name",
                    message: "invalid name",
                },
            ],
        });
        render(
            <FeatureDialog
                open
                onOpenChange={vi.fn()}
                feature={null}
                onSuccess={vi.fn()}
            />,
        );

        await userEvent.type(
            screen.getByPlaceholderText("Analíticas Avanzadas"),
            "X",
        );
        await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

        await waitFor(() =>
            expect(
                screen.getByPlaceholderText("Analíticas Avanzadas"),
            ).toHaveAttribute("aria-invalid", "true"),
        );
        expect(
            screen.getByText(/Revisá el formato del dato ingressado/),
        ).toBeInTheDocument();
    });
});
