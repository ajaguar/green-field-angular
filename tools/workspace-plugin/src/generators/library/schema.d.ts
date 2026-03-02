export interface LibraryGeneratorSchema {
  domain: string;
  type: LibraryType;
  name?: string;
  routing: boolean;
}

export enum LibraryType {
  Api = 'api',
  Domain = 'domain',
  Feature = 'feature',
  Shared = 'shared',
  Ui = 'ui',
  Util = 'util',
}
