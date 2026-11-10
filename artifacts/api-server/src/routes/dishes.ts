import { Router, type IRouter } from "express";
import sharp from "sharp";
import { desc, eq } from "drizzle-orm";
import { db, dishPhotosTable } from "@workspace/db";
import {
  CreateDishPhotoBody,
  CreateDishPhotoResponse,
  GetDishPhotoImageParams,
  ListDishPhotosResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;
const MIME_FORMATS: Record<string, string[]> = {
  "image/jpeg": ["jpeg", "jpg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

router.get("/dishes", async (_req, res): Promise<void> => {
  const records = await db
    .select({
      id: dishPhotosTable.id,
      title: dishPhotosTable.title,
      caption: dishPhotosTable.caption,
      createdAt: dishPhotosTable.createdAt,
    })
    .from(dishPhotosTable)
    .orderBy(desc(dishPhotosTable.createdAt), desc(dishPhotosTable.id));

  const photos = records.map((photo) => ({
    ...photo,
    imageUrl: `/api/dishes/${photo.id}/image`,
  }));
  res.json(ListDishPhotosResponse.parse(photos));
});

router.post("/dishes", async (req, res): Promise<void> => {
  const parsed = CreateDishPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Add a title and a valid image data URL." });
    return;
  }

  const title = parsed.data.title.trim();
  if (title.length === 0 || title.length > 120) {
    res.status(400).json({ error: "Title must be between 1 and 120 characters." });
    return;
  }
  if (parsed.data.caption != null && parsed.data.caption.length > 500) {
    res.status(400).json({ error: "Caption must be 500 characters or fewer." });
    return;
  }

  const match = IMAGE_DATA_URL.exec(parsed.data.imageData);
  if (!match) {
    res.status(400).json({
      error: "Use a valid JPEG, PNG, or WebP image.",
    });
    return;
  }

  const mimeType = match[1];
  const base64 = match[2];
  const imageBytes = Buffer.from(base64, "base64");
  if (
    imageBytes.length === 0 ||
    imageBytes.toString("base64") !== base64 ||
    imageBytes.length > MAX_IMAGE_BYTES
  ) {
    res.status(400).json({
      error:
        imageBytes.length > MAX_IMAGE_BYTES
          ? "Image must be 3 MB or smaller."
          : "Image data is invalid.",
    });
    return;
  }

  try {
    const image = sharp(imageBytes, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    });
    const metadata = await image.metadata();
    if (
      !metadata.format ||
      !MIME_FORMATS[mimeType]?.includes(metadata.format) ||
      !metadata.width ||
      !metadata.height
    ) {
      res.status(400).json({
        error: "Image data does not match its JPEG, PNG, or WebP file type.",
      });
      return;
    }
    await image.stats();
  } catch {
    res.status(400).json({ error: "Image data is invalid or corrupted." });
    return;
  }

  const [record] = await db
    .insert(dishPhotosTable)
    .values({
      title,
      caption: parsed.data.caption?.trim() || null,
      imageData: base64,
      mimeType,
    })
    .returning({
      id: dishPhotosTable.id,
      title: dishPhotosTable.title,
      caption: dishPhotosTable.caption,
      createdAt: dishPhotosTable.createdAt,
    });

  res.status(201).json(
    CreateDishPhotoResponse.parse({
      ...record,
      imageUrl: `/api/dishes/${record.id}/image`,
    }),
  );
});

router.get("/dishes/:id/image", async (req, res): Promise<void> => {
  const params = GetDishPhotoImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Dish photo image not found." });
    return;
  }

  const [photo] = await db
    .select({
      imageData: dishPhotosTable.imageData,
      mimeType: dishPhotosTable.mimeType,
    })
    .from(dishPhotosTable)
    .where(eq(dishPhotosTable.id, params.data.id))
    .limit(1);

  if (!photo) {
    res.status(404).json({ error: "Dish photo image not found." });
    return;
  }

  res.type(photo.mimeType).send(Buffer.from(photo.imageData, "base64"));
});

export default router;
