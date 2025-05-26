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

        


def validate_qty(doc, method = None):
    for drug in doc.drug_prescription:
        pes_qty = None
        dos = 0
        period = None
        dosage = frappe.get_doc("Prescription Dosage", drug.dosage)
        for ds in dosage.dosage_strength:
            strength = float(ds.strength) or 0
            dos += float(strength)

        dur = frappe.get_doc("Prescription Duration", drug.period)
        dur_qty = None
        if dur.period == "Week":
            dur_qty = 7
        elif dur.period == "Hour":
            dur_qty = 1
        elif dur.period == "Day":
            dur_qty = 1
        elif dur.period == "Month":
            dur_qty = 30

        pd_number = dur.number


        period = float(pd_number)*float(dur_qty)

        pes_qty = float(period)*float(dos)
        drug.custom_prescribed_qty = pes_qty
        if drug.custom_given_qty == 0:
            drug.custom_given_qty = pes_qty