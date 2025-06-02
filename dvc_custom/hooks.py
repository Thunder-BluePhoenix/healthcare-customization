app_name = "dvc_custom"
app_title = "Dvc Custom"
app_publisher = "BluePhoenix"
app_description = "Hospital management"
app_email = "bluephoenix00995@gmail.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "dvc_custom",
# 		"logo": "/assets/dvc_custom/logo.png",
# 		"title": "Dvc Custom",
# 		"route": "/dvc_custom",
# 		"has_permission": "dvc_custom.api.permission.has_app_permission"
# 	}
# ]



fixtures = [
            
            {"dt": "Translation", "filters": [["name", "in",("c956v3pamf", "1bho1m5i1p"),]]}



]

# Includes in <head>
# ------------------
# web_include_css = [
#     "/assets/dvc_custom/css/custom_login.css"
# ]
# web_include_js = "/assets/dvc_custom/js/dvc_custom_login_r.js"

# Login page specific CSS
# login_page_include_css = [
#     "/assets/dvc_custom/css/custom_login.css"
# ]
web_include_css = [
    "/assets/dvc_custom/css/custom_login_tt.css"
]
web_include_js = [
    "/assets/dvc_custom/js/dvc_custom_login_tt.js"
]

# Login page specific CSS and JS
login_page_include_css = [
    "/assets/dvc_custom/css/custom_login_tt.css"
]
login_page_include_js = [
    "/assets/dvc_custom/js/dvc_custom_login_tt.js"
]



# include js, css files in header of desk.html
# app_include_css = "/assets/dvc_custom/css/dvc_custom.css"
# app_include_js = "/assets/dvc_custom/js/dvc_custom.js"

# include js, css files in header of web template
# web_include_css = "/assets/dvc_custom/css/dvc_custom.css"
# web_include_js = "/assets/dvc_custom/js/dvc_custom.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "dvc_custom/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {"Patient" : "public/js/patient.js",
              "Patient Encounter": "public/js/opd.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "dvc_custom/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "dvc_custom.utils.jinja_methods",
# 	"filters": "dvc_custom.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "dvc_custom.install.before_install"
# after_install = "dvc_custom.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "dvc_custom.uninstall.before_uninstall"
# after_uninstall = "dvc_custom.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "dvc_custom.utils.before_app_install"
# after_app_install = "dvc_custom.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "dvc_custom.utils.before_app_uninstall"
# after_app_uninstall = "dvc_custom.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "dvc_custom.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }
doc_events = {
	"Patient": {
		"before_insert": "dvc_custom.override.patient.set_uid",
		
	},
    "Sales Invoice": {"on_submit":"dvc_custom.override.opd.update_opd"},
    "Patient Encounter":{"on_submit":"dvc_custom.override.opd.validate_qty",
                         "before_update_after_submit":"dvc_custom.override.opd.validate_qty"}
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"dvc_custom.tasks.all"
# 	],
# 	"daily": [
# 		"dvc_custom.tasks.daily"
# 	],
# 	"hourly": [
# 		"dvc_custom.tasks.hourly"
# 	],
# 	"weekly": [
# 		"dvc_custom.tasks.weekly"
# 	],
# 	"monthly": [
# 		"dvc_custom.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "dvc_custom.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "dvc_custom.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "dvc_custom.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["dvc_custom.utils.before_request"]
# after_request = ["dvc_custom.utils.after_request"]

# Job Events
# ----------
# before_job = ["dvc_custom.utils.before_job"]
# after_job = ["dvc_custom.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"dvc_custom.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

