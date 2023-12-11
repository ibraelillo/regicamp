import type { Schema, Attribute } from '@strapi/strapi';

export interface AddressAddress extends Schema.Component {
  collectionName: 'components_address_addresses';
  info: {
    displayName: 'address';
    icon: 'earth';
    description: '';
  };
  attributes: {
    geolocation: Attribute.JSON &
      Attribute.CustomField<'plugin::google-maps.location-picker'>;
  };
}

export interface ArticlesSection extends Schema.Component {
  collectionName: 'components_articles_sections';
  info: {
    displayName: 'Section';
    icon: 'bulletList';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    title_level: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
        max: 6;
      }> &
      Attribute.DefaultTo<3>;
    content: Attribute.Blocks;
    image: Attribute.Media;
    image_position: Attribute.Enumeration<['after_text', 'before_text']> &
      Attribute.DefaultTo<'after_text'>;
  };
}

export interface BasicLink extends Schema.Component {
  collectionName: 'components_basic_links';
  info: {
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    text: Attribute.String;
    url: Attribute.String;
  };
}

export interface BasicLogo extends Schema.Component {
  collectionName: 'components_basic_logos';
  info: {
    displayName: 'Logo';
  };
  attributes: {
    logo: Attribute.Media;
    url: Attribute.String;
  };
}

export interface CampingCamping extends Schema.Component {
  collectionName: 'components_camping_campings';
  info: {
    displayName: 'Camping';
    icon: 'gate';
  };
  attributes: {
    name: Attribute.String;
    medias: Attribute.Media;
    contracts: Attribute.Relation<
      'camping.camping',
      'oneToMany',
      'api::contract.contract'
    >;
    short_description: Attribute.Blocks;
    description: Attribute.Blocks;
    managedBy: Attribute.Relation<'camping.camping', 'oneToOne', 'admin::user'>;
  };
}

export interface ContractsContratThematiqueItem extends Schema.Component {
  collectionName: 'components_contracts_contrat_thematique_items';
  info: {
    displayName: 'ContratThematiqueItem';
    icon: 'cube';
  };
  attributes: {
    thematique: Attribute.Relation<
      'contracts.contrat-thematique-item',
      'oneToOne',
      'api::thematique.thematique'
    >;
    url: Attribute.String;
  };
}

export interface ContractsLinknet extends Schema.Component {
  collectionName: 'components_contracts_linknets';
  info: {
    displayName: 'Linknet';
    icon: 'folder';
  };
  attributes: {
    url: Attribute.String;
    destination: Attribute.Relation<
      'contracts.linknet',
      'oneToOne',
      'api::destination.destination'
    >;
  };
}

export interface ContractsValorizedLinknet extends Schema.Component {
  collectionName: 'components_contracts_valorized_linknets';
  info: {
    displayName: 'ValorizedLinknet';
    icon: 'file';
  };
  attributes: {
    url: Attribute.String;
    images: Attribute.Media;
    destination: Attribute.Relation<
      'contracts.valorized-linknet',
      'oneToOne',
      'api::destination.destination'
    >;
  };
}

export interface ContractsVideo extends Schema.Component {
  collectionName: 'components_contracts_videos';
  info: {
    displayName: 'Video';
    icon: 'play';
  };
  attributes: {
    videos: Attribute.Media;
    destination: Attribute.Relation<
      'contracts.video',
      'oneToOne',
      'api::destination.destination'
    >;
  };
}

export interface DestinationsCity extends Schema.Component {
  collectionName: 'components_destinations_cities';
  info: {
    displayName: 'City';
    icon: 'pin';
  };
  attributes: {
    name: Attribute.String;
    prefixes: Attribute.Component<'prefix.prefix'>;
    description: Attribute.Blocks;
    related_destinations: Attribute.Relation<
      'destinations.city',
      'oneToMany',
      'api::destination.destination'
    >;
  };
}

export interface PrefixPrefix extends Schema.Component {
  collectionName: 'components_prefix_prefixes';
  info: {
    displayName: 'Prefix';
    icon: 'collapse';
  };
  attributes: {
    singular: Attribute.String;
    plural: Attribute.String;
  };
}

export interface SeoSeo extends Schema.Component {
  collectionName: 'components_seo_seos';
  info: {
    displayName: 'Seo';
    icon: 'book';
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.String;
    keywords: Attribute.String;
    og_type: Attribute.String;
    og_image: Attribute.String;
  };
}

export interface TerrainAireReservation extends Schema.Component {
  collectionName: 'components_terrain_aire_reservations';
  info: {
    displayName: 'AireReservation';
    icon: 'shield';
  };
  attributes: {
    name: Attribute.String;
    medias: Attribute.Media;
    description: Attribute.Blocks;
  };
}

export interface TerrainAireStationnement extends Schema.Component {
  collectionName: 'components_terrain_aire_stationnements';
  info: {
    displayName: 'AireStationnement';
    icon: 'car';
  };
  attributes: {
    name: Attribute.String;
    description: Attribute.Blocks;
  };
}

export interface TerrainCamping extends Schema.Component {
  collectionName: 'components_terrain_campings';
  info: {
    displayName: 'Camping';
    icon: 'gate';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    medias: Attribute.Media;
    contracts: Attribute.Relation<
      'terrain.camping',
      'oneToMany',
      'api::contract.contract'
    >;
    short_description: Attribute.Blocks;
    description: Attribute.Blocks;
    managedBy: Attribute.Relation<'terrain.camping', 'oneToOne', 'admin::user'>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'address.address': AddressAddress;
      'articles.section': ArticlesSection;
      'basic.link': BasicLink;
      'basic.logo': BasicLogo;
      'camping.camping': CampingCamping;
      'contracts.contrat-thematique-item': ContractsContratThematiqueItem;
      'contracts.linknet': ContractsLinknet;
      'contracts.valorized-linknet': ContractsValorizedLinknet;
      'contracts.video': ContractsVideo;
      'destinations.city': DestinationsCity;
      'prefix.prefix': PrefixPrefix;
      'seo.seo': SeoSeo;
      'terrain.aire-reservation': TerrainAireReservation;
      'terrain.aire-stationnement': TerrainAireStationnement;
      'terrain.camping': TerrainCamping;
    }
  }
}
