import frappe
from frappe import _


def update_opd(doc, method=None):
    for i in doc.items:
        if i.reference_dt == "Medication Request":
            med_r = frappe.get_doc("Medication Request", i.reference_dn)
            opd = frappe.get_doc("Patient Encounter", med_r.order_group)

            for drug in opd.drug_prescription:
                if drug.medication == med_r.medication and drug.drug_code == i.item_code:
                    drug.custom_cleared = i.custom_item_cleared
                    drug.custom_remarks = i.custom_comment
            opd.save(ignore_permissions=True)

        