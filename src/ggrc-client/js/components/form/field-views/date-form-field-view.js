/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './date-form-field-view.stache';

export default CanComponent.extend({
  tag: 'date-form-field-view',
  view: canStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    value: null,
    disabled: false,
  }),
});
