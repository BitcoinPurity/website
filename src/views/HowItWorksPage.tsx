import {
  translator,
  launchDay,
  localePath,
  type LocalizedProps,
} from "@/lib/i18n";
import Link from "next/link";
import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { protocol } from "@/content/protocol";

export default function HowItWorksPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);
  const rows = [
    {
      name: t("Non-empty non-OP_RETURN scriptPubKey"),
      value: t("≤ {0} bytes", protocol.rdts.maxOutputScriptSize),
      id: "MAX_OUTPUT_SCRIPT_SIZE",
    },
    {
      name: t("OP_RETURN outputs"),
      value: t("≤ {0} bytes", protocol.rdts.maxOpReturnSize),
      id: "MAX_OUTPUT_DATA_SIZE",
    },
    {
      name: t("Script elements"),
      value: t("≤ {0} bytes", protocol.rdts.maxScriptElementSize),
      id: "MAX_SCRIPT_ELEMENT_SIZE_REDUCED",
    },
    {
      name: t("Taproot control blocks"),
      value: t("depth ≤ {0}", protocol.rdts.taprootControlMaxDepth),
      id: "TAPROOT_CONTROL_MAX_SIZE_REDUCED",
    },
    {
      name: t("Taproot annex"),
      value: t(protocol.rdts.taprootAnnex),
      id: "annex",
    },
    {
      name: t("OP_IF / OP_NOTIF in Tapscript"),
      value: t(protocol.rdts.tapscriptIfOpcodes),
      id: "tapscript-if",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("How it works")}
        title={t("Permanent Reduced Data, still Bitcoin.")}
      >
        {t("This page summarizes the short-term hard fork. Code must match")}{" "}
        <ExternalLink
          locale={locale}
          href={protocol.docs.consensus}
          className="text-gold"
        >
          {"doc/purity-consensus.md"}
        </ExternalLink>
        {t(". Later ideas belong on the roadmap and are not active rules.")}
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <section>
          <h2 className="text-3xl text-ink">{t("Activation")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t("Activation height ")}
            <span className="font-mono text-ink">
              nPurityActivationHeight
            </span>{" "}
            {t("is hardcoded on mainnet to")}{" "}
            <span className="font-mono text-ink">
              {protocol.launch.activationHeight}
            </span>
            {t(". The first Purity consensus block is pinned to the hash")}{" "}
            <span className="break-all font-mono text-ink">
              {protocol.activationBlockHash}
            </span>
            {t(
              ". A different block at that height is invalid under consensus, even when checkpoints are disabled with",
            )}{" "}
            <span className="font-mono text-ink">-checkpoints=0</span>
            {t(".")}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {t("Mainnet launched at")}{" "}
            <time
              dateTime={protocol.launch.isoUtc}
              className="font-mono text-ink"
            >
              {protocol.launch.timeLabel} {t("on ")}
              {launchDay(locale, protocol.launch.isoUtc)}
            </time>
            {t(", at height")}{" "}
            <span className="font-mono text-ink">
              {protocol.launch.activationHeight}
            </span>
            {t(". The enforcement-chain split is at ")}
            {protocol.enforcementHeight}
            {t(
              ". If an upgraded node already has a conflicting block at the activation height, rebuild its block index with",
            )}{" "}
            <span className="font-mono text-ink">-reindex</span>
            {t(".")}
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">{t("Fork baseline")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t("The Knots/BIP110 ")}
            <em>{t("enforcement")}</em>{" "}
            {t("chain that rejected non-signaling blocks at height ")}
            {protocol.enforcementHeight}{" "}
            {t(
              "— not the Core majority chain at the same height. Historical Bitcoin / Knots validation is unchanged before the Purity activation height, so IBD still works.",
            )}
          </p>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge locale={locale} kind="consensus" />
          </div>
          <h2 className="text-3xl text-ink">{t("Permanent RDTS")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "BIP110 Reduced Data rules become always active at the Purity activation height and never expire. They cannot be turned off with consensus-rule opt-outs. After activation, version-bit 4 mandatory signaling is not required. The rules are consensus, not a miner poll.",
            )}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            {t(
              "Script elements include the documented P2SH redeemScript-push exemption. Block size and weight limits remain those inherited from Bitcoin.",
            )}
          </p>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline"
              >
                <p className="text-ink">{t(row.name)}</p>
                <p className="font-mono text-sm text-gold">{row.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge locale={locale} kind="active-in-tree" />
          </div>
          <h2 className="text-3xl text-ink">
            {t("Difficulty: ")}
            {protocol.asert.algorithm}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t("Port of Bitcoin Cash aserti3. Half-life")}{" "}
            {protocol.asert.halfLifeSeconds}{" "}
            {t("seconds (24 hours). Ideal block time remains ")}
            {protocol.asert.targetIntervalSeconds}{" "}
            {t("seconds. Anchor is enforcement-chain block ")}
            {protocol.asert.anchorHeight}
            {t(
              ". From the Purity activation height onward, GetNextWorkRequired uses ASERT. Blocks before that height still use Bitcoin’s 2016-block DAA.",
            )}
          </p>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge locale={locale} kind="unchanged" />
          </div>
          <h2 className="text-3xl text-ink">{t("Unchanged")}</h2>
          <ul className="mt-5 max-w-2xl space-y-2 text-lg text-muted">
            <li>{t("SHA256d proof-of-work")}</li>
            <li>
              {t("P2P magic ")}
              {protocol.p2pMagic}
              {t(", default port ")}
              {protocol.defaultPort}
            </li>
            <li>{t("Address formats, transaction serialization, sighash")}</li>
            <li>{t("No transaction-level replay protection")}</li>
            <li>{t("Block size / weight limits inherited from Bitcoin")}</li>
          </ul>
        </section>

        <p className="text-muted">
          <Link href={localePath("/developers", locale)} className="text-gold">
            {t("Developers")}
          </Link>
          {" · "}
          <Link href={localePath("/safety", locale)} className="text-gold">
            {t("Safety")}
          </Link>
        </p>
      </Container>
    </>
  );
}
