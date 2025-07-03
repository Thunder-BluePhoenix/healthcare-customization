# # File: your_app/employee_utils_simple.py
# # Add this method to your existing file

# import frappe
# from frappe import _
# from frappe.model.rename_doc import rename_doc

# @frappe.whitelist()
# def get_employees_to_rename_count():
#     """Get total count of employees that need renaming"""
#     try:
#         # Get all employees with employee numbers
#         employees = frappe.get_all(
#             'Employee',
#             fields=['name', 'employee_number'],
#             filters={'employee_number': ['!=', '']}
#         )
        
#         needs_rename = []
#         preview_list = []
        
#         for emp in employees:
#             if emp.employee_number and emp.employee_number.strip():
#                 new_name = emp.employee_number.strip()
#                 if emp.name != new_name:
#                     needs_rename.append(emp)
#                     # Add to preview list (first 10 only)
#                     if len(preview_list) < 10:
#                         preview_list.append({
#                             'current': emp.name,
#                             'new': new_name
#                         })
        
#         return {
#             'total': len(needs_rename),
#             'preview': preview_list
#         }
        
#     except Exception as e:
#         frappe.log_error(frappe.get_traceback(), "Get Employee Count Error")
#         return {'total': 0, 'preview': []}

# @frappe.whitelist()
# def rename_employees_by_chunks(start_index=0, chunk_size=50):
#     """Rename employees in small chunks to avoid timeout"""
#     try:
#         start_index = int(start_index)
#         chunk_size = int(chunk_size)
        
#         # Get employees that need renaming (not all employees)
#         all_employees = frappe.get_all(
#             'Employee',
#             fields=['name', 'employee_number'],
#             filters={'employee_number': ['!=', '']},
#             order_by='creation'
#         )
        
#         # Filter to only those that need renaming
#         employees_to_rename = []
#         for emp in all_employees:
#             if emp.employee_number and emp.employee_number.strip():
#                 new_name = emp.employee_number.strip()
#                 if emp.name != new_name:
#                     employees_to_rename.append(emp)
        
#         # Get the chunk we need to process
#         end_index = start_index + chunk_size
#         employees_chunk = employees_to_rename[start_index:end_index]
        
#         if not employees_chunk:
#             return {
#                 'status': 'completed',
#                 'message': 'All employees processed',
#                 'processed': 0,
#                 'success_count': 0,
#                 'error_count': 0,
#                 'has_more': False
#             }
        
#         success_count = 0
#         error_count = 0
#         errors = []
        
#         for emp in employees_chunk:
#             try:
#                 current_name = emp['name']
#                 employee_number = emp['employee_number'].strip()
                
#                 # Check if target already exists
#                 if frappe.db.exists('Employee', employee_number) and employee_number != current_name:
#                     errors.append(f"Employee number {employee_number} already exists")
#                     error_count += 1
#                     continue
                
#                 # Perform rename
#                 rename_doc('Employee', current_name, employee_number, merge=False)
#                 success_count += 1
                
#             except Exception as e:
#                 error_msg = f"Error renaming {emp['name']} to {emp['employee_number']}: {str(e)}"
#                 errors.append(error_msg)
#                 error_count += 1
#                 frappe.log_error(error_msg, "Employee Rename Error")
        
#         # Commit the batch
#         frappe.db.commit()
        
#         # Check if there are more to process
#         has_more = end_index < len(employees_to_rename)
        
#         return {
#             'status': 'partial' if has_more else 'completed',
#             'processed': len(employees_chunk),
#             'success_count': success_count,
#             'error_count': error_count,
#             'errors': errors,
#             'has_more': has_more,
#             'next_start': end_index,
#             'total_remaining': len(employees_to_rename) - end_index if has_more else 0
#         }
        
#     except Exception as e:
#         frappe.log_error(frappe.get_traceback(), "Employee Rename Chunk Error")
#         return {
#             'status': 'error',
#             'message': str(e)
#         }


# Add these methods to your existing employee_utils_simple.py file

import frappe
import re
from datetime import datetime
from frappe import _
from frappe.model.rename_doc import rename_doc

@frappe.whitelist()
def preview_naming_series(naming_series, start_number=1, limit=5):
    """Preview how the naming series will look"""
    try:
        start_number = int(start_number) if start_number else 1
        
        # Get sample employees
        employees = frappe.get_all(
            'Employee',
            fields=['name'],
            limit=limit,
            order_by='creation'
        )
        
        preview_list = []
        current_number = start_number
        
        # Get all employees for total count
        all_employees = frappe.get_all('Employee', fields=['name'])
        
        for emp in employees:
            try:
                new_name = generate_naming_series_name(naming_series, current_number)
                preview_list.append({
                    'current': emp.name,
                    'new': new_name
                })
                current_number += 1
            except Exception as e:
                return {
                    'success': False,
                    'error': f"Naming series error: {str(e)}"
                }
        
        return {
            'success': True,
            'preview': preview_list,
            'total_count': len(all_employees)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def get_naming_series_count(naming_series, start_number=1):
    """Get total count of employees for naming series"""
    try:
        start_number = int(start_number) if start_number else 1
        
        # Get all employees
        employees = frappe.get_all('Employee', fields=['name'], order_by='creation')
        
        preview_list = []
        current_number = start_number
        
        for emp in employees:
            try:
                new_name = generate_naming_series_name(naming_series, current_number)
                if len(preview_list) < 10:
                    preview_list.append({
                        'current': emp.name,
                        'new': new_name
                    })
                current_number += 1
            except Exception:
                continue
        
        return {
            'total': len(employees),
            'preview': preview_list
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Naming Series Count Error")
        return {'total': 0, 'preview': []}

@frappe.whitelist()
def rename_employees_naming_series(naming_series, start_number=1, start_index=0, chunk_size=50):
    """Rename employees using naming series in chunks"""
    try:
        start_index = int(start_index)
        chunk_size = int(chunk_size)
        start_number = int(start_number) if start_number else 1
        
        # Get all employees in order
        all_employees = frappe.get_all(
            'Employee',
            fields=['name'],
            order_by='creation'
        )
        
        # Get the chunk we need to process
        end_index = start_index + chunk_size
        employees_chunk = all_employees[start_index:end_index]
        
        if not employees_chunk:
            return {
                'status': 'completed',
                'processed': 0,
                'success_count': 0,
                'error_count': 0,
                'has_more': False
            }
        
        success_count = 0
        error_count = 0
        errors = []
        
        # Calculate the starting number for this chunk
        current_number = start_number + start_index
        
        for emp in employees_chunk:
            try:
                current_name = emp['name']
                new_name = generate_naming_series_name(naming_series, current_number)
                
                # Skip if the name is already correct
                if current_name == new_name:
                    current_number += 1
                    continue
                
                # Check if target already exists
                if frappe.db.exists('Employee', new_name) and new_name != current_name:
                    errors.append(f"Target name '{new_name}' already exists")
                    error_count += 1
                    current_number += 1
                    continue
                
                # Perform rename
                rename_doc('Employee', current_name, new_name, merge=False)
                success_count += 1
                current_number += 1
                
            except Exception as e:
                error_msg = f"Error renaming {emp['name']}: {str(e)}"
                errors.append(error_msg)
                error_count += 1
                current_number += 1
                frappe.log_error(error_msg, "Naming Series Rename Error")
        
        # Commit the batch
        frappe.db.commit()
        
        # Check if there are more to process
        has_more = end_index < len(all_employees)
        
        return {
            'status': 'partial' if has_more else 'completed',
            'processed': len(employees_chunk),
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors,
            'has_more': has_more,
            'next_start': end_index
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Naming Series Rename Chunk Error")
        return {
            'status': 'error',
            'message': str(e)
        }

def generate_naming_series_name(naming_series, number):
    """Generate a name based on naming series pattern"""
    try:
        now = datetime.now()
        
        # Replace date/time placeholders
        result = naming_series
        result = result.replace('YYYY', now.strftime('%Y'))
        result = result.replace('YY', now.strftime('%y'))
        result = result.replace('MM', now.strftime('%m'))
        result = result.replace('DD', now.strftime('%d'))
        
        # Handle number padding - find #### patterns
        number_patterns = re.findall(r'\.?#+', result)
        
        for pattern in number_patterns:
            # Count the number of # characters to determine padding
            hash_count = pattern.count('#')
            # Format number with padding
            formatted_number = str(number).zfill(hash_count)
            # Replace the pattern
            result = result.replace(pattern, formatted_number, 1)
        
        # Clean up any remaining dots at the beginning or end
        result = result.strip('.')
        
        # Validate the result
        if not result:
            raise ValueError("Generated name is empty")
        
        if len(result) > 140:  # Frappe name field limit
            raise ValueError(f"Generated name is too long ({len(result)} characters)")
        
        # Remove any invalid characters
        result = re.sub(r'[^\w\s\-\.]', '', result)
        
        return result
        
    except Exception as e:
        raise ValueError(f"Naming series error: {str(e)}")

# Keep all your existing methods from previous code...

@frappe.whitelist()
def preview_custom_format(format_pattern, limit=5):
    """Preview how the custom format will look"""
    try:
        employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number', 'first_name', 'last_name', 'employee_name', 
                   'department', 'designation', 'company'],
            limit=limit
        )
        
        preview_list = []
        total_count = 0
        
        all_employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number', 'first_name', 'last_name', 'employee_name', 
                   'department', 'designation', 'company']
        )
        
        for emp in all_employees:
            try:
                new_name = apply_format_pattern(emp, format_pattern)
                if new_name and new_name != emp.name:
                    total_count += 1
                    if len(preview_list) < limit:
                        preview_list.append({
                            'current': emp.name,
                            'new': new_name
                        })
            except Exception as e:
                if len(preview_list) == 0:
                    return {
                        'success': False,
                        'error': f"Format error: {str(e)}"
                    }
        
        return {
            'success': True,
            'preview': preview_list,
            'total_count': total_count
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def get_custom_format_count(format_pattern):
    """Get total count of employees for custom format"""
    try:
        employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number', 'first_name', 'last_name', 'employee_name', 
                   'department', 'designation', 'company']
        )
        
        needs_rename = []
        preview_list = []
        
        for emp in employees:
            try:
                new_name = apply_format_pattern(emp, format_pattern)
                if new_name and new_name != emp.name:
                    needs_rename.append(emp)
                    if len(preview_list) < 10:
                        preview_list.append({
                            'current': emp.name,
                            'new': new_name
                        })
            except Exception:
                continue
        
        return {
            'total': len(needs_rename),
            'preview': preview_list
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Custom Format Count Error")
        return {'total': 0, 'preview': []}

@frappe.whitelist()
def rename_employees_custom_format(format_pattern, start_index=0, chunk_size=50):
    """Rename employees using custom format in chunks"""
    try:
        start_index = int(start_index)
        chunk_size = int(chunk_size)
        
        all_employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number', 'first_name', 'last_name', 'employee_name', 
                   'department', 'designation', 'company'],
            order_by='creation'
        )
        
        employees_to_rename = []
        for emp in all_employees:
            try:
                new_name = apply_format_pattern(emp, format_pattern)
                if new_name and new_name != emp.name:
                    emp['new_name'] = new_name
                    employees_to_rename.append(emp)
            except Exception:
                continue
        
        end_index = start_index + chunk_size
        employees_chunk = employees_to_rename[start_index:end_index]
        
        if not employees_chunk:
            return {
                'status': 'completed',
                'processed': 0,
                'success_count': 0,
                'error_count': 0,
                'has_more': False
            }
        
        success_count = 0
        error_count = 0
        errors = []
        
        for emp in employees_chunk:
            try:
                current_name = emp['name']
                new_name = emp['new_name']
                
                if frappe.db.exists('Employee', new_name) and new_name != current_name:
                    errors.append(f"Target name '{new_name}' already exists")
                    error_count += 1
                    continue
                
                rename_doc('Employee', current_name, new_name, merge=False)
                success_count += 1
                
            except Exception as e:
                error_msg = f"Error renaming {emp['name']} to {emp['new_name']}: {str(e)}"
                errors.append(error_msg)
                error_count += 1
                frappe.log_error(error_msg, "Custom Format Rename Error")
        
        frappe.db.commit()
        
        has_more = end_index < len(employees_to_rename)
        
        return {
            'status': 'partial' if has_more else 'completed',
            'processed': len(employees_chunk),
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors,
            'has_more': has_more,
            'next_start': end_index
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Custom Format Rename Chunk Error")
        return {
            'status': 'error',
            'message': str(e)
        }

def apply_format_pattern(employee_doc, format_pattern):
    """Apply the format pattern to generate new employee name"""
    try:
        variables = {
            'employee_number': employee_doc.get('employee_number') or '',
            'first_name': employee_doc.get('first_name') or '',
            'last_name': employee_doc.get('last_name') or '',
            'full_name': employee_doc.get('employee_name') or '',
            'department': employee_doc.get('department') or '',
            'designation': employee_doc.get('designation') or '',
            'company': employee_doc.get('company') or ''
        }
        
        new_name = format_pattern
        for key, value in variables.items():
            new_name = new_name.replace(f'{{{key}}}', str(value))
        
        new_name = re.sub(r'\s+', ' ', new_name)
        new_name = new_name.strip()
        new_name = re.sub(r'[^\w\s\-\.]', '', new_name)
        
        if not new_name:
            raise ValueError("Generated name is empty")
        
        if len(new_name) > 140:
            raise ValueError(f"Generated name is too long ({len(new_name)} characters)")
        
        return new_name
        
    except Exception as e:
        raise ValueError(f"Pattern error: {str(e)}")

@frappe.whitelist()
def get_employees_to_rename_count():
    """Get total count of employees that need renaming (original function)"""
    try:
        employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number'],
            filters={'employee_number': ['!=', '']}
        )
        
        needs_rename = []
        preview_list = []
        
        for emp in employees:
            if emp.employee_number and emp.employee_number.strip():
                new_name = emp.employee_number.strip()
                if emp.name != new_name:
                    needs_rename.append(emp)
                    if len(preview_list) < 10:
                        preview_list.append({
                            'current': emp.name,
                            'new': new_name
                        })
        
        return {
            'total': len(needs_rename),
            'preview': preview_list
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Employee Count Error")
        return {'total': 0, 'preview': []}

@frappe.whitelist()
def rename_employees_by_chunks(start_index=0, chunk_size=50):


    """Rename employees in small chunks (original function)"""
    try:
        start_index = int(start_index)
        chunk_size = int(chunk_size)
        
        all_employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number'],
            filters={'employee_number': ['!=', '']},
            order_by='creation'
        )
        
        employees_to_rename = []
        for emp in all_employees:
            if emp.employee_number and emp.employee_number.strip():
                new_name = emp.employee_number.strip()
                if emp.name != new_name:
                    employees_to_rename.append(emp)
        
        end_index = start_index + chunk_size
        employees_chunk = employees_to_rename[start_index:end_index]
        
        if not employees_chunk:
            return {
                'status': 'completed',
                'processed': 0,
                'success_count': 0,
                'error_count': 0,
                'has_more': False
            }
        
        success_count = 0
        error_count = 0
        errors = []
        
        for emp in employees_chunk:
            try:
                current_name = emp['name']
                employee_number = emp['employee_number'].strip()
                
                if frappe.db.exists('Employee', employee_number) and employee_number != current_name:
                    errors.append(f"Employee number {employee_number} already exists")
                    error_count += 1
                    continue
                
                rename_doc('Employee', current_name, employee_number, merge=False)
                success_count += 1
                
            except Exception as e:
                error_msg = f"Error renaming {emp['name']} to {emp['employee_number']}: {str(e)}"
                errors.append(error_msg)
                error_count += 1
                frappe.log_error(error_msg, "Employee Rename Error")
        
        frappe.db.commit()
        
        has_more = end_index < len(employees_to_rename)
        
        return {
            'status': 'partial' if has_more else 'completed',
            'processed': len(employees_chunk),
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors,
            'has_more': has_more,
            'next_start': end_index
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Employee Rename Chunk Error")
        return {
            'status': 'error',
            'message': str(e)
        }
    








# Add these methods to your existing employee_utils_simple.py file

import frappe
import re
from datetime import datetime
from frappe import _
from frappe.model.rename_doc import rename_doc

@frappe.whitelist()
def preview_naming_series(naming_series, start_number=1, limit=5):
    """Preview how the naming series will look"""
    try:
        start_number = int(start_number) if start_number else 1
        
        # Get sample employees
        employees = frappe.get_all(
            'Employee',
            fields=['name'],
            limit=limit,
            order_by='creation'
        )
        
        preview_list = []
        current_number = start_number
        
        # Get all employees for total count
        all_employees = frappe.get_all('Employee', fields=['name'])
        
        for emp in employees:
            try:
                new_name = generate_naming_series_name(naming_series, current_number)
                preview_list.append({
                    'current': emp.name,
                    'new': new_name
                })
                current_number += 1
            except Exception as e:
                return {
                    'success': False,
                    'error': f"Naming series error: {str(e)}"
                }
        
        return {
            'success': True,
            'preview': preview_list,
            'total_count': len(all_employees)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def get_naming_series_count(naming_series, start_number=1):
    """Get total count of employees for naming series"""
    try:
        start_number = int(start_number) if start_number else 1
        
        # Get all employees
        employees = frappe.get_all('Employee', fields=['name'], order_by='creation')
        
        preview_list = []
        current_number = start_number
        
        for emp in employees:
            try:
                new_name = generate_naming_series_name(naming_series, current_number)
                if len(preview_list) < 10:
                    preview_list.append({
                        'current': emp.name,
                        'new': new_name
                    })
                current_number += 1
            except Exception:
                continue
        
        return {
            'total': len(employees),
            'preview': preview_list
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Naming Series Count Error")
        return {'total': 0, 'preview': []}

@frappe.whitelist()
def rename_employees_naming_series(naming_series, start_number=1, start_index=0, chunk_size=50):
    """Rename employees using naming series in chunks"""
    try:
        start_index = int(start_index)
        chunk_size = int(chunk_size)
        start_number = int(start_number) if start_number else 1
        
        # Get all employees in order
        all_employees = frappe.get_all(
            'Employee',
            fields=['name'],
            order_by='creation'
        )
        
        # Get the chunk we need to process
        end_index = start_index + chunk_size
        employees_chunk = all_employees[start_index:end_index]
        
        if not employees_chunk:
            return {
                'status': 'completed',
                'processed': 0,
                'success_count': 0,
                'error_count': 0,
                'has_more': False
            }
        
        success_count = 0
        error_count = 0
        errors = []
        
        # Calculate the starting number for this chunk
        current_number = start_number + start_index
        
        for emp in employees_chunk:
            try:
                current_name = emp['name']
                new_name = generate_naming_series_name(naming_series, current_number)
                
                # Skip if the name is already correct
                if current_name == new_name:
                    current_number += 1
                    continue
                
                # Check if target already exists
                if frappe.db.exists('Employee', new_name) and new_name != current_name:
                    errors.append(f"Target name '{new_name}' already exists")
                    error_count += 1
                    current_number += 1
                    continue
                
                # Perform rename
                rename_doc('Employee', current_name, new_name, merge=False)
                success_count += 1
                current_number += 1
                
            except Exception as e:
                error_msg = f"Error renaming {emp['name']}: {str(e)}"
                errors.append(error_msg)
                error_count += 1
                current_number += 1
                frappe.log_error(error_msg, "Naming Series Rename Error")
        
        # Commit the batch
        frappe.db.commit()
        
        # Check if there are more to process
        has_more = end_index < len(all_employees)
        
        return {
            'status': 'partial' if has_more else 'completed',
            'processed': len(employees_chunk),
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors,
            'has_more': has_more,
            'next_start': end_index
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Naming Series Rename Chunk Error")
        return {
            'status': 'error',
            'message': str(e)
        }

def generate_naming_series_name(naming_series, number):
    """Generate a name based on naming series pattern"""
    try:
        now = datetime.now()
        
        # Ensure inputs are strings
        naming_series = str(naming_series)
        number = int(number)
        
        # Replace date/time placeholders
        result = naming_series
        result = result.replace('YYYY', now.strftime('%Y'))
        result = result.replace('YY', now.strftime('%y'))
        result = result.replace('MM', now.strftime('%m'))
        result = result.replace('DD', now.strftime('%d'))
        
        # Handle number padding - find #### patterns
        number_patterns = re.findall(r'\.?#+', result)
        
        for pattern in number_patterns:
            # Count the number of # characters to determine padding
            hash_count = pattern.count('#')
            # Format number with padding
            formatted_number = str(number).zfill(hash_count)
            # Replace the pattern (only replace first occurrence)
            result = result.replace(pattern, formatted_number, 1)
        
        # Clean up any remaining dots at the beginning or end
        result = result.strip('.')
        
        # Validate the result
        if not result:
            raise ValueError("Generated name is empty")
        
        if len(result) > 140:  # Frappe name field limit
            raise ValueError(f"Generated name is too long ({len(result)} characters)")
        
        # Remove any invalid characters but keep alphanumeric, spaces, hyphens, and dots
        result = re.sub(r'[^\w\s\-\.]', '', result)
        result = re.sub(r'\s+', ' ', result).strip()  # Clean up spaces
        
        return result
        
    except Exception as e:
        frappe.log_error(f"Naming series error: {str(e)}\nSeries: {naming_series}\nNumber: {number}", "Generate Naming Series Error")
        raise ValueError(f"Naming series error: {str(e)}")

# Keep all your existing methods from previous code...

@frappe.whitelist()
def preview_custom_format(format_pattern, limit=5):
    """Preview how the custom format will look"""
    try:
        limit = int(limit) if limit else 5
        
        employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number', 'first_name', 'last_name', 'employee_name', 
                   'department', 'designation', 'company'],
            limit=limit
        )
        
        preview_list = []
        total_count = 0
        
        # Get all employees for total count
        all_employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number', 'first_name', 'last_name', 'employee_name', 
                   'department', 'designation', 'company']
        )
        
        for emp in all_employees:
            try:
                new_name = apply_format_pattern(emp, format_pattern)
                if new_name and str(new_name) != str(emp.name):
                    total_count += 1
                    if len(preview_list) < limit:
                        preview_list.append({
                            'current': str(emp.name),
                            'new': str(new_name)
                        })
            except Exception as e:
                if len(preview_list) == 0:  # Only show error for first employee
                    frappe.log_error(f"Preview custom format error: {str(e)}\nPattern: {format_pattern}\nEmployee: {emp}", "Preview Custom Format Error")
                    return {
                        'success': False,
                        'error': f"Format error: {str(e)}"
                    }
        
        return {
            'success': True,
            'preview': preview_list,
            'total_count': total_count
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Preview Custom Format Main Error")
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def get_custom_format_count(format_pattern):
    """Get total count of employees for custom format"""
    try:
        employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number', 'first_name', 'last_name', 'employee_name', 
                   'department', 'designation', 'company']
        )
        
        needs_rename = []
        preview_list = []
        
        for emp in employees:
            try:
                new_name = apply_format_pattern(emp, format_pattern)
                if new_name and str(new_name) != str(emp.name):
                    needs_rename.append(emp)
                    if len(preview_list) < 10:
                        preview_list.append({
                            'current': str(emp.name),
                            'new': str(new_name)
                        })
            except Exception as e:
                frappe.log_error(f"Custom format count error for employee {emp.name}: {str(e)}", "Get Custom Format Count Error")
                continue
        
        return {
            'total': len(needs_rename),
            'preview': preview_list
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Custom Format Count Main Error")
        return {'total': 0, 'preview': []}

@frappe.whitelist()
def rename_employees_custom_format(format_pattern, start_index=0, chunk_size=50):
    """Rename employees using custom format in chunks"""
    try:
        start_index = int(start_index)
        chunk_size = int(chunk_size)
        
        all_employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number', 'first_name', 'last_name', 'employee_name', 
                   'department', 'designation', 'company'],
            order_by='creation'
        )
        
        employees_to_rename = []
        for emp in all_employees:
            try:
                new_name = apply_format_pattern(emp, format_pattern)
                if new_name and new_name != emp.name:
                    emp['new_name'] = new_name
                    employees_to_rename.append(emp)
            except Exception:
                continue
        
        end_index = start_index + chunk_size
        employees_chunk = employees_to_rename[start_index:end_index]
        
        if not employees_chunk:
            return {
                'status': 'completed',
                'processed': 0,
                'success_count': 0,
                'error_count': 0,
                'has_more': False
            }
        
        success_count = 0
        error_count = 0
        errors = []
        
        for emp in employees_chunk:
            try:
                current_name = emp['name']
                new_name = emp['new_name']
                
                if frappe.db.exists('Employee', new_name) and new_name != current_name:
                    errors.append(f"Target name '{new_name}' already exists")
                    error_count += 1
                    continue
                
                rename_doc('Employee', current_name, new_name, merge=False)
                success_count += 1
                
            except Exception as e:
                error_msg = f"Error renaming {emp['name']} to {emp['new_name']}: {str(e)}"
                errors.append(error_msg)
                error_count += 1
                frappe.log_error(error_msg, "Custom Format Rename Error")
        
        frappe.db.commit()
        
        has_more = end_index < len(employees_to_rename)
        
        return {
            'status': 'partial' if has_more else 'completed',
            'processed': len(employees_chunk),
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors,
            'has_more': has_more,
            'next_start': end_index
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Custom Format Rename Chunk Error")
        return {
            'status': 'error',
            'message': str(e)
        }

def apply_format_pattern(employee_doc, format_pattern):
    """Apply the format pattern to generate new employee name"""
    try:
        # Safely get values and convert to string
        variables = {
            'employee_number': str(employee_doc.get('employee_number') or ''),
            'first_name': str(employee_doc.get('first_name') or ''),
            'last_name': str(employee_doc.get('last_name') or ''),
            'full_name': str(employee_doc.get('employee_name') or ''),
            'department': str(employee_doc.get('department') or ''),
            'designation': str(employee_doc.get('designation') or ''),
            'company': str(employee_doc.get('company') or '')
        }
        
        new_name = str(format_pattern)
        for key, value in variables.items():
            new_name = new_name.replace(f'{{{key}}}', value)
        
        # Clean up the result
        new_name = re.sub(r'\s+', ' ', new_name)  # Replace multiple spaces with single space
        new_name = new_name.strip()  # Remove leading/trailing spaces
        new_name = re.sub(r'[^\w\s\-\.]', '', new_name)  # Remove special characters except dash and dot
        
        # Validate the result
        if not new_name:
            raise ValueError("Generated name is empty")
        
        if len(new_name) > 140:  # Frappe name field limit
            raise ValueError(f"Generated name is too long ({len(new_name)} characters)")
        
        return new_name
        
    except Exception as e:
        frappe.log_error(f"Format pattern error: {str(e)}\nEmployee: {employee_doc}\nPattern: {format_pattern}", "Apply Format Pattern Error")
        raise ValueError(f"Pattern error: {str(e)}")

@frappe.whitelist()
def get_employees_to_rename_count():
    """Get total count of employees that need renaming (original function)"""
    try:
        employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number'],
            filters={'employee_number': ['!=', '']}
        )
        
        needs_rename = []
        preview_list = []
        
        for emp in employees:
            if emp.employee_number and emp.employee_number.strip():
                new_name = emp.employee_number.strip()
                if emp.name != new_name:
                    needs_rename.append(emp)
                    if len(preview_list) < 10:
                        preview_list.append({
                            'current': emp.name,
                            'new': new_name
                        })
        
        return {
            'total': len(needs_rename),
            'preview': preview_list
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Employee Count Error")
        return {'total': 0, 'preview': []}

@frappe.whitelist()
def rename_employees_by_chunks(start_index=0, chunk_size=50):
    """Rename employees in small chunks (original function)"""
    try:
        start_index = int(start_index)
        chunk_size = int(chunk_size)
        
        all_employees = frappe.get_all(
            'Employee',
            fields=['name', 'employee_number'],
            filters={'employee_number': ['!=', '']},
            order_by='creation'
        )
        
        employees_to_rename = []
        for emp in all_employees:
            if emp.employee_number and emp.employee_number.strip():
                new_name = emp.employee_number.strip()
                if emp.name != new_name:
                    employees_to_rename.append(emp)
        
        end_index = start_index + chunk_size
        employees_chunk = employees_to_rename[start_index:end_index]
        
        if not employees_chunk:
            return {
                'status': 'completed',
                'processed': 0,
                'success_count': 0,
                'error_count': 0,
                'has_more': False
            }
        
        success_count = 0
        error_count = 0
        errors = []
        
        for emp in employees_chunk:
            try:
                current_name = emp['name']
                employee_number = emp['employee_number'].strip()
                
                if frappe.db.exists('Employee', employee_number) and employee_number != current_name:
                    errors.append(f"Employee number {employee_number} already exists")
                    error_count += 1
                    continue
                
                rename_doc('Employee', current_name, employee_number, merge=False)
                success_count += 1
                
            except Exception as e:
                error_msg = f"Error renaming {emp['name']} to {emp['employee_number']}: {str(e)}"
                errors.append(error_msg)
                error_count += 1
                frappe.log_error(error_msg, "Employee Rename Error")
        
        frappe.db.commit()
        
        has_more = end_index < len(employees_to_rename)
        
        return {
            'status': 'partial' if has_more else 'completed',
            'processed': len(employees_chunk),
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors,
            'has_more': has_more,
            'next_start': end_index
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Employee Rename Chunk Error")
        return {
            'status': 'error',
            'message': str(e)
        }