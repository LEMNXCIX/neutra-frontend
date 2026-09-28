// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/theme", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/theme")>()),
    applyTenantTheme: vi.fn(),
    clearTenantTheme: vi.fn(),
    ensureFontLoaded: vi.fn(),
}));

import { BrandingEditor } from "@/components/admin/tenants/BrandingEditor";

describe("BrandingEditor", () => {
    it("renders the live preview and field labels", () => {
        render(
            <BrandingEditor
                value={{ primaryColor: "#7c3aed" }}
                onChange={vi.fn()}
            />,
        );

        expect(screen.getByText("Vista previa en vivo")).toBeInTheDocument();
        expect(screen.getByText("Color Primario")).toBeInTheDocument();
        expect(screen.getByText("URL del logo")).toBeInTheDocument();
    });

    it("emits the changed token via onChange", async () => {
        const onChange = vi.fn();
        render(<BrandingEditor value={{}} onChange={onChange} />);

        const hexInputs = screen.getAllByPlaceholderText(
            "valor predeterminado del sitio",
        );
        const { fireEvent } = await import("@testing-library/dom");
        fireEvent.change(hexInputs[0], { target: { value: "#7c3aed" } });

        expect(onChange).toHaveBeenCalledWith({ primaryColor: "#7c3aed" });
    });

    it("reset link removes the token", async () => {
        const onChange = vi.fn();
        render(
            <BrandingEditor
                value={{ primaryColor: "#7c3aed" }}
                onChange={onChange}
            />,
        );

        await userEvent.click(screen.getByText("restablecer"));

        expect(onChange).toHaveBeenCalledWith({});
    });

    it("radius slider emits a rem value", async () => {
        const onChange = vi.fn();
        render(<BrandingEditor value={{}} onChange={onChange} />);

        const slider = screen.getByLabelText("Radio de las esquinas");
        const { fireEvent } = await import("@testing-library/dom");
        fireEvent.change(slider, { target: { value: "0.5" } });

        const lastCall = onChange.mock.calls.at(-1)?.[0];
        expect(lastCall.radius).toBe("0.50rem");
    });

    it("shows the reset link only for configured tokens", () => {
        render(
            <BrandingEditor
                value={{ primaryColor: "#7c3aed" }}
                onChange={vi.fn()}
            />,
        );

        expect(screen.getByText("restablecer")).toBeInTheDocument();
        expect(
            screen.queryByText("valor predeterminado del sitio"),
        ).not.toBeInTheDocument();
    });

    describe("tipografía", () => {
        it("renders both font pickers as shadcn selects, not native inputs", () => {
            render(<BrandingEditor value={{}} onChange={vi.fn()} />);

            expect(
                screen.getByRole("combobox", { name: "Fuente del Cuerpo" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("combobox", { name: "Fuente de Títulos" }),
            ).toBeInTheDocument();
            expect(document.querySelector("select")).toBeNull();
            expect(document.querySelector("datalist")).toBeNull();
        });

        it("picking a family from the list emits the token", async () => {
            const onChange = vi.fn();
            render(<BrandingEditor value={{}} onChange={onChange} />);

            await userEvent.click(
                screen.getByRole("combobox", { name: "Fuente del Cuerpo" }),
            );
            await userEvent.click(
                await screen.findByRole("option", { name: "DM Sans" }),
            );

            expect(onChange).toHaveBeenCalledWith({ fontFamily: "DM Sans" });
        });

        it("shows a family already stored outside the list in a free-text input", () => {
            render(
                <BrandingEditor
                    value={{ fontFamily: "Cormorant Garamond" }}
                    onChange={vi.fn()}
                />,
            );

            expect(
                screen.getByLabelText(
                    "Nombre de la familia para Fuente del Cuerpo",
                ),
            ).toHaveValue("Cormorant Garamond");
        });

        it("free-text entry emits the token for a family not in the list", async () => {
            const onChange = vi.fn();
            render(<BrandingEditor value={{}} onChange={onChange} />);

            await userEvent.click(screen.getAllByText("otra fuente")[0]);
            const input = screen.getByLabelText(
                "Nombre de la familia para Fuente del Cuerpo",
            );
            await userEvent.type(input, "Inter");

            // The editor is controlled: it emits the new value on every
            // keystroke and relies on the parent to feed `value` back, so the
            // last call carries the final keystroke rather than the whole word.
            expect(onChange).toHaveBeenLastCalledWith({ fontFamily: "r" });
        });

        it("switches back from free text to the curated list", async () => {
            const onChange = vi.fn();
            render(<BrandingEditor value={{}} onChange={onChange} />);

            await userEvent.click(screen.getAllByText("otra fuente")[0]);
            await userEvent.click(screen.getAllByText("elegir de la lista")[0]);

            expect(
                screen.getByRole("combobox", { name: "Fuente del Cuerpo" }),
            ).toBeInTheDocument();
        });

        it("resetting a family clears it and returns to the list", async () => {
            const onChange = vi.fn();
            render(
                <BrandingEditor
                    value={{ fontFamily: "Poppins" }}
                    onChange={onChange}
                />,
            );

            await userEvent.click(screen.getAllByText("restablecer")[0]);

            expect(onChange).toHaveBeenCalledWith({});
        });
    });
});
