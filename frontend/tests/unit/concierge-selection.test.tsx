/** Model IDs select native catalogue cards; editing the shortlist never mutates a cart. */
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import ConciergeSelection from "../../src/storefront/shell/ConciergeSelection";
import { LocaleProvider } from "../../src/shared/i18n/i18n";
import { product } from "./fixtures";

function Selection() {
  const [removed, setRemoved] = useState<string[]>([]);
  return (
    <ConciergeSelection
      ids={[product.id, product.id]}
      products={[product]}
      money={(n) => `${n.toFixed(2)} EUR`}
      removed={removed}
      onRemove={(id) => setRemoved([...removed, id])}
      onRestore={() => setRemoved([])}
    />
  );
}
it("shows native images and prices, deduplicates suggestions and permits reversible removal", async () => {
  localStorage.setItem("rac-locale", "de-DE");
  render(<Selection />, { wrapper: LocaleProvider });
  expect(screen.getByRole("img", { name: product.name })).toHaveAttribute(
    "src",
    "/fixture.svg",
  );
  expect(screen.getByText("49.90 EUR")).toBeVisible();
  expect(screen.getAllByRole("article")).toHaveLength(1);
  await userEvent.click(
    screen.getByRole("button", {
      name: `Aus Auswahl entfernen: ${product.name}`,
    }),
  );
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Auswahl wiederherstellen" }),
  );
  expect(screen.getByRole("article")).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});

it("keeps unavailable-to-this-page recommendations as safe detail links without invented product facts", () => {
  localStorage.setItem("rac-locale", "de-DE");
  render(
    <ConciergeSelection
      ids={["not-on-this-page"]}
      removed={[]}
      onRemove={() => {}}
      onRestore={() => {}}
      products={[]}
      money={String}
    />,
    { wrapper: LocaleProvider },
  );
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Produkt ansehen/ })).toHaveAttribute(
    "href",
    expect.stringContaining("/products/not-on-this-page"),
  );
  expect(fetch).not.toHaveBeenCalled();
});

it("compares current catalogue facts and hands off to the selected native product without cart writes", async () => {
  localStorage.setItem("rac-locale", "de-DE");
  const alternative = {
    ...product,
    id: "alternative",
    name: "Alternative",
    stock: 0,
    price: 79,
  };
  const remove = vi.fn();
  const props = {
    ids: [product.id, alternative.id, "unknown"],
    products: [product, alternative],
    money: (price: number) => `${price.toFixed(2)} EUR`,
    onRemove: remove,
    onRestore: () => {},
  };
  const page = render(<ConciergeSelection {...props} removed={[]} />, {
    wrapper: LocaleProvider,
  });
  const toggle = screen.getByRole("button", { name: "Produkte vergleichen" });
  await userEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  const table = within(screen.getByRole("table"));
  expect(
    table.getByRole("columnheader", { name: "Alternative" }),
  ).toBeVisible();
  expect(table.getByText("79.00 EUR")).toBeVisible();
  expect(
    table.getByRole("link", { name: /Produkt ansehen: Alternative/ }),
  ).toHaveAttribute("href", expect.stringContaining("/products/alternative"));
  expect(table.getAllByRole("columnheader")).toHaveLength(2);
  page.rerender(<ConciergeSelection {...props} removed={[alternative.id]} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
