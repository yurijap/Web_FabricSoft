// One-off image optimization (QA 1.1.4 — tiempos de carga).
// Convierte logos y foto del founder a WebP redimensionado.
// Las imagenes generadas ya estan commiteadas; sharp NO es dependencia del
// proyecto (rompia el build de Vercel en Linux). Para re-ejecutar el script:
//   npm i -D sharp && node scripts/optimize-images.mjs && npm un sharp
// Uso: node scripts/optimize-images.mjs
import sharp from "sharp";
import { statSync } from "node:fs";

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + "KB";

const jobs = [
  {
    in: "src/assets/logo/fabric_sin_fondo_transparente.png",
    out: "src/assets/logo/fabric-logo.webp",
    width: 480, // header lo muestra hasta 140px de alto → 480px cubre retina 3x
    fmt: "webp",
    opts: { quality: 90 },
  },
  {
    in: "src/assets/logo/logo.png",
    out: "src/assets/logo/logo.webp",
    width: 160, // loader/admin lo muestran a ~36px
    fmt: "webp",
    opts: { quality: 90 },
  },
  {
    in: "public/julio_alvarez.jpeg",
    out: "public/julio_alvarez.webp",
    width: 720, // sección founder
    fmt: "webp",
    opts: { quality: 80 },
  },
  {
    in: "public/julio_alvarez.png",
    out: "public/julio_alvarez_og.jpg", // og:image → se mantiene JPG por compatibilidad social
    width: 1024,
    fmt: "jpeg",
    opts: { quality: 82, mozjpeg: true },
  },
];

for (const j of jobs) {
  const before = kb(j.in);
  let pipe = sharp(j.in).resize({ width: j.width, withoutEnlargement: true });
  pipe = j.fmt === "webp" ? pipe.webp(j.opts) : pipe.jpeg(j.opts);
  await pipe.toFile(j.out);
  console.log(`${j.in}  (${before})  ->  ${j.out}  (${kb(j.out)})`);
}
