/** Render registered workspace controls with A2UI or the existing OpenUI fallback. */
import { createContext, useContext, type ReactNode } from "react";
import {
  createLibrary,
  defineComponent,
  Renderer,
} from "@openuidev/react-lang";
import { z } from "zod";
import { composeNativeWorkspace } from "./workspace-presentation";
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
  const presentation = composeNativeWorkspace(candidate, rights);
  if (!presentation) return null;
  if (presentation.protocol === "a2ui-1.0") {
    const controls = {
      Directory: directory,
      Intake: intake,
      ShippingPolicy: shippingPolicy,
    };
    return (
      <div
        className="generated-native-workspace"
        data-layout-protocol={presentation.protocol}
      >
        {presentation.controls.map((name) => (
          <div key={name}>{controls[name]}</div>
        ))}
      </div>
    );
  }
  return (
    <NativeBindings.Provider value={{ directory, intake, shippingPolicy }}>
      <Renderer
        response={presentation.source}
        library={library}
        isStreaming={false}
      />
    </NativeBindings.Provider>
  );
}
