# Alternative solution if background jobs are not available
# File: your_app/employee_utils_simple.py

import frappe
from frappe import _
from frappe.model.rename_doc import rename_doc

@frappe.whitelist()
def rename_employees_by_chunks(start_index=0, chunk_size=100):
    """Rename employees in small chunks to avoid timeout"""
    try:
        # Get a chunk of employees
        employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number'],
            limit_page_length=chunk_size,
            limit_start=start_index,
            order_by='creation'
        )
        
        if not employees:
            return {
                'status': 'completed',
                'message': 'All employees processed',
                'processed': 0,
                'has_more': False
            }
        
        success_count = 0
        error_count = 0
        errors = []
        
        for emp in employees:
            try:
                current_name = emp['name']
                employee_number = emp['employee_number']
                
                # Skip if no employee number or same as current name
                if not employee_number or employee_number == current_name:
                    continue
                
                # Check if target already exists
                if frappe.db.exists('Employee', employee_number) and employee_number != current_name:
                    errors.append(f"Employee number {employee_number} already exists")
                    error_count += 1
                    continue
                
                # Perform rename
                rename_doc('Employee', current_name, employee_number, merge=False)
                success_count += 1
                
            except Exception as e:
                error_msg = f"Error renaming {emp['name']}: {str(e)}"
                errors.append(error_msg)
                error_count += 1
                frappe.log_error(error_msg, "Employee Rename Error")
        
        # Commit the batch
        frappe.db.commit()
        
        return {
            'status': 'partial',
            'processed': len(employees),
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors[:10],  # Return first 10 errors
            'has_more': len(employees) == chunk_size,
            'next_start': start_index + chunk_size
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Employee Rename Chunk Error")
        return {
            'status': 'error',
            'message': str(e)
        }