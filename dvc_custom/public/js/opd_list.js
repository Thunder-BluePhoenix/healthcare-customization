// File: patient_encounter_list.js
// Place this file in: [your_app]/[your_app]/public/js/patient_encounter_list.js

frappe.listview_settings['Patient Encounter'] = {
    onload: function(listview) {
        // Add custom button to delete all Patient Encounter and Medication Request documents
        // listview.page.add_menu_item(__("Delete All Patient Encounters & Medication Requests"), function() {
        //     show_deletion_dialog(listview);
        // });
        
        // Add button to show summary
        listview.page.add_menu_item(__("Show Document Summary"), function() {
            show_summary_dialog();
        });
        
        // Add emergency force delete button (only for System Manager)dvc_custom.override.opd.
        if (frappe.user.has_role('System Manager')) {
            listview.page.add_menu_item(__("🚨 Emergency Force Delete"), function() {
                show_force_delete_dialog();
            });
        }
    }
};

function show_deletion_dialog(listview) {
    // First get summary to show user what will be deleted
    frappe.call({
        method: "dvc_custom.override.opd.get_patient_encounter_summary",
        callback: function(r) {
            if (r.message && r.message.success) {
                const pe_total = r.message.patient_encounter.total_documents;
                const mr_total = r.message.medication_request.total_documents;
                
                let dialog = new frappe.ui.Dialog({
                    title: __("Delete All Patient Encounters & Medication Requests"),
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'summary_html',
                            options: `
                                <div class="alert alert-warning">
                                    <h5><i class="fa fa-warning"></i> Warning: This action cannot be undone!</h5>
                                    <p>This will delete all documents in the following order:</p>
                                    <ol>
                                        <li>Cancel all submitted Medication Request documents</li>
                                        <li>Delete all Medication Request documents</li>
                                        <li>Cancel all submitted Patient Encounter documents</li>
                                        <li>Delete all Patient Encounter documents</li>
                                    </ol>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Patient Encounter Documents</h6>
                                        <p><strong>Total: ${pe_total}</strong></p>
                                        ${r.message.patient_encounter.status_breakdown.map(status => 
                                            `<p>${status.status_name}: ${status.count}</p>`
                                        ).join('')}
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Medication Request Documents</h6>
                                        <p><strong>Total: ${mr_total}</strong></p>
                                        ${r.message.medication_request.status_breakdown.map(status => 
                                            `<p>${status.status_name}: ${status.count}</p>`
                                        ).join('')}
                                    </div>
                                </div>
                            `
                        },
                        {
                            fieldtype: 'Check',
                            fieldname: 'confirm_deletion',
                            label: __('I understand this will permanently delete all documents'),
                            reqd: 1
                        },
                        {
                            fieldtype: 'Data',
                            fieldname: 'confirmation_text',
                            label: __('Type "DELETE ALL" to confirm'),
                            reqd: 1,
                            description: __('Type exactly: DELETE ALL')
                        }
                    ],
                    primary_action_label: __('Delete All Documents'),
                    primary_action: function(values) {
                        if (!values.confirm_deletion) {
                            frappe.msgprint(__('Please confirm that you understand the consequences'));
                            return;
                        }
                        
                        if (values.confirmation_text !== 'DELETE ALL') {
                            frappe.msgprint(__('Please type exactly "DELETE ALL" to confirm'));
                            return;
                        }
                        
                        dialog.hide();
                        execute_deletion_workflow(listview);
                    }
                });
                
                dialog.show();
            }
        }
    });
}

function execute_deletion_workflow(listview) {
    // Show progress dialog
    let progress_dialog = new frappe.ui.Dialog({
        title: __("Deleting Documents"),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'progress_html',
                options: `
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                    </div>
                    <p id="progress-message">Starting deletion process...</p>
                    <div id="progress-details" style="margin-top: 15px;"></div>
                `
            }
        ]
    });
    
    progress_dialog.show();
    progress_dialog.$wrapper.find('.modal-header .btn-modal-close').hide(); // Prevent closing during process
    
    // Execute the deletion workflow
    frappe.call({
        method: "dvc_custom.override.opd.delete_patient_encounter_workflow",
        callback: function(r) {
            if (r.message && r.message.success) {
                progress_dialog.hide();
                show_completion_dialog(r.message, listview);
            }
        },
        error: function(r) {
            progress_dialog.hide();
            frappe.msgprint({
                title: __('Error'),
                message: __('An error occurred during deletion. Please check error logs.'),
                indicator: 'red'
            });
        }
    });
    
    // Listen for progress updates
    frappe.realtime.on('progress', function(data) {
        if (data.progress !== undefined) {
            const progress_bar = progress_dialog.$wrapper.find('.progress-bar');
            const progress_message = progress_dialog.$wrapper.find('#progress-message');
            
            progress_bar.css('width', data.progress + '%');
            progress_message.text(data.title + ': ' + data.description);
        }
    });
}

function show_completion_dialog(result, listview) {
    const mr_summary = result.medication_request;
    const pe_summary = result.patient_encounter;
    
    let completion_dialog = new frappe.ui.Dialog({
        title: __("Deletion Completed"),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'completion_html',
                options: `
                    <div class="alert alert-success">
                        <h5><i class="fa fa-check"></i> Deletion Process Completed</h5>
                        <p>Total time: ${result.total_time}</p>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Medication Request</h6>
                            <ul>
                                <li>Cancelled: ${mr_summary.cancelled}</li>
                                <li>Deleted: ${mr_summary.deleted}</li>
                                <li>Failed: ${mr_summary.failed}</li>
                            </ul>
                            ${mr_summary.errors.length > 0 ? 
                                `<div class="alert alert-warning">
                                    <p><strong>Errors:</strong></p>
                                    <ul>${mr_summary.errors.map(error => `<li>${error}</li>`).join('')}</ul>
                                </div>` : ''
                            }
                        </div>
                        <div class="col-md-6">
                            <h6>Patient Encounter</h6>
                            <ul>
                                <li>Cancelled: ${pe_summary.cancelled}</li>
                                <li>Deleted: ${pe_summary.deleted}</li>
                                <li>Failed: ${pe_summary.failed}</li>
                            </ul>
                            ${pe_summary.errors.length > 0 ? 
                                `<div class="alert alert-warning">
                                    <p><strong>Errors:</strong></p>
                                    <ul>${pe_summary.errors.map(error => `<li>${error}</li>`).join('')}</ul>
                                </div>` : ''
                            }
                        </div>
                    </div>
                    
                    <div class="alert alert-info">
                        <p><strong>Steps Completed:</strong></p>
                        <ul>${result.steps_completed.map(step => `<li>${step}</li>`).join('')}</ul>
                    </div>
                `
            }
        ],
        primary_action_label: __('Refresh List'),
        primary_action: function() {
            completion_dialog.hide();
            listview.refresh();
        }
    });
    
    completion_dialog.show();
}

function show_summary_dialog() {
    frappe.call({
        method: "dvc_custom.override.opd.get_patient_encounter_summary",
        callback: function(r) {
            if (r.message && r.message.success) {
                let summary_dialog = new frappe.ui.Dialog({
                    title: __("Document Summary"),
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'summary_html',
                            options: `
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Patient Encounter Documents</h6>
                                        <p><strong>Total: ${r.message.patient_encounter.total_documents}</strong></p>
                                        ${r.message.patient_encounter.status_breakdown.map(status => 
                                            `<p>${status.status_name}: ${status.count}</p>`
                                        ).join('')}
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Medication Request Documents</h6>
                                        <p><strong>Total: ${r.message.medication_request.total_documents}</strong></p>
                                        ${r.message.medication_request.status_breakdown.map(status => 
                                            `<p>${status.status_name}: ${status.count}</p>`
                                        ).join('')}
                                    </div>
                                </div>
                            `
                        }
                    ]
                });
                
                summary_dialog.show();
            }
        }
    });
}

function show_force_delete_dialog() {
    let force_dialog = new frappe.ui.Dialog({
        title: __("🚨 Emergency Force Delete"),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'warning_html',
                options: `
                    <div class="alert alert-danger">
                        <h5><i class="fa fa-exclamation-triangle"></i> EMERGENCY FUNCTION</h5>
                        <p><strong>WARNING:</strong> This will forcefully delete ALL documents using direct SQL.</p>
                        <p>This bypasses all validations, hooks, and workflows.</p>
                        <p>Use only if normal deletion fails.</p>
                        <p><strong>THIS ACTION CANNOT BE UNDONE!</strong></p>
                    </div>
                `
            },
            {
                fieldtype: 'Check',
                fieldname: 'emergency_confirm',
                label: __('I understand this is an emergency function that bypasses all safety checks'),
                reqd: 1
            },
            {
                fieldtype: 'Data',
                fieldname: 'emergency_text',
                label: __('Type "FORCE DELETE NOW" to confirm'),
                reqd: 1,
                description: __('Type exactly: FORCE DELETE NOW')
            }
        ],
        primary_action_label: __('🚨 Force Delete'),
        primary_action: function(values) {
            if (!values.emergency_confirm) {
                frappe.msgprint(__('Please confirm you understand this is an emergency function'));
                return;
            }
            
            if (values.emergency_text !== 'FORCE DELETE NOW') {
                frappe.msgprint(__('Please type exactly "FORCE DELETE NOW" to confirm'));
                return;
            }
            
            force_dialog.hide();
            
            frappe.call({
                method: "dvc_custom.override.opd.force_delete_patient_encounter_workflow",
                callback: function(r) {
                    if (r.message && r.message.success) {
                        frappe.msgprint({
                            title: __('Force Deletion Completed'),
                            message: __('All documents have been forcefully deleted'),
                            indicator: 'green'
                        });
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                }
            });
        }
    });
    
    force_dialog.show();
}