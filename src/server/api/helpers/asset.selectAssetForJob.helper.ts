type References = {
  character1: {
    voiceAssetId: string | null;
    imageAssetId: string | null;
  };
  character2: {
    voiceAssetId: string | null;
    imageAssetId: string | null;
  };
};

type FailedRef = {
  slot: "character1" | "character2";
  type: "voiceAssetId" | "imageAssetId";
  assetId: string;
};

const SLOTS = ["character1", "character2"] as const;
const TYPES = ["voiceAssetId", "imageAssetId"] as const;

export const flattenRefs = (input: References): FailedRef[] => {
  const toValidate: FailedRef[] = [];

  for (const slot of SLOTS) {
    for (const type of TYPES) {
      const id = input[slot][type];
      if (id) toValidate.push({ slot, type, assetId: id });
    }
  }

  return toValidate;
};
