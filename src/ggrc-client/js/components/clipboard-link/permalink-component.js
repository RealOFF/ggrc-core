/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import CanComponent from 'can-component';
import './clipboard-link';

export default CanComponent.extend({
  tag: 'permalink-component',
  view: canStache(
    '<clipboard-link text:from="text">' +
    '<i class="fa fa-link"></i>Get permalink</clipboard-link>'
  ),
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    define: {
      text: {
        type: String,
        get() {
          let instance = this.attr('instance');
          let host = window.location.origin;

          if (['Cycle', 'CycleTaskGroupObjectTask'].includes(instance.type)) {
            let wf = instance.attr('workflow.id');
            return wf ? `${host}/workflows/${wf}#!current` : '';
          } else {
            return instance.viewLink ? `${host}${instance.viewLink}` : '';
          }
        },
      },
    },
  }),
});
