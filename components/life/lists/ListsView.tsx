"use client";

import { useState } from "react";
import { GroceryData, DumpData } from "@/lib/lists";
import GroceryList from "./GroceryList";
import ManageStaples from "./ManageStaples";
import DumpList from "./DumpList";

type SubView = "grocery" | "manageStaples" | "dump";

export default function ListsView({
  grocery,
  dump,
  onChangeGrocery,
  onChangeDump,
  onSendToWork,
  onSendToLife,
}: {
  grocery: GroceryData;
  dump: DumpData;
  onChangeGrocery: (updater: (g: GroceryData) => GroceryData) => void;
  onChangeDump: (updater: (d: DumpData) => DumpData) => void;
  onSendToWork: (text: string) => void;
  onSendToLife: (text: string) => void;
}) {
  const [sub, setSub] = useState<SubView>("grocery");

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      {sub !== "manageStaples" && (
        <div className="mb-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setSub("grocery")}
            className={`flex-1 rounded-xl py-2.5 text-center text-[13px] font-medium transition ${
              sub === "grocery" ? "bg-life text-paper-surface" : "border border-paper-border text-paper-muted"
            }`}
          >
            🛒 Grocery
          </button>
          <button
            type="button"
            onClick={() => setSub("dump")}
            className={`flex-1 rounded-xl py-2.5 text-center text-[13px] font-medium transition ${
              sub === "dump" ? "bg-work text-paper-surface" : "border border-paper-border text-paper-muted"
            }`}
          >
            🧠 Dump
          </button>
        </div>
      )}

      {sub === "grocery" && (
        <GroceryList
          data={grocery}
          onChange={onChangeGrocery}
          onManageStaples={() => setSub("manageStaples")}
        />
      )}
      {sub === "manageStaples" && (
        <ManageStaples data={grocery} onChange={onChangeGrocery} onBack={() => setSub("grocery")} />
      )}
      {sub === "dump" && (
        <DumpList data={dump} onChange={onChangeDump} onSendToWork={onSendToWork} onSendToLife={onSendToLife} />
      )}
    </div>
  );
}
