import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PipelineMini from "@/app/(features)/bandeja/components/PipelineMini";

describe("PipelineMini", () => {
  it("renderiza los 7 stages", () => {
    const { container } = render(<PipelineMini stage="quote" />);
    const steps = container.querySelectorAll(".mu-pm");
    expect(steps).toHaveLength(7);
  });

  it("marca el stage actual como --current", () => {
    const { container } = render(<PipelineMini stage="quote" />);
    const current = container.querySelector(".mu-pm--current");
    expect(current).not.toBeNull();
    expect(current?.textContent).toContain("COT.");
  });

  it("marca stages previos como --done", () => {
    const { container } = render(<PipelineMini stage="quote" />);
    const done = container.querySelectorAll(".mu-pm--done");
    expect(done).toHaveLength(1);
  });

  it("el primer stage (contact) no tiene done ni current cuando stage=contact", () => {
    const { container } = render(<PipelineMini stage="contact" />);
    const done    = container.querySelectorAll(".mu-pm--done");
    const current = container.querySelectorAll(".mu-pm--current");
    expect(done).toHaveLength(0);
    expect(current).toHaveLength(1);
  });

  it("sin stage → no hay --current ni --done", () => {
    const { container } = render(<PipelineMini />);
    expect(container.querySelectorAll(".mu-pm--current")).toHaveLength(0);
    expect(container.querySelectorAll(".mu-pm--done")).toHaveLength(0);
  });

  it("el último stage (closed) tiene 6 done y 1 current", () => {
    const { container } = render(<PipelineMini stage="closed" />);
    expect(container.querySelectorAll(".mu-pm--done")).toHaveLength(6);
    expect(container.querySelectorAll(".mu-pm--current")).toHaveLength(1);
  });

  it("tiene aria-label con el stage legible", () => {
    render(<PipelineMini stage="payment" />);
    expect(screen.getByLabelText("Etapa: Pago")).toBeDefined();
  });

  it("legacy ml_answer se normaliza a quote (mismo índice que cotización)", () => {
    const { container } = render(<PipelineMini stage="ml_answer" />);
    expect(container.querySelectorAll(".mu-pm")).toHaveLength(7);
    expect(container.querySelector(".mu-pm--current")?.textContent).toContain("COT.");
  });
});
