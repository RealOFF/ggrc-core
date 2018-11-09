# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Admin dashboard page smoke tests."""
# pylint: disable=no-self-use
# pylint: disable=invalid-name
# pylint: disable=too-few-public-methods
# pylint: disable=protected-access
# pylint: disable=unused-argument

import random

import pytest

from lib import base, constants, url, users
from lib.constants import messages, objects, roles
from lib.constants.element import AdminWidgetCustomAttributes
from lib.entities import entities_factory
from lib.page import dashboard
from lib.service import admin_webui_service, rest_facade
from lib.utils import date_utils, selenium_utils


class TestAdminDashboardPage(base.Test):
  """Tests for admin dashboard page."""

  _role_el = constants.element.AdminWidgetRoles
  _event_el = constants.element.AdminWidgetEvents

  @pytest.fixture(scope="function")
  def admin_dashboard(self, selenium):
    """Open Admin Dashboard URL and
    return AdminDashboard page objects model."""
    selenium_utils.open_url(url.Urls().admin_dashboard)
    return dashboard.AdminDashboard(selenium)

  @pytest.mark.smoke_tests
  def test_roles_widget(self, admin_dashboard):
    """Check count and content of role scopes."""
    admin_roles_tab = admin_dashboard.select_roles()
    expected_dict = self._role_el.ROLE_SCOPES_DICT
    actual_dict = admin_roles_tab.get_role_scopes_text_as_dict()
    assert admin_dashboard.tab_roles.member_count == len(expected_dict)
    assert expected_dict == actual_dict, (
        messages.AssertionMessages.
        format_err_msg_equal(expected_dict, expected_dict))

  @pytest.mark.smoke_tests
  def test_events_widget_tree_view_has_data(self, admin_dashboard):
    """Confirms tree view has at least one data row in valid format."""
    admin_events_tab = admin_dashboard.select_events()
    list_items = admin_events_tab.events_raw
    assert list_items
    items_with_incorrect_format = [
        item for item in list_items if not
        admin_events_tab.parse_event(item, is_strict=True)]
    assert len(items_with_incorrect_format) in [0, 1]
    if len(items_with_incorrect_format) == 1:
      # A line with incorrect format is created during DB migration.
      # We decided it's OK.
      assert items_with_incorrect_format[0].startswith(
          "by\n{}".format(users.MIGRATOR_USER_EMAIL))
    expected_header_text = self._event_el.WIDGET_HEADER
    actual_header_text = admin_events_tab.widget_header.text
    assert expected_header_text == actual_header_text

  @pytest.mark.smoke_tests
  def test_check_ca_groups(self, admin_dashboard):
    """Check that full list of Custom Attributes groups is displayed
    on Admin Dashboard panel.
    """
    ca_tab = admin_dashboard.select_custom_attributes()
    expected_ca_groups_set = set(
        [objects.get_normal_form(item) for item in objects.ALL_CA_OBJS])
    actual_ca_groups_set = set(
        [item.text for item in ca_tab.get_items_list()])
    assert expected_ca_groups_set == actual_ca_groups_set

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize(
      "ca_type",
      AdminWidgetCustomAttributes.ALL_CA_TYPES
  )
  def test_add_global_ca(self, admin_dashboard, ca_type):
    """Create different types of Custom Attribute on Admin Dashboard."""
    def_type = objects.get_normal_form(random.choice(objects.ALL_CA_OBJS))
    expected_ca = entities_factory.CustomAttributeDefinitionsFactory().create(
        attribute_type=ca_type, definition_type=def_type)
    ca_tab = admin_dashboard.select_custom_attributes()
    ca_tab.add_custom_attribute(ca_obj=expected_ca)
    actual_cas = ca_tab.get_custom_attributes_list(ca_group=expected_ca)
    # 'actual_ca': multi_choice_options (None)
    self.general_contain_assert(expected_ca, actual_cas,
                                "multi_choice_options")

  def test_create_new_person_w_no_role(self, selenium):
    """Check newly created person is on Admin People widget"""
    expected_person = entities_factory.PeopleFactory().create(
        system_wide_role=roles.NO_ROLE)
    actual_person = admin_webui_service.PeopleAdminWebUiService(
        selenium).create_new_person(expected_person)
    self.general_equal_assert(expected_person, actual_person)

  @pytest.mark.smoke_tests
  def test_custom_roles_widget(self, admin_dashboard):
    """Check count and content of roles scopes."""
    expected_set = set(
        [objects.get_normal_form(item) for
         item in objects.ALL_OBJS_W_CUSTOM_ROLES]
    )
    actual_set = \
        admin_dashboard.select_custom_roles().get_objects_text_as_set()
    assert admin_dashboard.tab_custom_roles.member_count == len(expected_set)
    assert expected_set == actual_set, (
        messages.AssertionMessages.
        format_err_msg_equal(expected_set, actual_set))


class TestEventLogTabDestructive(base.Test):
  """Tests for Event log."""
  _data = None

  @classmethod
  def get_event_tab(cls):
    selenium_utils.open_url(url.Urls().admin_dashboard)
    return dashboard.AdminDashboard().select_events()

  @pytest.fixture()
  def tested_events(self):
    """Create events to verify events functionality:
    0. Save event log count before test data creation,
    1. Create control editor role, create 2 users with global creator role
    under admin
    2. Create control#1 under global creator#1 and set global creator#2 to
    newly created control editor role
    3. Create control#2 under global creator#2 and map it control#1
    4. TODO Delete control#1 under global creator#2
    """
    if not self.__class__._data:
      # generate enough data, so test can be executed independently
      for _ in xrange(6):
        rest_facade.create_user_with_role(roles.READER)

      ctrl1_creator = rest_facade.create_user_with_role(roles.CREATOR)
      ctrl2_creator = rest_facade.create_user_with_role(roles.CREATOR)
      ctrl_editor_role = rest_facade.create_access_control_role(
          object_type="Control", read=True, update=True, delete=True)
      admin = users.current_user()
      users.set_current_user(ctrl1_creator)
      ctrl_custom_roles = [
          (ctrl_editor_role.name, ctrl_editor_role.id, [ctrl2_creator])
      ]
      ctrl1 = rest_facade.create_control(custom_roles=ctrl_custom_roles)
      # wait until notification and acl will assigned by background task
      rest_facade.get_obj(ctrl1)

      users.set_current_user(ctrl2_creator)
      ctrl2 = rest_facade.create_control()
      rest_facade.map_objs(ctrl1, ctrl2)

      users.set_current_user(admin)
      self.__class__._data = {
          "ctrl1_creator": ctrl1_creator,
          "ctrl2_creator": ctrl2_creator,
          "ctrl_editor_role": ctrl_editor_role,
          "ctrl1": ctrl1,
          "ctrl2": ctrl2,
      }
    return self.__class__._data

  def test_chronological_sequence_1st_page(self, tested_events, selenium):
    """Verify that items on 1st page is presented on tab in chronological
    order."""
    datetime_list = self.get_event_tab().event_datetimes
    date_utils.assert_chronological_order(datetime_list)

  def test_btns_at_1st_page(self, tested_events, selenium):
    """Verify that 1st page has NEXT PAGE navigation button only
    and doesn't have PREVIOUS PAGE navigation button.
    """
    event_tab_btns = self.get_event_tab().paging_buttons
    actual_btn_names = [btn.text for btn in event_tab_btns]
    assert actual_btn_names == ["NEXT PAGE"]

  def test_chronological_sequence_2nd_page(self, tested_events, selenium):
    """Verify that chronological order is continue at 2nd page too."""
    page_1 = self.get_event_tab()
    last_event_datetime_page_1 = page_1.event_datetimes[-1]
    event_tab_page_2 = page_1.go_to_next_page()
    event_datetimes_page_2 = event_tab_page_2.event_datetimes
    assert last_event_datetime_page_1 >= event_datetimes_page_2[0]
    date_utils.assert_chronological_order(event_datetimes_page_2)

  def test_previous_page_redirect(self, tested_events, selenium):
    """Verify that click on PREVIOUS PAGE navigation button on 2nd page
    redirect to 1st page.
    """
    page_1 = self.get_event_tab()
    events_on_1st_page = page_1.events
    events_on_prev_page = page_1.go_to_next_page().go_to_prev_page().events
    assert events_on_1st_page == events_on_prev_page, (
        messages.AssertionMessages.
        format_err_msg_equal(events_on_1st_page, events_on_prev_page))
