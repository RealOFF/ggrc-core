/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import './related-objects';
import '../add-issue-button/add-issue-button';
import template from './related-issues.stache';

export default CanComponent.extend({
  tag: 'related-issues',
  view: canStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    define: {
      orderBy: {
        type: 'string',
        value: 'created_at',
      },
      itemsType: {
        type: 'string',
        value: 'Issue',
      },
      relatedIssuesFilter: {
        type: '*',
        get: function () {
          let id = this.attr('baseInstance.id');
          let type = this.attr('baseInstance.type');
          return {
            expression: {
              left: {
                object_name: type,
                op: {name: 'relevant'},
                ids: [id],
              },
              right: {
                object_name: type,
                op: {name: 'similar'},
                ids: [id],
              },
              op: {name: 'OR'},
            },
          };
        },
      },
    },
    baseInstance: null,
  }),
});
