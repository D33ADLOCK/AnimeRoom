import React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type AssetSelections = {
  assetId: string;
  label: string;
  previewUrl: string;
} | null;

type AssetDropdownType = {
  myAudioAssets: {
    id: string;
    url: string;
    label: string;
  }[];
  characterSelectedAsset: AssetSelections;
  onSelect: (
    slot: "character1" | "character2",
    selectedAsset: AssetSelections,
  ) => void;
  slot: "character1" | "character2";
};

export const AssetDropdown = ({
  myAudioAssets,
  characterSelectedAsset,
  onSelect,
  slot,
}: AssetDropdownType) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="nb-input flex w-full min-w-0 items-center justify-between gap-2 px-3 py-2 text-xs font-bold uppercase"
        >
          <span className="truncate overflow-hidden">
            {characterSelectedAsset?.label || "Select from library"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="nb-border w-56 bg-white shadow-[4px_4px_0px_var(--color-nb-shadow)]">
        <DropdownMenuGroup>
          {myAudioAssets.length === 0 ? (
            <DropdownMenuItem disabled className="text-xs font-semibold">
              No assets uploaded yet
            </DropdownMenuItem>
          ) : (
            myAudioAssets.map((m) => (
              <DropdownMenuItem
                onClick={() =>
                  onSelect(slot, {
                    assetId: m.id,
                    previewUrl: m.url,
                    label: m.label,
                  })
                }
                key={m.id}
                className="cursor-pointer text-xs font-bold uppercase"
              >
                {m.label}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
