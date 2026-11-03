/** Native 3D admission errors explain conversion, ownership and material recovery in every interface language. */
const format = [
  "Upload a self-contained GLB 2 file up to 20 MiB. Embed all geometry and textures and export without Draco, meshopt or KTX2 compression.",
  "Lade eine vollständige GLB-2-Datei bis 20 MiB hoch. Bette Geometrie und Texturen ein und exportiere ohne Draco-, meshopt- oder KTX2-Kompression.",
  "Importez un fichier GLB 2 autonome de 20 MiB maximum. Intégrez géométrie et textures, sans compression Draco, meshopt ou KTX2.",
  "Sube un GLB 2 completo de hasta 20 MiB. Incluye geometría y texturas, sin compresión Draco, meshopt ni KTX2.",
];
export const modelErrors: Record<string, readonly string[]> = {
  ...Object.fromEntries(
    [
      "Invalid GLB structure",
      "A GLB 2 model is required",
      "GLB metadata exceeds limits",
      "Invalid GLB metadata",
      "GLB must contain a complete model up to 20 MiB",
      "GLB must embed all resources without external decoders",
      "Invalid GLB binary chunk",
      "Invalid GLB buffer size",
      "GLB geometry exceeds limits",
      "Invalid GLB material variants",
      "Invalid GLB material variant name",
      "Duplicate GLB material variant",
    ].map((key) => [key, format]),
  ),
  "Material variant is not present in this GLB": [
    "Open the 3D preview and choose one of the material variants contained in this file.",
    "Öffne die 3D-Vorschau und wähle eine Materialvariante, die in dieser Datei enthalten ist.",
    "Ouvrez l’aperçu 3D et choisissez un matériau contenu dans ce fichier.",
    "Abre la vista 3D y elige una variante de material incluida en este archivo.",
  ],
  "Published GLB asset for this product or its parent required": [
    "Upload a model to this product or use a model from its parent product, then save again.",
    "Lade ein Modell an diesem Produkt hoch oder übernimm eines vom Hauptprodukt. Speichere anschließend erneut.",
    "Importez un modèle sur ce produit ou utilisez celui du parent, puis enregistrez à nouveau.",
    "Sube un modelo a este producto o usa uno del producto principal y vuelve a guardar.",
  ],
  "Maximum four 3D models per product": [
    "Each product can contain four 3D models. Remove an unused assignment before adding another.",
    "Ein Produkt kann vier 3D-Modelle enthalten. Entferne eine unbenutzte Zuordnung, bevor du ein weiteres hinzufügst.",
    "Un produit peut contenir quatre modèles 3D. Retirez une affectation inutilisée avant d’en ajouter une autre.",
    "Cada producto admite cuatro modelos 3D. Quita una asignación sin uso antes de añadir otra.",
  ],
};
