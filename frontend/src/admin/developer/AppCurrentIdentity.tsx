/** Current app identity and save state stay visible across the editor's sections. */
import Icon from "../../shared/ui/Icon";
export default function AppCurrentIdentity({
  title,
  id,
  version,
  status,
}: {
  title: string;
  id: string;
  version: string;
  status: string;
}) {
  return (
    <div className="app-current">
      <span className="app-logo">
        <Icon name="layers" size={20} />
      </span>
      <div>
        <h1>{title}</h1>
        <small>
          {id} · {version} · {status}
        </small>
      </div>
    </div>
  );
}
