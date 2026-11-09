/** OpenUI presents admitted model compositions. Native bindings own every record, action and permission. */
import { createContext, useContext, type ReactNode } from "react";
import {
  createLibrary,
  defineComponent,
  Renderer,
} from "@openuidev/react-lang";
import { z } from "zod";
import { createLayoutRegistry } from "@veyndo/sdk/composition";
import { admitWorkspaceView } from "../../shared/grid/workspace-view";
const NativeBindings = createContext<{
  directory: ReactNode;
  intake: ReactNode;
  shippingPolicy: ReactNode;
}>({ directory: null, intake: null, shippingPolicy: null });
const Workspace = defineComponent({
  name: "Workspace",
  description: "A reviewed native Veyndo working view.",
  props: z.object({ children: z.array(z.any()).max(2) }),
  component: ({ props, renderNode }) => (
    <div className="generated-native-workspace">
      {props.children.map((node, index) => (
        <div key={index}>{renderNode(node)}</div>
      ))}
    </div>
  ),
});
const Directory = defineComponent({
  name: "Directory",
  description:
    "Current authorized native directory and optional selected-record editor.",
  props: z.object({}),
  component: () => useContext(NativeBindings).directory,
});
const Intake = defineComponent({
  name: "Intake",
  description: "Native reviewed catalogue intake, when authorized.",
  props: z.object({}),
  component: () => useContext(NativeBindings).intake,
});
const ShippingPolicy = defineComponent({
  name: "ShippingPolicy",
  description: "Current shipping policy passages from the shop knowledge base.",
  props: z.object({}),
  component: () => useContext(NativeBindings).shippingPolicy,
});
const library = createLibrary({
  root: "Workspace",
  components: [Workspace, Directory, Intake, ShippingPolicy],
});
export function composeNativeWorkspace(
  candidate: unknown,
  rights: string[],
): string | null {
  const view = admitWorkspaceView(candidate, rights);
  if (!view) return null;
  const selected = (view.components ?? ["records"]).flatMap((component) => {
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
  });
  // The SDK is shared with independent hosts. Domain and PII admission above stays native.
  const layout = createLayoutRegistry([
    { id: "Directory", version: 1, title: "Directory" },
    ...(rights.includes("catalog.write")
      ? [{ id: "Intake", version: 1, title: "Intake" }]
      : []),
    ...(rights.includes("knowledge.read")
      ? [{ id: "ShippingPolicy", version: 1, title: "Shipping policy" }]
      : []),
  ]).admit({
    version: 1,
    panels: selected.map((component) => ({
      id: component,
      view: component,
      version: 1,
    })),
  });
  if (!layout) return null;
  return `root = Workspace([${layout.panels.map((p) => `${p.view}()`).join(", ")}])`;
}
export default function GeneratedWorkspace({
  candidate,
  rights,
  directory,
  intake,
  shippingPolicy,
}: {
  candidate: unknown;
  rights: string[];
  directory: ReactNode;
  intake: ReactNode;
  shippingPolicy?: ReactNode;
}) {
  const source = composeNativeWorkspace(candidate, rights);
  if (!source) return null;
  return (
    <NativeBindings.Provider value={{ directory, intake, shippingPolicy }}>
      <Renderer response={source} library={library} isStreaming={false} />
    </NativeBindings.Provider>
  );
}
