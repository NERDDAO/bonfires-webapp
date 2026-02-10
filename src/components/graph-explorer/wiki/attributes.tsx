import { formatAttributeValue, formatLabel } from "./wiki-panel-utils";

export default function Attributes({
  attributes,
}: {
  attributes: Record<string, unknown>;
}) {
  return (
    <div className="bg-[#2D2E33] rounded-lg divide-y divide-[#37393F]">
      {Object.entries(attributes).map(([key, val]) => {
        const displayKey = formatLabel(key);
        const displayVal = formatAttributeValue(val);
        return (
          <div
            key={key}
            className="px-3 py-2.5 text-sm first:pt-2.5 last:pb-2.5"
          >
            <div className="text-xs capitalize tracking-wide text-base-content/60 mb-0.5">
              {displayKey}
            </div>
            <div className="text-base-content/90 wrap-break-word leading-relaxed">
              {displayVal || "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
