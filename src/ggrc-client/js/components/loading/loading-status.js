/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import CanComponent from 'can-component';
import template from './loading-status.stache';

export default CanComponent.extend({
  tag: 'loading-status',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      showSpinner: {
        type: 'boolean',
        value: false,
      },
      alwaysShowText: {
        type: 'boolean',
        value: false,
      },
      isLoading: {
        type: 'boolean',
        value: false,
      },
    },
    loadingText: '',
  }),
});
