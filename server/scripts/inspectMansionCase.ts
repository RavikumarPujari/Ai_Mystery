import { connectDatabase } from "../src/config/database.js";
import { MediaAssetModel } from "../src/models/MediaAsset.model.js";

async function run() {
  await connectDatabase();
  const assets = await MediaAssetModel.find({
    storageKey: { $in: ["asset_9ff1c8759adc4ebf.svg", "asset_b4d9099ce4db4f64.svg"] }
  }).select("+dataBase64 +promptUsed").lean();
  console.log(`Found ${assets.length} assets:`);
  for (const a of assets) {
    console.log(`- StorageKey: ${a.storageKey}, Tier: ${a.tierUsed}, MIME: ${a.mimeType}, EvidenceId: ${a.evidenceId}`);
    console.log(`  Prompt: ${a.promptUsed}`);
    console.log(`  Data length: ${a.dataBase64?.length}`);
    if (a.dataBase64) {
      const decoded = Buffer.from(a.dataBase64, 'base64').toString('utf-8');
      console.log(`  Decoded content preview:`, decoded.substring(0, 300));
    }
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

