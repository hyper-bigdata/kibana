/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { createQueryFilterClauses } from '../../utils/build_query';
import { RequestBasicOptions } from '../framework';

import { KpiNetworkESMSearchBody } from './types';

const getGeneralQueryFilter = () => [
  {
    bool: {
      filter: [
        {
          bool: {
            should: [
              {
                exists: {
                  field: 'source.ip',
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
        {
          bool: {
            should: [
              {
                exists: {
                  field: 'destination.ip',
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      ],
    },
  },
];

export const buildGeneralQuery = ({
  filterQuery,
  timerange: { from, to },
  sourceConfiguration: {
    fields: { timestamp },
    logAlias,
    packetbeatAlias,
  },
}: RequestBasicOptions): KpiNetworkESMSearchBody[] => {
  const filter = [
    ...createQueryFilterClauses(filterQuery),
    ...getGeneralQueryFilter(),
    {
      range: {
        [timestamp]: {
          gte: from,
          lte: to,
        },
      },
    },
  ];

  const dslQuery = [
    {
      index: [logAlias, packetbeatAlias],
      allowNoIndices: true,
      ignoreUnavailable: true,
    },
    {
      aggregations: {
        unique_flow_id: {
          cardinality: {
            field: 'network.community_id',
          },
        },
        active_agents: {
          cardinality: {
            field: 'agent.id',
          },
        },
      },
      query: {
        bool: {
          filter,
        },
      },
      size: 0,
      track_total_hits: true,
    },
  ];

  return dslQuery;
};
