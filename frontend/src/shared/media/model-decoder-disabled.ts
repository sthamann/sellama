/** Admission forbids meshopt-compressed GLB; avoid instantiating an unused WebAssembly decoder under the existing CSP. */
export const MeshoptDecoder = {
  supported: false,
  ready: Promise.resolve(),
  decodeGltfBuffer() {
    throw new Error("Compressed GLB requires conversion before upload");
  },
};
