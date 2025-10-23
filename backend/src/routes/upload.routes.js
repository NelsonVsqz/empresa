import express from "express";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "../utils/r2Client.js";

const router = express.Router();

router.get("/presigned-url", async (req, res) => {
  try {
    const { filename, contentType } = req.query;

    if (!filename || !contentType)
      return res.status(400).json({ error: "Faltan parámetros" });

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: `permisos/${Date.now()}_${filename}`, // Agregamos un timestamp al nombre del archivo para evitar duplicados
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 });

    res.json({ uploadUrl: signedUrl });
  } catch (error) {
    console.error("Error generando presigned URL:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;