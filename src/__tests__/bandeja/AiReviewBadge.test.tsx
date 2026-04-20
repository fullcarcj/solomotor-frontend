/**
 * AiReviewBadge — Tests unitarios (Sprint 6B)
 *
 * Criterio A.3: badge visible con count > 0; oculto si 0.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AiReviewBadge from "@/app/(features)/bandeja/components/AiReviewBadge";

describe("AiReviewBadge", () => {
  it("se renderiza y muestra el count cuando count > 0", () => {
    render(<AiReviewBadge count={7} onClick={() => undefined} />);
    expect(screen.getByRole("button")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();
  });

  it("muestra '99+' cuando count > 99", () => {
    render(<AiReviewBadge count={120} onClick={() => undefined} />);
    expect(screen.getByText("99+")).toBeDefined();
  });

  it("no renderiza nada cuando count === 0", () => {
    const { container } = render(<AiReviewBadge count={0} onClick={() => undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("llama a onClick al hacer clic", () => {
    const onClick = vi.fn();
    render(<AiReviewBadge count={3} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("tiene aria-label con el count correcto", () => {
    render(<AiReviewBadge count={5} onClick={() => undefined} />);
    const btn = screen.getByLabelText("Revisión IA: 5 pendientes");
    expect(btn).toBeDefined();
  });

  it("aria-label usa singular para count === 1", () => {
    render(<AiReviewBadge count={1} onClick={() => undefined} />);
    const btn = screen.getByLabelText("Revisión IA: 1 pendiente");
    expect(btn).toBeDefined();
  });
});
