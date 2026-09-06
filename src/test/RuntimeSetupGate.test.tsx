import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RuntimeSetupGate } from "@/components/RuntimeSetupGate";

describe("RuntimeSetupGate", () => {
  it("keeps the requested studio screen accessible when runtime health is not ready", () => {
    render(
      <MemoryRouter initialEntries={["/algorithms"]}>
        <Routes>
          <Route
            path="/algorithms"
            element={(
              <RuntimeSetupGate>
                <div>Algorithms studio</div>
              </RuntimeSetupGate>
            )}
          />
          <Route path="/settings" element={<div>Health settings</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Algorithms studio")).toBeInTheDocument();
    expect(screen.queryByText("Health settings")).not.toBeInTheDocument();
  });
});
