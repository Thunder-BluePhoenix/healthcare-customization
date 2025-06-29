import frappe
from frappe import _


emps = frappe.get_all("Employee", fields=["name", "employee_number"])

for emp in emps:
    if emp.employee_number != None or emp.employee_number != "":
        new_name = f"{emp.employee_number}"
        if emp.name != new_name:
            frappe.rename_doc("Employee", emp.name, new_name, force=1, merge=False)
