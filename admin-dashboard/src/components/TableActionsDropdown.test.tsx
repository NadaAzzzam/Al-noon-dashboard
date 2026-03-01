import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TableActionsDropdown } from "./TableActionsDropdown";

describe("TableActionsDropdown", () => {
  it("returns null when actions is empty", () => {
    const { container } = render(
      <MemoryRouter>
        <TableActionsDropdown actions={[]} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders trigger and opens menu on click", () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <TableActionsDropdown actions={[{ label: "Edit", onClick }]} />
      </MemoryRouter>
    );
    const trigger = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders Link action when to is provided", () => {
    render(
      <MemoryRouter>
        <TableActionsDropdown actions={[{ label: "View", to: "/products/1" }]} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /actions/i }));
    const link = screen.getByRole("menuitem", { name: "View" });
    expect(link).toHaveAttribute("href", "/products/1");
  });
});
