import { useState } from "react";
import { useAllHistory } from "../hooks/useAllHistory";
import { useConverter } from "../hooks/useConverter";
import { useHistory } from "../hooks/useHistory";
import { useI18n } from "../hooks/useI18n";
import type { TranslationKey } from "../lib/i18n";
import CorrelationMatrix from "./lab/CorrelationMatrix";
import Simulator from "./lab/Simulator";
import StrengthMeter from "./lab/StrengthMeter";
import TimeMachine from "./lab/TimeMachine";
import VolatilityCalendar from "./lab/VolatilityCalendar";

const TABS: Array<{ id: string; key: TranslationKey }> = [
  { id: "strength", key: "lab.strength" },
  { id: "correlation", key: "lab.correlation" },
  { id: "volatility", key: "lab.volatility" },
  { id: "timemachine", key: "lab.timemachine" },
  { id: "simulator", key: "lab.simulator" },
];

export default function MarketLab() {
  const { t } = useI18n();
  const { from, to } = useConverter();
  const [tab, setTab] = useState("strength");
  const market = useAllHistory("EUR", 365);
  const pair = useHistory(from, to, 365);

  return (
    <section className="panel panel-pad">
      <div className="section-head">
        <h2 className="section-title">{t("lab.title")}</h2>
      </div>

      <div role="tablist" className="seg mt-3 max-w-full overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`seg-item ${tab === item.id ? "seg-item--on" : ""}`}
          >
            {t(item.key)}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "strength" && <StrengthMeter market={market} />}
        {tab === "correlation" && <CorrelationMatrix market={market} />}
        {tab === "volatility" && <VolatilityCalendar pair={pair} />}
        {tab === "timemachine" && <TimeMachine market={market} />}
        {tab === "simulator" && <Simulator pair={pair} from={from} to={to} />}
      </div>
    </section>
  );
}
