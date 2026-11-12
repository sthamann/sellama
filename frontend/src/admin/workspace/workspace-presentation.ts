/** Project the native workspace's reviewed controls through the shared A2UI adapter. */
import {
  createA2uiAdapter,
  type A2uiProjection,
  type RendererCapabilities,
} from "@veyndo/sdk/a2ui";
import { createLayoutRegistry } from "@veyndo/sdk/composition";
import { admitWorkspaceView } from "../../shared/grid/workspace-view";

const catalogId = "veyndo:studio-workspace-v1";
const bindings = {
  Directory: { id: "Directory", title: "Directory", version: 1 },
  Intake: { id: "Intake", title: "Intake", version: 1 },
  ShippingPolicy: {
    id: "ShippingPolicy",
    title: "Shipping policy",
    version: 1,
  },
} as const;
type Control = keyof typeof bindings;

const adapter = createA2uiAdapter({
  catalogId,
  rootComponent: "Workspace",
  views: Object.values(bindings).map(({ id, version }) => ({
    view: id,
    version,
    component: id,
  })),
});
const nativeCapabilities = { "1.0": { supportedCatalogIds: [catalogId] } };

function readNativeControls(projection: A2uiProjection): Control[] | null {
  if (projection.kind !== "a2ui") return null;
  const update = projection.messages.find(
    (message) => "updateComponents" in message,
  );
  const components = update?.updateComponents.components;
  const root = components?.find((component) => component.id === "root");
  if (root?.component !== "Workspace" || !root.children) return null;
  const controls: Control[] = [];
  for (const id of root.children) {
    const name = components?.find(
      (component) => component.id === id,
    )?.component;
    if (!name || !Object.hasOwn(bindings, name)) return null;
    controls.push(name as Control);
  }
  return controls;
}

export function composeNativeWorkspace(
  candidate: unknown,
  rights: string[],
  capabilities: RendererCapabilities = nativeCapabilities,
) {
  const view = admitWorkspaceView(candidate, rights);
  if (!view) return null;
  const selected = (view.components ?? ["records"]).flatMap(
    (component): Control[] => {
      switch (component) {
        case "records":
          return ["Directory"];
        case "intake":
          return rights.includes("catalog.write") ? ["Intake"] : [];
        case "shippingPolicy":
          return ["ShippingPolicy"];
        case "details":
          return [];
      }
    },
  );
  const registry = createLayoutRegistry(selected.map((name) => bindings[name]));
  const layout = {
    version: 1,
    panels: selected.map((name) => ({ id: name, view: name, version: 1 })),
  };
  const presentation = adapter.project(registry, layout, {
    surfaceId: "studio_workspace",
    capabilities,
  });
  if (presentation.kind === "rejected") return null;
  const controls = readNativeControls(presentation);
  if (controls) return { protocol: "a2ui-1.0", controls } as const;
  return {
    protocol: "openui",
    source: `root = Workspace([${presentation.panels.map((panel) => `${panel.view}()`).join(", ")}])`,
  } as const;
}
