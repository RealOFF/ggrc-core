/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

describe('GGRC.Components.detailedBusinessObjectListItem', function () {
  'use strict';

  let snapshotParentTitle = 'Control title #1';
  let snapshotParentUrl = '/controls/55';
  let vendorObjectTitle = 'Vendor title 123';
  let vendorObjectLink = '/vendors/33';

  let snapshotObject = {
    selfLink: '/api/snapshots/123',
    viewLink: '/snapshots/123',
    type: 'Snapshot',
    child_id: 55,
    child_type: 'Control',
    revision: {
      content: {
        title: snapshotParentTitle
      }
    }
  };

  let vendorObject = {
    selfLink: '/api/vendors/33',
    viewLink: vendorObjectLink,
    type: 'Vendor',
    title: vendorObjectTitle,
    id: 33
  };

  describe('objectLink property', function () {
    let viewModel;

    beforeEach(function () {
      viewModel = GGRC.Components
        .getViewModel('detailedBusinessObjectListItem');
    });

    it('check objectLink of Vendor object', function () {
      viewModel.attr('instance', vendorObject);
      expect(viewModel.attr('objectLink')).toEqual(vendorObjectLink);
    });

    it('check objectLink of Snapshot object', function () {
      viewModel.attr('instance', snapshotObject);
      expect(viewModel.attr('objectLink')).toEqual(snapshotParentUrl);
    });
  });

  describe('objectTitle property', function () {
    let viewModel;

    beforeEach(function () {
      viewModel = GGRC.Components
        .getViewModel('detailedBusinessObjectListItem');
    });

    it('check objectTitle of Vendor object', function () {
      viewModel.attr('instance', vendorObject);
      expect(viewModel.attr('objectTitle')).toEqual(vendorObjectTitle);
    });

    it('check objectTitle of Snapshot object', function () {
      viewModel.attr('instance', snapshotObject);
      expect(viewModel.attr('objectTitle')).toEqual(snapshotParentTitle);
    });
  });
});
