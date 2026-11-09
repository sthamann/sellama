/** Both assistant surfaces accept formatted model prose without executable model content. */
import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import AssistantMarkdown from "../../src/shared/content/AssistantMarkdown";

it("shows the comparison response as a table with column headers and formatted prose", () => {
  render(
    <AssistantMarkdown
      text={`**Für die Leseecke** sind beide geeignet.

| Merkmal | Tischleuchte | Keramiktasse |
| --- | --- | --- |
| Einsatz | Lesen | Kaffee \\| Tee |

1. Tischleuchte ansehen
2. Keramiktasse ansehen`}
    />,
  );
  expect(screen.getByText("Für die Leseecke").tagName).toBe("STRONG");
  const table = within(screen.getByRole("table"));
  expect(
    table.getByRole("columnheader", { name: "Tischleuchte" }),
  ).toBeVisible();
  expect(table.getByRole("cell", { name: "Kaffee | Tee" })).toBeVisible();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

it("keeps model HTML, links and remote images inert", () => {
  const { container } = render(
    <AssistantMarkdown
      text={
        `[click](javascript:alert(1)) [external](https://example.test)
![image](https://example.test/track.png)
<img src=x onerror=alert(1)>

` + "```html\n<button>Buy</button>\n```"
      }
    />,
  );
  expect(container.querySelector("a, img, button")).toBeNull();
  expect(screen.getByText("click", { exact: false })).toBeVisible();
  expect(screen.getByText("<button>Buy</button>")).toBeVisible();
});
