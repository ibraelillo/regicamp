import type { Schema, Attribute } from '@strapi/strapi';

export interface FlagsCampingFlags extends Schema.Component {
  collectionName: 'components_flags_camping_flags';
  info: {
    displayName: 'CampingFlags';
    icon: 'lock';
  };
  attributes: {
    best_view: Attribute.Boolean;
    most_beatiful: Attribute.Boolean;
    selected_by_press: Attribute.Boolean;
  };
}

export interface MapAddress extends Schema.Component {
  collectionName: 'components_map_addresses';
  info: {
    displayName: 'address';
    description: '';
  };
  attributes: {
    address: Attribute.String;
    latitude: Attribute.String;
    longitude: Attribute.String;
    city: Attribute.String;
    country: Attribute.String;
    region: Attribute.String;
    department: Attribute.String;
  };
}

export interface SeoSeo extends Schema.Component {
  collectionName: 'components_seo_seos';
  info: {
    displayName: 'seo';
    icon: 'cog';
  };
  attributes: {
    title: Attribute.String;
    metas: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'flags.camping-flags': FlagsCampingFlags;
      'map.address': MapAddress;
      'seo.seo': SeoSeo;
    }
  }
}
