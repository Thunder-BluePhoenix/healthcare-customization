from datetime import datetime
import frappe
from frappe.model.document import Document


@frappe.whitelist()
def set_uid(doc, method=None):
    if not doc.uid and doc.custom_type:  
        doc.uid = generate_uid(doc.custom_type)
@frappe.whitelist()
def generate_uid(type_value):
    prefix = "DVC" #if type_value == "DVC" else "NDVC"

    current_year = datetime.now().year
    next_year = current_year + 1
    fiscal_year = f"{current_year}-{str(next_year)[-2:]}"

    prefix_str = f"{prefix}/{fiscal_year}/"

    last_uid = frappe.db.sql(
        f"""SELECT uid FROM `tabPatient` 
        WHERE uid LIKE %s ORDER BY LENGTH(uid) DESC, uid DESC LIMIT 1""",
        (prefix_str + "%",),
    )

    if last_uid:
        last_number = int(last_uid[0][0].split("/")[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    return f"{prefix_str}{new_number}"


@frappe.whitelist()
def gen_fiscal_year(doc, method=None):
    current_year = datetime.now().year
    next_year = current_year + 1
    fiscal_year = f"{current_year}-{str(next_year)[-2:]}"
    

    return fiscal_year