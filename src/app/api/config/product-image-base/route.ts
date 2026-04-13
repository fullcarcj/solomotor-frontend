import { NextResponse } from "next/server";
import { productImageBaseUrl } from "@/lib/productImageUrl";

/**
 * Expone la base de imágenes Firebase definida solo en el servidor (p. ej. PRODUCT_IMAGE_BASE_URL en Render),
 * para que el cliente recupere la URL si no quedó inlined en el build.
 */
export async function GET() {
  const baseUrl = productImageBaseUrl();
  return NextResponse.json(
    { baseUrl },
    {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    }
  );
}
