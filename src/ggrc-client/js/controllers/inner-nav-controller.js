/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getPageType,
  getPageInstance,
} from '../plugins/utils/current-page-utils';
import {getCounts} from '../plugins/utils/widgets-utils';
import {isDashboardEnabled} from '../plugins/utils/dashboards-utils';
import {isObjectVersion} from '../plugins/utils/object-versions-utils';
import router, {buildUrl} from '../router';
import '../components/add-tab-button/add-tab-button';
import pubSub from '../pub-sub';

export default can.Control.extend({
  defaults: {
    internav_view: '/static/templates/dashboard/internav_list.stache',
    pin_view: '.pin-content',
    widget_list: null,
    priorityTabs: null,
    notPriorityTabs: null,
    spinners: {},
    contexts: null,
    instance: null,
    isMenuVisible: true,
    counts: null,
    hasHiddenWidgets: false,
    /*
      The widget should refetch items when opening
      if "refetchOnce" has the model name of the widget.

      For example: "refetchOnce" contains "Control" item.
      The items of "Control" widget should be reloaded.
    */
    refetchOnce: new Set(),
    pubSub,
  },
}, {
  init: function (options) {
    const instance = getPageInstance();

    this.options = new can.Map(this.options);
    if (!this.options.widget_list) {
      this.options.attr('widget_list', new can.List([]));
    }
    this.options.attr('counts', getCounts());
    this.options.attr('instance', instance);
    if (!(this.options.contexts instanceof can.Map)) {
      this.options.attr('contexts', new can.Map(this.options.contexts));
    }

    router.bind('widget', (ev, newVal) => {
      this.route(newVal);
    });

    can.view(this.options.internav_view, this.options, (frag) => {
      const isAuditScope = instance.type === 'Audit';
      this.element.append(frag);
      if (isAuditScope) {
        this.element.addClass(this.options.instance.type.toLowerCase());
      }
      this.setTabsPriority();
      this.route(router.attr('widget'));
    });

    this.on();
  },

  addRefetchOnceItems(modelNames) {
    modelNames = typeof modelNames === 'string' ? [modelNames] : modelNames;
    const refetchOnce = this.options.attr('refetchOnce');

    modelNames.forEach((modelName) => {
      refetchOnce.add(modelName);
    });
  },

  route: function (path) {
    let widgetList = this.options.widget_list;

    // Find and make active the widget specified by `path`
    let widget = this.widget_by_selector('#' + path);
    if (!widget && widgetList.length) {
      // Target was not found, but we can select the first widget in the list
      let widgetId = widgetList[0].internav_id;
      router.attr('widget', widgetId);
      return;
    }
    if (widget) {
      this.set_active_widget(widget);
      return this.display_widget(widget.forceRefetch);
    }
    return new $.Deferred().resolve();
  },

  tryToRefetchOnce(widgetSelector) {
    const refetchOnce = this.options.attr('refetchOnce');

    if (!refetchOnce.size) {
      return false;
    }

    const widget = _.find(
      this.options.widget_list,
      (widget) => widget.selector === widgetSelector && widget.model
    );

    if (!widget) {
      return false;
    }

    return refetchOnce.delete(widget.model.model_singular);
  },

  display_widget: function (refetch) {
    let activeWidgetSelector = this.options.contexts.active_widget.selector;
    let $activeWidget = $(activeWidgetSelector);
    let widgetController = $activeWidget.control();

    if (widgetController && widgetController.display) {
      refetch = this.tryToRefetchOnce(activeWidgetSelector) || refetch;
      return widgetController.display(refetch);
    }
    return new $.Deferred().resolve();
  },

  set_active_widget: function (widget) {
    if (typeof widget === 'string') {
      widget = this.widget_by_selector(widget);
    }

    if (widget !== this.options.contexts.attr('active_widget')) {
      widget.attr('force_show', true);
      this.update_add_more_link();
      this.options.contexts.attr('active_widget', widget);
      this.show_active_widget(widget);
    }
  },

  show_active_widget: function (widgetModel) {
    let widget = $(widgetModel.selector);
    let dashboardCtr = this.options.dashboard_controller;

    if (dashboardCtr.hideInfoPin) {
      dashboardCtr.hideInfoPin();
    }

    if (widget.length) {
      dashboardCtr.show_widget_area();
      widget.siblings().addClass('hidden').trigger('widget_hidden');
      widget.removeClass('hidden').trigger('widget_shown');
    }
  },

  widget_by_selector: function (selector) {
    return this.options.widget_list.filter((widget) => {
      if (selector === '#account_balance' && widget.selector === '#project') {
        return true;
      }

      return widget.selector === selector;
    })[0] || undefined;
  },

  /**
   * Sort widgets in place by their `order` attribute in ascending order.
   *
   * The widgets with non-existing / non-numeric `order` value are placed
   * at the end of the list.
   */
  sortWidgets: function () {
    this.options.attr('widget_list',
      _.sortBy(this.options.widget_list, ['order', 'internav_display']));
  },

  update_widget: function (widgetElement, index) {
    let widgetOptions = $(widgetElement).control().options;
    let widgetId = widgetOptions.widget_id;
    let widget = this.widget_by_selector('#' + widgetId);
    let widgetName = widgetOptions.widget_name;
    let title = typeof widgetName === 'function' ? widgetName() : widgetName;
    let existingIndex;

    // Only create the observable once, this gets updated elsewhere
    if (!widget) {
      widget = new can.Map({
        selector: '#' + widgetId,
        has_count: false,
        placeInAddTab: false,
      });
    }
    existingIndex = this.options.widget_list.indexOf(widget);

    widget.attr({
      internav_icon: widgetOptions.widget_icon,
      widgetType: isObjectVersion(widgetId) ? 'version' : '',
      internav_display: title === 'Projects' ? 'Account Balances' : title,
      internav_id: widgetId,
      internav_href: buildUrl({widget: widgetId}),
      forceRefetch: widgetOptions && widgetOptions.forceRefetch,
      spinner: this.options.spinners['#' + widgetId],
      model: widgetOptions && widgetOptions.model,
      order: (widgetOptions || widget).order,
      uncountable: (widgetOptions || widget).uncountable,
    });

    index = this.options.widget_list.length;

    if (existingIndex !== index) {
      if (existingIndex > -1) {
        if (index >= this.options.widget_list.length) {
          this.options.widget_list.splice(existingIndex, 1);
          this.options.widget_list.push(widget);
        } else {
          this.options.widget_list
            .splice(existingIndex, 1, this.options.widget_list[index]);
          this.options.widget_list.splice(index, 1, widget);
        }
      } else {
        this.options.widget_list.push(widget);
      }
    }

    return widget;
  },

  update_widget_count: function ($el, count) {
    let widgetId = $el.closest('.widget').attr('id');
    let widget = this.widget_by_selector('#' + widgetId);

    if (widget) {
      widget.attr({
        count: count,
        has_count: true,
      });
    }
    this.update_add_more_link();
  },

  update_add_more_link: function () {
    let hasHiddenWidgets = false;
    let instance = this.options.instance || {};
    let model = instance.constructor;
    let showAllTabs = false;

    if (model.obj_nav_options) {
      showAllTabs = model.obj_nav_options.show_all_tabs;
    }

    if (!this.options.isMenuVisible) {
      return;
    }

    // Update has hidden widget attr
    this.options.widget_list.forEach((widget) => {
      let forceShowList = model.obj_nav_options.force_show_list;
      let forceShow = false;
      widget.attr('placeInAddTab', false);
      if (forceShowList) {
        forceShow = forceShowList.indexOf(widget.internav_display) > -1;
      }
      if (widget.has_count && widget.count === 0 &&
        !widget.force_show && !showAllTabs && !forceShow) {
        widget.attr('placeInAddTab', true);
        hasHiddenWidgets = true;
      }
    });
    this.options.attr('hasHiddenWidgets', hasHiddenWidgets);
  },
  setTabsPriority: function () {
    let pageType = getPageType();
    let widgets = this.options.attr('widget_list');
    let instance = this.options.attr('instance');

    if (pageType === 'Audit') {
      let priorityTabsNum = 5 + isDashboardEnabled(instance);
      this.options.attr('priorityTabs', widgets.slice(0, priorityTabsNum));
      this.options.attr('notPriorityTabs', widgets.slice(priorityTabsNum));
    } else {
      this.options.attr('priorityTabs', widgets);
    }
  },
  '.closed click': function (el, ev) {
    let widgetSelector = el.data('widget');
    let widget = this.widget_by_selector(widgetSelector);
    let widgets = this.options.widget_list;

    widget.attr('force_show', false);
    this.route(widgets[0].selector); // Switch to the first widget
    this.update_add_more_link();
    return false; // Prevent the url change back to the widget we are hiding
  },
  '.not-priority-hide click': function (el) {
    this.options.attr('isMenuVisible', !this.options.isMenuVisible);
  },
  '{counts} change': function () {
    this.update_add_more_link();
  },
  '{pubSub} refetchOnce'(scope, event) {
    this.addRefetchOnceItems(event.modelNames);
  },
});