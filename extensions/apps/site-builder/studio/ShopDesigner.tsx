/** The native shop-design entry binds workspace data and content-language scope to the visual canvas. */
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
import { ContentLanguage } from "../../../../frontend/src/shared/i18n/ContentLanguage";
import useDesigner from "./useDesigner";
import DesignerView from "./DesignerView";
export type Props = {
  request: RequestFn;
  workspace: string;
  shopName?: string;
  initialReference?: string;
  rights: string[];
  sandbox: boolean;
  onEnvironments: () => void;
  onTest?: (channel: string) => void;
  onSandbox?: (id: string, current?: () => boolean) => Promise<void>;
};
export default function ShopDesigner(props: Props) {
  const d = useDesigner(props.request, props.workspace);
  return d.context ? (
    <ContentLanguage
      locales={d.context.locales}
      mainLocale={d.context.mainLocale}
    >
      <DesignerView {...props} d={d} />
    </ContentLanguage>
  ) : (
    <section className="studio-page">
      <p role={d.error ? "alert" : "status"}>{d.error || "…"}</p>
      <button onClick={() => void d.load()}>↻</button>
    </section>
  );
}
