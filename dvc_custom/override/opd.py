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
            drug.custom_given_qty = drug.custom_prescribed_qtyby_doctor






@frappe.whitelist()
def update_drug_prescriptions(updates):
    import json
    updates = json.loads(updates) if isinstance(updates, str) else updates

    for row in updates:
        if not row.get("name"):
            continue

        try:
            frappe.db.set_value(
                "Drug Prescription",
                row["name"],
                {
                    "custom_given_qty": row.get("custom_given_qty"),
                    "custom_remarkspharmacy": row.get("custom_remarkspharmacy"),
                    "custom_clearedfrom_pharmacy": row.get("custom_clearedfrom_pharmacy"),
                }
            )
        except Exception as e:
            frappe.log_error(f"Failed to update Drug Prescription {row['name']}: {str(e)}")
            frappe.throw(_("Error updating row: {0}").format(row["name"]))

    return "success"




from healthcare.healthcare.doctype.patient_encounter.patient_encounter import PatientEncounter as OriginalPatientEncounter

class CustomPatientEncounter(OriginalPatientEncounter):
    def validate_medications(self):
        # Your custom logic here
        # Example: skip the validation
        for item in self.drug_prescription:
            if not item.drug_code:
                # Instead of throwing, log or handle gracefully
                frappe.msgprint(f"Warning: Drug Code missing for Row #{item.idx}")




import frappe
from frappe import _

@frappe.whitelist()
def delete_patient_encounter_workflow():
    """
    Complete workflow to delete Patient Encounter and related Medication Request documents
    
    Steps:
    1. Cancel all Medication Request documents
    2. Delete all Medication Request documents
    3. Cancel all Patient Encounter documents
    4. Delete all Patient Encounter documents
    
    Returns:
        dict: Complete summary of the deletion workflow
    """
    try:
        workflow_summary = {
            "success": False,
            "steps_completed": [],
            "medication_request": {
                "cancelled": 0,
                "deleted": 0,
                "failed": 0,
                "errors": []
            },
            "patient_encounter": {
                "cancelled": 0,
                "deleted": 0,
                "failed": 0,
                "errors": []
            },
            "total_time": None
        }
        
        import time
        start_time = time.time()
        
        # Step 1: Cancel all Medication Request documents
        frappe.publish_progress(10, title="Processing Medication Requests", description="Cancelling submitted documents...")
        
        med_cancel_result = cancel_all_submitted_docs("Medication Request")
        workflow_summary["medication_request"]["cancelled"] = med_cancel_result.get("cancelled_count", 0)
        workflow_summary["medication_request"]["errors"].extend(med_cancel_result.get("errors", []))
        workflow_summary["steps_completed"].append("Medication Request - Cancellation")
        
        # Step 2: Delete all Medication Request documents
        frappe.publish_progress(30, title="Processing Medication Requests", description="Deleting all documents...")
        
        med_delete_result = delete_all_submittable_docs("Medication Request", force_delete=False)
        workflow_summary["medication_request"]["deleted"] = med_delete_result["summary"]["deleted"]
        workflow_summary["medication_request"]["failed"] = med_delete_result["summary"]["failed"]
        workflow_summary["medication_request"]["errors"].extend(med_delete_result["summary"]["errors"])
        workflow_summary["steps_completed"].append("Medication Request - Deletion")
        
        # Step 3: Cancel all Patient Encounter documents
        frappe.publish_progress(60, title="Processing Patient Encounters", description="Cancelling submitted documents...")
        
        pe_cancel_result = cancel_all_submitted_docs("Patient Encounter")
        workflow_summary["patient_encounter"]["cancelled"] = pe_cancel_result.get("cancelled_count", 0)
        workflow_summary["patient_encounter"]["errors"].extend(pe_cancel_result.get("errors", []))
        workflow_summary["steps_completed"].append("Patient Encounter - Cancellation")
        
        # Step 4: Delete all Patient Encounter documents
        frappe.publish_progress(90, title="Processing Patient Encounters", description="Deleting all documents...")
        
        pe_delete_result = delete_all_submittable_docs("Patient Encounter", force_delete=False)
        workflow_summary["patient_encounter"]["deleted"] = pe_delete_result["summary"]["deleted"]
        workflow_summary["patient_encounter"]["failed"] = pe_delete_result["summary"]["failed"]
        workflow_summary["patient_encounter"]["errors"].extend(pe_delete_result["summary"]["errors"])
        workflow_summary["steps_completed"].append("Patient Encounter - Deletion")
        
        # Calculate total time
        end_time = time.time()
        workflow_summary["total_time"] = f"{end_time - start_time:.2f} seconds"
        
        workflow_summary["success"] = True
        
        frappe.publish_progress(100, title="Completed", description="All documents processed successfully!")
        
        return workflow_summary
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in delete_patient_encounter_workflow: {str(e)}")
        frappe.throw(_("An error occurred during the deletion workflow: {0}").format(str(e)))


def cancel_all_submitted_docs(doctype):
    """
    Cancel all submitted documents in a doctype
    """
    try:
        submitted_docs = frappe.get_all(doctype, filters={"docstatus": 1}, fields=["name"])
        
        if not submitted_docs:
            return {
                "success": True,
                "message": f"No submitted documents found in {doctype}",
                "cancelled_count": 0,
                "errors": []
            }
        
        cancelled_count = 0
        failed_count = 0
        errors = []
        
        for i, doc_info in enumerate(submitted_docs):
            try:
                # Progress update for large datasets
                if len(submitted_docs) > 10 and i % 10 == 0:
                    progress = int((i / len(submitted_docs)) * 100)
                    frappe.publish_progress(progress, title=f"Cancelling {doctype}", 
                                          description=f"Processing {i+1} of {len(submitted_docs)}")
                
                doc = frappe.get_doc(doctype, doc_info.name)
                doc.cancel()
                cancelled_count += 1
                
            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to cancel {doc_info.name}: {str(e)}")
                frappe.log_error(f"Error cancelling {doctype} {doc_info.name}: {str(e)}")
        
        frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Cancellation process completed for {doctype}",
            "cancelled_count": cancelled_count,
            "failed_count": failed_count,
            "errors": errors
        }
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in cancel_all_submitted_docs for {doctype}: {str(e)}")
        raise


def delete_all_submittable_docs(doctype, force_delete=False):
    """
    Delete all documents from a submittable doctype
    """
    try:
        all_docs = frappe.get_all(doctype, fields=["name", "docstatus"])
        
        if not all_docs:
            return {
                "success": True,
                "message": f"No documents found in {doctype}",
                "summary": {
                    "total": 0,
                    "cancelled": 0,
                    "deleted": 0,
                    "failed": 0,
                    "errors": []
                }
            }
        
        summary = {
            "total": len(all_docs),
            "cancelled": 0,
            "deleted": 0,
            "failed": 0,
            "errors": []
        }
        
        for i, doc_info in enumerate(all_docs):
            try:
                # Progress update for large datasets
                if len(all_docs) > 10 and i % 10 == 0:
                    progress = int((i / len(all_docs)) * 100)
                    frappe.publish_progress(progress, title=f"Deleting {doctype}", 
                                          description=f"Processing {i+1} of {len(all_docs)}")
                
                doc_name = doc_info.name
                docstatus = doc_info.docstatus
                
                if docstatus == 1:  # Submitted
                    if force_delete:
                        frappe.db.delete(doctype, {"name": doc_name})
                        summary["deleted"] += 1
                    else:
                        # Should already be cancelled, but double-check
                        doc = frappe.get_doc(doctype, doc_name)
                        if doc.docstatus == 1:
                            doc.cancel()
                            summary["cancelled"] += 1
                        
                        frappe.delete_doc(doctype, doc_name, force=True)
                        summary["deleted"] += 1
                        
                elif docstatus == 2:  # Cancelled
                    frappe.delete_doc(doctype, doc_name, force=True)
                    summary["deleted"] += 1
                    
                else:  # Draft
                    frappe.delete_doc(doctype, doc_name)
                    summary["deleted"] += 1
                    
            except Exception as e:
                summary["failed"] += 1
                summary["errors"].append(f"Failed to process {doc_name}: {str(e)}")
                frappe.log_error(f"Error deleting {doctype} {doc_name}: {str(e)}")
        
        frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Deletion process completed for {doctype}",
            "summary": summary
        }
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in delete_all_submittable_docs for {doctype}: {str(e)}")
        raise


@frappe.whitelist()
def get_patient_encounter_summary():
    """
    Get summary of Patient Encounter and Medication Request documents
    """
    try:
        # Patient Encounter summary
        pe_summary = frappe.db.sql("""
            SELECT 
                docstatus,
                COUNT(*) as count,
                CASE 
                    WHEN docstatus = 0 THEN 'Draft'
                    WHEN docstatus = 1 THEN 'Submitted'
                    WHEN docstatus = 2 THEN 'Cancelled'
                    ELSE 'Unknown'
                END as status_name
            FROM `tabPatient Encounter`
            GROUP BY docstatus
        """, as_dict=True)
        
        # Medication Request summary
        mr_summary = frappe.db.sql("""
            SELECT 
                docstatus,
                COUNT(*) as count,
                CASE 
                    WHEN docstatus = 0 THEN 'Draft'
                    WHEN docstatus = 1 THEN 'Submitted'
                    WHEN docstatus = 2 THEN 'Cancelled'
                    ELSE 'Unknown'
                END as status_name
            FROM `tabMedication Request`
            GROUP BY docstatus
        """, as_dict=True)
        
        pe_total = sum(item.count for item in pe_summary)
        mr_total = sum(item.count for item in mr_summary)
        
        return {
            "success": True,
            "patient_encounter": {
                "total_documents": pe_total,
                "status_breakdown": pe_summary
            },
            "medication_request": {
                "total_documents": mr_total,
                "status_breakdown": mr_summary
            }
        }
        
    except Exception as e:
        frappe.log_error(f"Error in get_patient_encounter_summary: {str(e)}")
        frappe.throw(_("An error occurred while getting summary: {0}").format(str(e)))


# Emergency force delete function
@frappe.whitelist()
def force_delete_patient_encounter_workflow():
    """
    Emergency function to force delete all Patient Encounter and Medication Request documents
    WARNING: This bypasses all validations
    """
    try:
        results = {}
        
        # Force delete Medication Request
        mr_count = frappe.db.count("Medication Request")
        if mr_count > 0:
            frappe.db.sql("DELETE FROM `tabMedication Request`")
            results["medication_request_deleted"] = mr_count
        
        # Force delete Patient Encounter
        pe_count = frappe.db.count("Patient Encounter")
        if pe_count > 0:
            frappe.db.sql("DELETE FROM `tabPatient Encounter`")
            results["patient_encounter_deleted"] = pe_count
        
        # Clear related child tables if they exist
        child_tables = ["Patient Encounter Diagnosis", "Patient Encounter Symptom", 
                       "Medication Request Item"]  # Add more if needed
        
        for table in child_tables:
            try:
                frappe.db.sql(f"DELETE FROM `tab{table}`")
                results[f"{table}_cleared"] = True
            except:
                pass
        
        frappe.db.commit()
        
        return {
            "success": True,
            "message": "Force deletion completed",
            "results": results
        }
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in force_delete_patient_encounter_workflow: {str(e)}")
        frappe.throw(_("An error occurred during force deletion: {0}").format(str(e)))