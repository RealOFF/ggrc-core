/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import CanComponent from 'can-component';
import '../../collapsible-panel/collapsible-panel';
import template from './mapped-control-related-objects.stache';

/**
 * ViewModel for Assessment Mapped Controls Related Objectives and Regulations.
 * @type {canMap}
 */
let viewModel = canMap.extend({
  define: {
    items: {
      value: [],
    },
  },
  titleText: '',
  type: '',
});
/**
 * Specific Wrapper Component to present Controls only inner popover data.
 * Should Load on expand Related Objectives and Regulations
 */
export default CanComponent.extend({
  tag: 'mapped-control-related-objects',
  view: canStache(template),
  leakScope: true,
  viewModel,
});
