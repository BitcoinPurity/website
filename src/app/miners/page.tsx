import Link from "next/link";
import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { LaunchPanel } from "@/components/LaunchPanel";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { activationConf, protocol } from "@/content/protocol";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "For Miners",
  "/miners",
  `Bitcoin Purity keeps SHA256d proof-of-work. Activation is scheduled for ${protocol.launch.dateLabel} at ${protocol.launch.timeLabel}. Set ${activationConf} on first start.`,
);

export default function MinersPage() {
  return (
    <>
      <PageHeader eyebrow="For miners" title="Keep hashing Bitcoin.">
        SHA256d remains the proof-of-work algorithm. Existing SHA256 hardware is
        not intentionally invalidated by an algorithm switch.
      </PageHeader>
      <Container className="space-y-14 py-16 sm:py-20">
        <LaunchPanel className="max-w-2xl" />
        <section className="max-w-2xl space-y-5 text-lg leading-relaxed text-muted">
          <p>
            <StatusBadge kind="unchanged" />
          </p>
          <p>
            ASERT is intended to allow difficulty to track changing available
            hash rate after activation. Purity retains Bitcoin’s 10-minute target
            interval ({protocol.blockIntervalSeconds} seconds).
          </p>
          <p>
            Mining involves substantial technical and economic risk. This page
            does not promise returns. The trial solo pool is provided for
            operators who want to point SHA256d hardware at Purity around
            activation; verify the endpoint independently before committing
            hash rate.
          </p>
          <p>
            The design avoids unnecessarily invalidating existing SHA256 mining
            investment as part of the fork. That is not a guarantee that every
            miner is protected from economic loss.
          </p>
        </section>
        <dl className="grid gap-8 font-mono text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">PoW</dt>
            <dd className="mt-2 text-ink">{protocol.pow}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">DAA after activation</dt>
            <dd className="mt-2 text-ink">{protocol.asert.algorithm}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">Half-life</dt>
            <dd className="mt-2 text-ink">24 hours</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">Anchor</dt>
            <dd className="mt-2 text-ink">enforcement-chain {protocol.asert.anchorHeight}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">Node parameter</dt>
            <dd className="mt-2 text-ink">
              {protocol.activationOption}=
              <span className="font-sans font-bold">
                {protocol.launch.activationHeight}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">Start</dt>
            <dd className="mt-2 text-ink">
              <time dateTime={protocol.launch.isoUtc}>
                {protocol.launch.timeLabel} · {protocol.launch.dateLabel}
              </time>
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-4">
          <ExternalLink href={protocol.docs.consensus} className="text-gold">
            Read the Consensus Specification
          </ExternalLink>
          <Link href="/run" className="text-gold">
            Build / Run Bitcoin Purity
          </Link>
        </div>
      </Container>
    </>
  );
}
