/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

describe('showMore', function () {
  'use strict';

  let viewModel;

  describe('should have some default values', function () {
    beforeEach(function () {
      viewModel = GGRC.Components.getViewModel('showMore');
    });

    it('and they should be correct', function () {
      expect(viewModel.attr('items').length).toBe(0);
      expect(viewModel.attr('limit')).toBe(5);
      expect(viewModel.attr('shouldShowAllItems')).toBeFalsy();
    });
  });

  describe('isOverLimit property', function () {
    let items = new can.List([{id: 1}, {id: 2}]);

    beforeEach(function () {
      viewModel = GGRC.Components.getViewModel('showMore');
      viewModel.attr('items', items);
    });

    it('should return true when more items than limit property', function () {
      let result;

      viewModel.attr('limit', 1);
      result = viewModel.attr('isOverLimit');

      expect(result).toBeTruthy();
    });

    it('should return false when less items than limit property', function () {
      let result;

      viewModel.attr('limit', 10);
      result = viewModel.attr('isOverLimit');

      expect(result).toBeFalsy();
    });
  });

  describe('showAllButtonText property', function () {
    let items = new can.List([{id: 1}, {id: 2}]);

    beforeEach(function () {
      viewModel = GGRC.Components.getViewModel('showMore');
      viewModel.attr('items', items);
    });

    it('should return collapsible text when all items are shown', function () {
      let result;

      viewModel.attr('shouldShowAllItems', true);
      result = viewModel.attr('showAllButtonText');

      expect(result).toBe('Show less');
    });

    it('should return expandable text when part of items are shown',
    function () {
      let result;

      viewModel.attr('shouldShowAllItems', false);
      viewModel.attr('limit', 1);
      result = viewModel.attr('showAllButtonText');

      expect(result).toBe('Show more (1)');
    });
  });

  describe('visibleItems property', function () {
    let items = new can.List([{id: 1}, {id: 2}]);

    beforeEach(function () {
      viewModel = GGRC.Components.getViewModel('showMore');
      viewModel.attr('items', items);
    });

    it('should return limited items list when should not show all',
      function () {
        let result;

        viewModel.attr('limit', 1);
        result = viewModel.attr('visibleItems');

        expect(result.length).toBe(1);
      });

    it('should return all items when should show all', function () {
      let result;

      viewModel.attr('shouldShowAllItems', true);
      result = viewModel.attr('visibleItems');

      expect(result).toBe(items);
    });

    it('should return all items when items count is less than limit',
      function () {
        let result;

        viewModel.attr('limit', 3);
        result = viewModel.attr('visibleItems');

        expect(result).toBe(items);
      });
  });

  describe('toggleShowAll() method', function () {
    let eventMock = {
      stopPropagation: function () {}
    };

    beforeEach(function () {
      viewModel = GGRC.Components.getViewModel('showMore');
    });

    it('should set shouldShowAll property when was false',
      function () {
        let result;

        viewModel.toggleShowAll(eventMock);
        result = viewModel.attr('shouldShowAllItems');

        expect(result).toBeTruthy();
      });

    it('should reset shouldShowAll property when was true', function () {
      let result;

      viewModel.attr('shouldShowAllItems', true);
      viewModel.toggleShowAll(eventMock);
      result = viewModel.attr('shouldShowAllItems');

      expect(result).toBeFalsy();
    });
  });
});
