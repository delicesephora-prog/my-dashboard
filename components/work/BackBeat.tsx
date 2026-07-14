"use client";

import {
  BackBeat as BackBeatData,
  StudySite,
  TranslationDoc,
  EdcAccessRow,
  UberHealthRow,
  emptyTranslationStages,
  emptyEdcStages,
} from "@/lib/types";
import StudyOverviewCard from "./StudyOverviewCard";
import SitesSection from "./SitesSection";
import TranslationTrackerSection from "./TranslationTrackerSection";
import EdcAccessSection from "./EdcAccessSection";
import UberHealthSection from "./UberHealthSection";

export default function BackBeat({
  backBeat,
  onChange,
}: {
  backBeat: BackBeatData;
  onChange: (updater: (b: BackBeatData) => BackBeatData) => void;
}) {
  function addSite() {
    const site: StudySite = {
      id: crypto.randomUUID(),
      name: "",
      status: "Pending",
      country: "",
      siteManager: "",
      enrollmentCount: 0,
      notes: "",
      archived: false,
    };
    onChange((b) => ({ ...b, sites: [site, ...b.sites] }));
  }

  function addTranslation() {
    const doc: TranslationDoc = {
      id: crypto.randomUUID(),
      documentName: "",
      vendor: "",
      language: "",
      stages: emptyTranslationStages(),
      notes: "",
    };
    onChange((b) => ({ ...b, translations: [doc, ...b.translations] }));
  }

  function addEdcRow() {
    const row: EdcAccessRow = {
      id: crypto.randomUUID(),
      user: "",
      site: "",
      stages: emptyEdcStages(),
    };
    onChange((b) => ({ ...b, edcAccess: [row, ...b.edcAccess] }));
  }

  function addUberHealthRow() {
    const row: UberHealthRow = {
      id: crypto.randomUUID(),
      site: "",
      credits: 0,
      monthlyInvoice: 0,
      statementReceived: false,
      paymentStatus: "Pending",
      notes: "",
    };
    onChange((b) => ({ ...b, uberHealth: [row, ...b.uberHealth] }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="flex flex-col gap-3">
        <StudyOverviewCard
          overview={backBeat.overview}
          onChange={(overview) => onChange((b) => ({ ...b, overview }))}
        />

        <SitesSection
          sites={backBeat.sites}
          onAdd={addSite}
          onUpdate={(id, updater) =>
            onChange((b) => ({
              ...b,
              sites: b.sites.map((s) => (s.id === id ? updater(s) : s)),
            }))
          }
          onArchive={(id, archived) =>
            onChange((b) => ({
              ...b,
              sites: b.sites.map((s) => (s.id === id ? { ...s, archived } : s)),
            }))
          }
        />

        <TranslationTrackerSection
          docs={backBeat.translations}
          onAdd={addTranslation}
          onUpdate={(id, updater) =>
            onChange((b) => ({
              ...b,
              translations: b.translations.map((d) => (d.id === id ? updater(d) : d)),
            }))
          }
          onDelete={(id) =>
            onChange((b) => ({ ...b, translations: b.translations.filter((d) => d.id !== id) }))
          }
        />

        <EdcAccessSection
          rows={backBeat.edcAccess}
          onAdd={addEdcRow}
          onUpdate={(id, updater) =>
            onChange((b) => ({
              ...b,
              edcAccess: b.edcAccess.map((r) => (r.id === id ? updater(r) : r)),
            }))
          }
          onDelete={(id) =>
            onChange((b) => ({ ...b, edcAccess: b.edcAccess.filter((r) => r.id !== id) }))
          }
        />

        <UberHealthSection
          rows={backBeat.uberHealth}
          onAdd={addUberHealthRow}
          onUpdate={(id, updater) =>
            onChange((b) => ({
              ...b,
              uberHealth: b.uberHealth.map((r) => (r.id === id ? updater(r) : r)),
            }))
          }
          onDelete={(id) =>
            onChange((b) => ({ ...b, uberHealth: b.uberHealth.filter((r) => r.id !== id) }))
          }
        />
      </div>
    </div>
  );
}
