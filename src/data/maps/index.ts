import { TiledMapJson } from '../../engine/TiledMap';

export interface MapRegistryEntry {
  id: string;
  json: TiledMapJson;
  title: string;
  mapType: string;
}

/**
 * Carregamento automático de todos os arquivos JSON de mapas em src/data/maps/
 * via import.meta.glob do Vite / Vitest.
 */
const mapModules = import.meta.glob<TiledMapJson>('./*.json', {
  eager: true,
  import: 'default',
});

export const MAP_REGISTRY: Record<string, MapRegistryEntry> = {};

for (const [path, json] of Object.entries(mapModules)) {
  const match = path.match(/\.\/(.+)\.json$/);
  if (!match) continue;
  const fileId = match[1];

  let title = fileId;
  let mapType = 'overworld';
  if (json.properties) {
    for (const prop of json.properties) {
      if (prop.name === 'title' || prop.name === 'nome') {
        title = String(prop.value);
      }
      if (prop.name === 'mapType' || prop.name === 'tipo') {
        mapType = String(prop.value);
      }
    }
  }

  MAP_REGISTRY[fileId] = {
    id: fileId,
    json,
    title,
    mapType,
  };
}

export function getMapEntry(id: string): MapRegistryEntry {
  const entry = MAP_REGISTRY[id];
  if (!entry) {
    throw new Error(`Mapa com ID '${id}' não encontrado no registro automático.`);
  }
  return entry;
}
